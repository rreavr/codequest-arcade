// Sertifikat tier (P1): PDF dibuat otomatis dari data peserta dan tier.
// Memakai pdf-lib supaya bisa jalan di server tanpa layanan tambahan.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ACARA, LABEL_TIER } from '#lib/constants/acara.js';

export type TierSertifikat = 'explorer' | 'builder' | 'champion';

export interface DataSertifikat {
	nama: string;
	nim: string;
	tier: TierSertifikat;
	/** Tanggal cetak; format teks Indonesia. */
	tanggal?: string;
}

const WARNA_TIER: Record<TierSertifikat, ReturnType<typeof rgb>> = {
	explorer: rgb(0.05, 0.5, 0.45),
	builder: rgb(0.37, 0.24, 0.72),
	champion: rgb(0.72, 0.45, 0.05)
};

const VIOLET = rgb(0.29, 0.2, 0.62);
const GELAP = rgb(0.13, 0.11, 0.26);
const ABU = rgb(0.42, 0.42, 0.5);

export function namaFileSertifikat(d: DataSertifikat): string {
	return `sertifikat-${d.tier}-${d.nim}.pdf`;
}

export async function buatSertifikat(d: DataSertifikat): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	pdf.setTitle(`Sertifikat ${LABEL_TIER[d.tier]} - ${d.nama}`);
	pdf.setAuthor(ACARA.penyelenggara);
	pdf.setSubject(ACARA.nama);

	const halaman = pdf.addPage([842, 595]); // A4 lanskap dalam poin
	const { width, height } = halaman.getSize();

	const tebal = await pdf.embedFont(StandardFonts.HelveticaBold);
	const biasa = await pdf.embedFont(StandardFonts.Helvetica);
	const miring = await pdf.embedFont(StandardFonts.HelveticaOblique);
	const serif = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);

	const tengah = (teks: string, font: typeof tebal, ukuran: number, y: number, warna = GELAP) => {
		const lebar = font.widthOfTextAtSize(teks, ukuran);
		halaman.drawText(teks, { x: (width - lebar) / 2, y, size: ukuran, font, color: warna });
	};

	// Bingkai
	halaman.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: VIOLET, borderWidth: 3 });
	halaman.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderColor: rgb(0.8, 0.78, 0.9), borderWidth: 1 });
	halaman.drawRectangle({ x: 24, y: height - 44, width: width - 48, height: 20, color: VIOLET });

	tengah(ACARA.namaPendek.toUpperCase(), tebal, 16, height - 100, VIOLET);
	tengah('SERTIFIKAT PENGHARGAAN', biasa, 12, height - 122, ABU);

	const tier = LABEL_TIER[d.tier].toUpperCase();
	tengah(tier, serif, 46, height - 178, WARNA_TIER[d.tier]);

	tengah('diberikan kepada', miring, 12, height - 216, ABU);
	tengah(d.nama, serif, 32, height - 254, GELAP);

	const barisNim = `NIM ${d.nim}`;
	tengah(barisNim, biasa, 11, height - 278, ABU);

	const paragraf = [
		`atas dedikasi menyelesaikan rangkaian misi ${ACARA.nama} pada ${ACARA.tanggal}`,
		`dan mencapai tier ${LABEL_TIER[d.tier]}. Teruslah membangun, bereksperimen, dan berbagi.`
	];
	paragraf.forEach((baris, i) => tengah(baris, biasa, 11.5, height - 318 - i * 18, GELAP));

	// Catatan Academic Vault untuk semua peserta
	tengah('Academic Vault dan grup mentoring terbuka untuk semua peserta yang hadir.', miring, 10, 96, ABU);

	// Kaki: tanggal dan penyelenggara
	const tanggal = d.tanggal ?? ACARA.tanggal;
	halaman.drawText(tanggal, { x: 64, y: 64, size: 10.5, font: biasa, color: ABU });
	const teksPenyelenggara = `Panitia ${ACARA.penyelenggara}`;
	const lebarPenyelenggara = biasa.widthOfTextAtSize(teksPenyelenggara, 10.5);
	halaman.drawText(teksPenyelenggara, { x: width - 64 - lebarPenyelenggara, y: 64, size: 10.5, font: biasa, color: ABU });

	return pdf.save();
}
