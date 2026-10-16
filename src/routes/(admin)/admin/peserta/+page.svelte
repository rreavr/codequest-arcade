<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { page } from '$app/state';
	import { LABEL_TIER } from '#lib/constants/acara.js';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let cari = $state('');
	const tersaring = $derived(
		data.baris.filter(
			(b) =>
				cari.trim() === '' ||
				b.nama.toLowerCase().includes(cari.toLowerCase()) ||
				b.nim.includes(cari.trim())
		)
	);
</script>

<h1>Peserta</h1>
<p class="petunjuk-kecil">
	{data.baris.length} dari kuota {data.kuota}. Skor individu di halaman ini hanya untuk panitia
	inti. Tombol Reset membuat sandi sementara acak — catat dari pesan di atas lalu berikan ke
	peserta (peserta bisa menggantinya sendiri lewat halaman Lupa sandi).
</p>

{#if form?.pesan}
	<p class="pesan" class:pesan-sukses={page.status < 400} class:pesan-galat={page.status >= 400}>
		{form.pesan}
	</p>
{/if}

<div class="bidang">
	<label for="cari" class="sr-saja">Cari peserta</label>
	<input id="cari" type="search" placeholder="Cari nama atau NIM..." bind:value={cari} />
</div>

<div class="tabel-gulir">
	<table>
		<thead>
			<tr>
				<th>Nama</th>
				<th>NIM</th>
				<th>Hadir</th>
				<th>Laptop</th>
				<th>Kelompok</th>
				<th>Poin</th>
				<th>Misi</th>
				<th>Tier</th>
				<th>Sandi</th>
			</tr>
		</thead>
		<tbody>
			{#each tersaring as b (b.id)}
				<tr>
					<td>{b.nama}</td>
					<td class="angka">{b.nim}</td>
					<td>{#if b.checkin}<Ikon nama="check" ukuran={15} />{:else}—{/if}</td>
					<td>{#if b.bawaLaptop}<Ikon nama="laptop" ukuran={15} />{:else}—{/if}</td>
					<td>
						<form method="POST" action="?/kelompok" class="deret" style="gap: 0.35rem">
							<input type="hidden" name="peserta_id" value={b.id} />
							<select name="kelompok_id" aria-label="Kelompok untuk {b.nama}" style="min-width: 7rem">
								<option value="">— belum —</option>
								{#each data.kelompok as k (k.id)}
									<option value={k.id} selected={k.id === b.kelompokId}>{k.nama}</option>
								{/each}
							</select>
							<button class="btn btn-kecil btn-garis" type="submit"
								><Ikon nama="save" ukuran={14} /> Simpan</button
							>
						</form>
					</td>
					<td class="angka"><strong>{b.poin}</strong></td>
					<td class="angka">{b.misiSelesai}/9</td>
					<td class="tier-{b.tier}">{LABEL_TIER[b.tier]}</td>
					<td>
						<form
							method="POST"
							action="?/reset"
							onsubmit={(kejadian) => {
								if (!confirm(`Reset sandi ${b.nama}? Sandi baru akan tampil di pesan atas.`)) {
									kejadian.preventDefault();
								}
							}}
						>
							<input type="hidden" name="peserta_id" value={b.id} />
							<button class="btn btn-kecil btn-garis" type="submit"
								><Ikon nama="reload" ukuran={14} /> Reset</button
							>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
{#if tersaring.length === 0}
	<p class="pesan pesan-kuning">Tidak ada peserta yang cocok.</p>
{/if}
