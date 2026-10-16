import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { buatKlienRequest, berandaUntuk, peranDari } from '#lib/server/supabase.js';

// Rute khusus peserta (di luar grup (peserta) ada juga /api yang dijaga sendiri).
const RUTE_PESERTA = ['/dashboard', '/level', '/tes', '/trivia', '/vault', '/survei'];
// Perkakas bersama: boleh dibuka mentor maupun admin.
const RUTE_STAF = ['/kelola'];

function kelompokRute(jalur: string): 'peserta' | 'mentor' | 'admin' | 'staf' | null {
	if (jalur === '/admin' || jalur.startsWith('/admin/')) return 'admin';
	if (jalur === '/mentor' || jalur.startsWith('/mentor/')) return 'mentor';
	if (RUTE_STAF.some((p) => jalur === p || jalur.startsWith(p + '/'))) return 'staf';
	if (RUTE_PESERTA.some((p) => jalur === p || jalur.startsWith(p + '/'))) return 'peserta';
	return null;
}

// Lapis pertama penjagaan peran. Lapis kedua adalah RLS di supabase/migrations/.
export const handle: Handle = async ({ event, resolve }) => {
	const klien = buatKlienRequest(event);
	event.locals.supabase = klien;
	event.locals.user = null;
	event.locals.peran = null;
	event.locals.terkonfigurasi = klien !== null;

	if (klien) {
		const {
			data: { user }
		} = await klien.auth.getUser();
		event.locals.user = user ?? null;
		event.locals.peran = peranDari(user);
	}

	const jalur = event.url.pathname;
	const wajib = kelompokRute(jalur);

	if (wajib) {
		if (!event.locals.user) {
			const lanjut = encodeURIComponent(jalur + event.url.search);
			redirect(303, `/masuk?lanjut=${lanjut}`);
		}
		const boleh =
			wajib === 'staf'
				? event.locals.peran === 'mentor' || event.locals.peran === 'admin'
				: event.locals.peran === wajib;
		if (!boleh) {
			redirect(303, berandaUntuk(event.locals.peran));
		}
	} else if (event.locals.user && (jalur === '/masuk' || jalur === '/daftar')) {
		redirect(303, berandaUntuk(event.locals.peran));
	}

	return resolve(event, {
		filterSerializedResponseHeaders: (nama) => nama === 'content-range' || nama === 'x-supabase-api-version'
	});
};
