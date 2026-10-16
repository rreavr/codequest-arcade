import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		peran: locals.peran,
		namaPengguna: (locals.user?.user_metadata?.nama as string | undefined) ?? null,
		terkonfigurasi: locals.terkonfigurasi
	};
};
