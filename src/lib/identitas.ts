// Utilitas identitas peserta: normalisasi nomor WhatsApp dan pencocokan nama.
// Dipakai halaman daftar dan lupa sandi agar aturan pencocokan selalu sama.

export const PESAN_IDENTITAS_TIDAK_COCOK =
	'Data tidak cocok dengan pendaftaran. Periksa NIM, nama lengkap, dan nomor WhatsApp yang kamu daftarkan — atau hubungi panitia.';

/** Membersihkan pemisah (spasi, tanda hubung, titik, kurung) lalu menyeragamkan awalan ke 62. */
export function normalkanWa(wa: string): string {
	let angka = wa.replace(/[\s\-().]/g, '');
	if (angka.startsWith('+')) angka = angka.slice(1);
	if (angka.startsWith('0')) angka = '62' + angka.slice(1);
	return angka;
}

/** Bandingkan nama dengan mengabaikan huruf besar/kecil dan spasi di tepi. */
export function namaCocok(terdaftar: string, isian: string): boolean {
	return terdaftar.trim().toLowerCase() === isian.trim().toLowerCase();
}
