import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { emailPesertaUntuk } from '#lib/constants/acara.js';
import { berandaUntuk, klienWajib, peranDari } from '#lib/server/supabase.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	return {
		lanjut: url.searchParams.get('lanjut'),
		pesan: url.searchParams.get('pesan'),
		kelompok: url.searchParams.get('kelompok'),
		terkonfigurasi: locals.terkonfigurasi
	};
};

function jalurLanjutValid(lanjut: string | null): string | null {
	if (!lanjut) return null;
	if (!lanjut.startsWith('/') || lanjut.startsWith('//')) return null;
	return lanjut;
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const identitas = String(form.get('identitas') ?? '').trim();
		const sandi = String(form.get('sandi') ?? '');

		if (!identitas || !sandi) {
			return fail(400, { pesan: 'Isi NIM/email dan sandi.', identitas });
		}

		// Peserta masuk memakai NIM; panitia dan mentor memakai email.
		const email = identitas.includes('@')
			? identitas
			: emailPesertaUntuk(identitas.replace(/\s+/g, ''));

		const klien = klienWajib(locals.supabase);
		const { data, error } = await klien.auth.signInWithPassword({ email, password: sandi });
		if (error || !data.user) {
			return fail(400, { pesan: 'NIM/email atau sandi salah. Coba lagi.', identitas });
		}

		const lanjut = jalurLanjutValid(String(form.get('lanjut') ?? '')) ?? null;
		redirect(303, lanjut ?? berandaUntuk(peranDari(data.user)));
	}
};
