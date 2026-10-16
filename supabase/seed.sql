-- Seed konten CodeQuest Arcade: level, misi, hint, dan bank soal.
-- Aman dijalankan berulang: baris yang sama akan diperbarui, bukan diduplikasi.
-- Jalankan setelah migrations/0001_skema_awal.sql (mis. `supabase db reset` atau tempel di SQL editor).

-- ============================================================
-- Level
-- ============================================================

insert into public.level (id, judul, ringkasan) values
	(1, 'Logic Unplugged', 'Berpikir seperti komputer: urutan, pengulangan, dan keputusan. Tanpa keyboard dulu.'),
	(2, 'IDE & File Studio', 'Pasang VS Code, buat folder proyek pertama, dan kenali terminal.'),
	(3, 'First Run + Error Hunt', 'Jalankan program TypeScript pertamamu, lalu berburu dan perbaiki error.')
on conflict (id) do update set judul = excluded.judul, ringkasan = excluded.ringkasan;

-- ============================================================
-- Misi (poin: Level 1 dan 2 = 2 per misi, Level 3 = 3 per misi)
-- ============================================================

insert into public.misi (level_id, urutan, judul, instruksi, kriteria, poin) values
	(1, 1, 'Resep Algoritma', $teks$
Tulis algoritma langkah demi langkah untuk satu tugas sederhana pilihanmu, misalnya "membuat teh manis" atau "menyalakan laptop dan membuka browser".

Aturan:
1. Tulis minimal 6 langkah bernomor di kertas atau catatan.
2. Pastikan ada bahan/alat (input), langkah pengolahan (proses), dan hasil akhir (output).
3. Urutan harus masuk akal jika dibaca orang lain.
$teks$, $teks$
Minimal 6 langkah bernomor, ada input, proses, dan output, dan urutannya logis saat diceritakan ulang ke mentor.
$teks$, 2),
	(1, 2, 'Pola Berulang (Loop)', $teks$
Gambar pola bintang lima baris berikut di kertas:

*
* *
* * *
* * * *
* * * * *

Lalu jawab dua pertanyaan:
1. Bagian mana yang berulang?
2. Kalau polanya 20 baris, apakah kamu menulis 20 kali atau cukup sekali dengan aturan "ulangi"?
$teks$, $teks$
Pola tergambar benar dan peserta bisa menjelaskan bagian yang berulang beserta aturan pengulangannya dengan kata sendiri.
$teks$, 2),
	(1, 3, 'Persimpangan Keputusan (If/Else)', $teks$
Buat aturan keputusan nilai kelulusan:
- Nilai 75 ke atas: LULUS
- Nilai 60 sampai 74: REMEDIAL
- Di bawah 60: MENGULANG

Uji aturanmu dengan empat contoh nilai (mis. 80, 74, 59, 60) dan tulis hasil keputusan tiap contoh.
$teks$, $teks$
Tiga cabang aturan benar dan empat contoh nilai menghasilkan keputusan yang tepat, termasuk nilai tepat di batas (74 dan 60).
$teks$, 2),
	(2, 1, 'Pasang VS Code', $teks$
Pasang Visual Studio Code di laptopmu:
1. Cari "Visual Studio Code" di mesin pencari dan unduh dari situs resminya.
2. Pasang dengan pengaturan bawaan sampai selesai.
3. Buka VS Code, lalu tunjukkan versinya (layar Welcome atau menu Help > About).
$teks$, $teks$
VS Code terbuka di laptop peserta dan versinya terlihat. Jika gagal memasang karena kendala perangkat, diskusikan dengan mentor untuk solusi sementara.
$teks$, 2),
	(2, 2, 'Studio Pertama', $teks$
Buat "studio" proyek pertamamu:
1. Buat folder bernama codequest-namamu (contoh: codequest-budi) di Documents.
2. Di VS Code, buka folder itu lewat File > Open Folder.
3. Buat file bernama hello.ts di dalam folder tersebut.
$teks$, $teks$
Panel Explorer VS Code menampilkan folder codequest-nama berisi file hello.ts.
$teks$, 2),
	(2, 3, 'Kenalan dengan Terminal', $teks$
Buka terminal terintegrasi di VS Code (menu Terminal > New Terminal), lalu:
1. Jalankan node -v untuk melihat versi Node.js.
2. Jalankan pwd (atau cd di Windows) untuk memastikan posisi folder.
3. Jalankan ls (atau dir) untuk melihat isi folder.
$teks$, $teks$
Terminal terbuka di folder proyek, ketiga perintah berjalan tanpa error, dan peserta bisa menjelaskan singkat keluaran tiap perintah.
$teks$, 2),
	(3, 1, 'Halo, CodeQuest!', $teks$
Tulis program pertamamu di hello.ts:

const nama: string = "namamu";
console.log(`Halo, ${nama}! Selamat datang di CodeQuest.`);

Jalankan di terminal dengan npx tsx hello.ts.
Jika internet lambat, boleh pakai cara klasik: npx tsc hello.ts lalu node hello.js.
$teks$, $teks$
Program berjalan dan menampilkan sapaan di terminal. Peserta bisa menunjukkan baris kode dan keluarannya.
$teks$, 3),
	(3, 2, 'Error Hunt I: Typo dan Nama', $teks$
Sengaja buat dua error di file latihan (bukan di hello.ts-mu):
1. Ganti console.log menjadi console.lg.
2. Panggil variabel yang belum pernah dideklarasikan, mis. console.log(umur).

Jalankan, baca pesan error yang muncul, lalu perbaiki satu per satu sampai kode berjalan lagi.
$teks$, $teks$
Peserta menunjukkan pesan error yang muncul, menjelaskan artinya dengan kata sendiri, dan program akhirnya berjalan. Error unik yang ditemukan bisa dicatat mentor sebagai bonus Error Collector.
$teks$, 3),
	(3, 3, 'Error Hunt II: Tipe Data', $teks$
Buat fungsi berikut di file latihan:

function umurBerikutnya(umur: number): number {
  return umur + 1;
}

Panggil dengan teks yang salah: umurBerikutnya("dua puluh").
Baca error yang muncul, jelaskan kenapa TypeScript menolaknya, lalu perbaiki panggilannya dengan angka yang benar.
$teks$, $teks$
Peserta menunjukkan error "Argument of type ... is not assignable to parameter of type 'number'", bisa menjelaskan singkat artinya, dan panggilan yang diperbaiki berjalan.
$teks$, 3)
on conflict (level_id, urutan) do update set
	judul = excluded.judul,
	instruksi = excluded.instruksi,
	kriteria = excluded.kriteria,
	poin = excluded.poin;

