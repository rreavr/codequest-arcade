// Klien Supabase sisi server.
//
// Dua jenis klien:
// - buatKlienRequest(event): memakai kunci anon + cookie sesi pengguna, sehingga
//   RLS di database berlaku penuh. Dipakai untuk membaca data atas nama pengguna.
// - buatKlienAdmin(): memakai service role untuk tugas panitia (buat akun,
//   ekspor, penilaian tes). Jangan pernah bocorkan ke peramban.

import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$app/env/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$app/env/private';
import { error, type RequestEvent } from '@sveltejs/kit';
import type { Peran } from '#lib/types.js';

export type Klien = SupabaseClient;

export interface KonfigurasiSupabase {
	url: string;
	anon: string;
	service: string | null;
}

export function konfigurasiSupabase(): KonfigurasiSupabase | null {
	const url = PUBLIC_SUPABASE_URL;
	const anon = PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !anon) return null;
	return { url, anon, service: SUPABASE_SERVICE_ROLE_KEY || null };
}

/**
 * Klien per request (anon + cookie sesi). Mengembalikan null jika environment
 * Supabase belum diisi, supaya halaman publik tetap bisa dibuka untuk latihan.
 */
export function buatKlienRequest(event: RequestEvent | null): Klien | null {
	const konf = konfigurasiSupabase();
	if (!konf) return null;

	return createServerClient(konf.url, konf.anon, {
		cookies: {
			getAll: () => event?.cookies.getAll() ?? [],
			setAll: (daftar, headers) => {
				// @supabase/ssr menitipkan header anti-cache agar respons tidak
				// di-cache CDN saat cookie sesi berubah.
				for (const [nama, nilai] of Object.entries(headers)) {
					event?.setHeaders({ [nama]: nilai });
				}
				for (const { name, value, options } of daftar) {
					event?.cookies.set(name, value, { ...options, path: '/' });
				}
			}
		}
	});
}

/** Klien service role (bypass RLS). Hanya untuk kode server yang sudah memeriksa peran. */
export function buatKlienAdmin(): Klien | null {
	const konf = konfigurasiSupabase();
	if (!konf?.service) return null;
	return createClient(konf.url, konf.service, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
}

/** Peran dari app_metadata pengguna (diisi saat akun dibuat lewat service role). */
export function peranDari(user: User | null | undefined): Peran | null {
	const peran = user?.app_metadata?.role;
	return peran === 'peserta' || peran === 'mentor' || peran === 'admin' ? peran : null;
}

/** Judul halaman beranda tiap peran, dipakai untuk pengalihan setelah masuk. */
export function berandaUntuk(peran: Peran | null): string {
	if (peran === 'admin') return '/admin';
	if (peran === 'mentor') return '/mentor';
	if (peran === 'peserta') return '/dashboard';
	return '/masuk';
}

/** Pastikan klien tersedia; jika environment belum diisi, tampilkan pesan jelas. */
export function klienWajib(klien: Klien | null): Klien {
	if (!klien) {
		error(
			503,
			'Supabase belum dikonfigurasi. Salin .env.example menjadi .env lalu isi PUBLIC_SUPABASE_URL dan PUBLIC_SUPABASE_ANON_KEY.'
		);
	}
	return klien;
}
