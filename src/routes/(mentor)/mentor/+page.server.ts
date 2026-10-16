import type { PageServerLoad } from './$types';
import { muatRekap } from '#lib/server/rekap.js';
import { klienWajib } from '#lib/server/supabase.js';
import type { KelompokRow } from '#lib/types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const klien = klienWajib(locals.supabase);
	const id = locals.user!.id;

	const { data: kelompok } = await klien.from('kelompok').select('*').eq('mentor_id', id);
	const daftarKelompok = (kelompok ?? []) as KelompokRow[];

	const hasil: {
		kelompok: KelompokRow;
		jumlahPeserta: number;
		jumlahMenunggu: number;
		ringkas: { id: string; nama: string; poin: number; misiSelesai: number; tier: string }[];
	}[] = [];

	for (const k of daftarKelompok) {
		const { data: anggota } = await klien.from('peserta').select('id').eq('kelompok_id', k.id);
		const ids = (anggota ?? []).map((a) => a.id as string);
		if (ids.length === 0) {
			hasil.push({ kelompok: k, jumlahPeserta: 0, jumlahMenunggu: 0, ringkas: [] });
			continue;
		}

		const [rekap, klaim, selesai] = await Promise.all([
			muatRekap(klien, { pesertaIds: ids }),
			klien.from('klaim_misi').select('peserta_id, misi_id').in('peserta_id', ids),
			klien.from('penyelesaian').select('peserta_id, misi_id').in('peserta_id', ids)
		]);

		const kunciSelesai = new Set(
			(selesai.data ?? []).map((r) => `${r.peserta_id}:${r.misi_id}`)
		);
		const jumlahMenunggu = (klaim.data ?? []).filter(
			(r) => !kunciSelesai.has(`${r.peserta_id}:${r.misi_id}`)
		).length;

		hasil.push({
			kelompok: k,
			jumlahPeserta: ids.length,
			jumlahMenunggu,
			ringkas: rekap.baris.map((b) => ({
				id: b.peserta.id,
				nama: b.peserta.nama,
				poin: b.poin,
				misiSelesai: b.bahan.misiSelesai.reduce((a, c) => a + c, 0),
				tier: b.tier
			}))
		});
	}

	return { hasil };
};
