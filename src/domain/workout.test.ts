import { describe, expect, it } from 'vitest';
import { workoutExerciseIds, workoutSchema } from './workout';
import type { Workout } from './workout';

const validWorkout: Workout = {
  id: 'foundation-w1-d1',
  name: 'Full Body A',
  day: 'monday',
  kind: 'training',
  weekIndex: 1,
  focus: 'full-body',
  estimatedMinutes: 26,
  warmUp: [
    {
      exerciseId: 'cat-cow',
      sets: 1,
      measurement: 'reps',
      target: { min: 8, max: 10 },
      restSeconds: 0,
      cue: 'Start from the tailbone.',
    },
  ],
  mainWork: [
    {
      exerciseId: 'push-up',
      sets: 3,
      measurement: 'reps',
      target: { min: 6, max: 10 },
      restSeconds: 90,
      cue: 'Push the floor away.',
    },
    {
      exerciseId: 'bodyweight-squat',
      sets: 3,
      measurement: 'reps',
      target: { min: 8, max: 12 },
      restSeconds: 90,
      cue: 'Push the floor away.',
    },
  ],
  mobility: [
    {
      exerciseId: 'deep-squat-hold',
      sets: 2,
      measurement: 'time',
      target: { min: 30, max: 45 },
      restSeconds: 30,
      cue: 'Relax into it.',
    },
  ],
  notes: 'Keep every rep clean; stop two reps short of failure.',
};

describe('workoutSchema', () => {
  it('accepts a fully specified workout', () => {
    expect(workoutSchema.parse(validWorkout)).toEqual(validWorkout);
  });

  it('requires at least one main-work exercise', () => {
    expect(workoutSchema.safeParse({ ...validWorkout, mainWork: [] }).success).toBe(false);
  });

  it('requires at least one warm-up exercise', () => {
    expect(workoutSchema.safeParse({ ...validWorkout, warmUp: [] }).success).toBe(false);
  });

  it('allows an empty mobility block', () => {
    expect(workoutSchema.safeParse({ ...validWorkout, mobility: [] }).success).toBe(true);
  });

  it('rejects an exercise prescribed zero sets', () => {
    const result = workoutSchema.safeParse({
      ...validWorkout,
      mainWork: [{ ...validWorkout.mainWork[0]!, sets: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative rest period', () => {
    const result = workoutSchema.safeParse({
      ...validWorkout,
      mainWork: [{ ...validWorkout.mainWork[0]!, restSeconds: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it('requires a technique cue on every exercise', () => {
    const { cue: _cue, ...withoutCue } = validWorkout.mainWork[0]!;
    const result = workoutSchema.safeParse({ ...validWorkout, mainWork: [withoutCue] });
    expect(result.success).toBe(false);
  });

  it('rejects an empty technique cue', () => {
    const result = workoutSchema.safeParse({
      ...validWorkout,
      mainWork: [{ ...validWorkout.mainWork[0]!, cue: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a target range whose maximum is below its minimum', () => {
    const result = workoutSchema.safeParse({
      ...validWorkout,
      mainWork: [{ ...validWorkout.mainWork[0]!, target: { min: 10, max: 6 } }],
    });
    expect(result.success).toBe(false);
  });
});

describe('restorative routines', () => {
  const routine = {
    ...validWorkout,
    id: 'mobility-hips',
    kind: 'mobility' as const,
    day: null,
    focus: 'mobility' as const,
    warmUp: [],
  };

  it('may have no warm-up, because the work is the warm-up', () => {
    expect(workoutSchema.safeParse(routine).success).toBe(true);
  });

  it('is not pinned to a weekday', () => {
    expect(workoutSchema.safeParse({ ...routine, day: 'monday' }).success).toBe(false);
  });

  it('still refuses a training workout with no warm-up', () => {
    expect(workoutSchema.safeParse({ ...validWorkout, warmUp: [] }).success).toBe(false);
  });

  it('still refuses a training workout with no day', () => {
    expect(workoutSchema.safeParse({ ...validWorkout, day: null }).success).toBe(false);
  });
});

describe('workoutExerciseIds', () => {
  it('lists warm-up, main work and mobility in the order they are performed', () => {
    expect(workoutExerciseIds(validWorkout)).toEqual([
      'cat-cow',
      'push-up',
      'bodyweight-squat',
      'deep-squat-hold',
    ]);
  });
});
