import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { klienWajib } from '#lib/server/supabase.js';
import type { SurveiRow } from '#lib/types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const klien = klienWajib(locals.supabase);
	const id = locals.user!.id;
	const { data } = await klien.from('survei').select('*').eq('peserta_id', id).maybeSingle();
	return { sudah: (data as SurveiRow | null) ?? null };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const klien = klienWajib(locals.supabase);
		const id = locals.user!.id;
		const form = await request.formData();

		const lebihSiap = String(form.get('lebih_siap') ?? '');
		if (lebihSiap !== 'ya' && lebihSiap !== 'tidak') {
			return fail(400, { pesan: 'Pilih salah satu jawaban dulu.' });
		}
		const saran = String(form.get('saran') ?? '').trim().slice(0, 1000);

		const { error } = await klien.from('survei').insert({
			peserta_id: id,
			lebih_siap: lebihSiap === 'ya',
			saran: saran || null
		});
		if (error) {
			const pesan = error.code === '23505' ? 'Kamu sudah mengisi survei.' : error.message;
			return fail(400, { pesan });
		}
		redirect(303, '/survei');
	}
};
