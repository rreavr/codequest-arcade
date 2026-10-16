<script lang="ts">
	import { MODUL } from '#lib/belajar/modul.js';
	import { SOAL_SQL } from '#lib/belajar/soalSql.js';
	import Ikon from '#lib/ui/Ikon.svelte';
</script>

<div class="lembar">
	<h1>Belajar</h1>
	<p class="petunjuk-kecil">
		Rangkuman singkat untuk pemula, plus latihan interaktif yang berjalan langsung di
		perambanmu. Terbuka untuk umum — tanpa akun, tanpa poin, dan tidak terhubung ke acara.
	</p>

	<section class="kartu">
		<h2><Ikon nama="book-open" ukuran={18} /> Modul singkat</h2>
		<p class="petunjuk-kecil">Klik judul modul untuk membuka isinya.</p>
		<div class="daftar-modul">
			{#each MODUL as modul (modul.id)}
				<details class="rincian-modul">
					<summary>
						<Ikon nama={modul.ikon} ukuran={17} />
						<span>{modul.judul}</span>
					</summary>
					<p class="petunjuk-kecil" style="margin: 0.5rem 0 0">{modul.ringkas}</p>
					{#each modul.bagian as bagian (bagian.judul)}
						<h3>{bagian.judul}</h3>
						{#each bagian.isi as paragraf}
							<p>{paragraf}</p>
						{/each}
					{/each}
					{#if modul.latihan}
						<div class="deret" style="margin-top: 0.6rem">
							<a class="btn btn-kecil" href={modul.latihan.href}>
								<Ikon nama="target" ukuran={15} /> {modul.latihan.label}
							</a>
						</div>
					{/if}
				</details>
			{/each}
		</div>
	</section>

	<section class="kartu">
		<h2><Ikon nama="target" ukuran={18} /> Latihan interaktif</h2>
		<a class="tautan-latihan" href="/belajar/sql">
			<div class="baris-jarak">
				<strong><Ikon nama="clipboard" ukuran={17} /> Minigame SQL</strong>
				<span class="chip chip-info">
					<Ikon nama="star" ukuran={13} />{SOAL_SQL.length} tantangan
				</span>
			</div>
			<p class="petunjuk-kecil" style="margin: 0.4rem 0 0">
				Latihan menulis kueri SELECT, WHERE, GROUP BY, sampai JOIN di basis data SQLite kecil
				yang berjalan di peramban. Tanpa instalasi, tanpa akun.
			</p>
		</a>
	</section>

	<p class="petunjuk-kecil">
		Catatan: semua latihan di halaman ini tidak dihitung sebagai poin acara. Poin hanya dari
		checkpoint dan misi yang diverifikasi mentor.
	</p>
</div>

<style>
	.daftar-modul {
		display: grid;
		gap: 0.6rem;
	}
	.rincian-modul {
		border: 2px solid var(--garis);
		background: var(--permukaan-2);
		padding: 0.7rem 0.9rem;
		box-shadow: 3px 3px 0 var(--bayang);
	}
	.rincian-modul summary {
		cursor: pointer;
		font-weight: 700;
	}
	.rincian-modul h3 {
		font-size: 0.95rem;
		margin: 0.8rem 0 0.3rem;
	}
	.rincian-modul p {
		margin: 0.3rem 0;
	}
	.tautan-latihan {
		display: block;
		color: inherit;
		text-decoration: none;
		border: 2px solid var(--garis);
		background: var(--permukaan-2);
		padding: 0.8rem 1rem;
		box-shadow: 3px 3px 0 var(--bayang);
	}
	.tautan-latihan:hover {
		border-color: var(--aksen);
	}
	.baris-jarak {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
</style>
