<script lang="ts">
	import type { PageData } from './$types';
	import Bar from '#lib/ui/Bar.svelte';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data }: { data: PageData } = $props();

	const kenaikan = $derived(
		data.rataPretest !== null && data.rataPosttest !== null
			? data.rataPosttest - data.rataPretest
			: null
	);
</script>

<h1>Ringkasan panitia</h1>
<p class="petunjuk-kecil">
	HIMTI CodeQuest: First Level 2026 · pantau KR1-KR3 langsung dari data situs.
</p>

<section class="kisi">
	<div class="kartu">
		<p class="petunjuk-kecil">Hadir (KR1)</p>
		<p class="poin-besar">{data.hadir}<span style="font-size: 1rem; color: var(--teks-lembut)">/{data.kuota}</span></p>
		<a href="/admin/checkin"><Ikon nama="checkbox-on" ukuran={14} /> Buka check-in</a>
	</div>
	<div class="kartu">
		<p class="petunjuk-kecil">Misi menunggu verifikasi</p>
		<p class="poin-besar" class:tier-champion={data.menunggu > 5}>{data.menunggu}</p>
		<p class="petunjuk-kecil">Antrean klaim peserta yang belum ditandai mentor.</p>
	</div>
	<div class="kartu">
		<p class="petunjuk-kecil">Kenaikan skor tes (KR3)</p>
		<p class="poin-besar">{kenaikan === null ? '—' : `+${kenaikan}`}</p>
		<p class="petunjuk-kecil">
			Pre-test {data.rataPretest ?? '—'} <Ikon nama="arrow-right" ukuran={12} /> Post-test {data.rataPosttest ?? '—'} (target +30).
		</p>
	</div>
</section>

<section class="kartu">
	<h2>Target KR2 (Builder atau lebih: minimal 28 dari 32)</h2>
	<Bar bagian={data.builderPlus} total={data.total} tinggi={14} />
	<p style="margin-top: 0.5rem">
		<strong>{data.builderPlus}</strong> dari {data.total} peserta sudah tier Builder+.
		({data.champion} Champion, {data.explorer} Explorer, {data.belumTier} belum ada tier)
	</p>
</section>

<section class="kartu">
	<h2><Ikon nama="target" ukuran={18} /> Misi kunci</h2>
	<ul class="senarai">
		<li class="deret deret-antara">
			<span>Level 2 tuntas — pasang IDE &amp; folder (KR1)</span>
			<span class="angka"><strong>{data.misiL2Tuntas}</strong>/{data.total}</span>
		</li>
		<li class="deret deret-antara">
			<span>Level 3 tuntas — Error Hunt (KR2)</span>
			<span class="angka"><strong>{data.misiL3Tuntas}</strong>/{data.total}</span>
		</li>
		<li class="deret deret-antara">
			<span>Survei “lebih siap” (KR3, target 90%)</span>
			<span class="angka">
				<strong>{data.lebihSiap}</strong>/{data.jumlahSurvei || 0} terisi
			</span>
		</li>
	</ul>
</section>

<section class="deret">
	<a class="btn" href="/admin/ekspor"><Ikon nama="download" ukuran={16} /> Ekspor data (CSV)</a>
	<a class="btn btn-garis" href="/admin/peserta"><Ikon nama="users" ukuran={16} /> Kelola peserta</a>
</section>
