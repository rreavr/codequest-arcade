import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { klienWajib } from '#lib/server/supabase.js';
import { muatRekap } from '#lib/server/rekap.js';
import type { PesertaRow } from '#lib/types.js';

// Satu baris tabel berkas_vault (migrasi 0006).
interface BerkasVault {
	id: string;
	nama: string;
	url: string;
	keterangan: string | null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const klien = klienWajib(locals.supabase);
	const id = locals.user!.id;

	const { data: peserta } = await klien.from('peserta').select('*').eq('id', id).maybeSingle();
	if (!peserta) error(404, 'Data peserta tidak ditemukan.');
	const p = peserta as PesertaRow;

	// Academic Vault hanya terbuka untuk peserta yang sudah check-in.
	if (!p.checkin_pada) {
		return { terkunci: true, tier: 'none' as const, berkas: [], nama: p.nama };
	}

	const rekap = await muatRekap(klien, { pesertaIds: [id] });
	const tier = rekap.baris[0]?.tier ?? ('none' as const);

	// Berkas vault berupa tautan (mis. Google Drive), diurut sesuai urutan
	// penambahan. Kalau tabelnya belum ada (migrasi 0006 belum jalan), vault
	// tampil kosong — halaman tetap terbuka.
	const { data: berkas } = await klien
		.from('berkas_vault')
		.select('id, nama, url, keterangan')
		.order('dibuat_pada', { ascending: true });

	return { terkunci: false, tier, berkas: (berkas ?? []) as BerkasVault[], nama: p.nama };
};
