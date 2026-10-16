import { describe, expect, it } from 'vitest';
import { MAX_TOTAL_POINTS } from '../src/lib/constants/points';
import { badgesFor, tierFor, totalPoints, type Progress } from '../src/lib/server/points';

const allLevels: Progress = {
	baseCampDone: true,
	level1Missions: 3,
	level2Missions: 3,
	level3Missions: 3,
	triviaPoints: 0,
	errorCollectorCount: 0,
	buddyAssistCount: 0
};

describe('poin dan tier (PRD bagian 3)', () => {
	it('total poin maksimum adalah 30', () => {
		expect(MAX_TOTAL_POINTS).toBe(30);
	});

	it('menyelesaikan semua level tanpa trivia dan bonus = 23 poin = Builder (KR2)', () => {
		const pts = totalPoints(allLevels);
		expect(pts).toBe(23);
		expect(tierFor(pts)).toBe('builder');
	});

	it('Champion butuh minimal 27 poin', () => {
		const pts = totalPoints({ ...allLevels, triviaPoints: 3, errorCollectorCount: 1 });
		expect(pts).toBe(27);
		expect(tierFor(pts)).toBe('champion');
		expect(tierFor(26)).toBe('builder');
	});

	it('Explorer mulai dari 10 poin, di bawahnya belum ada tier', () => {
		expect(tierFor(10)).toBe('explorer');
		expect(tierFor(9)).toBe('none');
	});

	it('bonus dan trivia dibatasi maksimal', () => {
		const pts = totalPoints({
			...allLevels,
			triviaPoints: 99,
			errorCollectorCount: 99,
			buddyAssistCount: 99
		});
		expect(pts).toBe(30);
	});

	it('nilai negatif atau melebihi batas tidak merusak total', () => {
		const pts = totalPoints({ ...allLevels, level1Missions: -5, level2Missions: 10 });
		expect(pts).toBe(2 + 0 + 6 + 9);
	});

	it('badge terbuka saat tiga misi di level itu selesai', () => {
		expect(badgesFor(allLevels)).toEqual(['Logic Navigator', 'IDE Explorer', 'Hello World Champ']);
		expect(badgesFor({ ...allLevels, level2Missions: 2 })).toEqual([
			'Logic Navigator',
			'Hello World Champ'
		]);
	});
});
