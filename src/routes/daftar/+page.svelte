<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import Ikon from '#lib/ui/Ikon.svelte';

	const POLA_NIM = '[0-9]{6,20}';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const nilai = $derived(form?.nilai ?? null);
	const penuh = $derived(data.kuotaSisa !== null && data.kuotaSisa <= 0);
</script>

<div class="lembar">
	<h1>Daftar peserta</h1>
	<p class="petunjuk-kecil">
		HIMTI CodeQuest: First Level 2026 · kuota {data.kuota} peserta.
		{#if data.kuotaSisa !== null}Sisa {data.kuotaSisa} tempat.{/if}
	</p>

	{#if !data.terkonfigurasi}
		<p class="pesan pesan-kuning">
			Situs belum terhubung ke basis data acara. Coba beberapa saat lagi.
		</p>
	{/if}

	{#if form?.pesan}
		<p class="pesan pesan-galat">{form.pesan}</p>
	{/if}

	{#if penuh}
		<p class="pesan pesan-kuning">
			Kuota sudah penuh. Hubungi panitia untuk masuk daftar tunggu.
		</p>
	{:else}
		<form method="POST" class="kartu">
			<div class="bidang">
				<label for="nama">Nama lengkap</label>
				<input id="nama" name="nama" type="text" required maxlength="80" value={nilai?.nama ?? ''} />
			</div>

			<div class="bidang">
				<label for="nim">NIM</label>
				<input
					id="nim"
					name="nim"
					type="text"
					inputmode="numeric"
					autocomplete="username"
					required
					pattern={POLA_NIM}
					value={nilai?.nim ?? ''}
				/>
				<span class="petunjuk">NIM dipakai untuk masuk ke situs bersama sandimu.</span>
			</div>

			<div class="bidang">
				<label for="whatsapp">Nomor WhatsApp</label>
				<input
					id="whatsapp"
					name="whatsapp"
					type="tel"
					autocomplete="tel"
					required
					placeholder="08xx-xxxx-xxxx"
					value={nilai?.whatsapp ?? ''}
				/>
				<span class="petunjuk">Hanya untuk komunikasi acara, tidak ditampilkan ke peserta lain.</span>
			</div>

			<fieldset class="bidang">
				<legend class="label-grup" style="padding: 0; margin-bottom: 0.3rem">
					Pengalaman coding sebelumnya
				</legend>
				<div class="pilihan">
					{#each ['Belum pernah', 'Pernah sedikit', 'Sudah sering'] as pilihan (pilihan)}
						<label>
							<input
								type="radio"
								name="pengalaman"
								value={pilihan}
								required
								checked={nilai?.pengalaman === pilihan}
							/>
							{pilihan}
						</label>
					{/each}
				</div>
			</fieldset>

			<div class="bidang">
				<label for="kendala">Kendala terbesar saat belajar komputer</label>
				<textarea
					id="kendala"
					name="kendala"
					required
					maxlength="500"
					placeholder="Contoh: takut salah, laptop lambat, belum pernah pakai terminal..."
				>{nilai?.kendala ?? ''}</textarea>
			</div>

			<fieldset class="bidang">
				<legend class="label-grup" style="padding: 0; margin-bottom: 0.3rem">
					Membawa laptop?
				</legend>
				<div class="pilihan">
					<label>
						<input
							type="radio"
							name="bawa_laptop"
							value="ya"
							required
							checked={nilai?.bawa_laptop === 'ya'}
						/> Ya, membawa laptop
					</label>
					<label>
						<input
							type="radio"
							name="bawa_laptop"
							value="tidak"
							required
							checked={nilai?.bawa_laptop === 'tidak'}
						/> Belum bisa membawa laptop
					</label>
				</div>
			</fieldset>

			<div class="bidang">
				<label for="sandi">Sandi</label>
				<input
					id="sandi"
					name="sandi"
					type="password"
					autocomplete="new-password"
					required
					minlength="8"
				/>
				<span class="petunjuk">Minimal 8 karakter. Catat baik-baik untuk masuk nanti.</span>
			</div>

			<div class="bidang">
				<label for="sandi2">Ulangi sandi</label>
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
				<Ikon nama="user" ukuran={16} /> Daftar dan mulai
			</button>
		</form>
	{/if}

	<p class="petunjuk-kecil">
		Sudah punya akun? <a href="/masuk">Masuk di sini</a>.
	</p>
</div>
