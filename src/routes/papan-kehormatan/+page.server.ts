import type { PageServerLoad } from './$types';
import { klienWajib } from '#lib/server/supabase.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.terkonfigurasi) {
		return { nama: [] as string[], terkonfigurasi: false };
	}
	const klien = klienWajib(locals.supabase);
	const { data } = await klien.from('papan_kehormatan').select('*').order('nama');

	return {
		nama: (data ?? []).map((r) => r.nama as string),
		terkonfigurasi: true
	};
};
