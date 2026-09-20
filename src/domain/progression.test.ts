import { describe, expect, it } from 'vitest';
import { performanceDelta, progressionStateSchema } from './progression';
import type { ProgressionState } from './progression';

const state: ProgressionState = {
  family: 'push',
  currentExerciseId: 'push-up',
  currentLevel: 3,
  performance: {
    exerciseId: 'push-up',
    date: '2026-09-21',
    bestSetReps: 10,
    bestSetSeconds: null,
    totalVolume: 26,
    setsCompleted: 3,
    averageRpe: 8,
    metTarget: true,
  },
  previousPerformance: {
    exerciseId: 'push-up',
    date: '2026-09-18',
    bestSetReps: 9,
    bestSetSeconds: null,
    totalVolume: 22,
    setsCompleted: 3,
    averageRpe: 8.5,
    metTarget: true,
  },
  progressionCriteria: {
    consecutiveSessions: 2,
    minSets: 3,
    minValuePerSet: 10,
    maxAverageRpe: 8,
  },
  regressionCriteria: {
    consecutiveSessions: 2,
    maxValuePerSet: 5,
    minAverageRpe: 9.5,
  },
  consecutiveQualifyingSessions: 1,
  consecutiveStrugglingSessions: 0,
  updatedAt: '2026-09-21',
};

const freshState: ProgressionState = {
  ...state,
  performance: null,
  previousPerformance: null,
  consecutiveQualifyingSessions: 0,
};

describe('progressionStateSchema', () => {
  it('accepts a state with current and previous performance', () => {
    expect(progressionStateSchema.parse(state)).toEqual(state);
  });

  it('accepts a fresh state that has no recorded performance yet', () => {
    expect(progressionStateSchema.parse(freshState)).toEqual(freshState);
  });

  it('rejects a previous performance with no current performance', () => {
    const result = progressionStateSchema.safeParse({
      ...state,
      performance: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a progression criterion requiring zero consecutive sessions', () => {
    const result = progressionStateSchema.safeParse({
      ...state,
      progressionCriteria: { ...state.progressionCriteria, consecutiveSessions: 0 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a maximum average RPE above 10', () => {
    const result = progressionStateSchema.safeParse({
      ...state,
      progressionCriteria: { ...state.progressionCriteria, maxAverageRpe: 11 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative qualifying-session counter', () => {
    const result = progressionStateSchema.safeParse({
      ...state,
      consecutiveQualifyingSessions: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('performanceDelta', () => {
  it('reports the change in volume since the previous performance', () => {
    expect(performanceDelta(state)).toBe(4);
  });

  it('returns null when there is nothing to compare against', () => {
    expect(performanceDelta(freshState)).toBeNull();
  });
});
