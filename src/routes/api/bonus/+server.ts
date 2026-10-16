// Bonus untuk peserta: Error Collector dan Buddy Assist.
// Batas maksimal 2 kali per jenis dijaga pemicu di database.
// DELETE membatalkan satu bonus terbaru (salah ketuk); RLS
// "mentor kelompok boleh membatalkan bonus" membatasi ke kelompok sendiri.

import { json, type RequestHandler } from '@sveltejs/kit';
import { klienWajib } from '#lib/server/supabase.js';

const JENIS_VALID = ['error_collector', 'buddy_assist'] as const;
type JenisBonus = (typeof JENIS_VALID)[number];

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ sukses: false, pesan: 'Belum masuk.' }, { status: 401 });
	}
	if (locals.peran !== 'mentor' && locals.peran !== 'admin') {
		return json({ sukses: false, pesan: 'Hanya mentor yang bisa memberi bonus.' }, { status: 403 });
	}

	const body = (await request.json().catch(() => null)) as {
		peserta_id?: string;
		jenis?: string;
		keterangan?: string;
	} | null;
	const pesertaId = String(body?.peserta_id ?? '');
	const jenis = String(body?.jenis ?? '') as JenisBonus;
	if (!pesertaId || !JENIS_VALID.includes(jenis)) {
		return json({ sukses: false, pesan: 'Data bonus tidak lengkap.' }, { status: 400 });
	}

	const klien = klienWajib(locals.supabase);
	const { error } = await klien.from('bonus').insert({
		peserta_id: pesertaId,
		jenis,
		mentor_id: locals.peran === 'mentor' ? locals.user.id : null,
		keterangan: String(body?.keterangan ?? '').trim().slice(0, 300) || null
	});

	if (error) {
		if (error.code === '42501' || error.code === '23514') {
			return json({ sukses: false, pesan: 'Bonus ini tidak bisa diberikan ke peserta tersebut.' }, { status: 403 });
		}
		// Pesan dari pemicu batas_bonus (raise exception).
		return json({ sukses: false, pesan: error.message }, { status: 400 });
	}

	return json({ sukses: true });
};

/** Batalkan satu bonus terbaru dari jenis tersebut (salah beri). */
export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ sukses: false, pesan: 'Belum masuk.' }, { status: 401 });
	}
	if (locals.peran !== 'mentor' && locals.peran !== 'admin') {
		return json({ sukses: false, pesan: 'Hanya mentor yang bisa membatalkan bonus.' }, { status: 403 });
	}

	const body = (await request.json().catch(() => null)) as {
		peserta_id?: string;
		jenis?: string;
	} | null;
	const pesertaId = String(body?.peserta_id ?? '');
	const jenis = String(body?.jenis ?? '') as JenisBonus;
	if (!pesertaId || !JENIS_VALID.includes(jenis)) {
		return json({ sukses: false, pesan: 'Data bonus tidak lengkap.' }, { status: 400 });
	}

	const klien = klienWajib(locals.supabase);
	const { data: baris, error: galatCari } = await klien
		.from('bonus')
		.select('id')
		.eq('peserta_id', pesertaId)
		.eq('jenis', jenis)
		.order('dibuat_pada', { ascending: false })
		.limit(1)
		.maybeSingle();
	if (galatCari) {
		return json({ sukses: false, pesan: `Gagal mencari bonus: ${galatCari.message}` }, { status: 400 });
	}
	if (!baris) {
		return json({ sukses: false, pesan: 'Tidak ada bonus yang bisa dibatalkan.' }, { status: 400 });
	}

	const { error } = await klien.from('bonus').delete().eq('id', baris.id);
	if (error) {
		if (error.code === '42501') {
			return json({ sukses: false, pesan: 'Bonus ini tidak bisa dibatalkan.' }, { status: 403 });
		}
		return json({ sukses: false, pesan: `Gagal membatalkan bonus: ${error.message}` }, { status: 400 });
	}

	return json({ sukses: true });
};
