// Ikon situs — dari paket `pixelarticons` (MIT, 1036 ikon gratis, grid 24×24).
// Hanya ikon yang benar-benar dipakai yang diimpor agar bundel tetap kecil.
// `?raw` mengambil isi berkas SVG mentah saat build; lihat komponen `Ikon.svelte`.
import analytics from 'pixelarticons/svg/analytics.svg?raw';
import arrowLeft from 'pixelarticons/svg/arrow-left.svg?raw';
import arrowRight from 'pixelarticons/svg/arrow-right.svg?raw';
import bookOpen from 'pixelarticons/svg/book-open.svg?raw';
import box from 'pixelarticons/svg/box.svg?raw';
import bug from 'pixelarticons/svg/bug.svg?raw';
import check from 'pixelarticons/svg/check.svg?raw';
import checkboxOn from 'pixelarticons/svg/checkbox-on.svg?raw';
import circle from 'pixelarticons/svg/circle.svg?raw';
import circleQuestion from 'pixelarticons/svg/circle-question.svg?raw';
import clipboard from 'pixelarticons/svg/clipboard.svg?raw';
import clock from 'pixelarticons/svg/clock.svg?raw';
import crown from 'pixelarticons/svg/crown.svg?raw';
import download from 'pixelarticons/svg/download.svg?raw';
import externalLink from 'pixelarticons/svg/external-link.svg?raw';
import flag from 'pixelarticons/svg/flag.svg?raw';
import home from 'pixelarticons/svg/home.svg?raw';
import hourglass from 'pixelarticons/svg/hourglass.svg?raw';
import key from 'pixelarticons/svg/key.svg?raw';
import laptop from 'pixelarticons/svg/laptop.svg?raw';
import lightbulb from 'pixelarticons/svg/lightbulb.svg?raw';
import lock from 'pixelarticons/svg/lock.svg?raw';
import login from 'pixelarticons/svg/login.svg?raw';
import logout from 'pixelarticons/svg/logout.svg?raw';
import minus from 'pixelarticons/svg/minus.svg?raw';
import pencil from 'pixelarticons/svg/pencil.svg?raw';
import reload from 'pixelarticons/svg/reload.svg?raw';
import save from 'pixelarticons/svg/save.svg?raw';
import send from 'pixelarticons/svg/send.svg?raw';
import shield from 'pixelarticons/svg/shield.svg?raw';
import smile from 'pixelarticons/svg/smile.svg?raw';
import sparkles from 'pixelarticons/svg/sparkles.svg?raw';
import star from 'pixelarticons/svg/star.svg?raw';
import target from 'pixelarticons/svg/target.svg?raw';
import trash from 'pixelarticons/svg/trash.svg?raw';
import trophy from 'pixelarticons/svg/trophy.svg?raw';
import upload from 'pixelarticons/svg/upload.svg?raw';
import user from 'pixelarticons/svg/user.svg?raw';
import users from 'pixelarticons/svg/users.svg?raw';
import zap from 'pixelarticons/svg/zap.svg?raw';

/** Buang pembungkus <svg> agar isi ikon bisa ditempel ke <svg> milik komponen Ikon. */
function isi(svg: string): string {
	return svg
		.replace(/^[\s\S]*?<svg[^>]*>/, '')
		.replace(/<\/svg>\s*$/, '')
		.trim();
}

/** Peta nama ikon ke markup SVG dari paket pixelarticons. */
export const IKON = {
	analytics: isi(analytics),
	'arrow-left': isi(arrowLeft),
	'arrow-right': isi(arrowRight),
	'book-open': isi(bookOpen),
	box: isi(box),
	bug: isi(bug),
	check: isi(check),
	'checkbox-on': isi(checkboxOn),
	circle: isi(circle),
	'circle-question': isi(circleQuestion),
	clipboard: isi(clipboard),
	clock: isi(clock),
	crown: isi(crown),
	download: isi(download),
	'external-link': isi(externalLink),
	flag: isi(flag),
	home: isi(home),
	hourglass: isi(hourglass),
	key: isi(key),
	laptop: isi(laptop),
	lightbulb: isi(lightbulb),
	lock: isi(lock),
	login: isi(login),
	logout: isi(logout),
	minus: isi(minus),
	pencil: isi(pencil),
	reload: isi(reload),
	save: isi(save),
	send: isi(send),
	smile: isi(smile),
	sparkles: isi(sparkles),
	star: isi(star),
	target: isi(target),
	trash: isi(trash),
	trophy: isi(trophy),
	upload: isi(upload),
	user: isi(user),
	users: isi(users),
	zap: isi(zap)
} as const;

export type NamaIkon = keyof typeof IKON;
