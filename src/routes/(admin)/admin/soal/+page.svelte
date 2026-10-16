<script lang="ts">
	import { untrack } from 'svelte';
	import type { ActionData, PageData } from './$types';
	import { LABEL_JENIS_TES } from '#lib/constants/acara.js';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const HURUF = ['A', 'B', 'C', 'D'];
	// Nilai awal saja: form diisi dari soal yang sedang diedit, lalu dikelola lokal.
	const edit = untrack(() => data.edit);

	let jenis = $state(edit?.jenis ?? 'pre');
	let urutan = $state(edit?.urutan ?? 1);
	let pertanyaan = $state(edit?.pertanyaan ?? '');
	let pilihan = $state<string[]>(edit ? [...edit.pilihan] : ['', '', '', '']);
	let jawaban = $state(edit?.jawaban ?? 0);

	const jumlahDiJenis = $derived(data.perJenis[jenis as keyof typeof data.perJenis].length);

	function siapkanTambah() {
		urutan = jumlahDiJenis + 1;
		pertanyaan = '';
		pilihan = ['', '', '', ''];
		jawaban = 0;
	}
</script>

<h1>Bank soal</h1>
<p class="petunjuk-kecil">
	Pre-test dan post-test masing-masing 10 soal, trivia 5 soal. Peserta tidak pernah menerima kunci
	jawaban; penilaian terjadi di server.
</p>

{#if form?.pesan}
	<p class="pesan pesan-sukses">{form.pesan}</p>
{/if}

<section class="kartu">
	<h2>{edit ? `Edit soal ${LABEL_JENIS_TES[edit.jenis]} nomor ${edit.urutan}` : 'Tambah / perbarui soal'}</h2>

	<form method="POST" action="?/simpan">
		{#if edit}
			<input type="hidden" name="id" value={edit.id} />
			<p class="petunjuk-kecil">
				Sedang mengedit soal lama. <a href="/admin/soal">Batal dan tambah soal baru</a>.
			</p>
		{/if}

		<div class="deret" style="align-items: flex-end">
			<div class="bidang" style="flex: 1; min-width: 9rem">
				<label for="jenis">Jenis</label>
				<select id="jenis" name="jenis" bind:value={jenis}>
					<option value="pre">{LABEL_JENIS_TES.pre}</option>
					<option value="post">{LABEL_JENIS_TES.post}</option>
					<option value="trivia">Trivia</option>
				</select>
			</div>
			<div class="bidang" style="width: 6rem">
				<label for="urutan">Nomor</label>
				<input id="urutan" name="urutan" type="number" min="1" max="99" bind:value={urutan} required />
			</div>
			<button class="btn btn-lembut btn-kecil" type="button" onclick={siapkanTambah}>
				Nomor otomatis
			</button>
		</div>

		<div class="bidang">
			<label for="pertanyaan">Pertanyaan</label>
			<textarea id="pertanyaan" name="pertanyaan" required bind:value={pertanyaan}></textarea>
		</div>

		{#each pilihan as _, i (i)}
			<div class="deret" style="align-items: center; margin-bottom: 0.5rem">
				<span style="width: 1.4rem; font-weight: 700">{HURUF[i]}.</span>
				<input
					type="text"
					name="pilihan-{i}"
					required
					bind:value={pilihan[i]}
					style="flex: 1; min-width: 10rem"
					aria-label="Pilihan {HURUF[i]}"
				/>
				<label class="petunjuk-kecil deret" style="gap: 0.3rem">
					<input type="radio" name="jawaban" value={i} checked={jawaban === i} onchange={() => (jawaban = i)} />
					kunci
				</label>
			</div>
		{/each}

		<button class="btn" type="submit"><Ikon nama="save" ukuran={15} /> {edit ? 'Simpan perubahan' : 'Tambah soal'}</button>
	</form>
</section>

{#each [{ kunci: 'pre', label: LABEL_JENIS_TES.pre }, { kunci: 'post', label: LABEL_JENIS_TES.post }, { kunci: 'trivia', label: LABEL_JENIS_TES.trivia }] as grup (grup.kunci)}
	<section class="kartu">
		<h2>{grup.label} ({data.perJenis[grup.kunci as keyof typeof data.perJenis].length} soal)</h2>
		<div class="tabel-gulir">
			<table>
				<thead>
					<tr>
						<th>No</th>
						<th>Pertanyaan</th>
						<th>Kunci</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.perJenis[grup.kunci as keyof typeof data.perJenis] as s (s.id)}
						<tr>
							<td class="angka">{s.urutan}</td>
							<td style="max-width: 22rem; overflow: hidden; text-overflow: ellipsis">{s.pertanyaan}</td>
							<td>{s.jawaban === null ? '—' : HURUF[s.jawaban]}</td>
							<td>
								<div class="deret" style="gap: 0.35rem; flex-wrap: nowrap">
									<a class="btn btn-kecil btn-lembut" href="?edit={s.id}">Edit</a>
									<form method="POST" action="?/hapus">
										<input type="hidden" name="soal_id" value={s.id} />
										<button class="btn btn-kecil btn-bahaya" type="submit">Hapus</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/each}
