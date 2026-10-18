# CodeQuest Arcade

Situs pendamping acara HIMTI CodeQuest: First Level 2026 (21 November 2026). SvelteKit 3 + TypeScript + Supabase.

## Kebutuhan

- Node.js >= 22.17 (syarat SvelteKit 3). Proyek ini dikembangkan memakai Bun 1.4 — `npm` juga bisa.
- Proyek Supabase (Postgres + Auth).

## Setup

1. Pasang dependensi:

   ```sh
   bun install
   ```

2. Siapkan database Supabase. Buka **SQL Editor** di dashboard Supabase lalu jalankan berurutan:
   - `supabase/migrations/0001_skema_awal.sql` — tabel, kebijakan RLS, trigger, view skor, dan bucket storage `vault` (warisan — berkas vault kini berupa tautan di tabel `berkas_vault`; bucket tidak dipakai aplikasi).
   - `supabase/seed.sql` — 3 level, 9 misi, 9 hint, dan bank soal (pre-test, post-test, trivia).
   - `supabase/migrations/0006_berkas_vault.sql` — tabel tautan berkas Academic Vault (jalankan juga di basis data lama).
   - Bila database sudah terlanjur dibuat dengan versi skema lama, jalankan juga: `supabase/migrations/0002_tautan_klaim.sql`, `0003_kelompok_otomatis.sql`, `0004_peran_app_metadata.sql`, dan `0005_batal_verifikasi.sql` (semuanya idempoten, aman diulang).

3. Salin dan isi environment:

   ```sh
   cp .env.example .env
   ```

   | Variabel | Dari mana | Kegunaan |
   | --- | --- | --- |
   | `PUBLIC_SUPABASE_URL` | Project Settings > API | URL proyek |
   | `PUBLIC_SUPABASE_ANON_KEY` | Project Settings > API | Baca/tulis sebagai pengguna (RLS aktif) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Project Settings > API | Hanya server: buat akun, penilaian tes, ekspor |

   Tanpa env terisi, halaman publik tetap terbuka dengan peringatan "belum dikonfigurasi".

4. Buat akun admin pertama. Tambahkan pengguna di **Authentication > Users > Add user**, lalu jalankan di SQL Editor (ganti email dan nama):

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'panitia@contoh.ac.id';

   update public.profiles
   set role = 'admin', nama = 'Nama Panitia'
   where id = (select id from auth.users where email = 'panitia@contoh.ac.id');
   ```

   Peserta mendaftar sendiri lewat `/daftar` (email supabase disintesis dari NIM). Lupa sandi? Peserta memakai `/lupa-sandi` (verifikasi NIM, nama lengkap, dan WhatsApp terdaftar). Akun mentor dibuat panitia dari halaman `/admin/kelompok`.

5. Isi Academic Vault berupa daftar **tautan berkas** (rekomendasi Google Drive dengan akses "siapa saja yang memiliki tautan"), dikelola mentor dan admin lewat halaman **Kelola berkas vault** (`/kelola/vault`). Tidak ada berkas fisik yang disimpan di server — jangan taruh materi di `static/`.

6. Jalankan:

   ```sh
   bun run dev
   ```

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `bun run dev` | Server pengembangan |
| `bun run check` | `svelte-kit sync` + type-check (`svelte-check`) |
| `bun run test` | Uji unit (vitest); `bun test` juga jalan |
| `bun run build` | Build produksi + adaptasi adapter |
| `bun run preview` | Pratinjau hasil build |

## Peta folder

| Folder | Isi |
| --- | --- |
| `src/env.ts` | Deklarasi environment variable (cara SvelteKit 3) |
| `src/routes/daftar`, `masuk`, `lupa-sandi` | Pendaftaran, login, dan reset sandi peserta (P0) |
| `src/routes/(peserta)` | Dashboard, level dan misi, tes, Vault; trivia dan survei (P1) |
| `src/routes/(mentor)` | Daftar kelompok dan verifikasi misi |
| `src/routes/(admin)` | Peserta, kelompok, soal, check-in, ekspor |
| `src/routes/kelola` | Perkakas bersama mentor & admin: kelola berkas vault |
| `src/routes/belajar` | Halaman belajar publik: modul singkat + minigame SQL (tanpa poin) |
| `src/routes/api` | Endpoint verifikasi, bonus, sertifikat, ekspor |
| `src/lib/constants/points.ts` | Tabel poin dan ambang tier (sumber tunggal, disalin ke `public.poin_peserta()`) |
| `src/lib/server/rekap.ts` | Rekap poin dari baris database, level terbuka, misi berikutnya |
| `src/lib/server/r2.ts` | Klien R2 (S3) — belum dipakai; disiapkan untuk rencana migrasi berkas fisik ke Cloudflare R2 |
| `src/lib/tautan.ts` | Validasi tautan tugas (Google Drive/GitHub) dan tautan berkas vault |
| `src/lib/identitas.ts` | Normalisasi nomor WhatsApp dan pencocokan nama (daftar dan lupa sandi) |
| `src/lib/belajar` | Konten modul & soal SQL statis untuk halaman belajar |
| `src/lib/ui` | Komponen `Ikon.svelte` dan `Bar.svelte`, plus registry ikon `pixelarticons` |
| `src/lib/server/certificate.ts` | Sertifikat PDF per tier |
| `src/lib/stores/offlineQueue.ts` | Antrean verifikasi saat Wi-Fi putus (IndexedDB) |
| `supabase/migrations` | Skema tabel dan kebijakan RLS |
| `tests` | Uji unit |

## Catatan SvelteKit 3

- Impor internal memakai alias `#lib` (bukan `$lib`), **wajib berakhiran `.js`**, mis. `#lib/server/rekap.js`. Alias didefinisikan di field `imports` `package.json`.
- Environment variable dideklarasikan di `src/env.ts` lewat `defineEnvVars`, lalu dibaca dari `$app/env/public` / `$app/env/private`. Modul `$env/...` sudah legacy.
- Konfigurasi proyek ada di `vite.config.ts`; `svelte.config.js` tidak dipakai lagi.
- Tipe hook (mis. `Handle`) diimpor dari `@sveltejs/kit/hooks`.

