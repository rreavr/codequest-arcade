<script lang="ts">
	import type { PageData } from './$types';
	import { ACARA } from '#lib/constants/acara.js';
	import { TIER_THRESHOLDS } from '#lib/constants/points.js';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data }: { data: PageData } = $props();
</script>

<h1>Academic Vault</h1>

{#if data.terkunci}
	<section class="kartu">
		<p class="pesan pesan-kuning">
			Vault terbuka setelah kamu tercatat hadir. Datangi meja panitia dan sebutkan NIM-mu
			untuk check-in.
		</p>
		<a class="btn" href="/dashboard"><Ikon nama="arrow-left" ukuran={15} /> Kembali ke dashboard</a>
	</section>
{:else}
	<p>
		Halo, <strong>{data.nama}</strong>. Vault ini hadiah untuk semua peserta yang hadir sampai
		akhir — tanpa syarat tier.
	</p>

	<section class="kartu">
		<h2><Ikon nama="trophy" ukuran={18} /> Sertifikatmu</h2>
		{#if data.tier === 'none'}
			<p class="petunjuk-kecil">
				Sertifikat tersedia mulai tier Explorer ({TIER_THRESHOLDS.explorer} poin). Kumpulkan poin
				dari checkpoint Base Camp dan misi yang diverifikasi mentor, lalu kembali ke sini.
			</p>
			<a class="btn btn-garis" href="/dashboard"
				><Ikon nama="analytics" ukuran={15} /> Lihat progres poin</a
			>
		{:else}
			<p>
				Tier kamu: <strong class="tier-{data.tier}">{data.tier === 'champion' ? 'Champion' : data.tier === 'builder' ? 'Builder' : 'Explorer'}</strong>.
				Unduh sertifikatmu dalam format PDF.
			</p>
			<a class="btn" href="/api/sertifikat" download
				><Ikon nama="download" ukuran={16} /> Unduh sertifikat PDF</a
			>
		{/if}
	</section>

	<section class="kartu">
		<h2><Ikon nama="box" ukuran={18} /> Daftar tautan</h2>
		{#if data.berkas.length === 0}
			<p class="petunjuk-kecil">Belum ada isi. Cek lagi nanti, ya.</p>
		{:else}
			<ul class="senarai">
				{#each data.berkas as berkas (berkas.id)}
					<li>
						<a href={berkas.url} target="_blank" rel="noopener"
							><Ikon nama="external-link" ukuran={14} /> {berkas.nama}</a
						>
						{#if berkas.keterangan}
							<p class="petunjuk-kecil" style="margin: 0.15rem 0 0">{berkas.keterangan}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="kartu">
		<h2>Selanjutnya</h2>
		<ul class="senarai">
			<li>Masuk ke grup mentoring lewat tautan yang dibagikan panitia.</li>
			<li>
				Data pribadimu (NIM, WhatsApp, kendala) dihapus pada {ACARA.tanggalHapusData} (H+3)
				sesuai aturan privasi.
			</li>
		</ul>
	</section>
{/if}
