-- 0006: berkas Academic Vault berupa tautan (mis. Google Drive).
--
-- Rencana penyimpanan berkas fisik (Cloudflare R2) ditunda, jadi supaya vault
-- tetap bisa diisi panitia tanpa dashboard storage, daftar berkas kini berupa
-- tautan yang disimpan di tabel ini dan dikelola mentor/admin lewat
-- /kelola/vault.
--
-- Aman dijalankan berulang kali (idempoten).

create table if not exists public.berkas_vault (
	id uuid primary key default gen_random_uuid(),
	nama text not null check (length(btrim(nama)) >= 2),
	url text not null check (url ~* '^https?://\S+$'),
	keterangan text,
	dibuat_pada timestamptz not null default now()
);

comment on table public.berkas_vault is
	'Daftar tautan berkas Academic Vault (pengganti bucket storage; migrasi R2 ditunda).';

alter table public.berkas_vault enable row level security;

-- Semua pengguna yang sudah masuk boleh membaca daftar. Halaman peserta tetap
-- dijaga kode server: hanya terbuka setelah check-in.
drop policy if exists "berkas vault terbaca" on public.berkas_vault;
create policy "berkas vault terbaca" on public.berkas_vault
	for select to authenticated
	using (true);

-- Menambah/mengubah/menghapus hanya mentor dan admin (lewat /kelola/vault).
drop policy if exists "vault dikelola staf" on public.berkas_vault;
create policy "vault dikelola staf" on public.berkas_vault
	for all to authenticated
	using (public.peran_saya() in ('mentor', 'admin'))
	with check (public.peran_saya() in ('mentor', 'admin'));
