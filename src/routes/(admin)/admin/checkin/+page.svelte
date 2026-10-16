<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import Ikon from '#lib/ui/Ikon.svelte';
	import jsQR from 'jsqr';

	import { invalidateAll } from '$app/navigation';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const hadir = $derived(data.peserta.filter((p) => p.checkin_pada).length);

	// --- Filter status ---
	let filterStatus = $state<'semua' | 'belum' | 'hadir'>('semua');
	const tampil = $derived(
		data.peserta.filter((p) => {
			if (filterStatus === 'hadir') return p.checkin_pada !== null;
			if (filterStatus === 'belum') return p.checkin_pada === null;
			return true;
		})
	);

	// --- Auto-refresh tiap 10 detik ---
	$effect(() => {
		const interval = setInterval(() => invalidateAll(), 10000);
		return () => clearInterval(interval);
	});

	// --- QR scanner state ---
	let scanning = $state(false);
	let videoEl = $state<HTMLVideoElement | null>(null);
	let canvasEl: HTMLCanvasElement | null = null;
	let stream: MediaStream | null = null;
	let detectorLoop: ReturnType<typeof requestAnimationFrame> | null = null;
	let scanError = $state('');
	let scanPending = $state('');

	// Konfirmasi sebelum submit
	let konfirmasi = $state<{ id: string; nama: string; nim: string } | null>(null);

	let hiddenForm = $state<HTMLFormElement | null>(null);
	let hiddenPesertaId = $state('');

	async function mulaiScan() {
		scanError = '';
		scanPending = '';
		scanning = true;
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
		} catch (err) {
			const e = err as DOMException;
			if (e?.name === 'NotAllowedError') {
				scanError = 'Izin kamera ditolak. Periksa pengaturan izin browser.';
			} else if (e?.name === 'NotFoundError') {
				scanError = 'Kamera tidak ditemukan di perangkat ini.';
			} else if (!window.isSecureContext) {
				scanError = 'Kamera hanya bisa diakses lewat HTTPS atau localhost. Buka lewat HTTPS.';
			} else {
				scanError = `Kamera tidak bisa dibuka: ${e?.message ?? String(err)}`;
			}
			scanning = false;
			return;
		}
		await new Promise<void>((r) => setTimeout(r, 50));
		if (!videoEl) { stopScan(); return; }
		videoEl.srcObject = stream;
		await videoEl.play();

		canvasEl = document.createElement('canvas');
		const ctx = canvasEl.getContext('2d')!;

		const loop = () => {
			if (!scanning || !videoEl || videoEl.readyState < videoEl.HAVE_ENOUGH_DATA) {
				detectorLoop = requestAnimationFrame(loop);
				return;
			}
			canvasEl!.width = videoEl.videoWidth;
			canvasEl!.height = videoEl.videoHeight;
			ctx.drawImage(videoEl, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvasEl!.width, canvasEl!.height);
			const code = jsQR(imageData.data, imageData.width, imageData.height);
			if (code) {
				const raw = code.data;
				const peserta = data.peserta.find((p) => p.id === raw);
				if (peserta) {
						stopScan();
						konfirmasi = { id: raw, nama: peserta.nama, nim: peserta.nim };
						return;
					}
			}
			detectorLoop = requestAnimationFrame(loop);
		};
		detectorLoop = requestAnimationFrame(loop);
	}

	function stopScan() {
		scanning = false;
		if (detectorLoop !== null) { cancelAnimationFrame(detectorLoop); detectorLoop = null; }
		if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
		if (videoEl) videoEl.srcObject = null;
		canvasEl = null;
	}

	function konfirmasiCheckin() {
		if (!konfirmasi) return;
		hiddenPesertaId = konfirmasi.id;
		konfirmasi = null;
		setTimeout(() => hiddenForm?.requestSubmit(), 0);
	}

	function batalKonfirmasi() {
		konfirmasi = null;
	}
</script>

<h1>Check-in</h1>
<p class="petunjuk-kecil">
	{hadir} dari {data.peserta.length} peserta tercatat hadir. Scan QR peserta, cari memakai NIM,
	atau tekan Check-in di baris tabel.
</p>

{#if form?.pesan}
	<p class="pesan {form.status === 'baru' ? 'pesan-sukses' : 'pesan-info'}">{form.pesan}</p>
{/if}

<form bind:this={hiddenForm} method="POST" action="?/checkin" style="display: none">
	<input type="hidden" name="peserta_id" bind:value={hiddenPesertaId} />
</form>

<section class="kartu">
	<h2><Ikon nama="camera" ukuran={18} /> Scan QR</h2>
	{#if konfirmasi}
		<p>Konfirmasi check-in:</p>
		<p><strong>{konfirmasi.nama}</strong> · <span class="angka">{konfirmasi.nim}</span></p>
		<div class="deret" style="margin-top: 0.75rem; gap: 0.5rem">
			<button class="btn" onclick={konfirmasiCheckin}>
				<Ikon nama="checkbox-on" ukuran={16} /> Ya, check-in
			</button>
			<button class="btn btn-garis" onclick={batalKonfirmasi}>Batal, scan ulang</button>
		</div>
	{:else if !scanning}
		<button class="btn" onclick={mulaiScan}>
			<Ikon nama="camera" ukuran={16} /> Buka kamera
		</button>
		{#if scanError}
			<p class="pesan pesan-gagal" style="margin-top: 0.5rem">{scanError}</p>
		{/if}
		{#if scanPending}
			<p class="petunjuk-kecil" style="margin-top: 0.5rem">Memproses check-in {scanPending}…</p>
		{/if}
	{:else}
		<div style="position: relative; max-width: 400px; margin: 0 auto">
			<video
				bind:this={videoEl}
				style="width: 100%; border-radius: 4px; background: #000"
				muted
				playsinline
				aria-label="Kamera pemindai QR"
			></video>
			<p class="petunjuk-kecil" style="text-align: center; margin: 0.5rem 0 0">
				Arahkan kamera ke QR code peserta
			</p>
		</div>
		<button class="btn btn-garis" style="margin-top: 0.75rem" onclick={stopScan}>
			Tutup kamera
		</button>
	{/if}
</section>

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
	<div class="deret" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem">
		<h2 style="margin: 0">Daftar peserta</h2>
		<div class="deret" style="gap: 0.35rem">
			<button class="btn btn-kecil {filterStatus === 'semua' ? '' : 'btn-lembut'}" onclick={() => (filterStatus = 'semua')}>Semua ({data.peserta.length})</button>
			<button class="btn btn-kecil {filterStatus === 'hadir' ? '' : 'btn-lembut'}" onclick={() => (filterStatus = 'hadir')}><Ikon nama="check" ukuran={13} /> Hadir ({hadir})</button>
			<button class="btn btn-kecil {filterStatus === 'belum' ? '' : 'btn-lembut'}" onclick={() => (filterStatus = 'belum')}>Belum ({data.peserta.length - hadir})</button>
		</div>
	</div>
	<div class="tabel-gulir" style="margin-top: 0.75rem">
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
				{#each tampil as p (p.id)}
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
									<form method="POST" action="?/checkin" style="display: contents">
										<input type="hidden" name="peserta_id" value={p.id} />
										<button class="btn btn-kecil btn-garis" type="submit" style="min-width: 6rem">Check-in</button>
									</form>
								{:else}
									<form method="POST" action="?/batal" style="display: contents">
										<input type="hidden" name="peserta_id" value={p.id} />
										<button class="btn btn-kecil btn-bahaya" type="submit" style="min-width: 6rem">Batal</button>
									</form>
								{/if}
							</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
