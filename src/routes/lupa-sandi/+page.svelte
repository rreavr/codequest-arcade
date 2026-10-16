<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="lembar">
	<h1>Lupa sandi</h1>
	<p class="petunjuk-kecil">
		Khusus peserta. Verifikasi memakai data saat mendaftar — NIM, nama lengkap, dan nomor
		WhatsApp — lalu tentukan sandi baru.
	</p>

	{#if !data.terkonfigurasi}
		<p class="pesan pesan-kuning">
			Situs belum terhubung ke basis data acara. Coba beberapa saat lagi.
		</p>
	{/if}

	{#if form?.pesan}
		<p class="pesan pesan-galat">{form.pesan}</p>
	{/if}

	<form method="POST" class="kartu">
		<div class="bidang">
			<label for="nim">NIM</label>
			<input
				id="nim"
				name="nim"
				type="text"
				inputmode="numeric"
				autocomplete="username"
				required
				maxlength="20"
				value={form?.nilai?.nim ?? ''}
			/>
		</div>

		<div class="bidang">
			<label for="nama">Nama lengkap saat daftar</label>
			<input
				id="nama"
				name="nama"
				type="text"
				autocomplete="name"
				required
				maxlength="80"
				value={form?.nilai?.nama ?? ''}
			/>
		</div>

		<div class="bidang">
			<label for="whatsapp">Nomor WhatsApp saat daftar</label>
			<input
				id="whatsapp"
				name="whatsapp"
				type="tel"
				autocomplete="tel"
				required
				maxlength="20"
				placeholder="08xx-xxxx-xxxx"
				value={form?.nilai?.whatsapp ?? ''}
			/>
			<span class="petunjuk">Boleh format 08…, +62…, atau 62….</span>
		</div>

		<div class="bidang">
			<label for="sandi">Sandi baru</label>
			<input
				id="sandi"
				name="sandi"
				type="password"
				autocomplete="new-password"
				required
				minlength="8"
			/>
			<span class="petunjuk">Minimal 8 karakter.</span>
		</div>

		<div class="bidang">
			<label for="sandi2">Ulangi sandi baru</label>
			<input
				id="sandi2"
				name="sandi2"
				type="password"
				autocomplete="new-password"
				required
				minlength="8"
			/>
		</div>

		<button class="btn btn-penuh" type="submit" disabled={!data.terkonfigurasi}>
			<Ikon nama="key" ukuran={16} /> Ganti sandi dan masuk
		</button>
	</form>

	<p class="petunjuk-kecil">
		Ingat sandimu? <a href="/masuk">Kembali ke halaman masuk</a>. Masih terkendala? Hubungi
		panitia di meja registrasi.
	</p>
</div>
