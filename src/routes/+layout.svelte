<script lang="ts">
	import { page } from '$app/state';
	import '../app.css';
	import { ACARA } from '#lib/constants/acara.js';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { children, data } = $props();

	const beranda = $derived(
		data.peran === 'admin' ? '/admin' : data.peran === 'mentor' ? '/mentor' : '/dashboard'
	);
	const labelPeran = $derived(data.peran ? data.peran[0].toUpperCase() + data.peran.slice(1) : '');

	// Judul tab peramban per rute; awalan yang lebih spesifik dicek lebih dulu.
	const JUDUL_RUTE: [string, string][] = [
		['/belajar/sql', 'Latihan SQL'],
		['/belajar', 'Belajar'],
		['/masuk', 'Masuk'],
		['/daftar', 'Daftar peserta'],
		['/lupa-sandi', 'Lupa sandi'],
		['/skor', 'Skor kelompok'],
		['/papan-kehormatan', 'Papan Kehormatan'],
		['/dashboard', 'Dashboard'],
		['/level', 'Misi'],
		['/tes/pre', 'Pre-test'],
		['/tes/post', 'Post-test'],
		['/trivia', 'Trivia'],
		['/vault', 'Academic Vault'],
		['/survei', 'Survei'],
		['/mentor/kelompok', 'Verifikasi misi'],
		['/mentor', 'Halaman mentor'],
		['/admin/checkin', 'Check-in'],
		['/admin/peserta', 'Peserta'],
		['/admin/kelompok', 'Kelompok dan mentor'],
		['/admin/soal', 'Bank soal'],
		['/admin/ekspor', 'Ekspor data'],
		['/admin', 'Ringkasan panitia'],
		['/kelola/vault', 'Kelola Academic Vault']
	];
	const judul = $derived.by(() => {
		const jalur = page.url.pathname;
		if (jalur === '/') return `${ACARA.namaPendek} — ${ACARA.nama}`;
		const cocok = JUDUL_RUTE.find(([awal]) => jalur === awal || jalur.startsWith(awal + '/'));
		return cocok ? `${cocok[1]} · ${ACARA.namaPendek}` : `${ACARA.namaPendek} — ${ACARA.nama}`;
	});
</script>

<svelte:head>
	<title>{judul}</title>
</svelte:head>

<a class="lempar" href="#konten">Lewati ke konten</a>

<header class="lini-atas">
	<div class="isi">
		<a class="merek" href={data.peran ? beranda : '/'}>
			<span class="petir"><Ikon nama="zap" ukuran={13} /></span>
			<span class="merek-teks">CodeQuest Arcade</span>
			<span class="kursor" aria-hidden="true"></span>
		</a>
		{#if data.peran}
			<span class="lencana-peran">{labelPeran}</span>
			<form method="POST" action="/keluar">
				<button class="btn btn-garis btn-kecil" type="submit"
					><Ikon nama="logout" ukuran={15} /> Keluar</button
				>
			</form>
		{:else}
			<a class="btn btn-garis btn-kecil" href="/masuk"
				><Ikon nama="login" ukuran={15} /> Masuk</a
			>
		{/if}
	</div>
</header>

<main id="konten">
	{@render children()}
</main>

{#if !data.peran}
	<footer class="lembar petunjuk-kecil tengah">
		<p>
			HIMTI CodeQuest: First Level 2026 ·
			<a href="/belajar">Belajar</a> ·
			<a href="/skor">Skor kelompok</a> ·
			<a href="/papan-kehormatan">Papan Kehormatan</a>
		</p>
		<p>Data pribadi dihapus pada {ACARA.tanggalHapusData} (H+3) sesuai aturan privasi.</p>
	</footer>
{/if}
