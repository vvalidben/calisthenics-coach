import { describe, expect, it } from 'vitest';
import {
  currentStreak,
  recentPerformance,
  totalWorkouts,
  weekStart,
  weeklyProgress,
} from './stats';
import type { WorkoutSession } from './session';
import { aProfile, aSession } from '../test/factories';

// The programme trains Monday, Tuesday, Thursday, Saturday.
const profile = aProfile({ trainingDays: ['monday', 'tuesday', 'thursday', 'saturday'] });

const MON = '2026-09-21';
const TUE = '2026-09-22';
const WED = '2026-09-23';
const THU = '2026-09-24';
const SAT = '2026-09-26';
const SUN = '2026-09-27';

const trained = (date: string, overrides: Partial<WorkoutSession> = {}): WorkoutSession =>
  aSession({ id: `${date}-w`, date, status: 'completed', kind: 'training', ...overrides });

const stretched = (date: string): WorkoutSession =>
  aSession({ id: `${date}-m`, date, status: 'completed', kind: 'mobility' });

describe('weekStart', () => {
  it('returns the Monday of the week', () => {
    expect(weekStart(WED)).toBe(MON);
    expect(weekStart(SAT)).toBe(MON);
  });

  it('treats Monday as its own week start', () => {
    expect(weekStart(MON)).toBe(MON);
  });

  it('counts Sunday as the end of the week, not the start', () => {
    expect(weekStart(SUN)).toBe(MON);
  });
});

describe('weeklyProgress', () => {
  it('counts training sessions done this week', () => {
    expect(weeklyProgress([trained(MON), trained(TUE)], profile, WED)).toEqual({
      completed: 2,
      planned: 4,
    });
  });

  it('ignores sessions from last week', () => {
    expect(weeklyProgress([trained('2026-09-19')], profile, WED).completed).toBe(0);
  });

  it('ignores mobility routines', () => {
    expect(weeklyProgress([stretched(MON), trained(TUE)], profile, WED).completed).toBe(1);
  });

  it('counts a partly finished session, because some of it happened', () => {
    expect(weeklyProgress([trained(MON, { status: 'partial' })], profile, WED).completed).toBe(1);
  });

  it('does not count a missed one', () => {
    const missed = aSession({ id: 'x', date: MON, status: 'missed', exercises: [] });
    expect(weeklyProgress([missed], profile, WED).completed).toBe(0);
  });

  it('plans as many sessions as the profile schedules', () => {
    expect(weeklyProgress([], profile, WED).planned).toBe(4);
  });
});

describe('currentStreak', () => {
  it('is zero with no history', () => {
    expect(currentStreak([], profile, WED)).toBe(0);
  });

  it('counts consecutive scheduled days that were trained', () => {
    expect(currentStreak([trained(MON), trained(TUE)], profile, WED)).toBe(2);
  });

  it('is not broken by the rest days in between', () => {
    expect(currentStreak([trained(MON), trained(TUE), trained(THU)], profile, SAT)).toBe(3);
  });

  it('forgives today, because the day is not over yet', () => {
    // Thursday is a training day and has not been done, but it is today.
    expect(currentStreak([trained(MON), trained(TUE)], profile, THU)).toBe(2);
  });

  it('counts today once it has been done', () => {
    expect(currentStreak([trained(MON), trained(TUE), trained(THU)], profile, THU)).toBe(3);
  });

  it('breaks on a scheduled day that was skipped', () => {
    // Tuesday missing between Monday and Thursday.
    expect(currentStreak([trained(MON), trained(THU)], profile, SAT)).toBe(1);
  });

  it('is zero when the last scheduled day was skipped', () => {
    expect(currentStreak([trained(MON)], profile, WED)).toBe(0);
  });

  it('ignores mobility routines entirely', () => {
    expect(currentStreak([stretched(TUE), trained(MON)], profile, WED)).toBe(0);
  });

  it('carries across a week boundary', () => {
    const lastWeek = ['2026-09-14', '2026-09-15', '2026-09-17', '2026-09-19'].map((d) => trained(d));
    expect(currentStreak([...lastWeek, trained(MON)], profile, TUE)).toBe(5);
  });
});

describe('totalWorkouts', () => {
  it('counts every finished training session', () => {
    expect(totalWorkouts([trained(MON), trained(TUE), trained(THU)])).toBe(3);
  });

  it('does not count mobility routines', () => {
    expect(totalWorkouts([trained(MON), stretched(TUE)])).toBe(1);
  });

  it('is zero before anything has been done', () => {
    expect(totalWorkouts([])).toBe(0);
  });
});

describe('recentPerformance', () => {
  it('returns the most recent sessions first', () => {
    const recent = recentPerformance([trained(MON), trained(THU), trained(TUE)]);
    expect(recent.map((r) => r.date)).toEqual([THU, TUE, MON]);
  });

  it('returns at most the requested number', () => {
    const many = [MON, TUE, THU, SAT].map((d) => trained(d));
    expect(recentPerformance(many, 2)).toHaveLength(2);
  });

  it('reports the difficulty as a word', () => {
    expect(recentPerformance([trained(MON, { overallRpe: 8 })])[0]!.difficulty).toBe('hard');
  });

  it('reports no difficulty when none was recorded', () => {
    expect(recentPerformance([trained(MON, { overallRpe: null })])[0]!.difficulty).toBeNull();
  });

  it('totals the reps performed', () => {
    expect(recentPerformance([trained(MON)])[0]!.totalReps).toBe(10);
  });

  it('counts the completed sets', () => {
    expect(recentPerformance([trained(MON)])[0]!.setsCompleted).toBe(1);
  });

  it('leaves mobility routines out', () => {
    expect(recentPerformance([stretched(MON)])).toEqual([]);
  });

  it('is empty before anything has been done', () => {
    expect(recentPerformance([])).toEqual([]);
  });
});
