// Sumber tunggal angka poin dan tier. Mengacu ke docs/PRD_CodeQuest_Arcade.md, bagian 3.

export const POINTS = {
	baseCamp: 2,
	level1PerMission: 2,
	level2PerMission: 2,
	level3PerMission: 3,
	trivia: 3,
	errorCollectorEach: 1,
	errorCollectorMaxCount: 2,
	buddyAssistEach: 1,
	buddyAssistMaxCount: 2
} as const;

export const MISSIONS_PER_LEVEL = 3;

export const TIER_THRESHOLDS = {
	explorer: 10,
	builder: 23,
	champion: 27
} as const;

export type Tier = 'none' | 'explorer' | 'builder' | 'champion';

export const MAX_TOTAL_POINTS =
	POINTS.baseCamp +
	MISSIONS_PER_LEVEL * POINTS.level1PerMission +
	MISSIONS_PER_LEVEL * POINTS.level2PerMission +
	MISSIONS_PER_LEVEL * POINTS.level3PerMission +
	POINTS.trivia +
	POINTS.errorCollectorEach * POINTS.errorCollectorMaxCount +
	POINTS.buddyAssistEach * POINTS.buddyAssistMaxCount;