## Catatan penting

- Penjagaan peran ada dua lapis: `src/hooks.server.ts` (dari JWT) dan RLS di database. Keduanya harus membaca sumber yang sama — `app_metadata` di `auth.users` lewat `peran_saya()`; `profiles.role` hanya cermin yang disinkronkan pemicu. `0004_peran_app_metadata.sql` membereskan basis data lama (dulu GoTrue menyetel `app_metadata` sesudah baris user dibuat, membuat mentor tercatat 'peserta' di profil dan halaman mentor tampak kosong).
- Skor individu bersifat privat; hanya skor kelompok yang tampil publik (`/skor`). Papan kehormatan hanya menampilkan peserta yang memilih ikut (`papan_optin`).
- Aturan poin: maksimum 30 poin; tier Explorer 10, Builder 23, Champion 27. Rumus di `src/lib/server/points.ts` harus selalu sama dengan `public.poin_peserta()` di SQL.
- Alur misi: peserta menempel tautan tugas (Google Drive atau GitHub) di halaman level saat minta verifikasi — klaim tanpa tautan valid ditolak server dan constraint `klaim_link_isi` di database. Mentor membuka tautan itu dari antrean "Menunggu verifikasi" sebelum menandai selesai, dan peserta bisa memperbarui tautannya selama belum diverifikasi. Salah ketuk? Mentor mengetuk kembali tanda ✓ (dengan konfirmasi) untuk membatalkan — poin otomatis kembali; tanda yang masih di antrean lokal (↻) dibatalkan sekali ketuk, dan bonus bisa dikurangi lewat tombol −. Kebijakan RLS-nya di `0005_batal_verifikasi.sql`.
- Academic Vault berisi tautan berkas (rekomendasi Google Drive) di tabel `berkas_vault` (migrasi `0006_berkas_vault.sql`); peserta melihatnya setelah check-in, mentor dan admin mengelolanya di `/kelola/vault`. Penyimpanan berkas fisik (Cloudflare R2) ditunda — helper `src/lib/server/r2.ts` dan variabel `R2_*` sudah disiapkan bila nanti dilanjutkan.
- Kelompok otomatis: saat mendaftar, peserta langsung dimasukkan ke kelompok paling awal yang belum penuh lewat pemicu `kelompok_peserta_baru` (4 orang per kelompok, urut pendaftaran — siapa cepat dia dapat). Kelompok baru dibuat otomatis sampai maksimum 8 (= 32 peserta ÷ 4); panitia tetap bisa memindahkan peserta di `/admin/peserta` atau menekan "Bagi rata" di `/admin/kelompok`.
- Check-in tanpa QR: panitia membuka `/admin/checkin`, mencari NIM peserta, lalu menekan tombol Check-in (lewat form pencarian atau tombol di baris tabel).
- Lupa sandi: email peserta sintetis sehingga reset via email Supabase tidak bisa. Peserta memverifikasi NIM + nama lengkap + nomor WhatsApp terdaftar di `/lupa-sandi`, lalu menetapkan sandi baru dan langsung masuk. Panitia dapat mereset dari `/admin/peserta` — sandi sementara acak hanya ditampilkan sekali di pesan dan tidak disimpan.
- Akun demo peserta: halaman `/masuk` menampilkan alert kredensial akun contoh dari konstanta `AKUN_DEMO` di `src/lib/constants/acara.ts`. Setel ke `null` untuk menyembunyikan alert (mis. saat hari H). Sandi akun demo disetel ulang lewat Supabase (Authentication > Users) atau API admin.
- Halaman `/belajar` terbuka untuk umum (tanpa login) dan sengaja tidak terhubung poin acara. Isinya statis di `src/lib/belajar/` — menambah modul atau soal berarti mengedit dua berkas di sana. Minigame SQL memakai SQLite (paket `sql.js`, WebAssembly) yang diunduh sekali lalu berjalan lokal di peramban; tanda selesai hanya tersimpan di perangkat peserta (localStorage), jadi tidak ada data latihan yang masuk server.
- Ikon situs memakai paket `pixelarticons` (MIT, gratis). Semua ikon didaftarkan di `src/lib/ui/ikon.ts` dan dirender lewat `Ikon.svelte`; menambah ikon baru berarti mengimpor SVG-nya di registry itu.
- Tampilan memakai sistem desain "Neon Cabinet" (8-bit): radius 0, border chunk 2px, bayangan keras tanpa blur, tipografi pixel, dan scanline CRT tipis. Semua token warna/ukuran ada di blok `:root` `src/app.css` — cukup ubah dari satu tempat itu. Halaman bertabel (admin, mentor, skor, papan kehormatan) memakai kelas tambahan `lembar-lebar` agar lebih lega di layar desktop, dan header otomatis mengikuti lebar kontennya.
- Ganti adapter hosting di `vite.config.ts`. Sekarang pakai `adapter-cloudflare` (Cloudflare Pages); build di Windows tidak lagi butuh symlink (Developer Mode).
- Versi dependensi utama di `package.json`; kunci versinya lewat `bun.lock` setelah install pertama.

## Urutan pengerjaan (tenggat pendaftaran siap: 10 November)

daftar → masuk → check-in → dashboard dan level → verifikasi mentor → tes → vault → admin, kelola vault, dan ekspor.
