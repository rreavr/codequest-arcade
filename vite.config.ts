import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			// Hosting di Cloudflare Pages. Buka https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-site
			// saat siap deploy; `npm run build` menghasilkan .svelte-kit/cloudflare.
			adapter: adapter()
		})
	],
	test: {
		include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
		environment: 'node'
	}
});