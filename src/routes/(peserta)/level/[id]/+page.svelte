<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { PESAN_TAUTAN, tautanTugasValid } from '#lib/tautan.js';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const hintTerpakai = $derived(data.hints.filter((h) => h.dipakai).length);

	// Pesan kesalahan tautan per misi, diperiksa di peramban sebelum formulir dikirim.
	let galatTautan = $state<Record<string, string>>({});

	function periksaTautan(kejadian: SubmitEvent, misiId: string) {
		const formulir = kejadian.currentTarget as HTMLFormElement;
		const nilai = String(new FormData(formulir).get('link_bukti') ?? '');
		if (tautanTugasValid(nilai)) {
			if (galatTautan[misiId]) {
				const salinan = { ...galatTautan };
				delete salinan[misiId];
				galatTautan = salinan;
			}
		} else {
			kejadian.preventDefault();
			galatTautan = { ...galatTautan, [misiId]: PESAN_TAUTAN };
		}
	}
</script>

<p class="petunjuk-kecil"><a href="/dashboard"><Ikon nama="arrow-left" ukuran={15} /> Kembali ke dashboard</a></p>
<h1>Level {data.level.id}: {data.level.judul}</h1>
<p>{data.level.ringkasan}</p>

{#if form?.pesan}
	<p class="pesan {form.galat ? 'pesan-galat' : 'pesan-sukses'}">{form.pesan}</p>
{/if}

{#if !data.terbuka}
	<p class="pesan pesan-kuning">
		Level ini terkunci. Selesaikan dulu ketiga misi di Level {data.level.id - 1} yang sudah
		diverifikasi mentor.
	</p>
{/if}

<section>
	{#each data.misi as m (m.id)}
		<article class="misi {m.selesai ? 'selesai' : m.menunggu ? 'menunggu' : 'belum'}">
			<div class="deret deret-antara">
				<h2 style="margin: 0">Misi {m.urut}: {m.judul}</h2>
				{#if m.selesai}
					<span class="chip chip-selesai"><Ikon nama="check" ukuran={13} />Selesai</span>
				{:else if m.menunggu}
					<span class="chip chip-menunggu"><Ikon nama="hourglass" ukuran={13} />Menunggu verifikasi</span>
				{:else}
					<span class="chip chip-belum"><Ikon nama="circle" ukuran={13} />Belum</span>
				{/if}
			</div>
			<p class="petunjuk-kecil" style="margin: 0.2rem 0 0">{m.poin} poin</p>

			<details style="margin-top: 0.5rem">
				<summary><Ikon nama="book-open" ukuran={15} /> Lihat instruksi</summary>
				<p class="instruksi">{m.instruksi}</p>
			</details>

			<div class="kriteria"><strong>Kriteria selesai:</strong> {m.kriteria}</div>

			{#if m.selesai}
				<p class="petunjuk-kecil">
					Diverifikasi mentor pada
					{new Date(m.diselesaikan!).toLocaleString('id-ID', {
						day: '2-digit',
						month: 'short',
						hour: '2-digit',
						minute: '2-digit'
					})}.
				</p>
			{:else if m.menunggu}
				<p class="petunjuk-kecil" style="margin: 0">
					Tautan tugasmu sudah terkirim — minta mentor memeriksa. Tanda
					<Ikon nama="check" ukuran={13} /> akan muncul setelah mentor menekan tombol di
					ponselnya.
				</p>
				{#if m.tautan}
					<p class="petunjuk-kecil" style="margin: 0.2rem 0 0">
						Tautan terkirim:
						<a href={m.tautan} target="_blank" rel="noopener noreferrer">{m.tautan}</a>
					</p>
				{/if}
				<form method="POST" action="?/klaim" onsubmit={(kejadian) => periksaTautan(kejadian, m.id)}>
					<input type="hidden" name="misi_id" value={m.id} />
					<div class="bidang" style="margin: 0.7rem 0 0.9rem">
						<label for="tautan-{m.id}">Perbarui tautan tugas</label>
						<input
							id="tautan-{m.id}"
							type="url"
							name="link_bukti"
							value={m.tautan ?? ''}
							placeholder="https://github.com/nama/repo"
							autocapitalize="off"
							spellcheck="false"
							required
						/>
						<p class="petunjuk">
							Salah tempel sebelumnya? Ganti dengan tautan Google Drive atau GitHub yang
							benar — mentor memakai tautan ini untuk memeriksa tugasmu.
						</p>
						{#if galatTautan[m.id]}
							<p class="pesan pesan-galat" style="margin: 0">{galatTautan[m.id]}</p>
						{/if}
					</div>
					<button class="btn btn-garis" type="submit"
						><Ikon nama="save" ukuran={15} /> Simpan tautan baru</button
					>
				</form>
			{:else}
				<form method="POST" action="?/klaim" onsubmit={(kejadian) => periksaTautan(kejadian, m.id)}>
					<input type="hidden" name="misi_id" value={m.id} />
					<div class="bidang" style="margin: 0.7rem 0 0.9rem">
						<label for="tautan-{m.id}">Tautan tugas (wajib)</label>
						<input
							id="tautan-{m.id}"
							type="url"
							name="link_bukti"
							placeholder="https://github.com/nama/repo"
							autocapitalize="off"
							spellcheck="false"
							required
							disabled={!data.terbuka}
						/>
						<p class="petunjuk">
							Hanya tautan Google Drive (drive.google.com / docs.google.com) atau GitHub
							(github.com). Mentor membuka tautan ini sebelum menandai misimu selesai.
						</p>
						{#if galatTautan[m.id]}
							<p class="pesan pesan-galat" style="margin: 0">{galatTautan[m.id]}</p>
						{/if}
					</div>
					<button class="btn" type="submit" disabled={!data.terbuka}
						><Ikon nama="check" ukuran={16} /> Minta verifikasi</button
					>
				</form>
			{/if}
		</article>
	{/each}
</section>

<section class="kartu">
	<h2><Ikon nama="lightbulb" ukuran={18} /> Kartu hint</h2>
	<p class="petunjuk-kecil">
		{hintTerpakai} dari {data.hints.length} kartu terpakai untuk level ini. Memakai hint tidak
		mengubah poinmu.
	</p>

	{#each data.hints as h (h.id)}
		{#if h.dipakai}
			<details class="hint" open>
				<summary>Kartu {h.urutan} (terbuka)</summary>
				<p>{h.isi}</p>
			</details>
		{:else}
			<form method="POST" action="?/hint">
				<input type="hidden" name="hint_id" value={h.id} />
				<button class="btn btn-garis btn-penuh hint-belum" type="submit"
					><Ikon nama="lightbulb" ukuran={15} /> Buka kartu hint {h.urutan}</button
				>
			</form>
		{/if}
	{/each}
</section>
