import type { PageServerLoad } from './$types';
import { klienWajib } from '#lib/server/supabase.js';
import type { SkorKelompokRow } from '#lib/types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.terkonfigurasi) {
		return { kelompok: [] as SkorKelompokRow[], terkonfigurasi: false };
	}
	const klien = klienWajib(locals.supabase);
	const { data } = await klien
		.from('skor_kelompok')
		.select('*')
		.order('total_poin', { ascending: false });

	return {
		kelompok: (data ?? []) as SkorKelompokRow[],
		terkonfigurasi: true
	};
};
