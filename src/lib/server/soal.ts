// Penilaian tes pilihan ganda. Dijalankan di server memakai kunci jawaban yang
// tidak pernah dikirim ke peramban.

import type { SoalRow } from '#lib/types.js';

export interface HasilPenilaian {
	benar: number;
	total: number;
	/** 0 sampai 100, dibulatkan. */
	skor: number;
	jawaban: number[];
}

export function nilaiJawaban(
	soal: SoalRow[],
	kunci: Map<string, number>,
	jawaban: number[]
): HasilPenilaian {
	let benar = 0;
	const jawabanBersih: number[] = [];
	soal.forEach((s, i) => {
		const j = Number.isInteger(jawaban[i]) ? jawaban[i] : -1;
		jawabanBersih.push(j);
		if (kunci.get(s.id) === j) benar += 1;
	});
	const total = soal.length;
	return { benar, total, skor: total > 0 ? Math.round((100 * benar) / total) : 0, jawaban: jawabanBersih };
}

/** Ubah FormData (kunci answer-<nomor>) menjadi array jawaban berurutan. */
export function jawabanDariForm(form: FormData, jumlah: number): number[] {
	const hasil: number[] = [];
	for (let i = 0; i < jumlah; i++) {
		const v = form.get(`jawaban-${i}`);
		hasil.push(v === null ? -1 : Number.parseInt(String(v), 10));
	}
	return hasil;
}
