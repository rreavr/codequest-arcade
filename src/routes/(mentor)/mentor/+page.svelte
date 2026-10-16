<script lang="ts">
	import type { PageData } from './$types';
	import { LABEL_TIER } from '#lib/constants/acara.js';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="lembar lembar-lebar">
	<h1>Halo, mentor {data.mentor.nama.split(' ')[0]}</h1>
	<p class="petunjuk-kecil">
		Verifikasi misi kelompokmu: pilih peserta, periksa hasil kerjanya, lalu ketuk misi yang sudah
		selesai. Kalau Wi-Fi putus, ketukanmu tetap tercatat dan terkirim otomatis saat tersambung.
	</p>

	<div class="deret" style="margin-bottom: 1rem">
		<a class="btn btn-lembut btn-kecil" href="/kelola/vault"
			><Ikon nama="box" ukuran={15} /> Kelola tautan vault</a
		>
	</div>

	{#if data.hasil.length === 0}
		<p class="pesan pesan-kuning">
			Kamu belum dipasangkan ke kelompok. Hubungi panitia untuk pembagian kelompok.
		</p>
	{/if}

	{#each data.hasil as h (h.kelompok.id)}
		<section class="kartu">
			<div class="deret" style="justify-content: space-between">
				<h2 style="margin: 0">{h.kelompok.nama}</h2>
				{#if h.jumlahMenunggu > 0}
					<span class="chip chip-menunggu"
						><Ikon nama="hourglass" ukuran={13} />{h.jumlahMenunggu} menunggu</span
					>
				{:else}
					<span class="chip chip-selesai"><Ikon nama="check" ukuran={13} />Tidak ada antrean</span>
				{/if}
			</div>
			<p class="petunjuk-kecil">
				{h.jumlahPeserta} peserta{h.kelompok.mentor_id ? '' : ' · mentor belum diatur'}
			</p>

			<ul class="senarai">
				{#each h.ringkas as r (r.id)}
					<li class="deret" style="justify-content: space-between">
						<span>{r.nama}</span>
						<span class="petunjuk-kecil angka">
							{r.poin} poin · {r.misiSelesai}/9 misi ·
							<span class="tier-{r.tier}">{LABEL_TIER[r.tier]}</span>
						</span>
					</li>
				{/each}
			</ul>

			<div class="deret" style="margin-top: 0.75rem">
				<a class="btn" href="/mentor/kelompok/{h.kelompok.id}"
					><Ikon nama="arrow-right" ukuran={16} /> Buka verifikasi</a
				>
			</div>
		</section>
	{/each}

	<p class="petunjuk-kecil">
		Petunjuk singkat: ketuk nama peserta <Ikon nama="arrow-right" ukuran={13} /> ketuk misi yang
		selesai. Dua ketukan, selesai. Poin peserta bertambah otomatis.
	</p>
</div>
