import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { klienWajib } from '#lib/server/supabase.js';
import type { PesertaRow } from '#lib/types.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	const klien = klienWajib(locals.supabase);
	const id = locals.user?.id;
	if (!id) error(401, 'Silakan masuk dulu.');

	const { data: peserta } = await klien.from('peserta').select('*').eq('id', id).maybeSingle();
	if (!peserta) {
		error(403, 'Akun ini tidak terdaftar sebagai peserta. Hubungi panitia.');
	}

	return { peserta: peserta as PesertaRow };
};