-- ============================================================
-- Kartu hint (3 per level, gratis, tidak mengurangi poin)
-- ============================================================

insert into public.hint (level_id, urutan, isi) values
	(1, 1, 'Algoritma itu urutan langkah. Mulai dari tiga pertanyaan: apa yang dibutuhkan, apa yang dilakukan, dan apa hasil akhirnya.'),
	(1, 2, 'Bagian yang berulang bisa diringkas: tulis aturannya sekali, lalu tambahkan "ulangi sebanyak N kali". Kamu tidak perlu menulis 20 baris bintang.'),
	(1, 3, 'Gambar alurnya dulu di kertas. Kotak untuk langkah biasa, belah ketupat untuk keputusan dengan cabang Ya dan Tidak.'),
	(2, 1, 'Cari "Visual Studio Code" di mesin pencari lalu unduh dari situs resminya. Pengaturan bawaan saat memasang sudah cukup, jangan lupa centang "Add to PATH" jika muncul.'),
	(2, 2, 'Kalau bingung mencari folder di VS Code: File > Open Folder, lalu arahkan ke folder yang baru kamu buat di Documents.'),
	(2, 3, 'Terminal dibuka lewat menu Terminal > New Terminal. Kalau tulisannya error "not recognized", coba tutup dan buka ulang VS Code supaya PATH-nya terbaca.'),
	(3, 1, 'Baca pesan error dari baris paling atas: biasanya ada nama file, nomor baris, dan penjelasan masalahnya. Error adalah petunjuk, bukan hukuman.'),
	(3, 2, 'Periksa ejaan huruf per huruf: console.log, bukan console.lg. TypeScript juga membedakan huruf besar dan kecil, jadi Pastikan nama variabel sama persis.'),
	(3, 3, 'Pesan "not assignable to type number" artinya fungsi meminta angka, tapi kamu memberi teks. Hapus tanda kutip dan berikan angka.')
on conflict (level_id, urutan) do update set isi = excluded.isi;

-- ============================================================
-- Bank soal: pre-test (10), post-test (10), trivia (5)
-- ============================================================

