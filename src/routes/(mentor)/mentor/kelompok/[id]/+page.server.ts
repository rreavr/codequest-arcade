import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { muatRekap } from '#lib/server/rekap.js';
import { klienWajib } from '#lib/server/supabase.js';
import type { KelompokRow, MisiRow, PesertaRow } from '#lib/types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const klien = klienWajib(locals.supabase);
	const mentorId = locals.user!.id;

	const { data: kelompok } = await klien
		.from('kelompok')
		.select('*')
		.eq('id', params.id)
		.eq('mentor_id', mentorId)
		.maybeSingle();
	if (!kelompok) {
		error(404, 'Kelompok tidak ditemukan atau bukan kelompok bimbinganmu.');
	}

	const { data: anggota } = await klien
		.from('peserta')
		.select('*')
		.eq('kelompok_id', kelompok.id)
		.order('nama');
	const daftarAnggota = (anggota ?? []) as PesertaRow[];
	const ids = daftarAnggota.map((a) => a.id);

	if (ids.length === 0) {
		return {
			kelompok: kelompok as KelompokRow,
			peserta: [],
			misiPerLevel: [] as {
				id: string;
				level_id: number;
				urutan: number;
				judul: string;
				poin: number;
			}[][],
			selesai: [] as string[],
			klaim: [] as [string, string][],
			antrean: [] as {
				peserta: string;
				misi: string;
				waktu: string;
				tautan: string;
				peserta_id: string;
				misi_id: string;
			}[]
		};
	}

	const [rekap, klaim, selesai] = await Promise.all([
		muatRekap(klien, { pesertaIds: ids }),
		klien
			.from('klaim_misi')
			.select('peserta_id, misi_id, diklaim_pada, link_bukti')
			.in('peserta_id', ids),
		klien.from('penyelesaian').select('peserta_id, misi_id').in('peserta_id', ids)
	]);

	const selesaiSet = new Set<string>(
		(selesai.data ?? []).map((r) => `${r.peserta_id}:${r.misi_id}`)
	);
	const klaimList = (klaim.data ?? []).map(
		(r) => [`${r.peserta_id}:${r.misi_id}`, r.diklaim_pada as string] as [string, string]
	);
	const tautanKlaim = new Map<string, string>(
		(klaim.data ?? []).map((r) => [
			`${r.peserta_id}:${r.misi_id}`,
			(r.link_bukti as string | null) ?? ''
		])
	);

	const namaById = new Map(daftarAnggota.map((a) => [a.id, a.nama]));
	const judulMisi = new Map<string, string>();
	for (const daftar of rekap.misiPerLevel) {
		for (const m of daftar) judulMisi.set(m.id, `L${m.level_id} · ${m.judul}`);
	}

	const antrean = Array.from(new Set<string>(klaimList.map(([key]) => key)))
		.filter((key) => !selesaiSet.has(key))
		.map((key) => {
			const [pesertaId, misiId] = key.split(':');
			const waktu = klaimList.find(([k]) => k === key)?.[1] ?? '';
			return {
				peserta: namaById.get(pesertaId) ?? 'Peserta',
				misi: judulMisi.get(misiId) ?? 'Misi',
				waktu,
				tautan: tautanKlaim.get(key) ?? '',
				peserta_id: pesertaId,
				misi_id: misiId
			};
		})
		.sort((a, b) => a.waktu.localeCompare(b.waktu));

	return {
		kelompok: kelompok as KelompokRow,
		peserta: rekap.baris.map((b) => ({
			id: b.peserta.id,
			nama: b.peserta.nama,
			poin: b.poin,
			tier: b.tier,
			badges: b.badges,
			misiSelesai: b.bahan.misiSelesai,
			errorCollector: b.bahan.errorCollector,
			buddyAssist: b.bahan.buddyAssist
		})),
		misiPerLevel: rekap.misiPerLevel.map((daftar: MisiRow[]) =>
			daftar.map((m) => ({ id: m.id, level_id: m.level_id, urutan: m.urutan, judul: m.judul, poin: m.poin }))
		),
		selesai: Array.from(selesaiSet),
		klaim: klaimList,
		antrean
	};
};
