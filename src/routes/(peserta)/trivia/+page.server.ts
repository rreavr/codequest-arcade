import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ACARA } from '#lib/constants/acara.js';
import { buatKlienAdmin, klienWajib } from '#lib/server/supabase.js';
import { hitungPoinTrivia } from '#lib/server/rekap.js';
import { jawabanDariForm, nilaiJawaban } from '#lib/server/soal.js';
import type { HasilTesRow, SoalRow } from '#lib/types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const klien = klienWajib(locals.supabase);
	const admin = klienWajib(buatKlienAdmin());
	const id = locals.user!.id;

	const [hasil, soal] = await Promise.all([
		klien.from('hasil_tes').select('*').eq('peserta_id', id).eq('jenis', 'trivia').maybeSingle(),
		admin.from('soal').select('*').eq('jenis', 'trivia').eq('aktif', true).order('urutan')
	]);

	const hasilData = (hasil.data as HasilTesRow | null) ?? null;
	const daftarSoal = ((soal.data ?? []) as SoalRow[]).map((s) => ({
		id: s.id,
		pertanyaan: s.pertanyaan,
		pilihan: s.pilihan
	}));

	return {
		hasil: hasilData,
		poinDidapat: hasilData ? hitungPoinTrivia(hasilData.benar, hasilData.total) : null,
		soal: daftarSoal,
		durasi: ACARA.durasiTriviaDetik
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const admin = klienWajib(buatKlienAdmin());
		const id = locals.user!.id;

		const { data: sudah } = await admin
			.from('hasil_tes')
			.select('peserta_id')
			.eq('peserta_id', id)
			.eq('jenis', 'trivia')
			.maybeSingle();
		if (sudah) return fail(400, { pesan: 'Trivia sudah kamu kerjakan.' });

		const { data: soal } = await admin
			.from('soal')
			.select('*')
			.eq('jenis', 'trivia')
			.eq('aktif', true)
			.order('urutan');
		const daftar = (soal ?? []) as SoalRow[];
		if (daftar.length === 0) return fail(503, { pesan: 'Soal trivia belum disiapkan panitia.' });

		const { data: kunciData } = await admin
			.from('soal_kunci')
			.select('soal_id, jawaban')
			.in(
				'soal_id',
				daftar.map((s) => s.id)
			);
		const kunci = new Map<string, number>(
			(kunciData ?? []).map((k) => [k.soal_id as string, k.jawaban as number])
		);

		const form = await request.formData();
		const jawaban = jawabanDariForm(form, daftar.length);
		const nilai = nilaiJawaban(daftar, kunci, jawaban);

		const { error: galat } = await admin.from('hasil_tes').insert({
			peserta_id: id,
			jenis: 'trivia',
			benar: nilai.benar,
			total: nilai.total,
			skor: nilai.skor,
			jawaban: nilai.jawaban
		});
		if (galat) {
			const pesan = galat.code === '23505' ? 'Trivia sudah kamu kerjakan.' : galat.message;
			return fail(400, { pesan });
		}
		redirect(303, '/trivia');
	}
};
