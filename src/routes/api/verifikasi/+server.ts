// Verifikasi misi oleh mentor. Idempotent: kirim ulang dari antrean offline aman
// karena duplikat ditolak primary key dan dianggap sukses.
// DELETE membatalkan salah tandai: baris penyelesaian dihapus dan poin peserta
// otomatis kembali (selalu dihitung ulang, tanpa cache).

import { json, type RequestHandler } from '@sveltejs/kit';
import { klienWajib } from '#lib/server/supabase.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ sukses: false, pesan: 'Belum masuk.' }, { status: 401 });
	}
	if (locals.peran !== 'mentor' && locals.peran !== 'admin') {
		return json({ sukses: false, pesan: 'Hanya mentor yang bisa memverifikasi misi.' }, { status: 403 });
	}

	const body = (await request.json().catch(() => null)) as {
		peserta_id?: string;
		misi_id?: string;
	} | null;
	const pesertaId = String(body?.peserta_id ?? '');
	const misiId = String(body?.misi_id ?? '');
	if (!pesertaId || !misiId) {
		return json({ sukses: false, pesan: 'Data tidak lengkap.' }, { status: 400 });
	}

	const klien = klienWajib(locals.supabase);
	const { error } = await klien.from('penyelesaian').insert({
		peserta_id: pesertaId,
		misi_id: misiId,
		mentor_id: locals.peran === 'mentor' ? locals.user.id : null
	});

	if (error) {
		// 23505 = sudah tercatat sebelumnya (mis. kiriman antrean offline ganda).
		if (error.code === '23505') {
			return json({ sukses: true, catatan: 'sudah tercatat' });
		}
		// RLS menolak jika mentor bukan pembimbing kelompok peserta ini.
		if (error.code === '42501') {
			return json({ sukses: false, pesan: 'Peserta ini bukan anggota kelompokmu.' }, { status: 403 });
		}
		return json({ sukses: false, pesan: `Gagal menyimpan: ${error.message}` }, { status: 400 });
	}

	return json({ sukses: true });
};

/** Batalkan salah tandai. Aman dipanggil ganda (mis. ketuk dua kali). */
export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ sukses: false, pesan: 'Belum masuk.' }, { status: 401 });
	}
	if (locals.peran !== 'mentor' && locals.peran !== 'admin') {
		return json({ sukses: false, pesan: 'Hanya mentor yang bisa membatalkan verifikasi.' }, { status: 403 });
	}

	const body = (await request.json().catch(() => null)) as {
		peserta_id?: string;
		misi_id?: string;
	} | null;
	const pesertaId = String(body?.peserta_id ?? '');
	const misiId = String(body?.misi_id ?? '');
	if (!pesertaId || !misiId) {
		return json({ sukses: false, pesan: 'Data tidak lengkap.' }, { status: 400 });
	}

	const klien = klienWajib(locals.supabase);
	// RLS "mentor kelompok boleh membatalkan": baris di luar kelompok mentor
	// tersaring diam-diam (tidak terhapus, tanpa galat) — aman.
	const { error } = await klien
		.from('penyelesaian')
		.delete()
		.eq('peserta_id', pesertaId)
		.eq('misi_id', misiId);

	if (error) {
		if (error.code === '42501') {
			return json({ sukses: false, pesan: 'Peserta ini bukan anggota kelompokmu.' }, { status: 403 });
		}
		return json({ sukses: false, pesan: `Gagal membatalkan: ${error.message}` }, { status: 400 });
	}

	return json({ sukses: true });
};
