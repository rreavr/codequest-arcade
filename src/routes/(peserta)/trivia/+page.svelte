<script lang="ts">
	import { untrack } from 'svelte';
	import type { ActionData, PageData } from './$types';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let sisa = $state<number>(untrack(() => data.durasi));
	let dikirim = $state(false);
	let formEl: HTMLFormElement | undefined = $state();

	const menitDetik = $derived(
		`${Math.floor(sisa / 60)}:${String(sisa % 60).padStart(2, '0')}`
	);

	$effect(() => {
		if (data.hasil || data.soal.length === 0) return;
		const t = setInterval(() => {
			if (dikirim) return;
			if (sisa > 0) sisa -= 1;
			if (sisa === 0) {
				dikirim = true;
				formEl?.requestSubmit();
			}
		}, 1000);
		return () => clearInterval(t);
	});
</script>

<h1>Trivia</h1>
<p class="petunjuk-kecil">
	Lima soal ringan di awal sesi siang. Poinnya mengikuti jumlah jawaban benar — benar semua dapat
	3 poin. Waktu {Math.round(data.durasi / 60)} menit.
</p>

{#if form?.pesan}
	<p class="pesan pesan-galat">{form.pesan}</p>
{/if}

{#if data.hasil}
	<section class="kartu tengah">
		<p class="petunjuk-kecil">Hasil triviamu</p>
		<p class="poin-besar">{data.hasil.benar}<span style="font-size: 1rem; color: var(--teks-lembut)">/{data.hasil.total} benar</span></p>
		<p>
			<span class="chip chip-info"><Ikon nama="star" ukuran={13} />+{data.poinDidapat} poin triviamu</span>
		</p>
		<p class="petunjuk-kecil">Skor hanya terlihat olehmu dan panitia.</p>
		<a class="btn" href="/dashboard"><Ikon nama="arrow-left" ukuran={15} /> Kembali ke dashboard</a>
	</section>
{:else if data.soal.length === 0}
	<p class="pesan pesan-kuning">Soal trivia belum disiapkan panitia. Coba lagi nanti, ya.</p>
{:else}
	<p class="pesan pesan-info" role="timer">
		<Ikon nama="clock" ukuran={14} /> Sisa waktu: <strong>{menitDetik}</strong>{#if sisa <= 60} — hampir habis!{/if}
	</p>

	<form method="POST" bind:this={formEl} class="kartu">
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
		<button class="btn btn-penuh" type="submit" disabled={dikirim}>
			<Ikon nama="send" ukuran={16} /> {dikirim ? 'Mengirim...' : 'Kirim jawaban'}
		</button>
		<p class="petunjuk-kecil tengah">
			Jika waktu habis, jawaban terkirim otomatis. Sekali kirim, tidak bisa diulang.
		</p>
	</form>
{/if}
