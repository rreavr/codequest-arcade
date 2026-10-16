<script lang="ts">
	import type { PageData } from './$types';
	import { TIER_THRESHOLDS } from '#lib/constants/points.js';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="lembar lembar-lebar">
	<h1>Papan Kehormatan</h1>
	<p class="petunjuk-kecil">
		Daftar peserta tier Champion yang sudah memberi izin namanya ditampilkan.
	</p>

	{#if !data.terkonfigurasi}
		<p class="pesan pesan-kuning">Situs belum terhubung ke basis data acara. Coba beberapa saat lagi.</p>
	{:else if data.nama.length === 0}
		<p class="pesan pesan-info">
			Belum ada nama di papan ini. Peserta yang mencapai tier Champion
			({TIER_THRESHOLDS.champion} poin) bisa memilih tampil dari dashboard-nya.
		</p>
	{:else}
		<section class="kartu">
			<ul class="senarai">
				{#each data.nama as nama (nama)}
					<li><span class="tier-champion"><Ikon nama="crown" ukuran={16} /></span> {nama}</li>
				{/each}
			</ul>
		</section>
		<p class="petunjuk-kecil">Persetujuan bisa ditarik kapan saja oleh peserta masing-masing.</p>
	{/if}
</div>
