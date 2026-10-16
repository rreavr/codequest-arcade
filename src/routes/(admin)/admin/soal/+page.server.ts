import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { klienWajib } from '#lib/server/supabase.js';
import type { SoalRow } from '#lib/types.js';

export interface SoalAdmin extends SoalRow {
	jawaban: number | null;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const klien = klienWajib(locals.supabase);
	const [soal, kunci] = await Promise.all([
		klien.from('soal').select('*').order('urutan'),
		klien.from('soal_kunci').select('*')
	]);

	const kunciMap = new Map<string, number>(
		(kunci.data ?? []).map((k) => [k.soal_id as string, k.jawaban as number])
	);
	const daftar: SoalAdmin[] = ((soal.data ?? []) as SoalRow[]).map((s) => ({
		...s,
		jawaban: kunciMap.get(s.id) ?? null
	}));

	const editId = url.searchParams.get('edit');
	const edit = editId ? daftar.find((s) => s.id === editId) ?? null : null;

	const perJenis = {
		pre: daftar.filter((s) => s.jenis === 'pre').sort((a, b) => a.urutan - b.urutan),
		post: daftar.filter((s) => s.jenis === 'post').sort((a, b) => a.urutan - b.urutan),
		trivia: daftar.filter((s) => s.jenis === 'trivia').sort((a, b) => a.urutan - b.urutan)
	};

	return { perJenis, edit };
};

export const actions: Actions = {
	simpan: async ({ request, locals }) => {
		const klien = klienWajib(locals.supabase);
		const form = await request.formData();

		const id = String(form.get('id') ?? '').trim();
		const jenis = String(form.get('jenis') ?? '');
		const urutan = Number.parseInt(String(form.get('urutan') ?? ''), 10);
		const pertanyaan = String(form.get('pertanyaan') ?? '').trim();
		const pilihan = [0, 1, 2, 3].map((i) => String(form.get(`pilihan-${i}`) ?? '').trim());
		const jawaban = Number.parseInt(String(form.get('jawaban') ?? ''), 10);

		if (!['pre', 'post', 'trivia'].includes(jenis)) return fail(400, { pesan: 'Jenis soal tidak valid.' });
		if (!Number.isInteger(urutan) || urutan < 1) return fail(400, { pesan: 'Nomor urut harus angka mulai 1.' });
		if (pertanyaan.length < 3) return fail(400, { pesan: 'Pertanyaan terlalu pendek.' });
		if (pilihan.some((p) => p.length === 0)) return fail(400, { pesan: 'Isi keempat pilihan jawaban.' });
		if (![0, 1, 2, 3].includes(jawaban)) return fail(400, { pesan: 'Pilih kunci jawaban yang benar.' });

		let soalId = id;
		if (id) {
			const { error } = await klien
				.from('soal')
				.update({ jenis, urutan, pertanyaan, pilihan })
				.select('id')
				.single();
			if (error) {
				const pesan = error.code === '23505' ? 'Nomor urut itu sudah dipakai di jenis ini.' : error.message;
				return fail(400, { pesan });
			}
		} else {
			const { data, error } = await klien
				.from('soal')
				.upsert({ jenis, urutan, pertanyaan, pilihan }, { onConflict: 'jenis,urutan' })
				.select('id')
				.single();
			if (error || !data) {
				const pesan = error?.code === '23505' ? 'Nomor urut itu sudah dipakai di jenis ini.' : (error?.message ?? 'Gagal menyimpan.');
				return fail(400, { pesan });
			}
			soalId = data.id as string;
		}

		const { error: galatKunci } = await klien
			.from('soal_kunci')
			.upsert({ soal_id: soalId, jawaban }, { onConflict: 'soal_id' });
		if (galatKunci) return fail(400, { pesan: `Kunci gagal disimpan: ${galatKunci.message}` });

		return { pesan: id ? 'Soal diperbarui.' : 'Soal baru ditambahkan.' };
	},

	hapus: async ({ request, locals }) => {
		const klien = klienWajib(locals.supabase);
		const soalId = String((await request.formData()).get('soal_id') ?? '');
		const { error } = await klien.from('soal').delete().eq('id', soalId);
		if (error) return fail(500, { pesan: error.message });
		return { pesan: 'Soal dihapus.' };
	}
};
