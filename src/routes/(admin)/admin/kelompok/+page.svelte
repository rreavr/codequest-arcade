<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<h1>Kelompok dan mentor</h1>
<p class="petunjuk-kecil">
	Target 4 peserta per kelompok. Peserta yang mendaftar langsung mendapat kelompok otomatis
	(urut pendaftaran — siapa cepat dia dapat); sesuaikan manual hanya bila perlu. Peserta tanpa
	kelompok: {data.belumDapat.length}.
</p>

{#if form?.pesan}
	<p class="pesan pesan-sukses">{form.pesan}</p>
{/if}

<section class="kartu">
	<h2>Buat kelompok</h2>
	<form method="POST" action="?/buat" class="deret">
		<input type="text" name="nama" placeholder="Nama kelompok (mis. Kelompok 1 — Garuda)" required style="flex: 1; min-width: 12rem" />
		<button class="btn" type="submit">Buat</button>
	</form>
	<form method="POST" action="?/otomatis" style="margin-top: 0.7rem">
		<button class="btn btn-garis" type="submit">Bagi rata peserta tanpa kelompok</button>
	</form>
</section>

<section class="kartu">
	<h2><Ikon nama="users" ukuran={18} /> Akun mentor</h2>
	<p class="petunjuk-kecil">
		Mentor masuk memakai email dan sandi, bukan NIM. Sudah ada {data.mentor.length} mentor.
	</p>
	<form method="POST" action="?/buat-mentor">
		<div class="bidang">
			<label for="m-nama">Nama mentor</label>
			<input id="m-nama" name="nama" type="text" required />
		</div>
		<div class="bidang">
			<label for="m-email">Email</label>
			<input id="m-email" name="email" type="email" required />
		</div>
		<div class="bidang">
			<label for="m-sandi">Sandi awal</label>
			<input id="m-sandi" name="sandi" type="text" minlength="8" required />
			<span class="petunjuk">Minimal 8 karakter; bagikan ke mentor lewat jalur pribadi.</span>
		</div>
		<button class="btn" type="submit"><Ikon nama="user" ukuran={15} /> Buat akun mentor</button>
	</form>
</section>

{#each data.kelompok as k (k.id)}
	<section class="kartu">
		<div class="deret" style="justify-content: space-between">
			<h2 style="margin: 0">{k.nama}</h2>
			<span class="chip {k.anggota.length === 4 ? 'chip-selesai' : 'chip-menunggu'}">
				<Ikon nama="users" ukuran={13} />{k.anggota.length}/4 peserta
			</span>
		</div>

		<ul class="senarai">
			{#each k.anggota as a (a.id)}
				<li>{a.nama}</li>
			{:else}
				<li class="petunjuk-kecil">Belum ada anggota.</li>
			{/each}
		</ul>

		<div class="deret" style="margin-top: 0.6rem">
			<form method="POST" action="?/mentor" class="deret" style="gap: 0.35rem">
				<input type="hidden" name="kelompok_id" value={k.id} />
				<select name="mentor_id" aria-label="Mentor untuk {k.nama}">
					<option value="">— tanpa mentor —</option>
					{#each data.mentor as m (m.id)}
						<option value={m.id} selected={m.id === k.mentor_id}>{m.nama}</option>
					{/each}
				</select>
				<button class="btn btn-kecil btn-garis" type="submit">Atur mentor</button>
			</form>

			{#if k.anggota.length === 0}
				<form method="POST" action="?/hapus">
					<input type="hidden" name="kelompok_id" value={k.id} />
					<button class="btn btn-kecil btn-bahaya" type="submit">Hapus kelompok</button>
				</form>
			{/if}
		</div>
	</section>
{/each}

{#if data.belumDapat.length > 0}
	<section class="kartu">
		<h2><Ikon nama="user" ukuran={18} /> Peserta tanpa kelompok ({data.belumDapat.length})</h2>
		<ul class="senarai">
			{#each data.belumDapat as p (p.id)}
				<li>{p.nama} · <span class="angka">{p.nim}</span></li>
			{/each}
		</ul>
		<p class="petunjuk-kecil">
			Atur satu per satu dari halaman <a href="/admin/peserta">Peserta</a>, atau pakai tombol bagi rata.
		</p>
	</section>
{/if}
