-- 0003: pembagian kelompok otomatis saat pendaftaran peserta.
--
-- Skema baru di 0001 sudah memuat pemicu `kelompok_peserta_baru`: peserta yang
-- mendaftar langsung mendapat kelompok (isi kelompok paling awal yang belum
-- penuh — 4 orang per kelompok, urut "siapa cepat dia dapat"). Migrasi ini
-- untuk basis data yang terlanjur dibuat memakai 0001 versi lama. Aman
-- dijalankan berulang kali (idempoten) dan menjadi no-op pada basis data baru.

-- Pembagian kelompok saat peserta baru mendaftar: isi kelompok paling awal
-- yang belum penuh (siapa cepat dia dapat); buat kelompok baru bila semua
-- penuh. Maksimum 8 kelompok = 32 peserta ÷ 4 orang per kelompok.
create or replace function public.kelompokkan_peserta_baru()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_kelompok uuid;
	v_jumlah int;
	v_nama text;
begin
	-- Isian eksplisit (mis. pemindahan oleh panitia) tidak ditimpa.
	if new.kelompok_id is not null then
		return new;
	end if;

	-- Kunci transaksi agar dua pendaftaran bersamaan tidak memperebutkan slot sama.
	perform pg_advisory_xact_lock(hashtext('codequest-arcade:kelompok')::bigint);

	select k.id into v_kelompok
	from public.kelompok k
	where (
		select count(*) from public.peserta p where p.kelompok_id = k.id
	) < 4
	order by k.dibuat_pada, k.nama
	limit 1;

	if v_kelompok is null then
		select count(*) into v_jumlah from public.kelompok;
		if v_jumlah < 8 then
			v_nama := 'Kelompok ' || (v_jumlah + 1)::text;
			-- Lewati nama yang sudah terpakai (mis. kelompok lama yang dihapus).
			while exists (select 1 from public.kelompok where nama = v_nama) loop
				v_jumlah := v_jumlah + 1;
				v_nama := 'Kelompok ' || (v_jumlah + 1)::text;
			end loop;
			insert into public.kelompok (nama) values (v_nama) returning id into v_kelompok;
		end if;
	end if;

	-- Bila semua penuh dan batas 8 kelompok tercapai, peserta dibiarkan tanpa
	-- kelompok; panitia membereskannya lewat /admin/kelompok.
	new.kelompok_id := v_kelompok;
	return new;
end;
$$;

drop trigger if exists kelompok_peserta_baru on public.peserta;
create trigger kelompok_peserta_baru
	before insert on public.peserta
	for each row execute function public.kelompokkan_peserta_baru();
