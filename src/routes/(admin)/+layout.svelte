<script lang="ts">
	import { page } from '$app/state';
	import Ikon from '#lib/ui/Ikon.svelte';
	import type { NamaIkon } from '#lib/ui/ikon.js';

	let { children } = $props();

	const menu: { href: string; label: string; ikon: NamaIkon }[] = [
		{ href: '/admin', label: 'Ringkasan', ikon: 'analytics' },
		{ href: '/admin/checkin', label: 'Check-in', ikon: 'checkbox-on' },
		{ href: '/admin/peserta', label: 'Peserta', ikon: 'user' },
		{ href: '/admin/kelompok', label: 'Kelompok', ikon: 'users' },
		{ href: '/admin/soal', label: 'Soal', ikon: 'circle-question' },
		{ href: '/admin/ekspor', label: 'Ekspor', ikon: 'download' },
		{ href: '/kelola/vault', label: 'Vault', ikon: 'box' }
	];

	function aktif(href: string): boolean {
		const jalur = page.url.pathname;
		if (href === '/admin') return jalur === '/admin';
		return jalur === href || jalur.startsWith(href + '/');
	}
</script>

<div class="lembar lembar-lebar">
	<nav
		aria-label="Navigasi panitia"
		class="deret"
		style="flex-wrap: nowrap; overflow-x: auto; margin-bottom: 1.2rem; padding-bottom: 0.35rem"
	>
		{#each menu as m (m.href)}
			<a
				class="btn btn-kecil {aktif(m.href) ? '' : 'btn-lembut'}"
				href={m.href}
				aria-current={aktif(m.href) ? 'page' : undefined}
			>
				<Ikon nama={m.ikon} ukuran={16} /> {m.label}
			</a>
		{/each}
	</nav>

	{@render children()}
</div>
