// Rekap poin: membaca data mentah dari database lalu menghitung progres memakai
// rumus di src/lib/server/points.ts (satu-satunya sumber kebenaran poin).

import type {
	BonusRow,
	HasilTesRow,
	KelompokRow,
	MentorRow,
	MisiRow,
	PesertaRow,
	PenyelesaianRow,
	SurveiRow,
	KlaimRow
} from '#lib/types.js';
import { MISSIONS_PER_LEVEL, POINTS, type Tier } from '#lib/constants/points.js';
import { badgesFor, tierFor, totalPoints, type Progress } from './points';
import type { Klien } from './supabase';

export interface BahanPoin {
	hadir: boolean;
	/** Pre-test sudah dikerjakan (bagian dari Base Camp). */
	pretestSelesai: boolean;
	/** Jumlah misi selesai per level (level 1..3). */
	misiSelesai: [number, number, number];
	triviaBenar: number;
	triviaTotal: number;
	errorCollector: number;
	buddyAssist: number;
}

/**
 * Poin trivia dari jumlah jawaban benar: floor(3 x benar/total), maksimal 3.
 * Rumus yang sama dipakai public.poin_peserta() di database.
 */
export function hitungPoinTrivia(benar: number, total: number): number {
	if (total <= 0) return 0;
	const b = Math.min(Math.max(benar, 0), total);
	return Math.min(POINTS.trivia, Math.floor((POINTS.trivia * b) / total));
}

export function keProgress(b: BahanPoin): Progress {
	return {
		baseCampDone: b.hadir && b.pretestSelesai,
		level1Missions: b.misiSelesai[0],
		level2Missions: b.misiSelesai[1],
		level3Missions: b.misiSelesai[2],
		triviaPoints: hitungPoinTrivia(b.triviaBenar, b.triviaTotal),
		errorCollectorCount: b.errorCollector,
		buddyAssistCount: b.buddyAssist
	};
}

export interface RekapBaris {
	peserta: PesertaRow;
	namaKelompok: string | null;
	namaMentor: string | null;
	bahan: BahanPoin;
	poin: number;
	tier: Tier;
	badges: string[];
	skorPretest: number | null;
	skorPosttest: number | null;
	skorTrivia: number | null;
	lebihSiap: boolean | null;
}

export interface DataRekap {
	baris: RekapBaris[];
	misiPerLevel: MisiRow[][];
	kelompok: KelompokRow[];
	mentor: MentorRow[];
}

interface SumberMentah {
	peserta: PesertaRow[];
	kelompok: KelompokRow[];
	mentor: MentorRow[];
	misi: MisiRow[];
	penyelesaian: Pick<PenyelesaianRow, 'peserta_id' | 'misi_id'>[];
	hasilTes: Pick<HasilTesRow, 'peserta_id' | 'jenis' | 'benar' | 'total' | 'skor'>[];
	bonus: Pick<BonusRow, 'peserta_id' | 'jenis'>[];
	survei: Pick<SurveiRow, 'peserta_id' | 'lebih_siap'>[];
}

