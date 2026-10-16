import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { buatKlienAdmin, klienWajib } from '#lib/server/supabase.js';
import { muatRekap } from '#lib/server/rekap.js';
import { ACARA } from '#lib/constants/acara.js';
import type { KelompokRow } from '#lib/types.js';

export const load: PageServerLoad = async () => {
	const admin = klienWajib(buatKlienAdmin());
	const [rekap, kelompok] = await Promise.all([
		muatRekap(admin),
		admin.from('kelompok').select('*').order('nama')
	]);

	return {
		kuota: ACARA.kuotaPeserta,
		kelompok: (kelompok.data ?? []) as KelompokRow[],
		baris: rekap.baris.map((b) => ({
			id: b.peserta.id,
			nama: b.peserta.nama,
			nim: b.peserta.nim,
			whatsapp: b.peserta.whatsapp,
			bawaLaptop: b.peserta.bawa_laptop,
			checkin: b.peserta.checkin_pada,
			kelompokId: b.peserta.kelompok_id,
			poin: b.poin,
			tier: b.tier,
			misiSelesai: b.bahan.misiSelesai.reduce((a, c) => a + c, 0),
			badges: b.badges.length
		}))
	};
};

// Sandi sementara acak yang mudah dibacakan panitia (tanpa 0/O dan 1/l/I).
const KARAKTER_SANDI = 'abcdefghjkmnpqrstuvwxyz23456789';

function sandiAcak(panjang = 8): string {
	const nilai = new Uint32Array(panjang);
	crypto.getRandomValues(nilai);
	return Array.from(nilai, (n) => KARAKTER_SANDI[n % KARAKTER_SANDI.length]).join('');
}

export const actions: Actions = {
	reset: async ({ request }) => {
		const admin = klienWajib(buatKlienAdmin());
		const form = await request.formData();
		const pesertaId = String(form.get('peserta_id') ?? '');
		if (!pesertaId) return fail(400, { pesan: 'Peserta tidak dikenali.' });

		const { data: peserta } = await admin
			.from('peserta')
			.select('id, nama, nim')
			.eq('id', pesertaId)
			.maybeSingle();
		if (!peserta) return fail(404, { pesan: 'Peserta tidak ditemukan.' });

		const sandiBaru = sandiAcak();
		const { error } = await admin.auth.admin.updateUserById(String(peserta.id), {
			password: sandiBaru
		});
		if (error) return fail(500, { pesan: `Gagal mereset sandi: ${error.message}` });

		return {
			pesan: `Sandi baru untuk ${peserta.nama} (${peserta.nim}): ${sandiBaru} — catat sekarang, pesan ini hilang saat halaman dimuat ulang.`
		};
	},
	kelompok: async ({ request }) => {
		const admin = klienWajib(buatKlienAdmin());
		const form = await request.formData();
		const pesertaId = String(form.get('peserta_id') ?? '');
		const kelompokId = String(form.get('kelompok_id') ?? '').trim();

		if (!pesertaId) return fail(400, { pesan: 'Peserta tidak dikenali.' });

		// Peringatan lunak bila kelompok sudah berisi 4 orang.
		if (kelompokId) {
			const { count } = await admin
				.from('peserta')
				.select('id', { count: 'exact', head: true })
				.eq('kelompok_id', kelompokId);
			if ((count ?? 0) >= 4) {
				const { error } = await admin
					.from('peserta')
					.update({ kelompok_id: kelompokId })
					.eq('id', pesertaId);
				if (error) return fail(500, { pesan: error.message });
				return {
					pesan: 'Tersimpan, tapi kelompok itu sudah 4 orang. Periksa kembali pembagiannya.'
				};
			}
		}

		const { error } = await admin
			.from('peserta')
			.update({ kelompok_id: kelompokId || null })
			.eq('id', pesertaId);
		if (error) return fail(500, { pesan: `Gagal menyimpan: ${error.message}` });
		return { pesan: 'Kelompok peserta diperbarui.' };
	}
};
