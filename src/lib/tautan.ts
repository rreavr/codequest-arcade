// Validasi tautan bukti tugas untuk klaim misi: wajib URL Google Drive atau
// GitHub. Dipakai server (aksi klaim di halaman level) dan klien (pemeriksaan
// sebelum formulir dikirim, supaya peserta langsung tahu bila tautannya salah).

export const PESAN_TAUTAN =
	'Tautan tugas wajib berupa URL Google Drive (drive.google.com / docs.google.com) atau GitHub (github.com). Contoh: https://github.com/nama-kamu/repo-proyek';

export function tautanTugasValid(nilai: string): boolean {
	let url: URL;
	try {
		url = new URL(nilai.trim());
	} catch {
		return false;
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
	if (url.pathname === '' || url.pathname === '/') return false;

	const host = url.hostname.toLowerCase();
	const github =
		host === 'github.com' ||
		host.endsWith('.github.com') ||
		host.endsWith('.github.io') ||
		host.endsWith('.githubusercontent.com');
	const google = host === 'drive.google.com' || host === 'docs.google.com';
	return github || google;
}

// Validasi tautan berkas Academic Vault (materi yang dibagikan panitia): boleh
// dari layanan mana saja (rekomendasi Google Drive) asal berupa URL http(s)
// lengkap. Dipakai server (aksi /kelola/vault) dan klien.

export const PESAN_VAULT =
	'Isi tautan lengkap yang diawali https:// — misalnya tautan Google Drive (https://drive.google.com/file/d/...). Pastikan aksesnya "siapa saja yang memiliki tautan".';

export function tautanVaultValid(nilai: string): boolean {
	let url: URL;
	try {
		url = new URL(nilai.trim());
	} catch {
		return false;
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
	if (url.pathname === '' || url.pathname === '/') return false;
	return url.hostname.includes('.');
}
