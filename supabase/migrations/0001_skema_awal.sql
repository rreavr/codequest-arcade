-- CodeQuest Arcade - skema awal, kebijakan RLS, dan view publik.
-- Mengacu ke docs/PRD_CodeQuest_Arcade.md bagian 3 (poin), 4 (fitur), dan 6 (privasi).
-- File ini dapat dijalankan ulang (idempoten) lewat SQL editor Supabase atau `supabase db push`.

-- ============================================================
-- 1. Tabel
-- ============================================================

create table if not exists public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	role text not null default 'peserta' check (role in ('peserta', 'mentor', 'admin')),
	nama text not null default '',
	dibuat_pada timestamptz not null default now()
);

create table if not exists public.mentor (
	id uuid primary key references auth.users (id) on delete cascade,
	nama text not null,
	cadangan boolean not null default false,
	dibuat_pada timestamptz not null default now()
);

create table if not exists public.kelompok (
	id uuid primary key default gen_random_uuid(),
	nama text not null unique,
	mentor_id uuid references public.mentor (id) on delete set null,
	dibuat_pada timestamptz not null default now()
);

create table if not exists public.peserta (
	id uuid primary key references auth.users (id) on delete cascade,
	nama text not null,
	nim text not null unique,
	whatsapp text not null,
	pengalaman text not null default '',
	kendala text not null default '',
	bawa_laptop boolean not null default false,
	checkin_pada timestamptz,
	kelompok_id uuid references public.kelompok (id) on delete set null,
	papan_optin boolean not null default false,
	dibuat_pada timestamptz not null default now()
);

create table if not exists public.level (
	id int primary key,
	judul text not null,
	ringkasan text not null
);

create table if not exists public.misi (
	id uuid primary key default gen_random_uuid(),
	level_id int not null references public.level (id) on delete cascade,
	urutan int not null check (urutan between 1 and 9),
	judul text not null,
	instruksi text not null,
	kriteria text not null,
	poin int not null check (poin > 0),
	unique (level_id, urutan)
);

create table if not exists public.hint (
	id uuid primary key default gen_random_uuid(),
	level_id int not null references public.level (id) on delete cascade,
	urutan int not null check (urutan between 1 and 3),
	isi text not null,
	unique (level_id, urutan)
);

create table if not exists public.hint_dipakai (
	peserta_id uuid not null references public.peserta (id) on delete cascade,
	hint_id uuid not null references public.hint (id) on delete cascade,
	dipakai_pada timestamptz not null default now(),
	primary key (peserta_id, hint_id)
);

create table if not exists public.klaim_misi (
	peserta_id uuid not null references public.peserta (id) on delete cascade,
	misi_id uuid not null references public.misi (id) on delete cascade,
	link_bukti text not null,
	diklaim_pada timestamptz not null default now(),
	primary key (peserta_id, misi_id),
	constraint klaim_link_isi check (link_bukti ~* '^https?://\S+$')
);

create table if not exists public.penyelesaian (
	peserta_id uuid not null references public.peserta (id) on delete cascade,
	misi_id uuid not null references public.misi (id) on delete cascade,
	mentor_id uuid references public.mentor (id) on delete set null,
	diselesaikan_pada timestamptz not null default now(),
	primary key (peserta_id, misi_id)
);

create table if not exists public.bonus (
	id uuid primary key default gen_random_uuid(),
	peserta_id uuid not null references public.peserta (id) on delete cascade,
	jenis text not null check (jenis in ('error_collector', 'buddy_assist')),
	mentor_id uuid references public.mentor (id) on delete set null,
	keterangan text,
	dibuat_pada timestamptz not null default now()
);

create table if not exists public.soal (
	id uuid primary key default gen_random_uuid(),
	jenis text not null check (jenis in ('pre', 'post', 'trivia')),
	urutan int not null check (urutan > 0),
	pertanyaan text not null,
	pilihan jsonb not null,
	aktif boolean not null default true,
	unique (jenis, urutan)
);

-- Kunci jawaban dipisah supaya tidak pernah ikut terkirim ke peserta.
create table if not exists public.soal_kunci (
	soal_id uuid primary key references public.soal (id) on delete cascade,
	jawaban int not null check (jawaban >= 0)
);

