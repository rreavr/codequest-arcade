import { describe, expect, it } from 'vitest';
import {
	hitungPoinTrivia,
	levelTerbuka,
	misiBerikutnya,
	susunRekap
} from '../src/lib/server/rekap';
import type { KelompokRow, MisiRow, PesertaRow } from '../src/lib/types';

function peserta(ubah: Partial<PesertaRow>): PesertaRow {
	return {
		id: 'p1',
		nama: 'Ani',
		nim: '2400000001',
		whatsapp: '0800000000',
		pengalaman: 'pernah',
		kendala: '-',
		bawa_laptop: true,
		checkin_pada: null,
		kelompok_id: null,
		papan_optin: false,
		dibuat_pada: '2026-10-01T00:00:00Z',
		...ubah
	};
}

function misi(id: string, level_id: number, urutan: number): MisiRow {
	return {
		id,
		level_id,
		urutan,
		judul: `Misi ${id}`,
		instruksi: '-',
		kriteria: '-',
		poin: level_id === 3 ? 3 : 2
	};
}

const MISI: MisiRow[] = [
	misi('m1', 1, 1),
	misi('m2', 1, 2),
	misi('m3', 1, 3),
	misi('m4', 2, 1),
	misi('m5', 3, 1)
];

const KELOMPOK: KelompokRow[] = [
	{ id: 'k1', nama: 'Kelompok 1', mentor_id: 'mt1', dibuat_pada: '2026-10-01T00:00:00Z' }
];

describe('hitungPoinTrivia (floor(3 x benar/total), PRD bagian 3)', () => {
	it.each([
		[5, 5, 3],
		[4, 5, 2],
		[3, 5, 1],
		[2, 5, 1],
		[1, 5, 0],
		[0, 5, 0]
	])('benar %i dari %i = %i poin', (benar, total, harapan) => {
		expect(hitungPoinTrivia(benar, total)).toBe(harapan);
	});

	it('aman untuk masukan tidak wajar', () => {
		expect(hitungPoinTrivia(0, 0)).toBe(0);
		expect(hitungPoinTrivia(5, 0)).toBe(0);
		expect(hitungPoinTrivia(-2, 5)).toBe(0);
		expect(hitungPoinTrivia(99, 5)).toBe(3);
	});
});

describe('levelTerbuka (berurutan)', () => {
	it('level 1 selalu terbuka', () => {
		expect(levelTerbuka([0, 0, 0])).toEqual([true, false, false]);
	});

	it('level berikutnya terbuka hanya setelah 3 misi level sebelumnya selesai', () => {
		expect(levelTerbuka([2, 0, 0])).toEqual([true, false, false]);
		expect(levelTerbuka([3, 0, 0])).toEqual([true, true, false]);
		expect(levelTerbuka([3, 3, 0])).toEqual([true, true, true]);
	});

	it('level yang terlewat tidak membuka level berikutnya', () => {
		expect(levelTerbuka([2, 3, 3])).toEqual([true, false, false]);
	});
});

describe('misiBerikutnya', () => {
	it('mengembalikan misi pertama yang belum selesai di level terbuka', () => {
		const selesai = new Set(['m1', 'm2', 'm3']);
		expect(misiBerikutnya([[...MISI].slice(0, 3), [MISI[3]], [MISI[4]]], selesai, [3, 0, 0])?.id).toBe(
			'm4'
		);
	});

	it('null jika semua misi sudah selesai', () => {
		const semua = new Set(MISI.map((m) => m.id));
		expect(misiBerikutnya([[...MISI].slice(0, 3), [MISI[3]], [MISI[4]]], semua, [3, 1, 1])).toBe(
			null
		);
	});
});

describe('susunRekap', () => {
	it('menghitung base camp, poin per level, trivia, dan bonus; urut nama', () => {
		const rekap = susunRekap({
			peserta: [
				peserta({ id: 'a', nama: 'Budi' }),
				peserta({ id: 'b', nama: 'Ani', checkin_pada: '2026-10-10T01:00:00Z', kelompok_id: 'k1' })
			],
			kelompok: KELOMPOK,
			mentor: [{ id: 'mt1', nama: 'Mentor Satu', cadangan: false, dibuat_pada: '2026-10-01T00:00:00Z' }],
			misi: MISI,
			penyelesaian: [
				{ peserta_id: 'b', misi_id: 'm1' },
				{ peserta_id: 'b', misi_id: 'm2' },
				{ peserta_id: 'b', misi_id: 'm3' },
				{ peserta_id: 'b', misi_id: 'm9' } // misi tak dikenal: diabaikan
			],
			hasilTes: [
				{ peserta_id: 'b', jenis: 'pre', benar: 8, total: 10, skor: 80 },
				{ peserta_id: 'b', jenis: 'trivia', benar: 5, total: 5, skor: 100 }
			],
			bonus: [
				{ peserta_id: 'b', jenis: 'error_collector' },
				{ peserta_id: 'b', jenis: 'error_collector' },
				{ peserta_id: 'b', jenis: 'buddy_assist' }
			],
			survei: [{ peserta_id: 'b', lebih_siap: true }]
		});

		expect(rekap.baris.map((b) => b.peserta.nama)).toEqual(['Ani', 'Budi']);

		const ani = rekap.baris[0];
		// 2 (base camp) + 6 (3 misi level 1) + 3 (trivia sempurna) + 2 (error collector) + 1 (buddy)
		expect(ani.poin).toBe(14);
		expect(ani.tier).toBe('explorer');
		expect(ani.badges).toEqual(['Logic Navigator']);
		expect(ani.namaKelompok).toBe('Kelompok 1');
		expect(ani.namaMentor).toBe('Mentor Satu');
		expect(ani.skorTrivia).toBe(100);
		expect(ani.lebihSiap).toBe(true);

		const budi = rekap.baris[1];
		expect(budi.poin).toBe(0);
		expect(budi.tier).toBe('none');
		expect(budi.badges).toEqual([]);
		expect(budi.namaKelompok).toBeNull();
	});

	it('base camp butuh check-in DAN pre-test', () => {
		const rekap = susunRekap({
			peserta: [peserta({ id: 'a', checkin_pada: '2026-10-10T01:00:00Z' })],
			kelompok: [],
			mentor: [],
			misi: MISI,
			penyelesaian: [],
			hasilTes: [{ peserta_id: 'a', jenis: 'post', benar: 5, total: 10, skor: 50 }],
			bonus: [],
			survei: []
		});
		expect(rekap.baris[0].bahan.pretestSelesai).toBe(false);
		expect(rekap.baris[0].poin).toBe(0);
	});

	it('mengurutkan misi per level berdasarkan urutan', () => {
		const rekap = susunRekap({
			peserta: [],
			kelompok: [],
			mentor: [],
			misi: [MISI[2], MISI[0], MISI[1], MISI[3], MISI[4]],
			penyelesaian: [],
			hasilTes: [],
			bonus: [],
			survei: []
		});
		expect(rekap.misiPerLevel[0].map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
		expect(rekap.misiPerLevel[1].map((m) => m.id)).toEqual(['m4']);
	});
});
