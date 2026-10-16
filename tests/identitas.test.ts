import { describe, expect, it } from 'vitest';
import { PESAN_IDENTITAS_TIDAK_COCOK, namaCocok, normalkanWa } from '../src/lib/identitas';

describe('normalkanWa', () => {
	it('mengubah awalan 0 menjadi 62', () => {
		expect(normalkanWa('081234567890')).toBe('6281234567890');
		expect(normalkanWa('0812-3456-7890')).toBe('6281234567890');
		expect(normalkanWa('0812 3456 7890')).toBe('6281234567890');
	});

	it('membersihkan +, spasi, tanda hubung, titik, dan kurung', () => {
		expect(normalkanWa('+62 (812) 3456-7890')).toBe('6281234567890');
		expect(normalkanWa('62.812.3456.7890')).toBe('6281234567890');
	});

	it('membiarkan nomor 62 yang sudah normal', () => {
		expect(normalkanWa('6281234567890')).toBe('6281234567890');
	});
});

describe('namaCocok', () => {
	it('mengabaikan huruf besar/kecil dan spasi di tepi', () => {
		expect(namaCocok('Ani Suryani', 'ani suryani')).toBe(true);
		expect(namaCocok('  Ani Suryani ', 'ANI SURYANI')).toBe(true);
	});

	it('menolak nama yang berbeda', () => {
		expect(namaCocok('Ani Suryani', 'Ani Suriani')).toBe(false);
	});
});

describe('PESAN_IDENTITAS_TIDAK_COCOK', () => {
	it('meminta peserta memeriksa ketiga data pendaftaran lalu menghubungi panitia', () => {
		expect(PESAN_IDENTITAS_TIDAK_COCOK).toMatch(/NIM/);
		expect(PESAN_IDENTITAS_TIDAK_COCOK).toMatch(/nama/i);
		expect(PESAN_IDENTITAS_TIDAK_COCOK).toMatch(/WhatsApp/);
		expect(PESAN_IDENTITAS_TIDAK_COCOK).toMatch(/panitia/i);
	});
});
