<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { AKUN_DEMO } from '#lib/constants/acara.js';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="lembar">
	<h1>Masuk</h1>
	<p class="petunjuk-kecil">Peserta memakai NIM. Mentor dan panitia memakai email.</p>

	{#if data.pesan === 'akun-dibuat'}
		<p class="pesan pesan-sukses">
			<Ikon nama="check" ukuran={14} /> Akun berhasil dibuat.{#if data.kelompok} Kamu tergabung di <strong>{data.kelompok}</strong>.{/if}
			Silakan masuk dengan NIM dan sandimu.
		</p>
	{/if}

	{#if data.pesan === 'sandi-dibaru'}
		<p class="pesan pesan-sukses"><Ikon nama="check" ukuran={14} /> Sandi berhasil diganti. Silakan masuk dengan sandi barumu.</p>
	{/if}

	{#if !data.terkonfigurasi}
		<p class="pesan pesan-kuning">
			Situs belum terhubung ke basis data acara. Coba beberapa saat lagi.
		</p>
	{/if}

	{#if AKUN_DEMO}
		<p class="pesan pesan-info">
			<strong>Akun demo.</strong> Coba dulu lewat akun contoh: NIM <strong>{AKUN_DEMO.nim}</strong>,
			sandi <strong>{AKUN_DEMO.sandi}</strong>. Progresnya sengaja terisi sebagai contoh — dari poin
			sampai sertifikat.
		</p>
	{/if}

	{#if form?.pesan}
		<p class="pesan pesan-galat">{form.pesan}</p>
	{/if}

	<form method="POST" class="kartu">
		<input type="hidden" name="lanjut" value={data.lanjut ?? ''} />

		<div class="bidang">
			<label for="identitas">NIM atau email</label>
			<input
				id="identitas"
				name="identitas"
				type="text"
				autocomplete="username"
				required
				value={form?.identitas ?? ''}
			/>
		</div>

		<div class="bidang">
			<label for="sandi">Sandi</label>
			<input id="sandi" name="sandi" type="password" autocomplete="current-password" required />
		</div>

		<button class="btn btn-penuh" type="submit" disabled={!data.terkonfigurasi}
			><Ikon nama="login" ukuran={16} /> Masuk</button
		>
	</form>

	<p class="petunjuk-kecil">
		Belum mendaftar? <a href="/daftar">Daftar di sini</a>. Lupa sandi?{' '}
		<a href="/lupa-sandi">Reset sandi peserta</a>.
	</p>
</div>
