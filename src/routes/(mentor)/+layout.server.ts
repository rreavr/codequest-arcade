import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { klienWajib } from '#lib/server/supabase.js';
import type { MentorRow } from '#lib/types.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	const klien = klienWajib(locals.supabase);
	const id = locals.user?.id;
	if (!id) error(401, 'Silakan masuk dulu.');

	const { data: mentor } = await klien.from('mentor').select('*').eq('id', id).maybeSingle();
	if (!mentor) error(403, 'Akun ini tidak terdaftar sebagai mentor. Hubungi panitia.');

	return { mentor: mentor as MentorRow };
};
