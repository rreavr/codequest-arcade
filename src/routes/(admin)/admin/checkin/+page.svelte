<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const hadir = $derived(data.peserta.filter((p) => p.checkin_pada).length);
</script>

<h1>Check-in</h1>
<p class="petunjuk-kecil">
	{hadir} dari {data.peserta.length} peserta tercatat hadir. Cari memakai NIM, atau tekan
	Check-in langsung di baris tabel peserta.
</p>

{#if form?.pesan}
	<p class="pesan {form.status === 'baru' ? 'pesan-sukses' : 'pesan-info'}">{form.pesan}</p>
{/if}

<section class="kartu">
	<h2>Pencarian NIM</h2>
	<form method="POST" action="?/checkin" class="deret">
		<input
			type="text"
			name="nim"
			inputmode="numeric"
			placeholder="NIM peserta"
			aria-label="NIM peserta"
			style="flex: 1; min-width: 10rem"
			required
		/>
		<button class="btn" type="submit"><Ikon nama="checkbox-on" ukuran={16} /> Check-in</button>
	</form>
</section>

<section class="kartu">
	<h2>Daftar peserta</h2>
	<div class="tabel-gulir">
		<table>
			<thead>
				<tr>
					<th>Nama</th>
					<th>NIM</th>
					<th>Kelompok</th>
					<th>Status</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.peserta as p (p.id)}
					<tr>
						<td>{p.nama}</td>
						<td class="angka">{p.nim}</td>
						<td>{data.kelompok.find((k) => k.id === p.kelompok_id)?.nama ?? '—'}</td>
						<td>
							{#if p.checkin_pada}
								<span class="chip chip-selesai">
									<Ikon nama="check" ukuran={13} />{new Date(p.checkin_pada).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
								</span>
							{:else}
								<span class="chip chip-belum">Belum</span>
							{/if}
						</td>
						<td>
							{#if !p.checkin_pada}
								<form method="POST" action="?/checkin">
									<input type="hidden" name="peserta_id" value={p.id} />
									<button class="btn btn-kecil btn-garis" type="submit">Check-in</button>
								</form>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
