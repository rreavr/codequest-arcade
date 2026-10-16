import type { PageServerLoad } from './$types';
import { buatKlienAdmin, klienWajib } from '#lib/server/supabase.js';
import { muatRekap } from '#lib/server/rekap.js';
import { ACARA } from '#lib/constants/acara.js';

export const load: PageServerLoad = async () => {
	const admin = klienWajib(buatKlienAdmin());
	const rekap = await muatRekap(admin);

	const total = rekap.baris.length;
	const hadir = rekap.baris.filter((b) => b.bahan.hadir).length;
	const builderPlus = rekap.baris.filter((b) => b.poin >= 23).length;
	const champion = rekap.baris.filter((b) => b.tier === 'champion').length;
	const explorer = rekap.baris.filter((b) => b.tier === 'explorer').length;

	const [klaim, selesai, survei] = await Promise.all([
		admin.from('klaim_misi').select('peserta_id, misi_id'),
		admin.from('penyelesaian').select('peserta_id, misi_id'),
		admin.from('survei').select('peserta_id, lebih_siap')
	]);

	const kunciSelesai = new Set((selesai.data ?? []).map((r) => `${r.peserta_id}:${r.misi_id}`));
	const menunggu = (klaim.data ?? []).filter(
		(r) => !kunciSelesai.has(`${r.peserta_id}:${r.misi_id}`)
	).length;

	const pre = rekap.baris.map((b) => b.skorPretest).filter((v): v is number => v !== null);
	const post = rekap.baris.map((b) => b.skorPosttest).filter((v): v is number => v !== null);
	const rata = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, c) => a + c, 0) / xs.length) : null);

	const jumlahSurvei = (survei.data ?? []).length;
	const lebihSiap = (survei.data ?? []).filter((s) => s.lebih_siap).length;

	return {
		kuota: ACARA.kuotaPeserta,
		total,
		hadir,
		menunggu,
		explorer,
		builderPlus,
		champion,
		belumTier: total - explorer - builderPlus - champion,
		rataPretest: rata(pre),
		rataPosttest: rata(post),
		jumlahSurvei,
		lebihSiap,
		jumlahLevel2Misi: rekap.misiPerLevel[1].length,
		misiL2Tuntas: rekap.baris.filter((b) => b.bahan.misiSelesai[1] >= rekap.misiPerLevel[1].length).length,
		misiL3Tuntas: rekap.baris.filter((b) => b.bahan.misiSelesai[2] >= rekap.misiPerLevel[2].length).length
	};
};
