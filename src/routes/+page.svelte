<script lang="ts">
	import { ACARA } from '#lib/constants/acara.js';
	import { TIER_THRESHOLDS, MAX_TOTAL_POINTS } from '#lib/constants/points.js';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data } = $props();

	const beranda = $derived(
		data.peran === 'admin' ? '/admin' : data.peran === 'mentor' ? '/mentor' : '/dashboard'
	);
	const labelBeranda = $derived(
		data.peran === 'admin'
			? 'Buka halaman admin'
			: data.peran === 'mentor'
				? 'Buka halaman mentor'
				: 'Buka dashboard'
	);
</script>

<div class="lembar">
	<section class="hero">
		<h1>{ACARA.namaPendek}</h1>
		<p class="petunjuk-kecil">
			Situs pendamping {ACARA.nama} · {ACARA.tanggal}
		</p>
		<p>
			Misi bertahap, poin, badge, dan tier hadiah — semuanya tercatat otomatis. Progresmu hanya
			terlihat olehmu dan mentormu.
		</p>
		{#if data.peran}
			<div class="deret" style="margin-top: 1rem">
				<a class="btn" href={beranda}><Ikon nama="arrow-right" ukuran={16} /> {labelBeranda}</a>
			</div>
		{:else}
			<div class="deret" style="margin-top: 1rem">
				<a class="btn" href="/daftar"><Ikon nama="user" ukuran={16} /> Daftar sekarang</a>
				<a class="btn btn-garis" href="/masuk"><Ikon nama="login" ukuran={16} /> Masuk</a>
			</div>
		{/if}
	</section>

	<section class="kartu">
		<h2><Ikon nama="book-open" ukuran={18} /> Baru kenal coding?</h2>
		<p>
			Buka halaman <a href="/belajar">Belajar</a> — rangkuman singkat dasar coding plus latihan
			interaktif, termasuk minigame SQL di peramban. Gratis, tanpa akun, tanpa poin.
		</p>
		<div class="deret" style="margin-top: 0.75rem">
			<a class="btn btn-garis" href="/belajar"><Ikon nama="book-open" ukuran={16} /> Mulai belajar</a>
		</div>
	</section>

	<section class="pusat-info">
		<h2><Ikon nama="circle-question" ukuran={18} /> Pusat info</h2>
		<p class="petunjuk-kecil tengah">Klik pertanyaannya untuk membuka jawaban.</p>

		<details class="faq">
			<summary><Ikon nama="target" ukuran={16} /> Bagaimana alur hari H?</summary>
			<div class="isi-faq">
				<div class="langkah">
					<span class="nomor">1</span>
					<div>
						<strong>Base Camp (08.30).</strong> Check-in, pre-test, dan cek setup laptop.
						Nilainya 2 poin.
					</div>
				</div>
				<div class="langkah">
					<span class="nomor">2</span>
					<div>
						<strong>Tiga level misi.</strong> Logic Unplugged, IDE &amp; File Studio, lalu First
						Run + Error Hunt. Tiap misi diverifikasi langsung oleh mentormu.
					</div>
				</div>
				<div class="langkah">
					<span class="nomor">3</span>
					<div>
						<strong>Trivia (13.00).</strong> Kuis singkat 5 soal, skornya masuk ke poin.
					</div>
				</div>
				<div class="langkah">
					<span class="nomor">4</span>
					<div>
						<strong>Penutup (14.30).</strong> Post-test, survei, lalu buka Academic Vault —
						terbuka untuk semua yang hadir.
					</div>
				</div>
			</div>
		</details>

		<details class="faq">
			<summary><Ikon nama="book-open" ukuran={16} /> Belum pernah coding — tetap bisa ikut?</summary>
			<div class="isi-faq">
				<p>
					Bisa. Pre-test hanya mengukur titik awalmu, dan tidak apa-apa kalau banyak yang belum
					tahu. Di tiap level ada kartu hint gratis, dan mentor mendampingi kelompokmu. Mau
					pemanasan lebih dulu? Latihan di halaman <a href="/belajar">Belajar</a> gratis tanpa akun.
				</p>
			</div>
		</details>

		<details class="faq">
			<summary><Ikon nama="zap" ukuran={16} /> Bagaimana poin dihitung?</summary>
			<div class="isi-faq">
				<ul class="senarai">
					<li>Base Camp &middot; 2 poin</li>
					<li>Level 1 &amp; 2 &middot; 3 misi &times; 2 poin</li>
					<li>Level 3 &middot; 3 misi &times; 3 poin</li>
					<li>Trivia &middot; 3 poin</li>
					<li>Bonus Error Collector &amp; Buddy Assist &middot; maks 2 + 2 poin</li>
				</ul>
				<p class="petunjuk-kecil">Total maksimum {MAX_TOTAL_POINTS} poin.</p>
			</div>
		</details>

		<details class="faq">
			<summary><Ikon nama="trophy" ukuran={16} /> Tier hadiah apa saja?</summary>
			<div class="isi-faq">
				<ul class="senarai">
					<li>
						<span class="chip chip-info">Explorer</span> mulai {TIER_THRESHOLDS.explorer} poin —
						sertifikat Explorer
					</li>
					<li>
						<span class="chip tier-builder">Builder</span> mulai {TIER_THRESHOLDS.builder} poin —
						sertifikat Builder
					</li>
					<li>
						<span class="chip tier-champion">Champion</span> mulai {TIER_THRESHOLDS.champion} poin —
						sertifikat Champion &amp; Papan Kehormatan
					</li>
				</ul>
			</div>
		</details>

		<details class="faq">
			<summary><Ikon nama="star" ukuran={16} /> Bagaimana cara mendapatkan sertifikat?</summary>
			<div class="isi-faq">
				<p>
					Sertifikat PDF tersedia mulai tier Explorer, dan jenisnya mengikuti tier yang kamu
					capai. Kalau poinmu sudah cukup, unduh dari halaman Academic Vault.
				</p>
			</div>
		</details>

		<details class="faq">
			<summary><Ikon nama="box" ukuran={16} /> Apa itu Academic Vault?</summary>
			<div class="isi-faq">
				<p>
					Kumpulan tautan materi dari panitia, terbuka otomatis setelah kamu check-in. Semua
					peserta yang hadir sampai akhir mendapatkannya — tanpa syarat tier.
				</p>
			</div>
		</details>

		<details class="faq">
			<summary><Ikon nama="lock" ukuran={16} /> Apakah poinku bisa dilihat peserta lain?</summary>
			<div class="isi-faq">
				<p>
					Tidak. Skor individu hanya terlihat olehmu, mentormu, dan panitia inti — yang tampil
					ke publik hanya skor kelompok. Papan Kehormatan pun hanya memuat nama yang sudah
					memberi izin.
				</p>
			</div>
		</details>

		<details class="faq">
			<summary><Ikon nama="key" ukuran={16} /> Bagaimana kalau aku lupa sandi?</summary>
			<div class="isi-faq">
				<p>
					Buka halaman <a href="/lupa-sandi">Lupa sandi</a> — khusus peserta. Verifikasi memakai
					data saat mendaftar: NIM, nama lengkap, dan nomor WhatsApp, lalu tentukan sandi baru.
					Setelah itu kamu langsung dibuat masuk.
				</p>
			</div>
		</details>
	</section>
</div>
