-- 0005: batalkan salah tandai — mentor boleh menghapus penyelesaian & bonus
-- peserta kelompoknya; admin boleh semuanya.
--
-- Kebijakan hapus (delete) di bawah ini kembar dengan kebijakan sisip yang sudah
-- ada di 0001: sama-sama dibatasi "mentor kelompok peserta tersebut". Menghapus
-- baris penyelesaian/bonus otomatis mengembalikan poin karena poin selalu
-- dihitung ulang dari data mentah (public.poin_peserta() / rekap), tanpa cache.
--
-- Aman dijalankan berulang kali (idempoten).

-- 1. Batalkan tanda selesai misi (salah ketuk ✓).
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

-- 2. Batalkan bonus (salah beri).
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
