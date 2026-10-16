<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const maks = $derived(Math.max(1, ...data.kelompok.map((k) => k.total_poin)));
</script>

<div class="lembar lembar-lebar">
	<h1>Skor kelompok</h1>
	<p class="petunjuk-kecil">
		Yang tampil ke publik hanya skor kelompok — skor individu tetap privat sesuai aturan acara.
	</p>

	{#if !data.terkonfigurasi}
		<p class="pesan pesan-kuning">Situs belum terhubung ke basis data acara. Coba beberapa saat lagi.</p>
	{:else if data.kelompok.length === 0}
		<p class="pesan pesan-info">Belum ada kelompok yang dibuat panitia.</p>
	{:else}
		<section class="kartu">
			<ul class="senarai">
				{#each data.kelompok as k, i (k.id)}
					<li>
						<div class="deret" style="justify-content: space-between">
							<strong class="angka">{i + 1}.</strong>
							<span style="flex: 1">{k.nama}</span>
							<span class="angka"><strong>{k.total_poin}</strong> poin</span>
						</div>
						<div class="bar" style="margin-top: 0.4rem">
							<div class="bar-isi" style="width: {Math.round((k.total_poin / maks) * 100)}%"></div>
						</div>
					</li>
				{/each}
			</ul>
		</section>
		<p class="petunjuk-kecil">Total {data.kelompok.length} kelompok. Diperbarui setiap kali mentor menandai misi.</p>
	{/if}
</div>
