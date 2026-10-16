// Lupa sandi peserta.
//
// Email peserta bersifat sintetis (nim@codequest-arcade.dev) sehingga reset
// lewat email Supabase tidak mungkin. Verifikasi memakai tiga data pendaftaran
// sekaligus — NIM, nama lengkap, dan nomor WhatsApp — lalu sandi diganti lewat
// service role dan peserta langsung dibuat masuk.

import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { emailPesertaUntuk } from '#lib/constants/acara.js';
import { PESAN_IDENTITAS_TIDAK_COCOK, namaCocok, normalkanWa } from '#lib/identitas.js';
import { buatKlienAdmin, klienWajib } from '#lib/server/supabase.js';

const skema = z.object({
	nim: z
		.string()
		.trim()
		.regex(/^[0-9]{6,20}$/, 'NIM berupa angka 6-20 digit.'),
	nama: z.string().trim().min(3, 'Nama minimal 3 huruf.').max(80, 'Nama terlalu panjang.'),
	whatsapp: z
		.string()
		.trim()
		.min(9, 'Nomor WhatsApp wajib diisi.')
		.max(20, 'Nomor WhatsApp terlalu panjang.'),
	sandi: z.string().min(8, 'Sandi minimal 8 karakter.').max(72),
	sandi2: z.string()
});

export const load: PageServerLoad = async ({ locals }) => {
	return { terkonfigurasi: locals.terkonfigurasi };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const mentah = {
			nim: String(form.get('nim') ?? ''),
			nama: String(form.get('nama') ?? ''),
			whatsapp: normalkanWa(String(form.get('whatsapp') ?? '')),
			sandi: String(form.get('sandi') ?? ''),
			sandi2: String(form.get('sandi2') ?? '')
		};
		const nilaiAman = { ...mentah, sandi: '', sandi2: '' };

		const hasil = skema.safeParse(mentah);
		if (!hasil.success) {
			return fail(400, {
				pesan: hasil.error.issues[0]?.message ?? 'Periksa kembali isianmu.',
				nilai: nilaiAman
			});
		}
		const d = hasil.data;
		if (d.sandi !== d.sandi2) {
			return fail(400, { pesan: 'Sandi dan ulangi sandi tidak sama.', nilai: nilaiAman });
		}
		if (!/^62[0-9]{8,13}$/.test(d.whatsapp)) {
			return fail(400, {
				pesan: 'Nomor WhatsApp tidak valid. Contoh: 0812-3456-7890.',
				nilai: nilaiAman
			});
		}

		const admin = klienWajib(buatKlienAdmin());
		const { data: peserta } = await admin
			.from('peserta')
			.select('id, nama, whatsapp')
			.eq('nim', d.nim)
			.maybeSingle();

		// Pesan galat disamakan untuk semua ketidakcocokan agar tidak
		// membocorkan bagian mana yang benar.
		const cocok =
			peserta !== null &&
			namaCocok(String(peserta.nama), d.nama) &&
			String(peserta.whatsapp) === d.whatsapp;
		if (!peserta || !cocok) {
			return fail(400, { pesan: PESAN_IDENTITAS_TIDAK_COCOK, nilai: nilaiAman });
		}

		const { error: galatReset } = await admin.auth.admin.updateUserById(String(peserta.id), {
			password: d.sandi
		});
		if (galatReset) {
			console.error('lupa-sandi: gagal mengganti sandi', galatReset.message);
			return fail(500, {
				pesan: 'Gagal mengganti sandi. Coba lagi sebentar lagi atau hubungi panitia.',
				nilai: nilaiAman
			});
		}

		// Langsung masuk supaya peserta tidak perlu mengetik ulang sandinya.
		const klien = klienWajib(locals.supabase);
		const { error: galatMasuk } = await klien.auth.signInWithPassword({
			email: emailPesertaUntuk(d.nim),
			password: d.sandi
		});
		if (galatMasuk) redirect(303, '/masuk?pesan=sandi-dibaru');
		redirect(303, '/dashboard');
	}
};
