// Antrean verifikasi offline untuk mentor (PRD bagian 5 dan 7).
// Tanda "selesai" disimpan di IndexedDB saat Wi-Fi putus, lalu dikirim ulang
// otomatis begitu koneksi pulih. Aman dipakai di SSR (tidak melakukan apa-apa).

const NAMA_DB = 'codequest-arcade';
const TOKO = 'antrean-verifikasi';

export interface AntreanVerifikasi {
	/** kunci unik: peserta_id + misi_id */
	id: string;
	peserta_id: string;
	misi_id: string;
	dibuat_pada: number;
	percobaan: number;
}

function dukunganTersedia(): boolean {
	return typeof indexedDB !== 'undefined';
}

function bukaDb(): Promise<IDBDatabase> {
	return new Promise((selesai, gagal) => {
		const permintaan = indexedDB.open(NAMA_DB, 1);
		permintaan.onupgradeneeded = () => {
			const db = permintaan.result;
			if (!db.objectStoreNames.contains(TOKO)) {
				db.createObjectStore(TOKO, { keyPath: 'id' });
			}
		};
		permintaan.onsuccess = () => selesai(permintaan.result);
		permintaan.onerror = () => gagal(permintaan.error ?? new Error('Gagal membuka IndexedDB'));
	});
}

async function transaksi<T>(mode: IDBTransactionMode, aksi: (toko: IDBObjectStore) => IDBRequest<T>): Promise<T> {
	const db = await bukaDb();
	return new Promise<T>((selesai, gagal) => {
		const tx = db.transaction(TOKO, mode);
		const req = aksi(tx.objectStore(TOKO));
		req.onsuccess = () => selesai(req.result);
		req.onerror = () => gagal(req.error ?? new Error('Transaksi IndexedDB gagal'));
		tx.oncomplete = () => db.close();
	});
}

/** Simpan satu tanda verifikasi ke antrean lokal. */
export async function antrekanVerifikasi(pesertaId: string, misiId: string): Promise<void> {
	if (!dukunganTersedia()) return;
	const id = `${pesertaId}:${misiId}`;
	const lama = await transaksi<AntreanVerifikasi | undefined>('readonly', (toko) => toko.get(id));
	const item: AntreanVerifikasi = lama
		? { ...lama, percobaan: lama.percobaan + 1 }
		: { id, peserta_id: pesertaId, misi_id: misiId, dibuat_pada: Date.now(), percobaan: 0 };
	await transaksi('readwrite', (toko) => toko.put(item));
}

export async function daftarAntrean(): Promise<AntreanVerifikasi[]> {
	if (!dukunganTersedia()) return [];
	return transaksi<AntreanVerifikasi[]>('readonly', (toko) => toko.getAll() as IDBRequest<AntreanVerifikasi[]>);
}

export async function hapusDariAntrean(id: string): Promise<void> {
	if (!dukunganTersedia()) return;
	await transaksi('readwrite', (toko) => toko.delete(id));
}

export interface HasilKirim {
	terkirim: number;
	sisa: number;
}

/**
 * Kirim semua antrean ke /api/verifikasi. Item yang berhasil (atau sudah pernah
 * tersimpan di server) dihapus dari antrean; sisanya menunggu percobaan berikut.
 */
export async function kirimAntrean(): Promise<HasilKirim> {
	const daftar = await daftarAntrean();
	let terkirim = 0;
	for (const item of daftar) {
		try {
			const resp = await fetch('/api/verifikasi', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ peserta_id: item.peserta_id, misi_id: item.misi_id })
			});
			const hasil = await resp.json().catch(() => ({ sukses: false }));
			if (hasil?.sukses) {
				await hapusDariAntrean(item.id);
				terkirim += 1;
			}
		} catch {
			// masih offline; biarkan di antrean
		}
	}
	const sisa = (await daftarAntrean()).length;
	return { terkirim, sisa };
}

/** Panggil sekali di halaman mentor: kirim ulang otomatis saat kembali online. */
export function mulaiPemantauKoneksi(onSelesai?: (hasil: HasilKirim) => void): () => void {
	if (typeof window === 'undefined') return () => {};
	const jalankan = async () => {
		const hasil = await kirimAntrean();
		onSelesai?.(hasil);
	};
	const saatOnline = () => void jalankan();
	window.addEventListener('online', saatOnline);
	void jalankan();
	return () => window.removeEventListener('online', saatOnline);
}
