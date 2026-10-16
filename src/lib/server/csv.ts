// Pembuat CSV untuk ekspor panitia.
// Memakai pemisah titik koma + BOM supaya rapi saat dibuka di Excel/Spreadsheet.

export type NilaiCsv = string | number | boolean | null | undefined;

function sel(v: NilaiCsv): string {
	if (v === null || v === undefined) return '';
	const s = typeof v === 'boolean' ? (v ? 'ya' : 'tidak') : String(v);
	// Excel otomatis mengubah angka panjang (mis. nomor WhatsApp 62888…) menjadi
	// notasi ilmiah (6,28E+12). Awali petik supaya sel diforce sebagai teks;
	// petik tidak ditampilkan saat dibuka di Excel / Spreadsheet.
	const teks = /^\d{11,}$/.test(s) ? `'${s}` : s;
	if (/["\n\r;]/.test(teks)) return `"${teks.replaceAll('"', '""')}"`;
	return teks;
}

export function keCsv(header: string[], baris: NilaiCsv[][]): string {
	const semua = [header, ...baris].map((r) => r.map(sel).join(';'));
	return '\uFEFF' + semua.join('\r\n') + '\r\n';
}