create table if not exists public.hasil_tes (
	peserta_id uuid not null references public.peserta (id) on delete cascade,
	jenis text not null check (jenis in ('pre', 'post', 'trivia')),
	benar int not null,
	total int not null,
	skor int not null,
	jawaban jsonb not null default '[]'::jsonb,
	dikerjakan_pada timestamptz not null default now(),
	primary key (peserta_id, jenis)
);

create table if not exists public.survei (
	peserta_id uuid primary key references public.peserta (id) on delete cascade,
	lebih_siap boolean not null,
	saran text,
	dibuat_pada timestamptz not null default now()
);

create index if not exists idx_peserta_kelompok on public.peserta (kelompok_id);
create index if not exists idx_penyelesaian_peserta on public.penyelesaian (peserta_id);
create index if not exists idx_klaim_peserta on public.klaim_misi (peserta_id);
create index if not exists idx_bonus_peserta on public.bonus (peserta_id);
create index if not exists idx_hasil_tes_peserta on public.hasil_tes (peserta_id);

-- ============================================================
-- 2. Profil otomatis + fungsi bantu
-- ============================================================

-- Setiap pengguna auth baru mendapat baris profil. Peran dibaca dari app_metadata
-- (hanya bisa diisi lewat service role, tidak bisa diubah peserta sendiri).
create or replace function public.tangani_pengguna_baru()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (id, role, nama)
	values (
		new.id,
		coalesce(new.raw_app_meta_data ->> 'role', 'peserta'),
		coalesce(new.raw_user_meta_data ->> 'nama', new.email, '')
	)
	on conflict (id) do nothing;
	return new;
end;
$$;

drop trigger if exists pengguna_baru on auth.users;
create trigger pengguna_baru
	after insert on auth.users
	for each row execute function public.tangani_pengguna_baru();

-- GoTrue menyetel app_metadata SESUDAH baris auth.users dibuat, sehingga peran di
-- profiles sempat ketinggalan (mis. mentor tercatat 'peserta'). Sinkronkan lagi
-- setiap app_metadata berubah supaya profiles selalu setara.
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

-- Peran pengguna saat ini. Dibaca dari app_metadata di auth.users — sumber yang
-- sama dengan JWT yang diperiksa aplikasi — supaya RLS tidak pernah berbeda
-- dengan penjagaan halaman. profiles.role hanya cermin yang dijaga pemicu di atas.
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

-- Kelompok tempat peserta saat ini terdaftar.
create or replace function public.kelompok_saya()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
	select kelompok_id from public.peserta where id = (select auth.uid());
$$;

-- Kelompok yang dibimbing mentor saat ini.
create or replace function public.kelompok_mentor()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
	select id from public.kelompok where mentor_id = (select auth.uid()) limit 1;
$$;

