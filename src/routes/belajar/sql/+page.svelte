<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Database, InitSqlJsStatic, QueryExecResult, SqlJsStatic } from 'sql.js';
	import { SKEMA_ARENA, SOAL_SQL, type SoalSql } from '#lib/belajar/soalSql.js';
	import Ikon from '#lib/ui/Ikon.svelte';

	const KUNCI_PROGRES = 'cq-belajar-sql-selesai';

	type Hasil = {
		ok: boolean;
		pesan: string;
		tabel?: { kolom: string[]; baris: string[][] };
	};

	const selesai = new SvelteSet<string>();
	let mesin = $state<SqlJsStatic | null>(null);
	let galatMesin = $state<string | null>(null);
	let kode = $state<Record<string, string>>(
		Object.fromEntries(SOAL_SQL.map((soal) => [soal.id, '']))
	);
	let hasil = $state<Record<string, Hasil>>({});

	onMount(async () => {
		try {
			const [modulSqlJs, berkasWasm] = await Promise.all([
				import('sql.js'),
				import('sql.js/dist/sql-wasm-browser.wasm?url')
			]);
			const initSqlJs = (modulSqlJs.default ?? modulSqlJs) as unknown as InitSqlJsStatic;
			mesin = await initSqlJs({ locateFile: () => berkasWasm.default });

			try {
				const tersimpan = localStorage.getItem(KUNCI_PROGRES);
				if (tersimpan) {
					for (const id of JSON.parse(tersimpan) as string[]) selesai.add(id);
				}
			} catch {
				// Progres tersimpan rusak — mulai dari nol.
			}
		} catch (e) {
			galatMesin = e instanceof Error ? e.message : String(e);
		}
	});

	function dbBaru(): Database | null {
		if (!mesin) return null;
		const db = new mesin.Database();
		db.run(SKEMA_ARENA);
		return db;
	}

	function tabelDari(keluaran: QueryExecResult[]): Hasil['tabel'] | null {
		if (keluaran.length === 0) return null;
		const pertama = keluaran[0];
		return {
			kolom: pertama.columns,
			baris: pertama.values.map((baris) =>
				baris.map((sel) => (sel === null ? 'NULL' : String(sel)))
			)
		};
	}

	function samaMultiset(a: string[][], b: string[][]): boolean {
		if (a.length !== b.length) return false;
		const kodekan = (baris: string[][]) => baris.map((r) => r.join('\u0001')).sort();
		const ka = kodekan(a);
		const kb = kodekan(b);
		return ka.every((v, i) => v === kb[i]);
	}

	function simpanProgres() {
		try {
			localStorage.setItem(KUNCI_PROGRES, JSON.stringify([...selesai]));
		} catch {
			// Penyimpanan diblokir — progres tetap jalan di memori sesi ini.
		}
	}

	// $state perlu objek baru, bukan mutasi, supaya tampilan ikut berubah.
	function catat(id: string, h: Hasil) {
		hasil = { ...hasil, [id]: h };
	}

	function jalan(soal: SoalSql) {
		const db = dbBaru();
		const dbKunci = dbBaru();
		if (!db || !dbKunci) return;

		try {
			const keluaran = tabelDari(db.exec(kode[soal.id] ?? ''));
			const kunci = tabelDari(dbKunci.exec(soal.kunci));

			if (!keluaran) {
				catat(soal.id, {
					ok: false,
					pesan: 'Kuerimu belum menghasilkan tabel. Awali dengan SELECT, ya.'
				});
				return;
			}
			if (!kunci) return;

			if (keluaran.kolom.length !== kunci.kolom.length) {
				catat(soal.id, {
					ok: false,
					pesan: `Jumlah kolomnya belum pas: kunci jawaban menghasilkan ${kunci.kolom.length} kolom, kuerimu ${keluaran.kolom.length} kolom.`,
					tabel: keluaran
				});
				return;
			}

			const cocok = soal.urut
				? keluaran.baris.length === kunci.baris.length &&
					keluaran.baris.every((baris, i) => baris.every((sel, j) => sel === kunci.baris[i][j]))
				: samaMultiset(keluaran.baris, kunci.baris);

			if (!cocok) {
				catat(soal.id, {
					ok: false,
					pesan: `Belum cocok: kunci jawaban menghasilkan ${kunci.baris.length} baris, kuerimu ${keluaran.baris.length} baris. Bandingkan lagi kolom dan barisnya.`,
					tabel: keluaran
				});
				return;
			}

			catat(soal.id, {
				ok: true,
				pesan: 'Tepat! Hasilnya cocok dengan kunci jawaban.',
				tabel: keluaran
			});
			selesai.add(soal.id);
			simpanProgres();
		} catch (e) {
			catat(soal.id, { ok: false, pesan: e instanceof Error ? e.message : String(e) });
		} finally {
			db.close();
			dbKunci.close();
		}
	}

	function bersihkan(soal: SoalSql) {
		kode[soal.id] = '';
		const salinan = { ...hasil };
		delete salinan[soal.id];
		hasil = salinan;
	}

	function resetProgres() {
		if (!confirm('Hapus tanda selesai untuk semua tantangan?')) return;
		selesai.clear();
		hasil = {};
		kode = Object.fromEntries(SOAL_SQL.map((soal) => [soal.id, '']));
		try {
			localStorage.removeItem(KUNCI_PROGRES);
		} catch {
			// abaikan
		}
	}
</script>

