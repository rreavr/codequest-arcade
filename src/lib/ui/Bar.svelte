<script lang="ts">
	let {
		bagian,
		total,
		tinggi
	}: { bagian: number; total: number; tinggi?: number } = $props();

	// Dijepit ke rentang 0..total supaya atribut ARIA tetap sah walau data kotor.
	const nilai = $derived(Math.max(0, Math.min(bagian, Math.max(0, total))));
	const persen = $derived(total > 0 ? Math.round((nilai / total) * 100) : 0);
</script>

<div
	class="bar"
	role="progressbar"
	aria-valuenow={nilai}
	aria-valuemin={0}
	aria-valuemax={Math.max(0, total)}
	style={tinggi ? `height: ${tinggi}px` : null}
>
	<div class="bar-isi" style="width: {persen}%"></div>
</div>
