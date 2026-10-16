<script lang="ts">
	import { page } from '$app/state';
	import Ikon from '#lib/ui/Ikon.svelte';
	import type { NamaIkon } from '#lib/ui/ikon.js';

	let { children } = $props();

	const menu: { href: string; label: string; ikon: NamaIkon }[] = [
		{ href: '/dashboard', label: 'Beranda', ikon: 'home' },
		{ href: '/tes/pre', label: 'Tes', ikon: 'pencil' },
		{ href: '/trivia', label: 'Trivia', ikon: 'star' },
		{ href: '/vault', label: 'Vault', ikon: 'box' },
		{ href: '/survei', label: 'Survei', ikon: 'smile' }
	];

	function aktif(href: string): boolean {
		const jalur = page.url.pathname;
		return jalur === href || jalur.startsWith(href + '/');
	}
</script>

<div class="ruang-nav">
	<div class="lembar">
		{@render children()}
	</div>
</div>

<nav class="nav-bawah" aria-label="Navigasi peserta">
	{#each menu as m (m.href)}
		<a href={m.href} aria-current={aktif(m.href) ? 'page' : undefined}>
			<span class="ikon" aria-hidden="true"><Ikon nama={m.ikon} ukuran={22} /></span>
			{m.label}
		</a>
	{/each}
</nav>
