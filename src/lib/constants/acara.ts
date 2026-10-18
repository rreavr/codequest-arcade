// Konstanta acara yang dipakai lintas halaman.

export const ACARA = {
	nama: 'HIMTI CodeQuest: First Level 2026',
	namaPendek: 'CodeQuest Arcade',
	tanggal: 'Sabtu, 21 November 2026',
	penyelenggara: 'HIMTI',
	kuotaPeserta: 32,
	/** Jumlah kartu hint per level per peserta (PRD bagian 3). */
	kartuHintPerLevel: 3,
	/** Batas waktu trivia dalam detik (10 menit). */
	durasiTriviaDetik: 600,
	/** Domain email sintetis untuk akun peserta (login memakai NIM + sandi). */
	domainEmailPeserta: 'codequest-arcade.dev',
	/** Hari penghapusan data pribadi (H+3). */
	tanggalHapusData: 'Selasa, 24 November 2026'
} as const;

/** Email sintetis akun peserta, mis. 2615001@codequest-arcade.dev. */
export function emailPesertaUntuk(nim: string): string {
	return `${nim}@${ACARA.domainEmailPeserta}`;
}

/**
 * Kredensial akun demo peserta yang ditampilkan di halaman masuk.
 * Setel ke `null` untuk menyembunyikan alert (mis. saat hari H tiba).
 */
export const AKUN_DEMO: { nim: string; sandi: string } | null = {
	nim: '2615001',
	sandi: 'demopeserta'
};

/** Label tier untuk tampilan. */
export const LABEL_TIER: Record<string, string> = {
	none: 'Belum ada tier',
	explorer: 'Explorer',
	builder: 'Builder',
	champion: 'Champion'
};

export const LABEL_BONUS: Record<string, string> = {
	error_collector: 'Error Collector',
	buddy_assist: 'Buddy Assist'
};

export const LABEL_JENIS_TES: Record<string, string> = {
	pre: 'Pre-test',
	post: 'Post-test',
	trivia: 'Trivia'
};
