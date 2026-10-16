-- 0002: tautan bukti tugas wajib pada klaim misi.
--
-- Skema baru di 0001 sudah memuat kolom `link_bukti` (not null + validasi).
-- Migrasi ini untuk basis data yang terlanjur dibuat memakai 0001 versi lama,
-- di mana `link_bukti` masih `default ''` tanpa validasi. Aman dijalankan
-- berulang kali (idempoten) dan menjadi no-op pada basis data baru.

alter table public.klaim_misi add column if not exists link_bukti text;

-- Klaim lama tanpa tautan diberi penanda netral supaya syarat not-null lolos.
update public.klaim_misi
set link_bukti = 'https://github.com/'
where link_bukti is null or trim(link_bukti) = '';

alter table public.klaim_misi alter column link_bukti set not null;
alter table public.klaim_misi alter column link_bukti drop default;

alter table public.klaim_misi drop constraint if exists klaim_link_isi;
alter table public.klaim_misi add constraint klaim_link_isi check (link_bukti ~* '^https?://\S+$');

-- Peserta boleh memperbarui tautan klaimnya sendiri.
drop policy if exists "ubah klaim sendiri" on public.klaim_misi;
create policy "ubah klaim sendiri" on public.klaim_misi
	for update to authenticated
	using (peserta_id = (select auth.uid()))
	with check (peserta_id = (select auth.uid()));
