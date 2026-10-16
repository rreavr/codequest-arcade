-- 0004: peran RLS selalu ikut app_metadata (perbaikan halaman mentor kosong).
--
-- Penyebab: GoTrue (Supabase Auth) menyetel `raw_app_meta_data` SESUDAH baris
-- auth.users disisipkan, sehingga pemicu pembuat profil sempat membaca peran
-- kosong dan menyimpannya sebagai 'peserta'. Akibatnya `peran_saya()` — yang
-- dipakai kebijakan RLS — melaporkan mentor sebagai peserta, mis. halaman
-- mentor tidak melihat peserta kelompoknya (padahal penjagaan halaman, yang
-- membaca JWT, lolos).
--
-- Perbaikan:
-- 1) `peran_saya()` membaca langsung raw_app_meta_data dari auth.users — sama
--    dengan sumber yang dipakai aplikasi — jadi tidak bisa berbeda lagi.
-- 2) Pemicu baru menyinkronkan profiles.role setiap app_metadata berubah.
-- 3) Backfill baris profil yang terlanjur melenceng.
--
-- Aman dijalankan berulang kali (idempoten) dan menjadi no-op pada basis data
-- yang sudah setara.

-- 1. Backfill: samakan profiles.role dengan app_metadata.
update public.profiles p
set role = coalesce(u.raw_app_meta_data ->> 'role', 'peserta')
from auth.users u
where u.id = p.id
	and p.role is distinct from coalesce(u.raw_app_meta_data ->> 'role', 'peserta');

-- 2. Sumber tunggal untuk peran.
create or replace function public.peran_saya()
returns text
language sql
stable
security definer
set search_path = public
as $$
	select coalesce(
		(select raw_app_meta_data ->> 'role' from auth.users where id = (select auth.uid())),
		'peserta'
	);
$$;

-- 3. Sinkronisasi profiles.role saat app_metadata berubah.
create or replace function public.penyelaras_peran_profil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	update public.profiles
	set role = coalesce(new.raw_app_meta_data ->> 'role', 'peserta')
	where id = new.id
		and role is distinct from coalesce(new.raw_app_meta_data ->> 'role', 'peserta');
	return new;
end;
$$;

drop trigger if exists penyelaras_peran_profil on auth.users;
create trigger penyelaras_peran_profil
	after update on auth.users
	for each row
	when (new.raw_app_meta_data is distinct from old.raw_app_meta_data)
	execute function public.penyelaras_peran_profil();
