// Lihat https://svelte.dev/docs/kit/types#app.d.ts
import type { SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			/** Klien Supabase per request (anon + cookie sesi); null jika env belum diisi. */
			supabase: SupabaseClient | null;
			user: User | null;
			peran: 'peserta' | 'mentor' | 'admin' | null;
			/** true jika environment Supabase sudah terisi. */
			terkonfigurasi: boolean;
		}
		interface PageData {
			/** Diisi oleh +layout.server.ts di akar: peran pengguna yang sedang masuk. */
			peran?: 'peserta' | 'mentor' | 'admin' | null;
			namaPengguna?: string | null;
		}
	}
}

export {};