insert into public.soal (jenis, urutan, pertanyaan, pilihan) values
	-- Pre-test: dasar sebelum belajar
	('pre', 1, 'Apa itu algoritma?', $json$["Urutan langkah untuk menyelesaikan masalah", "Nama aplikasi edit foto", "Jenis kabel laptop", "Bahasa asing"]$json$::jsonb),
	('pre', 2, 'Berikut ini yang termasuk bahasa pemrograman adalah...', $json$["HTML", "TypeScript", "CSS", "JPEG"]$json$::jsonb),
	('pre', 3, 'Variabel dalam pemrograman dipakai untuk...', $json$["Menyimpan nilai yang dipakai program", "Memperbesar layar", "Menghapus file", "Menyalakan laptop"]$json$::jsonb),
	('pre', 4, 'Nilai seperti "Halo" (diapit tanda kutip) bertipe...', $json$["number", "boolean", "string", "array"]$json$::jsonb),
	('pre', 5, 'Nilai true dan false bertipe...', $json$["string", "boolean", "number", "object"]$json$::jsonb),
	('pre', 6, 'Simbol yang dipakai untuk perkalian dalam kode adalah...', $json$["x", "%", "*", "#"]$json$::jsonb),
	('pre', 7, 'Perintah if / else dipakai untuk...', $json$["Mengulang langkah terus-menerus", "Memilih langkah berdasarkan kondisi", "Menghapus variabel", "Mengganti nama file"]$json$::jsonb),
	('pre', 8, 'Perulangan (loop) berguna untuk...', $json$["Menjalankan langkah yang sama berulang kali", "Mempercepat internet", "Menambah daya baterai", "Mengunci keyboard"]$json$::jsonb),
	('pre', 9, 'Dalam kode, fungsi adalah...', $json$["Blok kode bernama yang bisa dipanggil ulang", "Jenis layar monitor", "Kesalahan penulisan", "Ukuran sebuah file"]$json$::jsonb),
	('pre', 10, 'File dengan akhiran .ts biasanya berisi...', $json$["Gambar", "Video", "Kode TypeScript", "Musik"]$json$::jsonb),
	-- Post-test: setelah belajar
	('post', 1, 'Kata kunci untuk membuat variabel yang nilainya tidak bisa diubah lagi adalah...', $json$["var", "let", "const", "change"]$json$::jsonb),
	('post', 2, 'console.log dipakai untuk...', $json$["Menampilkan sesuatu di terminal", "Menghapus program", "Mematikan laptop", "Membuka browser"]$json$::jsonb),
	('post', 3, 'Error "Cannot find name ''umur''" kemungkinan besar berarti...', $json$["Laptop kurang kuat", "Variabel umur belum dideklarasikan", "Terminal rusak", "File terlalu besar"]$json$::jsonb),
	('post', 4, 'Penulisan tipe yang benar di TypeScript adalah...', $json$["let umur: number = 20;", "let umur = number 20;", "number let umur = 20;", "let number umur := 20;"]$json$::jsonb),
	('post', 5, 'Perintah yang dipakai untuk menjalankan file TypeScript langsung di terminal adalah...', $json$["run hello.ts", "npx tsx hello.ts", "open hello.ts", "node --install hello.ts"]$json$::jsonb),
	('post', 6, 'Fungsi mengembalikan nilai dengan kata kunci...', $json$["give", "send", "return", "back"]$json$::jsonb),
	('post', 7, 'Operator === dipakai untuk...', $json$["Membandingkan nilai dan tipenya", "Menjumlahkan angka", "Menggabungkan file", "Menghapus data"]$json$::jsonb),
	('post', 8, 'Template literal (menyisipkan variabel ke dalam teks) memakai tanda...', $json$["Kutip tunggal '", "Kutip ganda \"\"", "Backtick `", "Kurung siku [ ]"]$json$::jsonb),
	('post', 9, 'Saat program menampilkan error, langkah pertama yang sebaiknya dilakukan adalah...', $json$["Membaca pesan error dengan teliti", "Membeli laptop baru", "Menghapus semua file", "Mematikan Wi-Fi"]$json$::jsonb),
	('post', 10, 'Array dipakai untuk...', $json$["Menyimpan banyak nilai dalam satu variabel", "Mengubah warna layar", "Menambah kapasitas disk", "Menutup program"]$json$::jsonb),
	-- Trivia: ringan, di awal sesi siang
	('trivia', 1, 'Ekstensi file TypeScript adalah...', $json$[".js", ".ts", ".txt", ".tps"]$json$::jsonb),
	('trivia', 2, 'Nilai balik fungsi yang tidak punya pernyataan return adalah...', $json$["null", "undefined", "0", "false"]$json$::jsonb),
	('trivia', 3, 'Di JavaScript, hasil dari 0.1 + 0.2 === 0.3 adalah...', $json$["true", "false", "Kadang-kadang", "Error"]$json$::jsonb),
	('trivia', 4, 'Perintah untuk melihat versi Node.js adalah...', $json$["node -v", "node --buy", "versi node", "node.age"]$json$::jsonb),
	('trivia', 5, 'TypeScript dikembangkan dari bahasa...', $json$["Python", "JavaScript", "Java", "PHP"]$json$::jsonb)
on conflict (jenis, urutan) do update set
	pertanyaan = excluded.pertanyaan,
	pilihan = excluded.pilihan;

-- Kunci jawaban (indeks pilihan, mulai dari 0)
insert into public.soal_kunci (soal_id, jawaban)
select s.id, k.jawaban
from (values
	('pre', 1, 0), ('pre', 2, 1), ('pre', 3, 0), ('pre', 4, 2), ('pre', 5, 1),
	('pre', 6, 2), ('pre', 7, 1), ('pre', 8, 0), ('pre', 9, 0), ('pre', 10, 2),
	('post', 1, 2), ('post', 2, 0), ('post', 3, 1), ('post', 4, 0), ('post', 5, 1),
	('post', 6, 2), ('post', 7, 0), ('post', 8, 2), ('post', 9, 0), ('post', 10, 0),
	('trivia', 1, 1), ('trivia', 2, 1), ('trivia', 3, 1), ('trivia', 4, 0), ('trivia', 5, 1)
) as k(jenis, urutan, jawaban)
join public.soal s on s.jenis = k.jenis and s.urutan = k.urutan
on conflict (soal_id) do update set jawaban = excluded.jawaban;
