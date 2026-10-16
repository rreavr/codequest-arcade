import type { NamaIkon } from '#lib/ui/ikon.js';

export type BagianModul = {
	judul: string;
	isi: string[];
};

export type Modul = {
	id: string;
	judul: string;
	ikon: NamaIkon;
	ringkas: string;
	bagian: BagianModul[];
	latihan?: { label: string; href: string };
};

/** Konten modul belajar — statis, tanpa poin, dan bisa dibaca tanpa akun. */
export const MODUL: Modul[] = [
	{
		id: 'berpikir-komputasional',
		judul: 'Berpikir komputasional',
		ikon: 'target',
		ringkas: 'Cara memecah masalah besar jadi langkah kecil yang bisa dikerjakan komputer.',
		bagian: [
			{
				judul: 'Algoritma: resep langkah demi langkah',
				isi: [
					'Algoritma adalah urutan langkah yang jelas untuk menyelesaikan satu tugas. Bayangkan resep membuat teh manis: siapkan gelas, masukkan gula, tuang air panas, lalu aduk.',
					'Komputer menjalankan langkah persis seperti yang kamu tulis — ia tidak menebak maksudmu. Kalau urutannya kacau, hasilnya juga kacau.'
				]
			},
			{
				judul: 'Dekomposisi: pecah jadi bagian kecil',
				isi: [
					'Masalah besar jauh lebih mudah diselesaikan kalau dipecah. "Membuat website" bisa dibagi menjadi: rancang tampilan, tulis halaman, pasang data, lalu uji.',
					'Selesaikan satu bagian sampai benar-benar jalan sebelum pindah ke bagian berikutnya.'
				]
			},
			{
				judul: 'Pola dan uji logika',
				isi: [
					'Cari bagian yang berulang, lalu sederhanakan. Kalau sepuluh data diproses dengan cara yang sama, tulis satu langkah yang diulang — bukan sepuluh langkah terpisah.',
					'Uji dengan contoh kecil dulu, lalu coba kasus ekstrem: data kosong, angka terbesar, atau salah ketik.'
				]
			}
		]
	},
	{
		id: 'file-folder-ide',
		judul: 'File, folder & IDE',
		ikon: 'book-open',
		ringkas: 'Merapikan tempat kerja digital: folder, nama file, dan aplikasi editor kode.',
		bagian: [
			{
				judul: 'Folder dan path',
				isi: [
					'File disimpan di dalam folder, dan alamat lengkap sebuah file disebut path — misalnya Documents\\latihan\\halo.txt.',
					'Ekstensi di akhir nama menunjukkan jenis file: .txt untuk dokumen, .png untuk gambar, .py untuk kode Python, dan .js untuk kode JavaScript.'
				]
			},
			{
				judul: 'IDE: dapur kerja programmer',
				isi: [
					'IDE (Integrated Development Environment) menggabungkan editor kode, penanda error, tombol jalan, dan terminal dalam satu aplikasi. Salah satu yang gratis: VS Code.',
					'Alur kerjanya sederhana: buat folder proyek, buka folder itu dari IDE, lalu simpan file kode pertamamu di dalamnya.'
				]
			},
			{
				judul: 'Kebiasaan rapi',
				isi: [
					'Pakai huruf kecil dan tanda hubung tanpa spasi untuk nama file atau folder: latihan-hari-ini. Spasi dan huruf besar sering membuat perintah terminal gagal.',
					'Satu proyek, satu folder. Jangan biarkan file kode berserakan di Desktop atau Documents.'
				]
			}
		]
	},
	{
		id: 'menjalankan-error',
		judul: 'Menjalankan program & membaca error',
		ikon: 'bug',
		ringkas: 'Error bukan musuh — ia petunjuk yang menunjukkan baris mana yang perlu diperbaiki.',
		bagian: [
			{
				judul: 'Cara menjalankan program',
				isi: [
					'Buka terminal di dalam folder proyek, lalu jalankan: python halo.py (Python) atau node halo.js (JavaScript).',
					'Kalau muncul pesan "file not found", berarti perintah dijalankan dari folder yang salah atau nama filenya salah ketik. Cek keduanya dulu sebelum panik.'
				]
			},
			{
				judul: 'Membaca pesan error',
				isi: [
					'Pesan error punya tiga bagian: jenis masalah, keterangan singkat, dan nomor baris yang bermasalah. Mulai membaca dari baris yang ditunjuk, bukan dari bagian paling atas.',
					'Contoh: SyntaxError: expected ":" artinya di baris tersebut kamu lupa menulis titik dua. Perbaiki satu hal, jalankan lagi — error biasanya menjawab satu per satu.'
				]
			},
			{
				judul: 'Tiga kesalahan pemula',
				isi: [
					'Salah ketik nama: huruf besar dan kecil dianggap berbeda, jadi "Halo" tidak sama dengan "halo".',
					'Tanda penutup yang kurang lengkap: kutip ", kurung ), atau titik dua :.',
					'File berada di folder lain: programnya benar, tetapi dijalankan dari tempat yang salah.'
				]
			}
		]
	},
	{
		id: 'dasar-sql',
		judul: 'Dasar SQL',
		ikon: 'clipboard',
		ringkas: 'Bahasa untuk berbicara dengan basis data: mengambil, menyaring, dan merangkum data.',
		bagian: [
			{
				judul: 'Tabel: seperti spreadsheet yang rapi',
				isi: [
					'Data tersimpan dalam tabel di sebuah basis data. Satu baris adalah satu catatan, dan satu kolom adalah satu jenis informasi — misalnya nama, kelompok, atau poin.'
				]
			},
			{
				judul: 'Kueri pertama',
				isi: [
					'SELECT nama FROM peserta; berarti "ambil kolom nama dari tabel peserta".',
					'Tambahkan WHERE poin > 20 untuk menyaring baris, ORDER BY poin DESC untuk mengurutkan dari terbesar, dan LIMIT 3 untuk mengambil tiga baris saja.'
				]
			},
			{
				judul: 'Merangkum dan menggabungkan',
				isi: [
					'COUNT(*) menghitung jumlah baris dan SUM(poin) menjumlahkan nilai. Dengan GROUP BY, data bisa dirangkum per kelompok: SELECT kelompok, COUNT(*) FROM peserta GROUP BY kelompok;',
					'JOIN menggabungkan dua tabel lewat kolom penghubung, misalnya peserta_id di tabel penyelesaian.'
				]
			}
		],
		latihan: { label: 'Coba minigame SQL', href: '/belajar/sql' }
	}
];
