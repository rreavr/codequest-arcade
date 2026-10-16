import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { buatKlienAdmin, klienWajib } from '#lib/server/supabase.js';
import type { PesertaRow } from '#lib/types.js';

export const load: PageServerLoad = async () => {
	const admin = klienWajib(buatKlienAdmin());
	const [peserta, kelompok] = await Promise.all([
		admin.from('peserta').select('id, nama, nim, checkin_pada, kelompok_id').order('nama'),
		admin.from('kelompok').select('id, nama')
	]);
	return {
		peserta: (peserta.data ?? []) as Pick<PesertaRow, 'id' | 'nama' | 'nim' | 'checkin_pada' | 'kelompok_id'>[],
		kelompok: (kelompok.data ?? []) as { id: string; nama: string }[]
	};
};

export const actions: Actions = {
	checkin: async ({ request }) => {
		const admin = klienWajib(buatKlienAdmin());
		const form = await request.formData();
		const nim = String(form.get('nim') ?? '').trim();
		const pesertaId = String(form.get('peserta_id') ?? '').trim();

		let kueri = admin.from('peserta').select('*');
		kueri = pesertaId ? kueri.eq('id', pesertaId) : kueri.eq('nim', nim);
		const { data: target } = await kueri.maybeSingle();
		if (!target) {
			return fail(404, { pesan: pesertaId ? 'Peserta tidak ditemukan.' : `NIM ${nim} tidak ditemukan.` });
		}

		const p = target as PesertaRow;
		const waktu = (iso: string) =>
			new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

		if (p.checkin_pada) {
			return { pesan: `${p.nama} sudah check-in pukul ${waktu(p.checkin_pada)}.`, status: 'sudah' as const };
		}

		const { error } = await admin
			.from('peserta')
			.update({ checkin_pada: new Date().toISOString() })
			.eq('id', p.id);
		if (error) return fail(500, { pesan: `Gagal menyimpan: ${error.message}` });

		return { pesan: `${p.nama} (${p.nim}) tercatat hadir.`, status: 'baru' as const };
	}
};
