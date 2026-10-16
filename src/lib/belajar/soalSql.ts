export type SoalSql = {
	id: string;
	judul: string;
	tingkat: 'Dasar' | 'Menengah' | 'Lanjutan';
	tugas: string;
	petunjuk: string;
	kunci: string;
	/** true = urutan baris hasil dibandingkan ketat (kunci memakai ORDER BY). */
	urut?: boolean;
};

/**
 * Database latihan kecil bertema acara. Dibuat ulang di peramban setiap kali
 * kueri dijalankan, jadi peserta bebas bereksperimen tanpa merusak apa pun.
 */
export const SKEMA_ARENA = `
CREATE TABLE peserta (
	id INTEGER PRIMARY KEY,
	nama TEXT NOT NULL,
	kelompok TEXT NOT NULL,
	poin INTEGER NOT NULL
);

INSERT INTO peserta (id, nama, kelompok, poin) VALUES
	(1, 'Ani', 'Garuda', 28),
	(2, 'Budi', 'Garuda', 17),
	(3, 'Citra', 'Elang', 31),
	(4, 'Dewi', 'Elang', 22),
	(5, 'Eko', 'Merak', 9),
	(6, 'Fani', 'Merak', 25),
	(7, 'Gilang', 'Garuda', 12),
	(8, 'Hina', 'Elang', 27);

CREATE TABLE misi (
	id INTEGER PRIMARY KEY,
	judul TEXT NOT NULL,
	level INTEGER NOT NULL,
	poin INTEGER NOT NULL
);

INSERT INTO misi (id, judul, level, poin) VALUES
	(1, 'Susun Algoritma', 1, 2),
	(2, 'Pasang IDE', 2, 2),
	(3, 'Error Hunt', 3, 3),
	(4, 'Trivia Kilat', 3, 3);

CREATE TABLE penyelesaian (
	peserta_id INTEGER NOT NULL,
	misi_id INTEGER NOT NULL
);

INSERT INTO penyelesaian (peserta_id, misi_id) VALUES
	(1, 1), (1, 2), (2, 1), (3, 1), (3, 3), (4, 2), (6, 1), (8, 3), (8, 4);
`;

/** Tantangan minigame SQL, berurutan dari yang paling mudah. */
export const SOAL_SQL: SoalSql[] = [
	{
		id: 'kenalan-select',
		judul: 'Kenalan dengan tabel',
		tingkat: 'Dasar',
		tugas: 'Tampilkan seluruh isi tabel peserta (semua kolom).',
		petunjuk: 'Gunakan SELECT * FROM diikuti nama tabelnya.',
		kunci: 'SELECT * FROM peserta;'
	},
	{
		id: 'saring-where',
		judul: 'Saring baris',
		tingkat: 'Dasar',
		tugas: 'Tampilkan nama peserta yang poinnya lebih dari 20 (kolom: nama).',
		petunjuk: 'Tambahkan filter WHERE poin > 20 setelah nama tabel.',
		kunci: 'SELECT nama FROM peserta WHERE poin > 20;'
	},
	{
		id: 'urutkan-limit',
		judul: 'Tiga peringkat teratas',
		tingkat: 'Menengah',
		tugas: 'Tampilkan nama dan poin tiga peserta dengan poin tertinggi, urut dari yang paling besar (kolom: nama, poin).',
		petunjuk: 'Pakai ORDER BY poin DESC, lalu tutup dengan LIMIT 3.',
		kunci: 'SELECT nama, poin FROM peserta ORDER BY poin DESC LIMIT 3;',
		urut: true
	},
	{
		id: 'hitung-kelompok',
		judul: 'Hitung anggota kelompok',
		tingkat: 'Menengah',
		tugas: 'Tampilkan setiap kelompok beserta jumlah anggotanya (kolom: kelompok, jumlah).',
		petunjuk: 'Rangkum dengan GROUP BY kelompok dan hitung barisnya memakai COUNT(*).',
		kunci: 'SELECT kelompok, COUNT(*) FROM peserta GROUP BY kelompok;'
	},
	{
		id: 'join-penyelesaian',
		judul: 'Gabungkan dua tabel',
		tingkat: 'Menengah',
		tugas: 'Tampilkan nama peserta dan judul misi yang sudah mereka selesaikan — tabel penyelesaian menghubungkan keduanya (kolom: nama, judul).',
		petunjuk: 'JOIN peserta ON peserta.id = penyelesaian.peserta_id, lalu JOIN misi ON misi.id = penyelesaian.misi_id.',
		kunci: 'SELECT peserta.nama, misi.judul FROM penyelesaian JOIN peserta ON peserta.id = penyelesaian.peserta_id JOIN misi ON misi.id = penyelesaian.misi_id;'
	},
	{
		id: 'total-poin',
		judul: 'Total poin per kelompok',
		tingkat: 'Lanjutan',
		tugas: 'Tampilkan total poin setiap kelompok, urut dari total terbesar (kolom: kelompok, total).',
		petunjuk: 'Pakai SUM(poin) dengan GROUP BY, beri nama kolomnya total, lalu ORDER BY total DESC.',
		kunci: 'SELECT kelompok, SUM(poin) AS total FROM peserta GROUP BY kelompok ORDER BY total DESC;',
		urut: true
	},
	{
		id: 'having-total',
		judul: 'Saring hasil rangkuman',
		tingkat: 'Lanjutan',
		tugas: 'Tampilkan kelompok yang total poinnya lebih dari 50 (kolom: kelompok).',
		petunjuk: 'WHERE tidak bisa menyaring hasil SUM — gunakan HAVING setelah GROUP BY.',
		kunci: 'SELECT kelompok FROM peserta GROUP BY kelompok HAVING SUM(poin) > 50;'
	}
];
