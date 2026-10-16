import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { buatKlienAdmin, klienWajib } from '#lib/server/supabase.js';
import type { KelompokRow, MentorRow, PesertaRow } from '#lib/types.js';

export const load: PageServerLoad = async () => {
	const admin = klienWajib(buatKlienAdmin());
	const [kelompok, mentor, peserta] = await Promise.all([
		admin.from('kelompok').select('*').order('nama'),
		admin.from('mentor').select('*').order('nama'),
		admin.from('peserta').select('id, nama, nim, kelompok_id').order('nama')
	]);

	const daftarKelompok = (kelompok.data ?? []) as KelompokRow[];
	const daftarPeserta = (peserta.data ?? []) as Pick<PesertaRow, 'id' | 'nama' | 'nim' | 'kelompok_id'>[];

	return {
		kelompok: daftarKelompok.map((k) => ({
			...k,
			anggota: daftarPeserta.filter((p) => p.kelompok_id === k.id).map((p) => ({ id: p.id, nama: p.nama }))
		})),
		mentor: (mentor.data ?? []) as MentorRow[],
		belumDapat: daftarPeserta.filter((p) => !p.kelompok_id).map((p) => ({ id: p.id, nama: p.nama, nim: p.nim }))
	};
};

export const actions: Actions = {
	buat: async ({ request }) => {
		const admin = klienWajib(buatKlienAdmin());
		const nama = String((await request.formData()).get('nama') ?? '').trim();
		if (nama.length < 3) return fail(400, { pesan: 'Nama kelompok minimal 3 huruf.' });
		const { error } = await admin.from('kelompok').insert({ nama });
		if (error) {
			const pesan = error.code === '23505' ? 'Nama kelompok itu sudah ada.' : error.message;
			return fail(400, { pesan });
		}
		return { pesan: `Kelompok ${nama} dibuat.` };
	},

	hapus: async ({ request }) => {
		const admin = klienWajib(buatKlienAdmin());
		const id = String((await request.formData()).get('kelompok_id') ?? '');
		const { count } = await admin
			.from('peserta')
			.select('id', { count: 'exact', head: true })
			.eq('kelompok_id', id);
		if ((count ?? 0) > 0) {
			return fail(400, { pesan: 'Kosongkan dulu anggota kelompok sebelum menghapus.' });
		}
		const { error } = await admin.from('kelompok').delete().eq('id', id);
		if (error) return fail(500, { pesan: error.message });
		return { pesan: 'Kelompok dihapus.' };
	},

	mentor: async ({ request }) => {
		const admin = klienWajib(buatKlienAdmin());
		const form = await request.formData();
		const kelompokId = String(form.get('kelompok_id') ?? '');
		const mentorId = String(form.get('mentor_id') ?? '').trim();
		const { error } = await admin
			.from('kelompok')
			.update({ mentor_id: mentorId || null })
			.eq('id', kelompokId);
		if (error) return fail(500, { pesan: error.message });
		return { pesan: 'Mentor kelompok diperbarui.' };
	},

	otomatis: async () => {
		const admin = klienWajib(buatKlienAdmin());
		const [kelompok, peserta] = await Promise.all([
			admin.from('kelompok').select('id, nama').order('nama'),
			admin.from('peserta').select('id, nama, kelompok_id').order('nama')
		]);
		const grup = (kelompok.data ?? []) as Pick<KelompokRow, 'id' | 'nama'>[];
		if (grup.length === 0) {
			return fail(400, { pesan: 'Buat minimal satu kelompok dulu.' });
		}

		const ukuran = new Map<string, number>(grup.map((k) => [k.id, 0]));
		const belum: string[] = [];
		for (const p of peserta.data ?? []) {
			if (p.kelompok_id && ukuran.has(p.kelompok_id)) {
				ukuran.set(p.kelompok_id, (ukuran.get(p.kelompok_id) ?? 0) + 1);
			} else {
				belum.push(p.id);
			}
		}

		// Bagi rata: peserta tanpa kelompok masuk ke kelompok terkecil.
		let dipindah = 0;
		for (const pesertaId of belum) {
			const terkecil = grup
				.slice()
				.sort((a, b) => (ukuran.get(a.id) ?? 0) - (ukuran.get(b.id) ?? 0))[0];
			const { error } = await admin
				.from('peserta')
				.update({ kelompok_id: terkecil.id })
				.eq('id', pesertaId);
			if (!error) {
				ukuran.set(terkecil.id, (ukuran.get(terkecil.id) ?? 0) + 1);
				dipindah += 1;
			}
		}

		return { pesan: `${dipindah} peserta dibagi rata ke kelompok terkecil.` };
	},

	'buat-mentor': async ({ request }) => {
		const admin = klienWajib(buatKlienAdmin());
		const form = await request.formData();
		const nama = String(form.get('nama') ?? '').trim();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const sandi = String(form.get('sandi') ?? '');

		if (nama.length < 3) return fail(400, { pesan: 'Nama mentor minimal 3 huruf.' });
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(400, { pesan: 'Email tidak valid.' });
		if (sandi.length < 8) return fail(400, { pesan: 'Sandi mentor minimal 8 karakter.' });

		const { data: dibuat, error } = await admin.auth.admin.createUser({
			email,
			password: sandi,
			email_confirm: true,
			app_metadata: { role: 'mentor' },
			user_metadata: { nama }
		});
		if (error || !dibuat.user) {
			const pesan = error?.message.includes('already')
				? 'Email itu sudah terdaftar.'
				: `Gagal membuat akun mentor: ${error?.message ?? 'tidak diketahui'}`;
			return fail(400, { pesan });
		}

		const { error: galatMentor } = await admin.from('mentor').insert({ id: dibuat.user.id, nama });
		if (galatMentor) {
			await admin.auth.admin.deleteUser(dibuat.user.id);
			return fail(400, { pesan: `Gagal menyimpan mentor: ${galatMentor.message}` });
		}

		// GoTrue menyetel app_metadata sesudah baris auth dibuat, jadi peran di
		// profiles sempat ketinggalan 'peserta'. Samakan langsung — jaring
		// pengaman untuk basis data yang belum menjalankan migrasi 0004.
		await admin.from('profiles').update({ role: 'mentor' }).eq('id', dibuat.user.id);

		return { pesan: `Akun mentor ${nama} dibuat. Bagikan email dan sandinya.` };
	}
};
