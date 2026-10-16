import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { ACARA, emailPesertaUntuk } from '#lib/constants/acara.js';
import { normalkanWa } from '#lib/identitas.js';
import { buatKlienAdmin, klienWajib } from '#lib/server/supabase.js';

const skema = z.object({
	nama: z.string().trim().min(3, 'Nama minimal 3 huruf.').max(80, 'Nama terlalu panjang.'),
	nim: z
		.string()
		.trim()
		.regex(/^[0-9]{6,20}$/, 'NIM berupa angka 6-20 digit.'),
	whatsapp: z
		.string()
		.trim()
		.min(9, 'Nomor WhatsApp wajib diisi.')
		.max(20, 'Nomor WhatsApp terlalu panjang.'),
	pengalaman: z.enum(['Belum pernah', 'Pernah sedikit', 'Sudah sering'], {
		message: 'Pilih salah satu pengalaman.'
	}),
	kendala: z.string().trim().min(3, 'Ceritakan kendala terbesarmu (minimal 3 huruf).').max(500),
	bawa_laptop: z.enum(['ya', 'tidak'], { message: 'Pilih salah satu.' }),
	sandi: z.string().min(8, 'Sandi minimal 8 karakter.').max(72),
	sandi2: z.string()
});

export const load: PageServerLoad = async ({ locals }) => {
	const admin = buatKlienAdmin();
	let jumlahPeserta: number | null = null;
	if (admin) {
		const { count } = await admin.from('peserta').select('id', { count: 'exact', head: true });
		jumlahPeserta = count ?? 0;
	}
	return {
		kuotaSisa: jumlahPeserta === null ? null : Math.max(0, ACARA.kuotaPeserta - jumlahPeserta),
		kuota: ACARA.kuotaPeserta,
		terkonfigurasi: locals.terkonfigurasi
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const mentah = {
			nama: String(form.get('nama') ?? ''),
			nim: String(form.get('nim') ?? ''),
			whatsapp: normalkanWa(String(form.get('whatsapp') ?? '')),
			pengalaman: String(form.get('pengalaman') ?? ''),
			kendala: String(form.get('kendala') ?? ''),
			bawa_laptop: String(form.get('bawa_laptop') ?? ''),
			sandi: String(form.get('sandi') ?? ''),
			sandi2: String(form.get('sandi2') ?? '')
		};

		const hasil = skema.safeParse(mentah);
		if (!hasil.success) {
			return fail(400, {
				pesan: hasil.error.issues[0]?.message ?? 'Periksa kembali isianmu.',
				nilai: { ...mentah, sandi: '', sandi2: '' }
			});
		}
		const d = hasil.data;
		if (d.sandi !== d.sandi2) {
			return fail(400, { pesan: 'Sandi dan ulangi sandi tidak sama.', nilai: { ...d, sandi: '', sandi2: '' } });
		}
		if (!/^62[0-9]{8,13}$/.test(d.whatsapp)) {
			return fail(400, {
				pesan: 'Nomor WhatsApp tidak valid. Contoh: 0812-3456-7890.',
				nilai: { ...d, sandi: '', sandi2: '' }
			});
		}

		const admin = klienWajib(buatKlienAdmin());
		const klien = klienWajib(locals.supabase);

		// Kuota dihitung langsung dari jumlah peserta terdaftar.
		const { count } = await admin.from('peserta').select('id', { count: 'exact', head: true });
		if ((count ?? 0) >= ACARA.kuotaPeserta) {
			return fail(400, { pesan: 'Maaf, kuota peserta sudah penuh. Hubungi panitia.', nilai: null });
		}

		const { data: nimAda } = await admin.from('peserta').select('id').eq('nim', d.nim).maybeSingle();
		if (nimAda) {
			return fail(400, { pesan: 'NIM ini sudah terdaftar. Coba masuk dengan menu Masuk.', nilai: null });
		}

		const email = emailPesertaUntuk(d.nim);
		const { data: dibuat, error: galatBuat } = await admin.auth.admin.createUser({
			email,
			password: d.sandi,
			email_confirm: true,
			app_metadata: { role: 'peserta' },
			user_metadata: { nama: d.nama }
		});

		if (galatBuat || !dibuat.user) {
			const pesan = galatBuat?.message.includes('already')
				? 'NIM ini sudah terdaftar. Coba masuk dengan menu Masuk.'
				: 'Pendaftaran gagal disimpan. Coba lagi atau hubungi panitia.';
			return fail(400, { pesan, nilai: null });
		}

		// Pemicu `kelompok_peserta_baru` di database mengisi kelompok_id otomatis
		// (siapa cepat dia dapat); di sini nama kelompoknya dibaca kembali.
		const { data: pesertaBaru, error: galatIsi } = await admin
			.from('peserta')
			.insert({
				id: dibuat.user.id,
				nama: d.nama,
				nim: d.nim,
				whatsapp: d.whatsapp,
				pengalaman: d.pengalaman,
				kendala: d.kendala,
				bawa_laptop: d.bawa_laptop === 'ya'
			})
			.select('kelompok_id')
			.single();

		if (galatIsi) {
			// Bersihkan akun supaya NIM bisa didaftarkan ulang.
			await admin.auth.admin.deleteUser(dibuat.user.id);
			const pesan = galatIsi.code === '23505'
				? 'NIM ini sudah terdaftar. Coba masuk dengan menu Masuk.'
				: 'Pendaftaran gagal disimpan. Coba lagi atau hubungi panitia.';
			return fail(400, { pesan, nilai: null });
		}

		let namaKelompok: string | null = null;
		if (pesertaBaru?.kelompok_id) {
			const { data: grup } = await admin
				.from('kelompok')
				.select('nama')
				.eq('id', pesertaBaru.kelompok_id)
				.maybeSingle();
			namaKelompok = (grup?.nama as string | undefined) ?? null;
		}

		// Masuk otomatis supaya peserta langsung melihat dashboard.
		const { error: galatMasuk } = await klien.auth.signInWithPassword({ email, password: d.sandi });
		if (galatMasuk) {
			const kelompok = namaKelompok ? `&kelompok=${encodeURIComponent(namaKelompok)}` : '';
			redirect(303, `/masuk?pesan=akun-dibuat${kelompok}`);
		}
		redirect(303, '/dashboard');
	}
};
