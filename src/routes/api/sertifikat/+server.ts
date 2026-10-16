// Unduh sertifikat PDF. Peserta hanya bisa mengunduh sertifikatnya sendiri;
// admin boleh meminta atas nama peserta mana pun lewat ?peserta_id=.

import { error, type RequestHandler } from '@sveltejs/kit';
import { TIER_THRESHOLDS } from '#lib/constants/points.js';
import { buatKlienAdmin, klienWajib } from '#lib/server/supabase.js';
import { muatRekap } from '#lib/server/rekap.js';
import { buatSertifikat, namaFileSertifikat, type TierSertifikat } from '#lib/server/certificate.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Silakan masuk dulu.');

	const admin = klienWajib(buatKlienAdmin());

	let id = locals.user.id;
	if (locals.peran === 'admin') {
		const diminta = url.searchParams.get('peserta_id');
		if (diminta) id = diminta;
	} else if (locals.peran !== 'peserta') {
		error(403, 'Hanya peserta dan panitia yang bisa mengunduh sertifikat.');
	}

	const rekap = await muatRekap(admin, { pesertaIds: [id] });
	const baris = rekap.baris[0];
	if (!baris) error(404, 'Data peserta tidak ditemukan.');
	if (baris.tier === 'none') {
		error(400, `Sertifikat tersedia mulai tier Explorer (${TIER_THRESHOLDS.explorer} poin).`);
	}

	const data = {
		nama: baris.peserta.nama,
		nim: baris.peserta.nim,
		tier: baris.tier as TierSertifikat,
		tanggal: new Date().toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
	};

	// Salin ke Uint8Array baru agar tipenya ArrayBuffer (BodyInit), bukan ArrayBufferLike.
	const bytes = new Uint8Array(await buatSertifikat(data));
	return new Response(bytes, {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `attachment; filename="${namaFileSertifikat(data)}"`,
			'cache-control': 'private, no-store'
		}
	});
};
