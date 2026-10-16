<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<h1>Survei pasca-acara</h1>
<p class="petunjuk-kecil">Tiga pertanyaan singkat, kurang dari satu menit. Jawabanmu dipakai panitia untuk mengevaluasi acara.</p>

{#if form?.pesan}
	<p class="pesan pesan-galat">{form.pesan}</p>
{/if}

{#if data.sudah}
	<section class="kartu tengah">
		<p class="chip chip-selesai"><Ikon nama="check" ukuran={13} /> Survei sudah terisi</p>
		<p style="margin-top: 0.75rem">
			Jawabanmu: <strong>{data.sudah.lebih_siap ? 'Lebih siap menghadapi praktikum' : 'Belum merasa lebih siap'}</strong>
		</p>
		{#if data.sudah.saran}
			<p class="petunjuk-kecil">Saran untuk panitia: “{data.sudah.saran}”</p>
		{/if}
		<p class="petunjuk-kecil">Terima kasih! Jawaban survei hanya dibaca panitia.</p>
		<div class="deret" style="justify-content: center">
			<a class="btn" href="/vault">Buka Academic Vault</a>
			<a class="btn btn-garis" href="/dashboard">Dashboard</a>
		</div>
	</section>
{:else}
	<form method="POST" class="kartu">
		<fieldset class="bidang">
			<legend class="label-grup">Setelah hari ini, apakah kamu lebih siap menghadapi praktikum?</legend>
			<div class="pilihan">
				<label>
					<input type="radio" name="lebih_siap" value="ya" required />
					Ya, aku lebih siap
				</label>
				<label>
					<input type="radio" name="lebih_siap" value="tidak" required />
					Belum, masih butuh banyak latihan
				</label>
			</div>
		</fieldset>

		<div class="bidang">
			<label for="saran">Saran atau masukan untuk panitia (opsional)</label>
			<textarea id="saran" name="saran" maxlength="1000" placeholder="Boleh kosong..."></textarea>
		</div>

		<button class="btn btn-penuh" type="submit"
			><Ikon nama="send" ukuran={16} /> Kirim survei</button
		>
	</form>
{/if}