/** Hitung rekap dari data mentah. Murni supaya mudah diuji. */
export function susunRekap(s: SumberMentah, klaim: Pick<KlaimRow, 'peserta_id' | 'misi_id'>[] = []): DataRekap {
	const levelMisi = new Map<string, number>();
	for (const m of s.misi) levelMisi.set(m.id, m.level_id);

	const selesaiPerPeserta = new Map<string, number[]>(); // [l1, l2, l3]
	for (const p of s.penyelesaian) {
		const level = levelMisi.get(p.misi_id);
		if (!level) continue;
		const arr = selesaiPerPeserta.get(p.peserta_id) ?? [0, 0, 0];
		if (level >= 1 && level <= 3) arr[level - 1] += 1;
		selesaiPerPeserta.set(p.peserta_id, arr);
	}
	// klaim dipakai halaman misi; di sini hanya untuk kelengkapan tipe
	void klaim;

	const tes = new Map<string, { pre?: number; post?: number; triviaBenar?: number; triviaTotal?: number }>();
	for (const h of s.hasilTes) {
		const t = tes.get(h.peserta_id) ?? {};
		if (h.jenis === 'pre') t.pre = h.skor;
		if (h.jenis === 'post') t.post = h.skor;
		if (h.jenis === 'trivia') {
			t.triviaBenar = h.benar;
			t.triviaTotal = h.total;
		}
		tes.set(h.peserta_id, t);
	}

	const bonusPerPeserta = new Map<string, { ec: number; ba: number }>();
	for (const b of s.bonus) {
		const t = bonusPerPeserta.get(b.peserta_id) ?? { ec: 0, ba: 0 };
		if (b.jenis === 'error_collector') t.ec += 1;
		if (b.jenis === 'buddy_assist') t.ba += 1;
		bonusPerPeserta.set(b.peserta_id, t);
	}

	const pesertaById = new Map(s.peserta.map((p) => [p.id, p]));
	const namaKelompok = new Map(s.kelompok.map((k) => [k.id, k.nama]));
	const namaMentor = new Map(s.mentor.map((m) => [m.id, m.nama]));
	const kelompokMentor = new Map(s.kelompok.map((k) => [k.id, k.mentor_id]));

	const baris: RekapBaris[] = s.peserta
		.slice()
		.sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
		.map((p) => {
			const selesai = selesaiPerPeserta.get(p.id) ?? [0, 0, 0];
			const t = tes.get(p.id) ?? {};
			const bonus = bonusPerPeserta.get(p.id) ?? { ec: 0, ba: 0 };
			const bahan: BahanPoin = {
				hadir: p.checkin_pada !== null,
				pretestSelesai: t.pre !== undefined,
				misiSelesai: [selesai[0], selesai[1], selesai[2]],
				triviaBenar: t.triviaBenar ?? 0,
				triviaTotal: t.triviaTotal ?? 0,
				errorCollector: bonus.ec,
				buddyAssist: bonus.ba
			};
			const progres = keProgress(bahan);
			const poin = totalPoints(progres);
			const grupId = p.kelompok_id;
			const mentorId = grupId ? kelompokMentor.get(grupId) ?? null : null;
			return {
				peserta: p,
				namaKelompok: grupId ? namaKelompok.get(grupId) ?? null : null,
				namaMentor: mentorId ? namaMentor.get(mentorId) ?? null : null,
				bahan,
				poin,
				tier: tierFor(poin),
				badges: badgesFor(progres),
				skorPretest: t.pre ?? null,
				skorPosttest: t.post ?? null,
				skorTrivia: t.triviaTotal ? Math.round((100 * (t.triviaBenar ?? 0)) / t.triviaTotal) : null,
				lebihSiap: s.survei.find((v) => v.peserta_id === p.id)?.lebih_siap ?? null
			};
		});

	const misiPerLevel: MisiRow[][] = [[], [], []];
	for (const m of s.misi) {
		if (m.level_id >= 1 && m.level_id <= 3) misiPerLevel[m.level_id - 1].push(m);
	}
	for (const daftar of misiPerLevel) daftar.sort((a, b) => a.urutan - b.urutan);

	return { baris, misiPerLevel, kelompok: s.kelompok, mentor: s.mentor };
}

/** Muat data mentah lalu susun rekap. pesertaIds membatasi lingkup (mis. satu kelompok). */
export async function muatRekap(
	klien: Klien,
	opsi: { pesertaIds?: string[] } = {}
): Promise<DataRekap> {
	let kueriPeserta = klien.from('peserta').select('*');
	if (opsi.pesertaIds) kueriPeserta = kueriPeserta.in('id', opsi.pesertaIds);

	const [peserta, kelompok, mentor, misi, penyelesaian, hasilTes, bonus, survei] = await Promise.all([
		kueriPeserta,
		klien.from('kelompok').select('*'),
		klien.from('mentor').select('*'),
		klien.from('misi').select('*'),
		klien.from('penyelesaian').select('peserta_id, misi_id'),
		klien.from('hasil_tes').select('peserta_id, jenis, benar, total, skor'),
		klien.from('bonus').select('peserta_id, jenis'),
		klien.from('survei').select('peserta_id, lebih_siap')
	]);

	const galat = [peserta, kelompok, mentor, misi, penyelesaian, hasilTes, bonus, survei].find(
		(r) => r.error
	);
	if (galat?.error) throw new Error(`Gagal memuat data rekap: ${galat.error.message}`);

	return susunRekap({
		peserta: (peserta.data ?? []) as PesertaRow[],
		kelompok: (kelompok.data ?? []) as KelompokRow[],
		mentor: (mentor.data ?? []) as MentorRow[],
		misi: (misi.data ?? []) as MisiRow[],
		penyelesaian: (penyelesaian.data ?? []) as PenyelesaianRow[],
		hasilTes: (hasilTes.data ?? []) as HasilTesRow[],
		bonus: (bonus.data ?? []) as BonusRow[],
		survei: (survei.data ?? []) as SurveiRow[]
	});
}

/** Level terbuka secara berurutan: level n terbuka setelah semua misi level n-1 selesai. */
export function levelTerbuka(misiSelesai: number[]): boolean[] {
	const terbuka = [true, false, false];
	for (let i = 1; i < 3; i++) {
		terbuka[i] = terbuka[i - 1] && misiSelesai[i - 1] >= MISSIONS_PER_LEVEL;
	}
	return terbuka;
}

/** Misi berikutnya: misi pertama yang belum selesai di level terbuka pertama. */
export function misiBerikutnya(misiPerLevel: MisiRow[][], selesaiIds: Set<string>, misiSelesai: number[]): MisiRow | null {
	const terbuka = levelTerbuka(misiSelesai);
	for (let i = 0; i < 3; i++) {
		if (!terbuka[i]) continue;
		for (const m of misiPerLevel[i]) {
			if (!selesaiIds.has(m.id)) return m;
		}
	}
	return null;
}
