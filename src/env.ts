// Deklarasi environment variable (cara SvelteKit 3).
// - `public: true`  → bisa dibaca dari peramban lewat `$app/env/public`.
// - tanpa `public`  → hanya server, dibaca lewat `$app/env/private`.
// Semua opsional: tanpa nilai, aplikasi tetap berjalan dengan mode "belum
// dikonfigurasi" (halaman publik tampil dengan peringatan, tanpa crash).

import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: {
		public: true,
		description: 'URL proyek Supabase, mis. https://xxxx.supabase.co',
		schema: (nilai) => nilai?.trim() || undefined
	},
	PUBLIC_SUPABASE_ANON_KEY: {
		public: true,
		description: 'Kunci anon publik Supabase (Project Settings > API).',
		schema: (nilai) => nilai?.trim() || undefined
	},
	SUPABASE_SERVICE_ROLE_KEY: {
		description:
			'Kunci service role Supabase. Hanya untuk server (endpoint /api dan ekspor). Jangan pernah diawali PUBLIC_.',
		schema: (nilai) => nilai?.trim() || undefined
	},
	R2_ACCOUNT_ID: {
		description: 'ID akun Cloudflare untuk endpoint R2 (https://<id>.r2.cloudflarestorage.com).',
		schema: (nilai) => nilai?.trim() || undefined
	},
	R2_ACCESS_KEY_ID: {
		description: 'Access key token API R2 — scope hanya bucket berkas vault.',
		schema: (nilai) => nilai?.trim() || undefined
	},
	R2_SECRET_ACCESS_KEY: {
		description: 'Secret key token API R2. Hanya untuk server, jangan pernah diawali PUBLIC_.',
		schema: (nilai) => nilai?.trim() || undefined
	},
	R2_BUCKET: {
		description: 'Nama bucket R2 untuk berkas vault (bawaan: codequest-vault).',
		schema: (nilai) => nilai?.trim() || undefined
	}
});