-- Poin resmi seorang peserta. Wajib sama dengan src/lib/server/points.ts.
-- Klamp yang sama: misi per level maks 3, bonus per jenis maks 2, trivia 0..3.
create or replace function public.poin_peserta(p uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
	with d as (
		select
			(select count(*) from public.penyelesaian pe
				join public.misi m on m.id = pe.misi_id
				where pe.peserta_id = p and m.level_id = 1) as l1,
			(select count(*) from public.penyelesaian pe
				join public.misi m on m.id = pe.misi_id
				where pe.peserta_id = p and m.level_id = 2) as l2,
			(select count(*) from public.penyelesaian pe
				join public.misi m on m.id = pe.misi_id
				where pe.peserta_id = p and m.level_id = 3) as l3,
			(select count(*) from public.bonus b
				where b.peserta_id = p and b.jenis = 'error_collector') as ec,
			(select count(*) from public.bonus b
				where b.peserta_id = p and b.jenis = 'buddy_assist') as ba,
			(select coalesce(benar, 0) from public.hasil_tes ht
				where ht.peserta_id = p and ht.jenis = 'trivia') as tb,
			(select coalesce(total, 0) from public.hasil_tes ht
				where ht.peserta_id = p and ht.jenis = 'trivia') as tt,
			(select (p2.checkin_pada is not null) and exists (
				select 1 from public.hasil_tes ht
				where ht.peserta_id = p and ht.jenis = 'pre'
			) from public.peserta p2 where p2.id = p) as bc
	)
	select
		(case when coalesce(bc, false) then 2 else 0 end)
		+ least(l1, 3) * 2
		+ least(l2, 3) * 2
		+ least(l3, 3) * 3
		+ (case when tt > 0 then least(3, floor(3.0 * tb / tt)) else 0 end)
		+ least(ec, 2)
		+ least(ba, 2)
	from d;
$$;

-- ============================================================
-- 3. Pemicu otomatis (kelompok, hint, dan bonus)
-- ============================================================

create or replace function public.cek_batas_hint()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_level int;
	v_jumlah int;
begin
	select level_id into v_level from public.hint where id = new.hint_id;
	select count(*) into v_jumlah
	from public.hint_dipakai hd
	join public.hint h on h.id = hd.hint_id
	where hd.peserta_id = new.peserta_id and h.level_id = v_level;
	if v_jumlah >= 3 then
		raise exception 'Kartu hint untuk level ini sudah habis (3 kartu).';
	end if;
	return new;
end;
$$;

drop trigger if exists batas_hint on public.hint_dipakai;
create trigger batas_hint
	before insert on public.hint_dipakai
	for each row execute function public.cek_batas_hint();

create or replace function public.cek_batas_bonus()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_jumlah int;
begin
	select count(*) into v_jumlah
	from public.bonus
	where peserta_id = new.peserta_id and jenis = new.jenis;
	if v_jumlah >= 2 then
		raise exception 'Bonus % sudah mencapai batas maksimal 2 kali.', new.jenis;
	end if;
	return new;
end;
$$;

drop trigger if exists batas_bonus on public.bonus;
create trigger batas_bonus
	before insert on public.bonus
	for each row execute function public.cek_batas_bonus();

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

-- ============================================================
-- 4. Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.mentor enable row level security;
alter table public.kelompok enable row level security;
alter table public.peserta enable row level security;
alter table public.level enable row level security;
alter table public.misi enable row level security;
alter table public.hint enable row level security;
alter table public.hint_dipakai enable row level security;
alter table public.klaim_misi enable row level security;
alter table public.penyelesaian enable row level security;
alter table public.bonus enable row level security;
alter table public.soal enable row level security;
alter table public.soal_kunci enable row level security;
alter table public.hasil_tes enable row level security;
alter table public.survei enable row level security;

-- profiles: milik sendiri, admin melihat semua. Perubahan lewat service role.
drop policy if exists "profil sendiri atau admin" on public.profiles;
create policy "profil sendiri atau admin" on public.profiles
	for select to authenticated
	using (id = (select auth.uid()) or public.peran_saya() = 'admin');

-- peserta: milik sendiri, mentor kelompoknya, atau admin.
drop policy if exists "peserta sendiri mentor atau admin" on public.peserta;
create policy "peserta sendiri mentor atau admin" on public.peserta
	for select to authenticated
	using (
		id = (select auth.uid())
		or public.peran_saya() = 'admin'
		or (public.peran_saya() = 'mentor' and kelompok_id = public.kelompok_mentor())
	);

-- mentor dan kelompok: nama bukan rahasia, boleh dibaca semua pengguna masuk.
drop policy if exists "mentor boleh dibaca" on public.mentor;
create policy "mentor boleh dibaca" on public.mentor
	for select to authenticated using (true);

drop policy if exists "kelompok boleh dibaca" on public.kelompok;
create policy "kelompok boleh dibaca" on public.kelompok
	for select to authenticated using (true);

-- level, misi, hint: konten acara, boleh dibaca semua pengguna masuk.
drop policy if exists "level boleh dibaca" on public.level;
create policy "level boleh dibaca" on public.level
	for select to authenticated using (true);

drop policy if exists "misi boleh dibaca" on public.misi;
create policy "misi boleh dibaca" on public.misi
	for select to authenticated using (true);

drop policy if exists "hint boleh dibaca" on public.hint;
create policy "hint boleh dibaca" on public.hint
	for select to authenticated using (true);

-- hint_dipakai: peserta mengelola miliknya; mentor dan admin melihat kelompok/semua.
drop policy if exists "hint dipakai sendiri" on public.hint_dipakai;
create policy "hint dipakai sendiri" on public.hint_dipakai
	for select to authenticated
	using (
		peserta_id = (select auth.uid())
		or public.peran_saya() = 'admin'
		or (public.peran_saya() = 'mentor' and peserta_id in (
			select p.id from public.peserta p where p.kelompok_id = public.kelompok_mentor()
		))
	);

drop policy if exists "pakai hint sendiri" on public.hint_dipakai;
create policy "pakai hint sendiri" on public.hint_dipakai
	for insert to authenticated
	with check (peserta_id = (select auth.uid()));

-- klaim_misi: peserta mengklaim miliknya; mentor dan admin melihat.
drop policy if exists "klaim terlihat" on public.klaim_misi;
create policy "klaim terlihat" on public.klaim_misi
	for select to authenticated
	using (
		peserta_id = (select auth.uid())
		or public.peran_saya() = 'admin'
		or (public.peran_saya() = 'mentor' and peserta_id in (
			select p.id from public.peserta p where p.kelompok_id = public.kelompok_mentor()
		))
	);

drop policy if exists "klaim sendiri" on public.klaim_misi;
create policy "klaim sendiri" on public.klaim_misi
	for insert to authenticated
	with check (peserta_id = (select auth.uid()));

-- Peserta boleh memperbarui tautan klaimnya sendiri (mis. salah tempel link).
drop policy if exists "ubah klaim sendiri" on public.klaim_misi;
create policy "ubah klaim sendiri" on public.klaim_misi
	for update to authenticated
	using (peserta_id = (select auth.uid()))
	with check (peserta_id = (select auth.uid()));

-- penyelesaian: peserta melihat miliknya, mentor kelompoknya, admin semua.
-- Hanya mentor kelompok peserta (atau admin) yang boleh menandai selesai.
drop policy if exists "penyelesaian terlihat" on public.penyelesaian;
create policy "penyelesaian terlihat" on public.penyelesaian
	for select to authenticated
	using (
		peserta_id = (select auth.uid())
		or public.peran_saya() = 'admin'
		or (public.peran_saya() = 'mentor' and peserta_id in (
			select p.id from public.peserta p where p.kelompok_id = public.kelompok_mentor()
		))
	);

drop policy if exists "mentor kelompok boleh menandai selesai" on public.penyelesaian;
create policy "mentor kelompok boleh menandai selesai" on public.penyelesaian
	for insert to authenticated
	with check (
		public.peran_saya() = 'admin'
		or (
			public.peran_saya() = 'mentor'
			and exists (
				select 1 from public.peserta p
				join public.kelompok k on k.id = p.kelompok_id
				where p.id = peserta_id and k.mentor_id = (select auth.uid())
			)
		)
	);

-- Salah ketuk? Mentor (atau admin) boleh membatalkan tanda selesai peserta
-- kelompoknya. Poin otomatis kembali karena selalu dihitung ulang.
drop policy if exists "mentor kelompok boleh membatalkan" on public.penyelesaian;
create policy "mentor kelompok boleh membatalkan" on public.penyelesaian
	for delete to authenticated
	using (
		public.peran_saya() = 'admin'
		or (
			public.peran_saya() = 'mentor'
			and exists (
				select 1 from public.peserta p
				join public.kelompok k on k.id = p.kelompok_id
				where p.id = peserta_id and k.mentor_id = (select auth.uid())
			)
		)
	);

-- bonus: sama seperti penyelesaian. Batas 2 kali dijaga pemicu batas_bonus.
drop policy if exists "bonus terlihat" on public.bonus;
create policy "bonus terlihat" on public.bonus
	for select to authenticated
	using (
		peserta_id = (select auth.uid())
		or public.peran_saya() = 'admin'
		or (public.peran_saya() = 'mentor' and peserta_id in (
			select p.id from public.peserta p where p.kelompok_id = public.kelompok_mentor()
		))
	);

drop policy if exists "mentor kelompok boleh memberi bonus" on public.bonus;
create policy "mentor kelompok boleh memberi bonus" on public.bonus
	for insert to authenticated
	with check (
		public.peran_saya() = 'admin'
		or (
			public.peran_saya() = 'mentor'
			and exists (
				select 1 from public.peserta p
				join public.kelompok k on k.id = p.kelompok_id
				where p.id = peserta_id and k.mentor_id = (select auth.uid())
			)
		)
	);

-- Salah beri? Mentor (atau admin) boleh menghapus bonus peserta kelompoknya.
drop policy if exists "mentor kelompok boleh membatalkan bonus" on public.bonus;
create policy "mentor kelompok boleh membatalkan bonus" on public.bonus
	for delete to authenticated
	using (
		public.peran_saya() = 'admin'
		or (
			public.peran_saya() = 'mentor'
			and exists (
				select 1 from public.peserta p
				join public.kelompok k on k.id = p.kelompok_id
				where p.id = peserta_id and k.mentor_id = (select auth.uid())
			)
		)
	);

-- soal: hanya admin yang boleh membaca langsung (lewat API/SQL). Peserta menerima
-- soal dari server melalui route /tes dan /trivia supaya kunci tetap aman.
drop policy if exists "soal hanya admin" on public.soal;
create policy "soal hanya admin" on public.soal
	for all to authenticated
	using (public.peran_saya() = 'admin')
	with check (public.peran_saya() = 'admin');

drop policy if exists "kunci hanya admin" on public.soal_kunci;
create policy "kunci hanya admin" on public.soal_kunci
	for all to authenticated
	using (public.peran_saya() = 'admin')
	with check (public.peran_saya() = 'admin');

-- hasil_tes: peserta melihat miliknya, admin semua. Penulisan hanya lewat
-- server (service role) supaya skor tidak bisa dipalsukan dari peramban.
drop policy if exists "hasil tes terlihat" on public.hasil_tes;
create policy "hasil tes terlihat" on public.hasil_tes
	for select to authenticated
	using (peserta_id = (select auth.uid()) or public.peran_saya() = 'admin');

-- survei: peserta mengisi miliknya; admin membaca semua.
drop policy if exists "survei sendiri" on public.survei;
create policy "survei sendiri" on public.survei
	for select to authenticated
	using (peserta_id = (select auth.uid()) or public.peran_saya() = 'admin');

drop policy if exists "isi survei sendiri" on public.survei;
create policy "isi survei sendiri" on public.survei
	for insert to authenticated
	with check (peserta_id = (select auth.uid()));

-- ============================================================
-- 5. View publik (agregat, tanpa data pribadi)
-- ============================================================

-- Skor kelompok tanpa skor individu (PRD bagian 3: yang tampil ke umum hanya skor kelompok).
create or replace view public.skor_kelompok
with (security_invoker = false)
as
	select
		k.id,
		k.nama,
		coalesce(sum(public.poin_peserta(p.id)), 0)::int as total_poin,
		count(p.id)::int as jumlah_peserta
	from public.kelompok k
	left join public.peserta p on p.kelompok_id = k.id
	group by k.id, k.nama;

grant select on public.skor_kelompok to anon, authenticated;

-- Papan Kehormatan: hanya Champion yang sudah menyetujui (opt-in).
create or replace view public.papan_kehormatan
with (security_invoker = false)
as
	select p.nama
	from public.peserta p
	where p.papan_optin = true
		and public.poin_peserta(p.id) >= 27;

grant select on public.papan_kehormatan to anon, authenticated;

grant execute on function public.poin_peserta(uuid) to anon, authenticated;

-- ============================================================
-- 6. Storage: bucket privat untuk Academic Vault
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('vault', 'vault', false, 20971520)
on conflict (id) do nothing;

-- Tidak ada kebijakan storage: hanya service role (server) yang boleh membuat
-- tautan bertanda tangan, dan hanya setelah peserta tercatat hadir.
