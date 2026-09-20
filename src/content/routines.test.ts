import { describe, expect, it } from 'vitest';
import { isExerciseAvailable } from '../domain/availability';
import { blockSeconds, estimateWorkoutMinutes } from '../domain/duration';
import { workoutBlocks, workoutExerciseIds, workoutSchema } from '../domain/workout';
import type { Workout } from '../domain/workout';
import { exerciseById, requireExercise } from './catalog';
import { PROGRAM } from './program';
import { ROUTINES, routineById } from './routines';
import { SEED_PROFILE } from './seed-profile';

const lookup = (id: string) => exerciseById(id);
const each = ROUTINES.map((r) => [r.name, r] as const);

describe('the rest-day routines', () => {
  it('covers each of the five mobility areas, plus a combined reset', () => {
    expect(ROUTINES.map((r) => r.id)).toEqual([
      'mobility-shoulders',
      'mobility-thoracic',
      'mobility-hips',
      'mobility-hamstrings',
      'mobility-ankles',
      'mobility-reset',
    ]);
  });

  it.each(each)('%s is a valid workout', (_name, routine: Workout) => {
    expect(() => workoutSchema.parse(routine)).not.toThrow();
  });

  it('finds a routine by id', () => {
    expect(routineById('mobility-hips')?.name).toBe('Hips');
  });

  it('returns nothing for an id that is not a routine', () => {
    expect(routineById('foundation-w1-d1')).toBeUndefined();
  });

  it.each(each)('%s is marked as mobility rather than training', (_name, routine: Workout) => {
    expect(routine.kind).toBe('mobility');
  });

  it.each(each)('%s is offered rather than scheduled', (_name, routine: Workout) => {
    expect(routine.day).toBeNull();
  });
});

describe('they are restorative rather than another workout', () => {
  it.each(each)('%s is short', (_name, routine: Workout) => {
    const minutes = estimateWorkoutMinutes(routine, lookup);
    expect(minutes).toBeGreaterThanOrEqual(4);
    expect(minutes).toBeLessThanOrEqual(10);
  });

  it.each(each)('%s states an estimate close to the real one', (_name, routine: Workout) => {
    const actual = estimateWorkoutMinutes(routine, lookup);
    expect(Math.abs(routine.estimatedMinutes - actual)).toBeLessThanOrEqual(1);
  });

  it.each(each)('%s contains only mobility exercises', (_name, routine: Workout) => {
    const notMobility = workoutExerciseIds(routine).filter(
      (id) => requireExercise(id).category !== 'mobility',
    );
    expect(notMobility).toEqual([]);
  });

  it.each(each)('%s asks for nothing strenuous', (_name, routine: Workout) => {
    const hard = workoutExerciseIds(routine).filter(
      (id) => requireExercise(id).difficulty > 2,
    );
    expect(hard).toEqual([]);
  });

  it.each(each)('%s needs no warm-up, because it is one', (_name, routine: Workout) => {
    expect(routine.warmUp).toEqual([]);
  });

  it.each(each)('%s rests briefly between positions', (_name, routine: Workout) => {
    const longRests = workoutBlocks(routine).filter((item) => item.restSeconds > 30);
    expect(longRests).toEqual([]);
  });

  it.each(each)('%s mostly asks for one set of each position', (_name, routine: Workout) => {
    const repeated = workoutBlocks(routine).filter((item) => item.sets > 2);
    expect(repeated.map((i) => i.exerciseId)).toEqual([]);
  });

  it.each(each)('%s needs no equipment the athlete lacks', (_name, routine: Workout) => {
    const blocked = workoutExerciseIds(routine).filter(
      (id) => !isExerciseAvailable(requireExercise(id), SEED_PROFILE),
    );
    expect(blocked).toEqual([]);
  });

  it.each(each)('%s gives every position a cue', (_name, routine: Workout) => {
    const uncued = workoutBlocks(routine).filter((item) => item.cue.trim().length === 0);
    expect(uncued).toEqual([]);
  });

  it('is far shorter than a training session', () => {
    const longestRoutine = Math.max(...ROUTINES.map((r) => blockSeconds(r.mainWork, lookup)));
    const shortestWorkout = Math.min(
      ...PROGRAM.map((w) => blockSeconds(workoutBlocks(w), lookup)),
    );
    expect(longestRoutine).toBeLessThan(shortestWorkout / 2);
  });
});

