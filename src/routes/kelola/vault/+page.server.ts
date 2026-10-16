import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { berandaUntuk, klienWajib } from '#lib/server/supabase.js';
import { PESAN_VAULT, tautanVaultValid } from '#lib/tautan.js';

// Satu baris tabel berkas_vault (migrasi 0006).
export interface BerkasVault {
	id: string;
	nama: string;
	url: string;
	keterangan: string | null;
	dibuat_pada: string;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const klien = klienWajib(locals.supabase);

	const { data, error } = await klien
		.from('berkas_vault')
		.select('id, nama, url, keterangan, dibuat_pada')
		.order('dibuat_pada', { ascending: true });

	const berkas = (data ?? []) as BerkasVault[];
	const idSunting = url.searchParams.get('edit');

	return {
		berkas,
		galat: error ? error.message : null,
		sunting: idSunting ? (berkas.find((b) => b.id === idSunting) ?? null) : null,
		beranda: berandaUntuk(locals.peran)
	};
};

export const actions: Actions = {
	simpan: async ({ request, locals }) => {
		const klien = klienWajib(locals.supabase);
		const form = await request.formData();

		const id = String(form.get('id') ?? '').trim();
		const nama = String(form.get('nama') ?? '').trim();
		const url = String(form.get('url') ?? '').trim();
		const keterangan = String(form.get('keterangan') ?? '').trim();

		if (nama.length < 2) return fail(400, { galat: true, pesan: 'Nama berkas minimal 2 huruf.' });
		if (nama.length > 120)
			return fail(400, { galat: true, pesan: 'Nama berkas maksimal 120 huruf.' });
		if (!tautanVaultValid(url)) return fail(400, { galat: true, pesan: PESAN_VAULT });

		const isi = { nama, url, keterangan: keterangan ? keterangan.slice(0, 160) : null };

		if (id) {
			const { error } = await klien.from('berkas_vault').update(isi).eq('id', id);
			if (error) return fail(400, { galat: true, pesan: `Gagal menyimpan: ${error.message}` });
			return { pesan: `Tautan "${nama}" diperbarui.` };
		}

		const { error } = await klien.from('berkas_vault').insert(isi);
		if (error) return fail(400, { galat: true, pesan: `Gagal menambah: ${error.message}` });
		return { pesan: `Tautan "${nama}" ditambahkan ke vault.` };
	},

	hapus: async ({ request, locals }) => {
		const klien = klienWajib(locals.supabase);
		const id = String((await request.formData()).get('id') ?? '').trim();
		if (!id) return fail(400, { galat: true, pesan: 'Tautan yang mau dihapus tidak jelas.' });

		const { error } = await klien.from('berkas_vault').delete().eq('id', id);
		if (error) return fail(500, { galat: true, pesan: `Gagal menghapus: ${error.message}` });
		return { pesan: 'Tautan dihapus dari vault.' };
	}
};
