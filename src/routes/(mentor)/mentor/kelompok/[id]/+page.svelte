<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { PageData } from './$types';
	import { LABEL_TIER } from '#lib/constants/acara.js';
	import {
		antrekanVerifikasi,
		daftarAntrean,
		hapusDariAntrean,
		mulaiPemantauKoneksi
	} from '#lib/stores/offlineQueue.js';
	import Ikon from '#lib/ui/Ikon.svelte';

	let { data }: { data: PageData } = $props();

	// Status yang berubah selama sesi ini (sebelum halaman dimuat ulang).
	let selesai = new SvelteSet(untrack(() => data.selesai));
	let antreanLokal = $state<string[]>([]);
	let sibuk = $state<string[]>([]);
	let notifikasi = $state<string | null>(null);
	let bonusTambahan = $state<string[]>([]); // "pesertaId:jenis"
	let bonusDikurangi = $state<string[]>([]); // "pesertaId:jenis" yang dibatalkan

	// Cuplikan klaim awal; tidak berubah selama sesi.
	const klaimAwal = untrack(() => new Map(data.klaim));

	type Status = 'selesai' | 'lokal' | 'menunggu' | 'belum';

	function status(pesertaId: string, misiId: string): Status {
		const key = `${pesertaId}:${misiId}`;
		if (selesai.has(key)) return 'selesai';
		if (antreanLokal.includes(key)) return 'lokal';
		if (klaimAwal.has(key)) return 'menunggu';
		return 'belum';
	}

	function namaPeserta(pesertaId: string): string {
		return data.peserta.find((p) => p.id === pesertaId)?.nama ?? 'peserta ini';
	}

	async function verifikasi(pesertaId: string, misiId: string) {
		const key = `${pesertaId}:${misiId}`;
		const st = status(pesertaId, misiId);
		if (st === 'selesai' || sibuk.includes(key)) return;

		sibuk = [...sibuk, key];
		try {
			const resp = await fetch('/api/verifikasi', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ peserta_id: pesertaId, misi_id: misiId })
			});
			const hasil = (await resp.json().catch(() => ({ sukses: false }))) as {
				sukses: boolean;
				pesan?: string;
			};
			if (hasil.sukses) {
				selesai.add(key);
				antreanLokal = antreanLokal.filter((k) => k !== key);
			} else {
				notifikasi = hasil.pesan ?? 'Gagal menyimpan. Coba lagi.';
			}
		} catch {
			// Wi-Fi putus: simpan di perangkat, kirim otomatis saat online.
			await antrekanVerifikasi(pesertaId, misiId);
			antreanLokal = [...antreanLokal, key];
			notifikasi = 'Koneksi putus — tanda disimpan di perangkat dan akan terkirim otomatis.';
		} finally {
			sibuk = sibuk.filter((k) => k !== key);
		}
	}

	async function batalkan(pesertaId: string, misiId: string) {
		const key = `${pesertaId}:${misiId}`;
		if (sibuk.includes(key)) return;
		const judul = data.misiPerLevel.flat().find((m) => m.id === misiId)?.judul ?? 'misi ini';
		if (!window.confirm(`Batalkan "${judul}" untuk ${namaPeserta(pesertaId)}?`)) return;

		sibuk = [...sibuk, key];
		try {
			const resp = await fetch('/api/verifikasi', {
				method: 'DELETE',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ peserta_id: pesertaId, misi_id: misiId })
			});
			const hasil = (await resp.json().catch(() => ({ sukses: false }))) as {
				sukses: boolean;
				pesan?: string;
			};
			if (hasil.sukses) {
				selesai.delete(key);
				notifikasi = `Tanda selesai "${judul}" dibatalkan.`;
			} else {
				notifikasi = hasil.pesan ?? 'Gagal membatalkan. Coba lagi.';
			}
		} catch {
			notifikasi = 'Koneksi bermasalah — pembatalan butuh jaringan.';
		} finally {
			sibuk = sibuk.filter((k) => k !== key);
		}
	}

	async function batalkanLokal(pesertaId: string, misiId: string) {
		const key = `${pesertaId}:${misiId}`;
		await hapusDariAntrean(key);
		antreanLokal = antreanLokal.filter((k) => k !== key);
		notifikasi = 'Tanda lokal dibatalkan.';
	}

	function labelBonus(jenis: 'error_collector' | 'buddy_assist'): string {
		return jenis === 'error_collector' ? 'Error Collector' : 'Buddy Assist';
	}

	async function beriBonus(pesertaId: string, jenis: 'error_collector' | 'buddy_assist') {
		const pertanyaan =
			jenis === 'error_collector'
				? 'Error unik apa yang ditemukan peserta ini?'
				: 'Bantuan apa yang diberikan peserta ini ke temannya?';
		const keterangan = window.prompt(pertanyaan, '');
		if (keterangan === null) return;

		try {
			const resp = await fetch('/api/bonus', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ peserta_id: pesertaId, jenis, keterangan })
			});
			const hasil = (await resp.json().catch(() => ({ sukses: false }))) as {
				sukses: boolean;
				pesan?: string;
			};
			if (hasil.sukses) {
				bonusTambahan = [...bonusTambahan, `${pesertaId}:${jenis}`];
				notifikasi = jenis === 'error_collector' ? 'Bonus Error Collector ditambahkan.' : 'Bonus Buddy Assist ditambahkan.';
			} else {
				notifikasi = hasil.pesan ?? 'Gagal menambah bonus.';
			}
		} catch {
			notifikasi = 'Koneksi bermasalah. Tambah bonus saat jaringan kembali.';
		}
	}

	async function batalkanBonus(pesertaId: string, jenis: 'error_collector' | 'buddy_assist') {
		const key = `${pesertaId}:${jenis}`;
		if (!window.confirm(`Batalkan satu bonus ${labelBonus(jenis)} untuk ${namaPeserta(pesertaId)}?`)) return;

		try {
			const resp = await fetch('/api/bonus', {
				method: 'DELETE',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ peserta_id: pesertaId, jenis })
			});
			const hasil = (await resp.json().catch(() => ({ sukses: false }))) as {
				sukses: boolean;
				pesan?: string;
			};
			if (hasil.sukses) {
				// Kurangi dulu yang ditambahkan sesi ini; kalau tidak ada, tandai
				// pengurangan dari hitungan awal.
				const idx = bonusTambahan.lastIndexOf(key);
				if (idx !== -1) {
					bonusTambahan = bonusTambahan.filter((_, i) => i !== idx);
				} else {
					bonusDikurangi = [...bonusDikurangi, key];
				}
				notifikasi = `Bonus ${labelBonus(jenis)} dibatalkan.`;
			} else {
				notifikasi = hasil.pesan ?? 'Gagal membatalkan bonus.';
			}
		} catch {
			notifikasi = 'Koneksi bermasalah — pembatalan butuh jaringan.';
		}
	}

	function jumlahBonus(pesertaId: string, jenis: 'error_collector' | 'buddy_assist'): number {
		const awal = data.peserta.find((p) => p.id === pesertaId);
		const dasar = jenis === 'error_collector' ? (awal?.errorCollector ?? 0) : (awal?.buddyAssist ?? 0);
		const key = `${pesertaId}:${jenis}`;
		const tambahan = bonusTambahan.filter((k) => k === key).length;
		const dikurangi = bonusDikurangi.filter((k) => k === key).length;
		return Math.max(0, dasar + tambahan - dikurangi);
	}

	onMount(() => {
		void daftarAntrean().then((items) => {
			antreanLokal = items.map((i) => `${i.peserta_id}:${i.misi_id}`);
		});
		const stop = mulaiPemantauKoneksi(async (hasil) => {
			if (hasil.terkirim > 0) {
				const sisa = await daftarAntrean();
				const sisaKeys = new Set(sisa.map((i) => `${i.peserta_id}:${i.misi_id}`));
				const terkirim = antreanLokal.filter((k) => !sisaKeys.has(k));
				for (const key of terkirim) selesai.add(key);
				antreanLokal = antreanLokal.filter((k) => sisaKeys.has(k));
				notifikasi = `Koneksi pulih — ${hasil.terkirim} tanda berhasil terkirim.`;
			}
		});
		return stop;
	});

	const antreanTampil = $derived(
		data.antrean.filter((a) => status(a.peserta_id, a.misi_id) === 'menunggu')
	);
