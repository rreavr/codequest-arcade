// Klien R2 (API S3) sisi server — penyimpanan berkas Academic Vault.
//
// Semua akses lewat server: daftar isi bucket, tautan unduh bertanda tangan
// (presigned GET), unggah tahan duplikat (If-None-Match), dan hapus. Token R2
// disarankan di-scope hanya ke bucket vault. Jangan pernah bocorkan kredensial
// ke peramban.

import { AwsClient } from 'aws4fetch';
import { XMLParser } from 'fast-xml-parser';
import {
	R2_ACCESS_KEY_ID,
	R2_ACCOUNT_ID,
	R2_BUCKET,
	R2_SECRET_ACCESS_KEY
} from '$app/env/private';

export interface ObjekVault {
	key: string;
	ukuran: number | null;
	terakhirDiubah: string | null; // ISO-8601
}

interface KonfigurasiR2 {
	endpoint: string;
	bucket: string;
	klien: AwsClient;
}

const BUCKET_BAWAAN = 'codequest-vault';

/** Konfigurasi R2 dari environment; null saat belum diisi (mode "belum dikonfigurasi"). */
export function konfigurasiR2(): KonfigurasiR2 | null {
	const akun = R2_ACCOUNT_ID;
	const akses = R2_ACCESS_KEY_ID;
	const rahasia = R2_SECRET_ACCESS_KEY;
	if (!akun || !akses || !rahasia) return null;

	return {
		endpoint: `https://${akun}.r2.cloudflarestorage.com`,
		bucket: R2_BUCKET || BUCKET_BAWAAN,
		klien: new AwsClient({
			accessKeyId: akses,
			secretAccessKey: rahasia,
			service: 's3',
			region: 'auto'
		})
	};
}

/** URL objek tanpa tanda tangan (nama berkas kita datar — tanpa garis miring). */
function urlObjek(conf: KonfigurasiR2, key: string): URL {
	return new URL(`${conf.endpoint}/${conf.bucket}/${encodeURIComponent(key)}`);
}

/** Daftar berkas di bucket, terbaru dulu. */
export async function daftarBerkas(): Promise<{ berkas: ObjekVault[]; galat: string | null }> {
	const conf = konfigurasiR2();
	if (!conf) return { berkas: [], galat: 'belum-dikonfigurasi' };

	const url = new URL(`${conf.endpoint}/${conf.bucket}`);
	url.searchParams.set('list-type', '2');
	url.searchParams.set('max-keys', '1000');

	try {
		const res = await conf.klien.fetch(url, { method: 'GET' });
		if (!res.ok) {
			const teks = await res.text().catch(() => '');
			return { berkas: [], galat: `R2 ${res.status}: ${teks.slice(0, 200) || res.statusText}` };
		}

		const parser = new XMLParser({
			ignoreAttributes: true,
			parseTagValue: false,
			isArray: (nama) => nama === 'Contents'
		});
		const hasil = parser.parse(await res.text()) as {
			ListBucketResult?: { Contents?: { Key?: string; Size?: string; LastModified?: string }[] };
		};

		const berkas = (hasil.ListBucketResult?.Contents ?? []).map((o) => ({
			key: String(o.Key ?? ''),
			ukuran: o.Size !== undefined ? Number(o.Size) : null,
			terakhirDiubah: o.LastModified ? String(o.LastModified) : null
		}));
		// Terbaru dulu; LastModified berupa ISO-8601 sehingga perbandingan teks cukup.
		berkas.sort((a, b) => (b.terakhirDiubah ?? '').localeCompare(a.terakhirDiubah ?? ''));
		return { berkas, galat: null };
	} catch (e) {
		return { berkas: [], galat: e instanceof Error ? e.message : 'gagal menghubungi R2' };
	}
}

/** Tautan unduh bertanda tangan (presigned GET) berumur `detik` (maks 7 hari). */
export async function tautanUnduh(key: string, detik: number): Promise<string | null> {
	const conf = konfigurasiR2();
	if (!conf) return null;

	const url = urlObjek(conf, key);
	url.searchParams.set('X-Amz-Expires', String(Math.min(Math.max(detik, 60), 604800)));
	const tanda = await conf.klien.sign(url, { method: 'GET', aws: { signQuery: true } });
	return tanda.url;
}

/** Unggah berkas baru; menolak menimpa yang lama (If-None-Match: * → 412). */
export async function unggahBerkas(
	key: string,
	isi: Blob,
	tipe: string
): Promise<{ ok: true } | { ok: false; duplikat: boolean; pesan: string }> {
	const conf = konfigurasiR2();
	if (!conf) return { ok: false, duplikat: false, pesan: 'R2 belum dikonfigurasi di server' };

	try {
		const res = await conf.klien.fetch(urlObjek(conf, key), {
			method: 'PUT',
			headers: {
				'Content-Type': tipe || 'application/octet-stream',
				'If-None-Match': '*'
			},
			body: isi
		});
		if (res.ok) return { ok: true };
		if (res.status === 412) {
			return { ok: false, duplikat: true, pesan: 'sudah ada — hapus dulu bila ingin mengganti' };
		}
		const teks = await res.text().catch(() => '');
		return {
			ok: false,
			duplikat: false,
			pesan: `R2 ${res.status}: ${teks.slice(0, 200) || res.statusText}`
		};
	} catch (e) {
		return { ok: false, duplikat: false, pesan: e instanceof Error ? e.message : 'gagal menghubungi R2' };
	}
}

/** Hapus berkas dari bucket. */
export async function hapusBerkas(key: string): Promise<{ ok: boolean; pesan?: string }> {
	const conf = konfigurasiR2();
	if (!conf) return { ok: false, pesan: 'R2 belum dikonfigurasi di server' };

	try {
		const res = await conf.klien.fetch(urlObjek(conf, key), { method: 'DELETE' });
		if (res.ok || res.status === 404) return { ok: true };
		const teks = await res.text().catch(() => '');
		return { ok: false, pesan: `R2 ${res.status}: ${teks.slice(0, 200) || res.statusText}` };
	} catch (e) {
		return { ok: false, pesan: e instanceof Error ? e.message : 'gagal menghubungi R2' };
	}
}
