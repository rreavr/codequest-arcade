<script lang="ts">
	import { ACARA } from '#lib/constants/acara.js';
	import Ikon from '#lib/ui/Ikon.svelte';
</script>

<h1>Ekspor data</h1>
<p class="petunjuk-kecil">
	Berkas CSV memakai pemisah titik koma dan bisa langsung dibuka di Excel atau Google Sheets.
	Ekspor hanya untuk panitia inti; data pribadi dihapus pada {ACARA.tanggalHapusData} (H+3).
</p>

<section class="kartu">
	<h2><Ikon nama="download" ukuran={18} /> Berkas untuk hitung KR</h2>
	<ul class="senarai">
		<li class="deret deret-antara">
			<a href="/api/ekspor?jenis=ringkasan" download><Ikon nama="download" ukuran={14} /> Ringkasan KR1-KR3.csv</a>
			<span class="chip chip-info"><Ikon nama="star" ukuran={13} /> Mulai dari sini</span>
		</li>
		<li class="deret deret-antara">
			<a href="/api/ekspor?jenis=peserta" download><Ikon nama="download" ukuran={14} /> Rekap peserta.csv</a>
			<span class="petunjuk-kecil">poin, tier, badge, check-in</span>
		</li>
		<li class="deret deret-antara">
			<a href="/api/ekspor?jenis=misi" download><Ikon nama="download" ukuran={14} /> Penyelesaian misi.csv</a>
			<span class="petunjuk-kecil">termasuk mentor yang memverifikasi</span>
		</li>
		<li class="deret deret-antara">
			<a href="/api/ekspor?jenis=tes" download><Ikon nama="download" ukuran={14} /> Hasil tes.csv</a>
			<span class="petunjuk-kecil">pre-test, post-test, trivia</span>
		</li>
		<li class="deret deret-antara">
			<a href="/api/ekspor?jenis=survei" download><Ikon nama="download" ukuran={14} /> Survei.csv</a>
			<span class="petunjuk-kecil">jawaban "lebih siap" dan saran</span>
		</li>
	</ul>
</section>

<section class="kartu">
	<h2>Rencana cadangan</h2>
	<p class="petunjuk-kecil">
		Sesuai PRD bagian 10: unduh rekap peserta dan penyelesaian misi sebelum hari H dimulai
		sebagai salinan cadangan, lalu ulangi setelah acara selesai.
	</p>
</section>
