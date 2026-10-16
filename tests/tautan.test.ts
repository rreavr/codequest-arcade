import { describe, expect, it } from 'vitest';
import { PESAN_TAUTAN, PESAN_VAULT, tautanTugasValid, tautanVaultValid } from '../src/lib/tautan';

describe('tautanTugasValid', () => {
	it('menerima tautan GitHub berupa repo, gist, raw, dan GitHub Pages', () => {
		expect(tautanTugasValid('https://github.com/abi/proyek')).toBe(true);
		expect(tautanTugasValid('http://github.com/abi/proyek')).toBe(true);
		expect(tautanTugasValid('https://gist.github.com/abi/abc123')).toBe(true);
		expect(tautanTugasValid('https://raw.githubusercontent.com/abi/proyek/main/README.md')).toBe(true);
		expect(tautanTugasValid('https://abi.github.io/proyek')).toBe(true);
		// URL parser menormalkan host menjadi huruf kecil.
		expect(tautanTugasValid('https://GITHUB.com/Abi/Proyek')).toBe(true);
		expect(tautanTugasValid('  https://github.com/abi/proyek  ')).toBe(true);
	});

	it('menerima tautan Google Drive dan Google Docs', () => {
		expect(tautanTugasValid('https://drive.google.com/file/d/abc123/view?usp=sharing')).toBe(true);
		expect(tautanTugasValid('https://drive.google.com/open?id=abc123')).toBe(true);
		expect(tautanTugasValid('https://docs.google.com/document/d/abc123/edit')).toBe(true);
	});

	it('menolak teks kosong dan bukan URL', () => {
		expect(tautanTugasValid('')).toBe(false);
		expect(tautanTugasValid('   ')).toBe(false);
		expect(tautanTugasValid('bukan-url')).toBe(false);
		expect(tautanTugasValid('github.com/abi/proyek')).toBe(false);
	});

	it('menolak host selain Drive/GitHub', () => {
		expect(tautanTugasValid('https://example.com/abi')).toBe(false);
		expect(tautanTugasValid('https://evil-github.com/abi')).toBe(false);
		expect(tautanTugasValid('https://github.com.evil.com/abi')).toBe(false);
		expect(tautanTugasValid('https://drive.google.com.evil.com/abc')).toBe(false);
		expect(tautanTugasValid('https://notgithub.io/abi')).toBe(false);
	});

	it('menolak skema selain http/https dan URL tanpa path', () => {
		expect(tautanTugasValid('ftp://github.com/abi')).toBe(false);
		expect(tautanTugasValid('javascript:alert(1)')).toBe(false);
		expect(tautanTugasValid('https://github.com')).toBe(false);
		expect(tautanTugasValid('https://drive.google.com/')).toBe(false);
	});

	it('punya pesan kesalahan yang menyebut Drive dan GitHub', () => {
		expect(PESAN_TAUTAN).toContain('Google Drive');
		expect(PESAN_TAUTAN).toContain('GitHub');
	});
});

describe('tautanVaultValid', () => {
	it('menerima tautan Google Drive dan Docs', () => {
		expect(tautanVaultValid('https://drive.google.com/file/d/abc123/view?usp=sharing')).toBe(true);
		expect(tautanVaultValid('https://docs.google.com/document/d/abc123/edit')).toBe(true);
	});

	it('menerima URL http(s) lengkap dari host lain', () => {
		expect(tautanVaultValid('https://example.com/materi.pdf')).toBe(true);
		expect(tautanVaultValid('  https://example.com/unduhan.zip  ')).toBe(true);
	});

	it('menolak teks kosong, bukan URL, dan skema selain http', () => {
		expect(tautanVaultValid('')).toBe(false);
		expect(tautanVaultValid('   ')).toBe(false);
		expect(tautanVaultValid('drive.google.com/file/d/abc')).toBe(false);
		expect(tautanVaultValid('javascript:alert(1)')).toBe(false);
		expect(tautanVaultValid('mailto:panitia@codequest.id')).toBe(false);
	});

	it('menolak URL tanpa path', () => {
		expect(tautanVaultValid('https://drive.google.com')).toBe(false);
		expect(tautanVaultValid('https://drive.google.com/')).toBe(false);
	});

	it('punya pesan kesalahan yang menyebut Google Drive', () => {
		expect(PESAN_VAULT).toContain('Google Drive');
	});
});