describe('the five areas are covered', () => {
  const familiesIn = (workouts: Workout[]) =>
    new Set(workouts.flatMap(workoutExerciseIds).map((id) => requireExercise(id).family));

  const MOBILITY_FAMILIES = [
    'shoulder-mobility',
    'thoracic-mobility',
    'hip-mobility',
    'hamstring-mobility',
    'ankle-mobility',
  ] as const;

  it.each(MOBILITY_FAMILIES.map((f) => [f] as const))(
    '%s appears somewhere in the weekly program',
    (family: string) => {
      expect([...familiesIn(PROGRAM)]).toContain(family);
    },
  );

  it.each(MOBILITY_FAMILIES.map((f) => [f] as const))(
    '%s has a routine of its own',
    (family: string) => {
      const covered = ROUTINES.some((routine) =>
        workoutExerciseIds(routine).some((id) => requireExercise(id).family === family),
      );
      expect(covered).toBe(true);
    },
  );

  it('the reset routine touches every area in one go', () => {
    const reset = routineById('mobility-reset')!;
    const families = new Set(
      workoutExerciseIds(reset).map((id) => requireExercise(id).family),
    );
    for (const family of MOBILITY_FAMILIES) {
      expect([...families]).toContain(family);
    }
  });
});

describe('every mobility exercise carries the full instruction system', () => {
  const mobility = [...new Set(ROUTINES.flatMap(workoutExerciseIds))].map(requireExercise);

  it.each(mobility.map((e) => [e.id, e] as const))(
    '%s describes the whole starting position',
    (_id, exercise) => {
      const thin = Object.values(exercise.startingPosition).filter((v) => v.trim().length < 12);
      expect(thin).toEqual([]);
    },
  );

  it.each(mobility.map((e) => [e.id, e] as const))('%s has movement steps', (_id, exercise) => {
    expect(exercise.steps.length).toBeGreaterThanOrEqual(3);
  });

  it.each(mobility.map((e) => [e.id, e] as const))('%s states its range', (_id, exercise) => {
    expect(exercise.rangeOfMotion.trim().length).toBeGreaterThan(30);
  });

  it.each(mobility.map((e) => [e.id, e] as const))('%s explains breathing', (_id, exercise) => {
    expect(exercise.breathing.inhale.length).toBeGreaterThan(0);
    expect(exercise.breathing.exhale.length).toBeGreaterThan(0);
  });

  it.each(mobility.map((e) => [e.id, e] as const))('%s says what to feel', (_id, exercise) => {
    expect(exercise.sensation.working.length).toBeGreaterThan(20);
    expect(exercise.sensation.notNormal.length).toBeGreaterThan(0);
  });

  it.each(mobility.map((e) => [e.id, e] as const))('%s lists mistakes', (_id, exercise) => {
    expect(exercise.commonMistakes.length).toBeGreaterThanOrEqual(2);
  });

  it.each(mobility.map((e) => [e.id, e] as const))('%s covers safety', (_id, exercise) => {
    expect(exercise.safety.stopIf.length).toBeGreaterThan(0);
    expect(exercise.safety.modifyIf.length).toBeGreaterThan(0);
  });

  it.each(mobility.map((e) => [e.id, e] as const))(
    '%s sits on a ladder with an easier or harder step',
    (_id, exercise) => {
      expect(exercise.regression !== null || exercise.progression !== null).toBe(true);
    },
  );
});
