// Tipe baris tabel Supabase yang dipakai di aplikasi.
// Ditulis tangan supaya ringkas; kolom mengikuti supabase/migrations/0001_skema_awal.sql.

export type Peran = 'peserta' | 'mentor' | 'admin';

export interface ProfilRow {
	id: string;
	role: Peran;
	nama: string;
	dibuat_pada: string;
}

export interface MentorRow {
	id: string;
	nama: string;
	cadangan: boolean;
	dibuat_pada: string;
}

export interface KelompokRow {
	id: string;
	nama: string;
	mentor_id: string | null;
	dibuat_pada: string;
}

export interface PesertaRow {
	id: string;
	nama: string;
	nim: string;
	whatsapp: string;
	pengalaman: string;
	kendala: string;
	bawa_laptop: boolean;
	checkin_pada: string | null;
	kelompok_id: string | null;
	papan_optin: boolean;
	dibuat_pada: string;
}

export interface LevelRow {
	id: number;
	judul: string;
	ringkasan: string;
}

export interface MisiRow {
	id: string;
	level_id: number;
	urutan: number;
	judul: string;
	instruksi: string;
	kriteria: string;
	poin: number;
}

export interface HintRow {
	id: string;
	level_id: number;
	urutan: number;
	isi: string;
}

export interface HintDipakaiRow {
	peserta_id: string;
	hint_id: string;
	dipakai_pada: string;
}

export interface KlaimRow {
	peserta_id: string;
	misi_id: string;
	link_bukti: string;
	diklaim_pada: string;
}

export interface PenyelesaianRow {
	peserta_id: string;
	misi_id: string;
	mentor_id: string | null;
	diselesaikan_pada: string;
}

export type JenisBonus = 'error_collector' | 'buddy_assist';

export interface BonusRow {
	id: string;
	peserta_id: string;
	jenis: JenisBonus;
	mentor_id: string | null;
	keterangan: string | null;
	dibuat_pada: string;
}

export type JenisTes = 'pre' | 'post' | 'trivia';

export interface SoalRow {
	id: string;
	jenis: JenisTes;
	urutan: number;
	pertanyaan: string;
	pilihan: string[];
	aktif: boolean;
}

export interface SoalKunciRow {
	soal_id: string;
	jawaban: number;
}

export interface HasilTesRow {
	peserta_id: string;
	jenis: JenisTes;
	benar: number;
	total: number;
	skor: number;
	jawaban: unknown;
	dikerjakan_pada: string;
}

export interface SurveiRow {
	peserta_id: string;
	lebih_siap: boolean;
	saran: string | null;
	dibuat_pada: string;
}

export interface SkorKelompokRow {
	id: string;
	nama: string;
	total_poin: number;
	jumlah_peserta: number;
}
