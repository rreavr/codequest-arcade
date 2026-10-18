<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const sunting = $derived(data.sunting);

	function tanggalRapi(iso: string): string {
		const t = new Date(iso);
		if (Number.isNaN(t.getTime())) return '—';
		return t.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<div class="lembar lembar-lebar">
	<div class="deret deret-antara" style="margin-bottom: 0.75rem">
		<h1 style="margin: 0">Kelola Academic Vault</h1>
		<a class="btn btn-lembut btn-kecil" href={data.beranda}
			><Ikon nama="arrow-left" ukuran={15} /> Beranda</a
		>
	</div>

	<p class="petunjuk-kecil">
		Isi vault berupa tautan berkas (mis. Google Drive) — tampil di halaman Academic Vault peserta
		yang sudah check-in. Mentor dan panitia bisa menambah, mengubah, atau menghapus dari sini;
		tidak ada berkas yang perlu diunggah.
	</p>

	{#if form?.pesan}
		<p class="pesan {form.galat ? 'pesan-galat' : 'pesan-sukses'}">{form.pesan}</p>
	{/if}

	{#if data.galat}
		<p class="pesan pesan-galat">Daftar tautan gagal dimuat: {data.galat}</p>
	{/if}

	<section class="kartu">
		<h2>
			<Ikon nama={sunting ? 'pencil' : 'box'} ukuran={18} />
			{sunting ? 'Ubah tautan berkas' : 'Tambah tautan berkas'}
		</h2>
		<form method="POST" action="?/simpan">
			{#if sunting}
				<input type="hidden" name="id" value={sunting.id} />
				<p class="petunjuk-kecil">
					Sedang mengubah "{sunting.nama}". <a href="?">Batal dan tambah baru</a>.
				</p>
			{/if}
			<div class="bidang">
				<label for="nama">Nama berkas</label>
				<input
					id="nama"
					name="nama"
					type="text"
					required
					minlength="2"
					maxlength="120"
					value={sunting?.nama ?? ''}
					placeholder="Mis. Modul Latihan Python (PDF)"
				/>
			</div>
			<div class="bidang">
				<label for="url">Tautan berkas</label>
				<input
					id="url"
					name="url"
					type="url"
					required
					value={sunting?.url ?? ''}
					placeholder="https://drive.google.com/file/d/..."
				/>
				<p class="petunjuk">
					Rekomendasi Google Drive dengan akses "Siapa saja yang memiliki tautan" supaya bisa
					dibuka semua peserta.
				</p>
			</div>
			<div class="bidang">
				<label for="keterangan">Keterangan singkat (opsional)</label>
				<input
					id="keterangan"
					name="keterangan"
					type="text"
					maxlength="160"
					value={sunting?.keterangan ?? ''}
					placeholder="Mis. Wajib dibaca sebelum sesi 2"
				/>
			</div>
			<button class="btn" type="submit"
				><Ikon nama="save" ukuran={15} /> {sunting
					? 'Simpan perubahan'
					: 'Tambah ke vault'}</button
			>
		</form>
	</section>

	<section class="kartu">
		<h2><Ikon nama="box" ukuran={18} /> Tautan di vault ({data.berkas.length})</h2>
		{#if data.berkas.length === 0}
			<p class="petunjuk-kecil">
				Vault masih kosong. Tambahkan tautan pertamamu — begitu tersimpan, daftar langsung
				muncul di halaman peserta yang sudah check-in.
			</p>
		{:else}
			<div class="tabel-gulir">
				<table>
					<thead>
						<tr>
							<th>Nama berkas</th>
							<th>Keterangan</th>
							<th>Ditambahkan</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.berkas as b (b.id)}
							<tr>
								<td
									style="max-width: 20rem; overflow: hidden; text-overflow: ellipsis"
									title={b.nama}
								>
									<a href={b.url} target="_blank" rel="noopener">{b.nama}</a>
								</td>
								<td
									class="petunjuk-kecil"
									style="max-width: 16rem; overflow: hidden; text-overflow: ellipsis"
									title={b.keterangan ?? ''}
								>
									{b.keterangan ?? '—'}
								</td>
								<td>{tanggalRapi(b.dibuat_pada)}</td>
								<td>
									<div class="deret" style="gap: 0.35rem; flex-wrap: nowrap">
										<a class="btn btn-kecil btn-lembut" href="?edit={b.id}"
											><Ikon nama="pencil" ukuran={13} /> Ubah</a
										>
										<form method="POST" action="?/hapus">
											<input type="hidden" name="id" value={b.id} />
											<button class="btn btn-kecil btn-bahaya" type="submit"
												><Ikon nama="trash" ukuran={13} /> Hapus</button
											>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
