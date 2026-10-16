<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { LABEL_JENIS_TES } from '#lib/constants/acara.js';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const sudah = $derived(data.hasil !== null);
	const judul = $derived(LABEL_JENIS_TES[data.jenis]);
	const keterangan = $derived(
		data.jenis === 'pre'
			? 'Untuk mengukur titik awalmu. Tidak apa-apa kalau banyak yang belum tahu — justru itu tujuan pre-test.'
			: 'Mengukur kemajuanmu setelah seharian belajar. Jawab dengan tenang.'
	);
</script>

<h1>{judul}</h1>
<p class="petunjuk-kecil">{keterangan}</p>

{#if form?.pesan}
	<p class="pesan pesan-galat">{form.pesan}</p>
{/if}

{#if sudah}
	<section class="kartu tengah">
		<p class="petunjuk-kecil">Skormu</p>
		<p class="poin-besar">{data.hasil!.skor}<span style="font-size: 1rem; color: var(--teks-lembut)">/100</span></p>
		<p>
			Benar {data.hasil!.benar} dari {data.hasil!.total} soal
		</p>
		<p class="petunjuk-kecil">
			Dikerjakan {new Date(data.hasil!.dikerjakan_pada).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}.
			Skor hanya terlihat olehmu dan panitia.
		</p>
		{#if data.jenis === 'pre'}
			<a class="btn" href="/dashboard"><Ikon nama="arrow-right" ukuran={16} /> Lanjut ke misi Level 1</a>
		{:else}
			<div class="deret" style="justify-content: center">
				<a class="btn" href="/survei"><Ikon nama="arrow-right" ukuran={16} /> Isi survei pasca-acara</a>
				<a class="btn btn-garis" href="/vault"><Ikon nama="box" ukuran={16} /> Buka Academic Vault</a>
			</div>
		{/if}
	</section>
{:else if data.soal.length === 0}
	<p class="pesan pesan-kuning">Soal belum disiapkan panitia. Coba lagi nanti, ya.</p>
{:else}
	<form method="POST" class="kartu">
		{#each data.soal as s, i (s.id)}
			<fieldset style="margin-bottom: 1.25rem">
				<legend style="font-weight: 650; margin-bottom: 0.4rem">
					{i + 1}. {s.pertanyaan}
				</legend>
				<div class="pilihan">
					{#each s.pilihan as pilihan, j (j)}
						<label>
							<input type="radio" name="jawaban-{i}" value={j} required />
							{pilihan}
						</label>
					{/each}
				</div>
			</fieldset>
		{/each}
		<button class="btn btn-penuh" type="submit"><Ikon nama="send" ukuran={16} /> Kirim jawaban</button>
		<p class="petunjuk-kecil tengah">Skor muncul langsung setelah dikirim. Sekali kirim, tidak bisa diulang.</p>
	</form>
{/if}
