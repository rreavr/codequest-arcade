import { MISSIONS_PER_LEVEL, POINTS, TIER_THRESHOLDS, type Tier } from '../constants/points';

export interface Progress {
	baseCampDone: boolean;
	/** Jumlah misi selesai per level, 0 sampai 3. */
	level1Missions: number;
	level2Missions: number;
	level3Missions: number;
	triviaPoints: number;
	errorCollectorCount: number;
	buddyAssistCount: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/** Jumlahkan semua komponen poin; tiap komponen dijepit ke batasnya lebih dulu. */
export function totalPoints(p: Progress): number {
	const base = p.baseCampDone ? POINTS.baseCamp : 0;
	const l1 = clamp(p.level1Missions, 0, MISSIONS_PER_LEVEL) * POINTS.level1PerMission;
	const l2 = clamp(p.level2Missions, 0, MISSIONS_PER_LEVEL) * POINTS.level2PerMission;
	const l3 = clamp(p.level3Missions, 0, MISSIONS_PER_LEVEL) * POINTS.level3PerMission;
	const trivia = clamp(p.triviaPoints, 0, POINTS.trivia);
	const err =
		clamp(p.errorCollectorCount, 0, POINTS.errorCollectorMaxCount) * POINTS.errorCollectorEach;
	const buddy = clamp(p.buddyAssistCount, 0, POINTS.buddyAssistMaxCount) * POINTS.buddyAssistEach;
	return base + l1 + l2 + l3 + trivia + err + buddy;
}

/** Tier tertinggi yang ambangnya sudah terlewati. */
export function tierFor(points: number): Tier {
	if (points >= TIER_THRESHOLDS.champion) return 'champion';
	if (points >= TIER_THRESHOLDS.builder) return 'builder';
	if (points >= TIER_THRESHOLDS.explorer) return 'explorer';
	return 'none';
}

/** Badge level terbuka saat ketiga misi di level itu selesai. */
export function badgesFor(p: Progress): string[] {
	const badges: string[] = [];
	if (p.level1Missions >= MISSIONS_PER_LEVEL) badges.push('Logic Navigator');
	if (p.level2Missions >= MISSIONS_PER_LEVEL) badges.push('IDE Explorer');
	if (p.level3Missions >= MISSIONS_PER_LEVEL) badges.push('Hello World Champ');
	return badges;
}
