// Ekspor CSV untuk panitia (PRD bagian 4 dan 8). Hanya peran admin.

import { error, type RequestHandler } from '@sveltejs/kit';
import { buatKlienAdmin, klienWajib } from '#lib/server/supabase.js';
import { muatRekap } from '#lib/server/rekap.js';
import { keCsv, type NilaiCsv } from '#lib/server/csv.js';
import { ACARA } from '#lib/constants/acara.js';
import type { MisiRow, PenyelesaianRow } from '#lib/types.js';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (locals.peran !== 'admin') {
		error(403, 'Ekspor hanya untuk panitia inti.');
	}

	const admin = klienWajib(buatKlienAdmin());
	const jenis = url.searchParams.get('jenis') ?? 'peserta';
	const rekap = await muatRekap(admin);

	let header: string[] = [];
	let isi: NilaiCsv[][] = [];

	if (jenis === 'peserta') {
		header = [
			'nim', 'nama', 'whatsapp', 'pengalaman', 'kendala', 'bawa_laptop', 'hadir', 'waktu_checkin',
			'kelompok', 'mentor', 'poin', 'tier', 'badge', 'misi_level1', 'misi_level2', 'misi_level3',
			'pretest', 'posttest', 'trivia_skor', 'error_collector', 'buddy_assist', 'survei_lebih_siap'
		];
		isi = rekap.baris.map((b) => [
			b.peserta.nim,
			b.peserta.nama,
			b.peserta.whatsapp,
			b.peserta.pengalaman,
			b.peserta.kendala,
			b.peserta.bawa_laptop,
			b.bahan.hadir,
			b.peserta.checkin_pada,
			b.namaKelompok,
			b.namaMentor,
			b.poin,
			b.tier,
			b.badges.join(' | '),
			b.bahan.misiSelesai[0],
			b.bahan.misiSelesai[1],
			b.bahan.misiSelesai[2],
			b.skorPretest,
			b.skorPosttest,
			b.skorTrivia,
			b.bahan.errorCollector,
			b.bahan.buddyAssist,
			b.lebihSiap
		]);
	} else if (jenis === 'misi') {
		const [penyelesaian, misi, peserta, mentor] = await Promise.all([
			admin.from('penyelesaian').select('*').order('diselesaikan_pada'),
			admin.from('misi').select('*'),
			admin.from('peserta').select('id, nim, nama'),
			admin.from('mentor').select('id, nama')
		]);
		const misiMap = new Map<string, MisiRow>((misi.data ?? []).map((m) => [m.id as string, m as MisiRow]));
		const pesertaMap = new Map((peserta.data ?? []).map((p) => [p.id as string, p]));
		const mentorMap = new Map((mentor.data ?? []).map((m) => [m.id as string, m.nama as string]));

		header = ['nim', 'nama', 'level', 'misi', 'poin', 'mentor_verifikator', 'waktu'];
		isi = ((penyelesaian.data ?? []) as PenyelesaianRow[]).map((r) => {
			const m = misiMap.get(r.misi_id);
			const p = pesertaMap.get(r.peserta_id) as { nim?: string; nama?: string } | undefined;
			return [
				p?.nim ?? '',
				p?.nama ?? '',
				m?.level_id ?? '',
				m?.judul ?? '',
				m?.poin ?? '',
				r.mentor_id ? mentorMap.get(r.mentor_id) ?? '' : '',
				r.diselesaikan_pada
			];
		});
	} else if (jenis === 'tes') {
		const [hasil, peserta] = await Promise.all([
			admin.from('hasil_tes').select('*').order('dikerjakan_pada'),
			admin.from('peserta').select('id, nim, nama')
		]);
		const pesertaMap = new Map((peserta.data ?? []).map((p) => [p.id as string, p]));
		header = ['nim', 'nama', 'jenis_tes', 'benar', 'total', 'skor', 'waktu'];
		isi = (hasil.data ?? []).map((h) => {
			const p = pesertaMap.get(h.peserta_id as string) as { nim?: string; nama?: string } | undefined;
			return [p?.nim ?? '', p?.nama ?? '', h.jenis, h.benar, h.total, h.skor, h.dikerjakan_pada];
		});
	} else if (jenis === 'survei') {
		const [survei, peserta] = await Promise.all([
			admin.from('survei').select('*').order('dibuat_pada'),
			admin.from('peserta').select('id, nim, nama')
		]);
		const pesertaMap = new Map((peserta.data ?? []).map((p) => [p.id as string, p]));
		header = ['nim', 'nama', 'lebih_siap', 'saran', 'waktu'];
		isi = (survei.data ?? []).map((s) => {
			const p = pesertaMap.get(s.peserta_id as string) as { nim?: string; nama?: string } | undefined;
			return [p?.nim ?? '', p?.nama ?? '', s.lebih_siap, s.saran ?? '', s.dibuat_pada];
		});
	} else if (jenis === 'ringkasan') {
		const total = rekap.baris.length;
		const hadir = rekap.baris.filter((b) => b.bahan.hadir).length;
		const builderPlus = rekap.baris.filter((b) => b.poin >= 23).length;
		const l3Tuntas = rekap.baris.filter(
			(b) => b.bahan.misiSelesai[2] >= rekap.misiPerLevel[2].length
		).length;
		const l2Tuntas = rekap.baris.filter(
			(b) => b.bahan.misiSelesai[1] >= rekap.misiPerLevel[1].length
		).length;
		const rata = (xs: number[]) =>
			xs.length ? Math.round(xs.reduce((a, c) => a + c, 0) / xs.length) : null;
		const pre = rata(rekap.baris.map((b) => b.skorPretest).filter((v): v is number => v !== null));
		const post = rata(rekap.baris.map((b) => b.skorPosttest).filter((v): v is number => v !== null));
		const survei = rekap.baris.filter((b) => b.lebihSiap !== null);
		const persenSiap = survei.length
			? Math.round((100 * survei.filter((b) => b.lebihSiap).length) / survei.length)
			: null;

		header = ['metrik', 'nilai', 'target'];
		isi = [
			['Peserta terdaftar', total, ACARA.kuotaPeserta],
			['Peserta hadir (KR1)', hadir, ACARA.kuotaPeserta],
			['Level 2 tuntas: pasang IDE dan buat folder (KR1)', l2Tuntas, total],
			['Peserta tier Builder atau lebih (KR2)', builderPlus, 28],
			['Peserta menyelesaikan Error Hunt tanpa bantuan (KR2)', l3Tuntas, 26],
			['Rata-rata skor pre-test', pre, ''],
			['Rata-rata skor post-test', post, ''],
			['Kenaikan skor rata-rata (poin persentase, KR3)', pre !== null && post !== null ? post - pre : null, 30],
			['Jawaban "lebih siap" di survei % (KR3)', persenSiap, 90],
			['Survei terisi', survei.length, total]
		];
	} else {
		error(404, 'Jenis ekspor tidak dikenal.');
	}

	const csv = keCsv(header, isi);
	const tanggal = new Date().toISOString().slice(0, 10);
	return new Response(csv, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="codequest-${jenis}-${tanggal}.csv"`,
			'cache-control': 'no-store'
		}
	});
};
