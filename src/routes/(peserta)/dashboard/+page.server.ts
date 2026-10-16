import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { TIER_THRESHOLDS, MISSIONS_PER_LEVEL } from '#lib/constants/points.js';
import { levelTerbuka, muatRekap, misiBerikutnya } from '#lib/server/rekap.js';
import { buatKlienAdmin, klienWajib } from '#lib/server/supabase.js';

export const load: PageServerLoad = async ({ locals }) => {
	const klien = klienWajib(locals.supabase);
	const id = locals.user!.id;

	const [rekap, penyelesaian, klaim] = await Promise.all([
		muatRekap(klien, { pesertaIds: [id] }),
		klien.from('penyelesaian').select('misi_id').eq('peserta_id', id),
		klien.from('klaim_misi').select('misi_id').eq('peserta_id', id)
	]);

	const baris = rekap.baris[0];
	if (!baris) error(404, 'Data peserta tidak ditemukan.');

	const selesaiIds = new Set<string>((penyelesaian.data ?? []).map((r) => r.misi_id as string));
	const klaimIds = new Set<string>((klaim.data ?? []).map((r) => r.misi_id as string));
	const berikutnya = misiBerikutnya(rekap.misiPerLevel, selesaiIds, baris.bahan.misiSelesai);

	// Target tier berikutnya untuk bilah progres.
	type Target = { label: string; poin: number; selesai: boolean };
	const target: Target[] = [
		{ label: 'Explorer', poin: TIER_THRESHOLDS.explorer, selesai: baris.poin >= TIER_THRESHOLDS.explorer },
		{ label: 'Builder', poin: TIER_THRESHOLDS.builder, selesai: baris.poin >= TIER_THRESHOLDS.builder },
		{ label: 'Champion', poin: TIER_THRESHOLDS.champion, selesai: baris.poin >= TIER_THRESHOLDS.champion }
	];
	const targetBerikut = target.find((t) => !t.selesai) ?? null;

	return {
		baris,
		misiPerLevel: rekap.misiPerLevel.map((daftar) =>
			daftar.map((m) => ({
				id: m.id,
				judul: m.judul,
				urutan: m.urutan,
				poin: m.poin,
				selesai: selesaiIds.has(m.id),
				menunggu: klaimIds.has(m.id)
			}))
		),
		terbuka: levelTerbuka(baris.bahan.misiSelesai),
		berikutnya: berikutnya ? { id: berikutnya.id, judul: berikutnya.judul, level: berikutnya.level_id } : null,
		targetBerikut,
		jumlahMisiPerLevel: MISSIONS_PER_LEVEL
	};
};

export const actions: Actions = {
	papan: async ({ request, locals }) => {
		const admin = buatKlienAdmin();
		if (!admin) return fail(503, { pesan: 'Situs belum terhubung ke basis data acara. Coba beberapa saat lagi.' });
		const id = locals.user!.id;
		const form = await request.formData();
		const optin = form.get('optin') === 'ya';
		const { error } = await admin.from('peserta').update({ papan_optin: optin }).eq('id', id);
		if (error) return fail(500, { pesan: 'Gagal menyimpan pilihan.' });
		return { pesan: optin ? 'Namamu akan tampil di Papan Kehormatan.' : 'Namamu disembunyikan dari Papan Kehormatan.' };
	}
};
