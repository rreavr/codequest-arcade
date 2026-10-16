import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { buatKlienAdmin, klienWajib } from '#lib/server/supabase.js';
import { jawabanDariForm, nilaiJawaban } from '#lib/server/soal.js';
import type { HasilTesRow, SoalRow } from '#lib/types.js';

const JENIS_VALID = ['pre', 'post'] as const;
type JenisTesValid = (typeof JENIS_VALID)[number];

function jenisDari(params: { jenis: string }): JenisTesValid {
	const jenis = params.jenis as JenisTesValid;
	if (!JENIS_VALID.includes(jenis)) error(404, 'Jenis tes tidak dikenal.');
	return jenis;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const jenis = jenisDari(params);
	const klien = klienWajib(locals.supabase);
	const admin = klienWajib(buatKlienAdmin());
	const id = locals.user!.id;

	const [hasil, soal] = await Promise.all([
		klien.from('hasil_tes').select('*').eq('peserta_id', id).eq('jenis', jenis).maybeSingle(),
		admin.from('soal').select('*').eq('jenis', jenis).eq('aktif', true).order('urutan')
	]);

	const daftarSoal = ((soal.data ?? []) as SoalRow[]).map((s) => ({
		id: s.id,
		urutan: s.urutan,
		pertanyaan: s.pertanyaan,
		pilihan: s.pilihan
	}));

	return {
		jenis,
		hasil: (hasil.data as HasilTesRow | null) ?? null,
		soal: daftarSoal
	};
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		const jenis = jenisDari(params);
		const admin = klienWajib(buatKlienAdmin());
		const id = locals.user!.id;

		const { data: sudah } = await admin
			.from('hasil_tes')
			.select('peserta_id')
			.eq('peserta_id', id)
			.eq('jenis', jenis)
			.maybeSingle();
		if (sudah) return fail(400, { pesan: 'Tes ini sudah kamu kerjakan.' });

		const { data: soal } = await admin
			.from('soal')
			.select('*')
			.eq('jenis', jenis)
			.eq('aktif', true)
			.order('urutan');

		const daftar = (soal ?? []) as SoalRow[];
		if (daftar.length === 0) {
			return fail(503, { pesan: 'Soal belum disiapkan panitia. Coba lagi nanti, ya.' });
		}

		const { data: kunciData } = await admin
			.from('soal_kunci')
			.select('soal_id, jawaban')
			.in(
				'soal_id',
				daftar.map((s) => s.id)
			);
		const kunci = new Map<string, number>((kunciData ?? []).map((k) => [k.soal_id as string, k.jawaban as number]));

		const form = await request.formData();
		const jawaban = jawabanDariForm(form, daftar.length);
		const nilai = nilaiJawaban(daftar, kunci, jawaban);

		const { error: galat } = await admin.from('hasil_tes').insert({
			peserta_id: id,
			jenis,
			benar: nilai.benar,
			total: nilai.total,
			skor: nilai.skor,
			jawaban: nilai.jawaban
		});
		if (galat) {
			const pesan = galat.code === '23505' ? 'Tes ini sudah kamu kerjakan.' : galat.message;
			return fail(400, { pesan });
		}

		redirect(303, `/tes/${jenis}?selesai=1`);
	}
};