<div class="lembar">
	<p class="petunjuk-kecil">
		<a href="/belajar"><Ikon nama="arrow-left" ukuran={14} /> Kembali ke Belajar</a>
	</p>
	<h1>Minigame SQL</h1>
	<p class="petunjuk-kecil">
		Latihan menulis kueri di basis data SQLite kecil (via WebAssembly, paket sql.js) yang berjalan
		sepenuhnya di perambanmu. Data latihannya fiktif, tidak dikirim ke server, dan tidak
		terhubung ke poin acara.
	</p>

	<div class="deret" style="gap: 0.4rem; flex-wrap: wrap; margin: 0.75rem 0 1rem">
		<span class="chip chip-info">
			<Ikon nama="star" ukuran={13} />{selesai.size}/{SOAL_SQL.length} tantangan selesai
		</span>
		{#if mesin}
			<span class="chip chip-selesai"><Ikon nama="check" ukuran={13} />Mesin SQL siap</span>
		{:else if galatMesin}
			<span class="chip chip-belum"><Ikon nama="lock" ukuran={13} />Mesin SQL gagal dimuat</span>
		{:else}
			<span class="chip chip-menunggu">
				<Ikon nama="hourglass" ukuran={13} />Menyiapkan mesin SQL…
			</span>
		{/if}
		<button
			class="btn btn-kecil btn-lembut"
			type="button"
			onclick={resetProgres}
			disabled={selesai.size === 0}
		>
			<Ikon nama="reload" ukuran={14} /> Reset progres
		</button>
	</div>

	{#if galatMesin}
		<p class="pesan pesan-galat">
			Gagal memuat mesin SQL di peramban: <code>{galatMesin}</code>. Coba muat ulang halaman, atau
			buka lewat peramban terbaru (Chrome, Firefox, Edge, atau Safari).
		</p>
	{/if}

	<section class="kartu">
		<h2><Ikon nama="clipboard" ukuran={18} /> Skema basis data latihan</h2>
		<p class="petunjuk-kecil">
			Tiga tabel ini dipakai oleh semua tantangan di bawah. Database dibuat ulang setiap kali
			kueri dijalankan, jadi aman untuk bereksperimen.
		</p>
		<details>
			<summary>Lihat skema &amp; contoh data</summary>
			<pre class="kode">{SKEMA_ARENA.trim()}</pre>
		</details>
	</section>

	{#each SOAL_SQL as soal (soal.id)}
		<section class="kartu" id={soal.id}>
			<div class="baris-soal">
				<h2><Ikon nama="clipboard" ukuran={18} /> {soal.judul}</h2>
				<div class="deret" style="gap: 0.35rem">
					<span class="chip chip-info">{soal.tingkat}</span>
					{#if selesai.has(soal.id)}
						<span class="chip chip-selesai"><Ikon nama="check" ukuran={13} />Selesai</span>
					{/if}
				</div>
			</div>
			<p>{soal.tugas}</p>
			<textarea
				rows="3"
				spellcheck="false"
				autocapitalize="off"
				autocomplete="off"
				aria-label="Kueri SQL untuk {soal.judul}"
				placeholder="SELECT ..."
				bind:value={kode[soal.id]}
			></textarea>
			<div class="deret" style="gap: 0.4rem; flex-wrap: wrap; margin-top: 0.6rem">
				<button class="btn btn-kecil" type="button" onclick={() => jalan(soal)} disabled={!mesin}>
					<Ikon nama="target" ukuran={15} /> Jalankan kueri
				</button>
				<button class="btn btn-kecil btn-lembut" type="button" onclick={() => bersihkan(soal)}>
					<Ikon nama="reload" ukuran={14} /> Bersihkan
				</button>
			</div>
			<div class="baris-petunjuk">
				<details>
					<summary>Petunjuk</summary>
					<p class="petunjuk-kecil" style="margin: 0.35rem 0 0">{soal.petunjuk}</p>
				</details>
				{#if hasil[soal.id]?.ok === false || selesai.has(soal.id)}
					<details>
						<summary>Kunci jawaban</summary>
						<pre class="kode">{soal.kunci}</pre>
					</details>
				{/if}
			</div>

			{#if hasil[soal.id]}
				{@const h = hasil[soal.id]}
				<div class="pesan {h.ok ? 'pesan-sukses' : 'pesan-galat'}" style="margin-top: 0.7rem">
					{h.pesan}
				</div>
				{#if h.tabel}
					<div class="tabel-gulir" style="margin-top: 0.6rem">
						<table>
							<thead>
								<tr>
									{#each h.tabel.kolom as kolom}
										<th>{kolom}</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each h.tabel.baris as baris}
									<tr>
										{#each baris as sel}
											<td>{sel}</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{/if}
		</section>
	{/each}

	<p class="petunjuk-kecil">
		Progres tersimpan di perangkat ini saja (localStorage) — berpindah perangkat berarti mulai
		dari awal. Latihan ini tidak masuk perhitungan poin acara.
	</p>
</div>

<style>
	.baris-soal {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.baris-soal h2 {
		margin: 0;
	}
	.baris-petunjuk {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin-top: 0.6rem;
	}
	.baris-petunjuk summary {
		cursor: pointer;
		font-size: 0.85rem;
	}
	pre.kode {
		margin: 0.4rem 0 0;
		padding: 0.55rem 0.75rem;
		background: var(--permukaan-2);
		border: 2px solid var(--garis);
		font-size: 0.8rem;
		overflow-x: auto;
		white-space: pre-wrap;
	}
	textarea {
		width: 100%;
		margin-top: 0.5rem;
	}
</style>
