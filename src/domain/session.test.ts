import { describe, expect, it } from 'vitest';
import {
  completedSetCount,
  totalRepsPerformed,
  workoutSessionSchema,
} from './session';
import type { WorkoutSession } from './session';

const completedSession: WorkoutSession = {
  id: '2026-09-21-foundation-w1-d1',
  workoutId: 'foundation-w1-d1',
  date: '2026-09-21',
  status: 'completed',
  startedAt: '2026-09-21T18:30:00.000Z',
  completedAt: '2026-09-21T18:56:00.000Z',
  durationSeconds: 1560,
  exercises: [
    {
      exerciseId: 'push-up',
      block: 'main',
      prescribed: { sets: 3, measurement: 'reps', target: { min: 6, max: 10 } },
      sets: [
        { setNumber: 1, reps: 10, seconds: null, rpe: 7, completed: true },
        { setNumber: 2, reps: 9, seconds: null, rpe: 8, completed: true },
        { setNumber: 3, reps: 7, seconds: null, rpe: 9, completed: true },
      ],
      rpe: 8,
      note: 'Last set got shaky.',
    },
    {
      exerciseId: 'front-plank',
      block: 'main',
      prescribed: { sets: 2, measurement: 'time', target: { min: 20, max: 40 } },
      sets: [
        { setNumber: 1, reps: null, seconds: 35, rpe: 6, completed: true },
        { setNumber: 2, reps: null, seconds: null, rpe: null, completed: false },
      ],
      rpe: 6,
    },
  ],
  overallRpe: 7,
  notes: 'Felt strong.',
};

const missedSession: WorkoutSession = {
  id: '2026-09-22-foundation-w1-d2',
  workoutId: 'foundation-w1-d2',
  date: '2026-09-22',
  status: 'missed',
  startedAt: null,
  completedAt: null,
  durationSeconds: null,
  exercises: [],
  overallRpe: null,
};

describe('workoutSessionSchema', () => {
  it('accepts a completed session', () => {
    expect(workoutSessionSchema.parse(completedSession)).toEqual(completedSession);
  });

  it('accepts a missed session with nothing logged', () => {
    expect(workoutSessionSchema.parse(missedSession)).toEqual(missedSession);
  });

  it('rejects a missed session that has logged work', () => {
    const result = workoutSessionSchema.safeParse({
      ...missedSession,
      exercises: completedSession.exercises,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a completed session with no completion timestamp', () => {
    const result = workoutSessionSchema.safeParse({ ...completedSession, completedAt: null });
    expect(result.success).toBe(false);
  });

  it('rejects a completed set that records neither reps nor seconds', () => {
    const result = workoutSessionSchema.safeParse({
      ...completedSession,
      exercises: [
        {
          ...completedSession.exercises[0]!,
          sets: [{ setNumber: 1, reps: null, seconds: null, rpe: 7, completed: true }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('allows an abandoned set to record neither reps nor seconds', () => {
    const result = workoutSessionSchema.safeParse({
      ...completedSession,
      exercises: [
        {
          ...completedSession.exercises[0]!,
          sets: [{ setNumber: 1, reps: null, seconds: null, rpe: null, completed: false }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an RPE above 10', () => {
    const result = workoutSessionSchema.safeParse({ ...completedSession, overallRpe: 11 });
    expect(result.success).toBe(false);
  });

  it('rejects a negative duration', () => {
    const result = workoutSessionSchema.safeParse({ ...completedSession, durationSeconds: -1 });
    expect(result.success).toBe(false);
  });
});

describe('completedSetCount', () => {
  it('counts only the sets that were actually completed', () => {
    expect(completedSetCount(completedSession)).toBe(4);
  });

  it('is zero for a missed session', () => {
    expect(completedSetCount(missedSession)).toBe(0);
  });
});

describe('totalRepsPerformed', () => {
  it('sums reps across completed sets and ignores timed sets', () => {
    expect(totalRepsPerformed(completedSession)).toBe(26);
  });

  it('counts only the named exercise when one is given', () => {
    expect(totalRepsPerformed(completedSession, 'push-up')).toBe(26);
    expect(totalRepsPerformed(completedSession, 'front-plank')).toBe(0);
  });
});
