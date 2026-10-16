import { describe, expect, it } from 'vitest';
import { keCsv } from '../src/lib/server/csv';

describe('keCsv (ekspor panitia)', () => {
	it('memakai BOM dan pemisah titik koma supaya rapi di Excel', () => {
		const csv = keCsv(['nama', 'poin'], [['Rani', 12]]);
		expect(csv.startsWith('\uFEFF')).toBe(true);
		expect(csv).toBe('\uFEFFnama;poin\r\nRani;12\r\n');
	});

	it('mengosongkan null dan undefined, serta menerjemahkan boolean', () => {
		const csv = keCsv(['a', 'b', 'c'], [[null, undefined, true], [false, '', '']]);
		expect(csv).toBe('\uFEFFa;b;c\r\n;;ya\r\ntidak;;\r\n');
	});

	it('mengutip sel yang memuat titik koma, kutip, atau baris baru', () => {
		const csv = keCsv(['catatan'], [['a;b'], ['kata "kutip"'], ['baris1\nbaris2']]);
		expect(csv).toBe('\uFEFFcatatan\r\n"a;b"\r\n"kata ""kutip"""\r\n"baris1\nbaris2"\r\n');
	});

	it('paksa nomor panjang (WhatsApp) jadi teks agar tidak notasi ilmiah di Excel', () => {
		const csv = keCsv(['whatsapp'], [['6288888888888']]);
		expect(csv).toBe('\uFEFFwhatsapp\r\n\'6288888888888\r\n');
	});

	it('menutup baris terakhir dengan CRLF', () => {
		const csv = keCsv(['x'], [[1]]);
		expect(csv.endsWith('\r\n')).toBe(true);
	});
});