</script>

<div class="lembar lembar-lebar">
	<p class="petunjuk-kecil"><a href="/mentor"><Ikon nama="arrow-left" ukuran={15} /> Kembali ke halaman mentor</a></p>
	<h1>{data.kelompok.nama}</h1>
	<p class="petunjuk-kecil">
		Ketuk misi untuk menandai selesai. Ketuk lagi tanda <Ikon nama="check" ukuran={13} /> (selesai)
		atau <Ikon nama="reload" ukuran={13} /> (tersimpan lokal) untuk membatalkan.
	</p>

	{#if notifikasi}
		<div class="pesan pesan-info deret" style="justify-content: space-between">
			<span>{notifikasi}</span>
			<button class="btn btn-kecil btn-garis" onclick={() => (notifikasi = null)}>Tutup</button>
		</div>
	{/if}

	{#if antreanTampil.length > 0}
		<section class="kartu">
			<h2>Menunggu verifikasi ({antreanTampil.length})</h2>
			<p class="petunjuk-kecil">
				Buka tautan tugas peserta dulu, baru tandai selesai bila sudah sesuai.
			</p>
			<ul class="senarai">
				{#each antreanTampil as a (a.peserta_id + a.misi_id)}
					<li class="deret" style="justify-content: space-between; flex-wrap: wrap">
						<span>
							<strong>{a.peserta}</strong> · {a.misi}
							{#if a.tautan}
								<br /><a href={a.tautan} target="_blank" rel="noopener noreferrer"
									>Buka tautan tugas <Ikon nama="external-link" ukuran={13} /></a
								>
							{/if}
						</span>
						<button class="btn btn-kecil" onclick={() => verifikasi(a.peserta_id, a.misi_id)}
							><Ikon nama="check" ukuran={15} /> Tandai selesai</button
						>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#each data.peserta as p (p.id)}
		<section class="kartu">
			<div class="deret" style="justify-content: space-between">
				<h2 style="margin: 0">{p.nama}</h2>
				<span class="chip tier-{p.tier}" style="border: 1.5px solid currentColor">
					{p.poin} poin · {LABEL_TIER[p.tier]}
				</span>
			</div>
			{#if p.badges.length > 0}
				<div class="deret" style="margin: 0.4rem 0">
					{#each p.badges as badge (badge)}
						<span class="chip chip-info"><Ikon nama="star" ukuran={13} />{badge}</span>
					{/each}
				</div>
			{/if}

			{#each data.misiPerLevel as levelMisi, i (i)}
				<div class="deret" style="margin-top: 0.6rem">
					<span class="petunjuk-kecil" style="min-width: 3.6rem">Level {i + 1}</span>
					{#each levelMisi as m (m.id)}
						{@const st = status(p.id, m.id)}
						<button
							class="tombol-misi {st} {sibuk.includes(`${p.id}:${m.id}`) ? 'sibuk' : ''}"
							title={st === 'selesai'
								? 'Ketuk untuk membatalkan'
								: st === 'lokal'
									? 'Ketuk untuk membatalkan tanda lokal'
									: `${m.judul} (${m.poin} poin)`}
							onclick={() =>
								st === 'selesai'
									? batalkan(p.id, m.id)
									: st === 'lokal'
										? batalkanLokal(p.id, m.id)
										: verifikasi(p.id, m.id)}
						>
							{#if st === 'selesai'}<Ikon nama="check" ukuran={15} />{:else if st === 'menunggu'}<Ikon
									nama="hourglass"
									ukuran={15}
								/>{:else if st === 'lokal'}<Ikon
									nama="reload"
									ukuran={15}
								/>{:else}<Ikon nama="circle" ukuran={15} />{/if} M{m.urutan}
						</button>
					{/each}
				</div>
			{/each}

			<div class="deret" style="margin-top: 0.9rem; gap: 0.4rem; flex-wrap: wrap">
				<button
					class="btn btn-garis btn-kecil"
					onclick={() => beriBonus(p.id, 'error_collector')}
					disabled={jumlahBonus(p.id, 'error_collector') >= 2}
				>
					<Ikon nama="flag" ukuran={14} /> Error Collector ({jumlahBonus(p.id, 'error_collector')}/2)
				</button>
				<button
					class="btn btn-garis btn-kecil"
					title="Batalkan satu bonus Error Collector"
					onclick={() => batalkanBonus(p.id, 'error_collector')}
					disabled={jumlahBonus(p.id, 'error_collector') === 0}
				>
					<Ikon nama="minus" ukuran={14} />
				</button>
				<button
					class="btn btn-garis btn-kecil"
					onclick={() => beriBonus(p.id, 'buddy_assist')}
					disabled={jumlahBonus(p.id, 'buddy_assist') >= 2}
				>
					<Ikon nama="sparkles" ukuran={14} /> Buddy Assist ({jumlahBonus(p.id, 'buddy_assist')}/2)
				</button>
				<button
					class="btn btn-garis btn-kecil"
					title="Batalkan satu bonus Buddy Assist"
					onclick={() => batalkanBonus(p.id, 'buddy_assist')}
					disabled={jumlahBonus(p.id, 'buddy_assist') === 0}
				>
					<Ikon nama="minus" ukuran={14} />
				</button>
			</div>
		</section>
	{/each}

	{#if data.peserta.length === 0}
		<p class="pesan pesan-kuning">Belum ada peserta di kelompok ini. Hubungi panitia.</p>
	{/if}

	<p class="petunjuk-kecil">
		Legenda: <Ikon nama="circle" ukuran={13} /> belum · <Ikon nama="hourglass" ukuran={13} /> menunggu
		verifikasi · <Ikon nama="reload" ukuran={13} /> tersimpan lokal (ketuk untuk batalkan) ·
		<Ikon nama="check" ukuran={13} /> selesai (ketuk untuk batalkan)
	</p>
</div>

<style>
	.tombol-misi {
		min-width: 44px;
		min-height: 44px;
		border: 2px solid var(--garis);
		background: var(--permukaan);
		color: var(--teks-lembut);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}
	.tombol-misi.menunggu {
		border-color: var(--kuning);
		background: var(--kuning-lembut);
		color: var(--kuning);
	}
	.tombol-misi.selesai {
		border-color: var(--hijau);
		background: var(--hijau-lembut);
		color: var(--hijau);
	}
	.tombol-misi.lokal {
		border-style: dashed;
		border-color: var(--aksen);
		color: var(--aksen);
	}
	.tombol-misi.sibuk {
		opacity: 0.6;
	}
</style>
