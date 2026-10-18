<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { LABEL_TIER } from '#lib/constants/acara.js';
	import { MAX_TOTAL_POINTS } from '#lib/constants/points.js';
	import Bar from '#lib/ui/Bar.svelte';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const b = $derived(data.baris);
	const cek = $derived({
		hadir: b.bahan.hadir,
		pretest: b.bahan.pretestSelesai,
		posttest: b.skorPosttest !== null,
		survei: b.lebihSiap !== null
	});
</script>

{#snippet centang(nilai: number | null)}
	<Ikon nama="check" ukuran={13} />{#if nilai !== null}{nilai}{/if}
{/snippet}

<h1>Halo, {b.peserta.nama.split(' ')[0]}!</h1>
<div class="deret" style="gap: 1rem; align-items: center; margin-bottom: 1rem;">
	<span class="petunjuk-kecil" style="margin: 0">Kelompok</span>
	<span class="kotak-info">{b.namaKelompok ?? 'Belum ada'}</span>
	<span class="petunjuk-kecil" style="margin: 0">·</span>
	<span class="petunjuk-kecil" style="margin: 0">mentor</span>
	<span class="kotak-info">{b.namaMentor ?? 'Belum ditentukan'}</span>
</div>

{#if form?.pesan}
	<p class="pesan pesan-sukses">{form.pesan}</p>
{/if}

<section class="kartu">
	<div class="deret deret-antara" style="align-items: flex-end">
		<div>
			<p class="petunjuk-kecil" style="margin: 0">Total poin</p>
			<p class="poin-besar">{b.poin}<span style="font-size: 1rem; color: var(--teks-lembut)"> / {MAX_TOTAL_POINTS}</span></p>
		</div>
		<span class="chip tier-{b.tier}" style="border: 1.5px solid currentColor">
			{LABEL_TIER[b.tier]}
		</span>
	</div>

	{#if data.targetBerikut}
		<p class="petunjuk-kecil" style="margin-top: 0.75rem">
			{data.targetBerikut.poin - b.poin} poin lagi menuju tier {data.targetBerikut.label}.
		</p>
		<Bar bagian={b.poin} total={data.targetBerikut.poin} />
	{:else}
		<p class="petunjuk-kecil" style="margin-top: 0.75rem">Tier tertinggi tercapai. Luar biasa!</p>
	{/if}

	{#if b.badges.length > 0}
		<div class="deret" style="margin-top: 0.75rem">
			{#each b.badges as badge (badge)}
				<span class="chip chip-info"><Ikon nama="star" ukuran={13} />{badge}</span>
			{/each}
		</div>
	{/if}
</section>

{#if !cek.hadir}
	<section class="kartu">
		<h2>Check-in Base Camp</h2>
		<p>
			Datangi meja panitia dan sebutkan NIM <strong>{b.peserta.nim}</strong> untuk dicatat
			hadir — tidak perlu memindai apa pun.
		</p>
		<p class="petunjuk-kecil">Status di halaman ini berubah begitu panitia mencatatmu.</p>
	</section>
{:else}
	<section class="kartu kartu-sempit">
		<div class="deret">
			<span class="chip chip-selesai"><Ikon nama="check" ukuran={13} />Sudah check-in</span>
			<span class="petunjuk-kecil"
				>pukul {new Date(b.peserta.checkin_pada!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span
			>
		</div>
	</section>
{/if}

<section class="kartu">
	<h2>Base Camp</h2>
	<ul class="senarai">
		<li class="deret deret-antara">
			<span>Check-in</span>
			<span class="chip {cek.hadir ? 'chip-selesai' : 'chip-belum'}"
				>{#if cek.hadir}{@render centang(null)}{:else}Belum{/if}</span
			>
		</li>
		<li class="deret deret-antara">
			<a href="/tes/pre">Pre-test (10 soal)</a>
			<span class="chip {cek.pretest ? 'chip-selesai' : 'chip-belum'}"
				>{#if cek.pretest}{@render centang(b.skorPretest)}{:else}Belum{/if}</span
			>
		</li>
		<li class="deret deret-antara">
			<span>Laptop siap ({b.peserta.bawa_laptop ? 'membawa laptop' : 'tanpa laptop'})</span>
			<span class="chip chip-belum">Cek bersama mentor</span>
		</li>
	</ul>
</section>

{#if data.berikutnya}
	<section class="kartu">
		<h2><Ikon nama="target" ukuran={18} /> Misi berikutnya</h2>
		<p>
			<strong>Level {data.berikutnya.level} · {data.berikutnya.judul}</strong>
		</p>
		<a class="btn" href="/level/{data.berikutnya.level}"
			><Ikon nama="arrow-right" ukuran={16} /> Buka misi ini</a
		>
	</section>
{/if}

<section>
	<h2>Level dan misi</h2>
	<div class="kisi">
		{#each data.misiPerLevel as daftar, i (i)}
			{@const selesai = b.bahan.misiSelesai[i]}
			{@const label = i === 0 ? 'Logic Unplugged' : i === 1 ? 'IDE & File Studio' : 'First Run + Error Hunt'}
			<a class="kartu" href="/level/{i + 1}" style="text-decoration: none; color: inherit">
				<div class="deret deret-antara">
					<strong>Level {i + 1} · {label}</strong>
					{#if !data.terbuka[i]}
						<span class="chip chip-belum"><Ikon nama="lock" ukuran={13} />Terkunci</span>
					{:else if selesai >= data.jumlahMisiPerLevel}
						<span class="chip chip-selesai">{@render centang(null)}Selesai</span>
					{:else}
						<span class="chip chip-menunggu">{selesai}/{data.jumlahMisiPerLevel} misi</span>
					{/if}
				</div>
				<div style="margin-top: 0.6rem">
					<Bar bagian={selesai} total={data.jumlahMisiPerLevel} />
				</div>
			</a>
		{/each}
	</div>
</section>

<section class="kartu">
	<h2>Sesi siang dan penutup</h2>
	<ul class="senarai">
		<li class="deret deret-antara">
			<a href="/trivia">Trivia 13.00 (5 soal, 3 poin)</a>
			<span class="chip {b.bahan.triviaTotal > 0 ? 'chip-selesai' : 'chip-belum'}"
				>{#if b.bahan.triviaTotal > 0}{@render centang(null)}{:else}Belum{/if}</span
			>
		</li>
		<li class="deret deret-antara">
			<a href="/tes/post">Post-test (10 soal)</a>
			<span class="chip {cek.posttest ? 'chip-selesai' : 'chip-belum'}"
				>{#if cek.posttest}{@render centang(b.skorPosttest)}{:else}Belum{/if}</span
			>
		</li>
		<li class="deret deret-antara">
			<a href="/survei">Survei pasca-acara</a>
			<span class="chip {cek.survei ? 'chip-selesai' : 'chip-belum'}"
				>{#if cek.survei}{@render centang(null)}{:else}Belum{/if}</span
			>
		</li>
		<li class="deret deret-antara">
			<a href="/vault">Academic Vault</a>
			<span class="chip {cek.hadir ? 'chip-info' : 'chip-belum'}"
				>{#if cek.hadir}<Ikon nama="box" ukuran={13} />Terbuka{:else}Perlu check-in{/if}</span
			>
		</li>
	</ul>
</section>

{#if b.tier === 'champion'}
	<section class="kartu">
		<h2><Ikon nama="crown" ukuran={18} /> Papan Kehormatan</h2>
		<p class="petunjuk-kecil">
			Sebagai Champion, kamu bisa memilih tampil di <a href="/papan-kehormatan">Papan Kehormatan</a>.
			Persetujuanmu bisa diubah kapan saja.
		</p>
		<form method="POST" action="?/papan" class="deret">
			<button class="btn btn-kecil" name="optin" value="ya" type="submit" disabled={b.peserta.papan_optin}>
				Tampilkan namaku
			</button>
			<button class="btn btn-garis btn-kecil" name="optin" value="tidak" type="submit" disabled={!b.peserta.papan_optin}>
				Sembunyikan namaku
			</button>
			<span class="chip {b.peserta.papan_optin ? 'chip-selesai' : 'chip-belum'}">
				{b.peserta.papan_optin ? 'Sedang tampil' : 'Sedang disembunyikan'}
			</span>
		</form>
	</section>
{/if}

<p class="petunjuk-kecil">
	Poinmu hanya terlihat olehmu dan mentormu. Yang tampil ke umum hanya <a href="/skor">skor kelompok</a>.
</p>
<p class="petunjuk-kecil">
	Mau belajar santai? Buka <a href="/belajar">halaman Belajar</a> — modul singkat dan minigame SQL, gratis tanpa poin.
</p>
