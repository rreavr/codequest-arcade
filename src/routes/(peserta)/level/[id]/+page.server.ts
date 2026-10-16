import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { levelTerbuka, muatRekap } from '#lib/server/rekap.js';
import { klienWajib } from '#lib/server/supabase.js';
import { PESAN_TAUTAN, tautanTugasValid } from '#lib/tautan.js';
import type { HintRow, LevelRow, MisiRow } from '#lib/types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const noLevel = Number(params.id);
	if (![1, 2, 3].includes(noLevel)) error(404, 'Level tidak ditemukan.');

	const klien = klienWajib(locals.supabase);
	const id = locals.user!.id;

	const [rekap, penyelesaian, klaim, hints, hintDipakai, level] = await Promise.all([
		muatRekap(klien, { pesertaIds: [id] }),
		klien.from('penyelesaian').select('misi_id, diselesaikan_pada').eq('peserta_id', id),
		klien.from('klaim_misi').select('misi_id, link_bukti').eq('peserta_id', id),
		klien.from('hint').select('*').eq('level_id', noLevel).order('urutan'),
		klien.from('hint_dipakai').select('hint_id').eq('peserta_id', id),
		klien.from('level').select('*').eq('id', noLevel).maybeSingle()
	]);

	const baris = rekap.baris[0];
	if (!baris) error(404, 'Data peserta tidak ditemukan.');
	if (!level.data) error(404, 'Level belum disiapkan panitia.');

	const selesaiMap = new Map<string, string>(
		(penyelesaian.data ?? []).map((r) => [r.misi_id as string, r.diselesaikan_pada as string])
	);
	const klaimIds = new Set<string>((klaim.data ?? []).map((r) => r.misi_id as string));
	const tautanKlaim = new Map<string, string>(
		(klaim.data ?? []).map((r) => [r.misi_id as string, r.link_bukti as string])
	);
	const dipakai = new Set<string>((hintDipakai.data ?? []).map((r) => r.hint_id as string));
	const terbuka = levelTerbuka(baris.bahan.misiSelesai)[noLevel - 1];

	const misi = rekap.misiPerLevel[noLevel - 1].map((m: MisiRow) => ({
		id: m.id,
		urut: m.urutan,
		judul: m.judul,
		instruksi: m.instruksi,
		kriteria: m.kriteria,
		poin: m.poin,
		selesai: selesaiMap.has(m.id),
		diselesaikan: selesaiMap.get(m.id) ?? null,
		menunggu: klaimIds.has(m.id),
		tautan: tautanKlaim.get(m.id) ?? null
	}));

	const daftarHint = (hints.data ?? []).map((h: HintRow) => ({
		id: h.id,
		urutan: h.urutan,
		isi: h.isi,
		dipakai: dipakai.has(h.id)
	}));

	return {
		level: level.data as LevelRow,
		misi,
		hints: daftarHint,
		terbuka,
		jumlahLevel: 3
	};
};

export const actions: Actions = {
	klaim: async ({ request, locals }) => {
		const klien = klienWajib(locals.supabase);
		const id = locals.user!.id;
		const form = await request.formData();
		const misiId = String(form.get('misi_id') ?? '');
		const tautan = String(form.get('link_bukti') ?? '').trim();
		if (!misiId) return fail(400, { pesan: 'Misi tidak dikenali.', galat: true });
		if (!tautanTugasValid(tautan)) return fail(400, { pesan: PESAN_TAUTAN, galat: true });

		// Tautan wajib ada sebelum minta verifikasi; kirim ulang = perbarui tautan.
		const { error: galat } = await klien.from('klaim_misi').upsert(
			{
				peserta_id: id,
				misi_id: misiId,
				link_bukti: tautan,
				diklaim_pada: new Date().toISOString()
			},
			{ onConflict: 'peserta_id,misi_id' }
		);
		if (galat) {
			console.error('level: gagal mengirim klaim', galat.message);
			return fail(500, {
				pesan: 'Gagal mengirim klaim. Coba lagi — kalau tetap gagal, minta bantuan mentor.',
				galat: true
			});
		}
		return { pesan: 'Terkirim! Tautan tugasmu tersimpan — minta mentor memeriksa.', galat: false };
	},

	hint: async ({ request, locals }) => {
		const klien = klienWajib(locals.supabase);
		const id = locals.user!.id;
		const hintId = String((await request.formData()).get('hint_id') ?? '');
		if (!hintId) return fail(400, { pesan: 'Kartu hint tidak dikenali.', galat: true });

		const { error: galat } = await klien.from('hint_dipakai').insert({ peserta_id: id, hint_id: hintId });
		if (galat) {
			if (galat.code === '23505') {
				return fail(400, { pesan: 'Kartu ini sudah kamu buka.', galat: true });
			}
			console.error('level: gagal membuka kartu hint', galat.message);
			return fail(400, { pesan: 'Gagal membuka kartu. Coba lagi, ya.', galat: true });
		}
		return { pesan: 'Kartu hint terbuka. Poinmu tidak berkurang.', galat: false };
	}
};
