<script lang="ts">
	import { IKON, type NamaIkon } from './ikon.js';

	let {
		nama,
		ukuran = 18,
		kelas = ''
	}: { nama: NamaIkon; ukuran?: number; kelas?: string } = $props();
</script>

<svg
	class="ikon-pixel {kelas}"
	width={ukuran}
	height={ukuran}
	viewBox="0 0 24 24"
	fill="currentColor"
	shape-rendering="crispEdges"
	aria-hidden="true"
	focusable="false"
>
	{@html IKON[nama]}
</svg>

<style>
	.ikon-pixel {
		display: inline-block;
		flex: none;
		vertical-align: -0.18em;
	}
</style>
