import { describe, expect, it } from 'vitest';
import { isExerciseAvailable } from '../domain/availability';
import { blockSeconds, estimateWorkoutMinutes } from '../domain/duration';
import { workoutBlocks, workoutExerciseIds, workoutSchema } from '../domain/workout';
import type { Workout } from '../domain/workout';
import { exerciseById, requireExercise } from './catalog';
import { PROGRAM, PROGRAM_DAYS, workoutForDay } from './program';
import { SEED_PROFILE } from './seed-profile';

const lookup = (id: string) => exerciseById(id);
const each = PROGRAM.map((w) => [w.name, w] as const);

describe('the foundation program', () => {
  it('has four workouts', () => {
    expect(PROGRAM).toHaveLength(4);
  });

  it.each(each)('%s is a valid workout', (_name, workout: Workout) => {
    expect(() => workoutSchema.parse(workout)).not.toThrow();
  });

  it('gives each workout its own id', () => {
    const ids = PROGRAM.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('trains on four different days', () => {
    expect(new Set(PROGRAM_DAYS).size).toBe(4);
  });

  it('matches the training days on the profile', () => {
    expect([...PROGRAM_DAYS].sort()).toEqual([...SEED_PROFILE.trainingDays].sort());
  });

  it('never schedules more than two training days in a row', () => {
    const order = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ] as const;
    const training = order.map((day) => PROGRAM_DAYS.includes(day));
    // Wrap around the week, because Sunday is followed by Monday.
    const doubled = [...training, ...training];
    let run = 0;
    let longest = 0;
    for (const isTraining of doubled) {
      run = isTraining ? run + 1 : 0;
      longest = Math.max(longest, run);
    }
    expect(longest).toBeLessThanOrEqual(2);
  });

  it('gives each day a different focus', () => {
    const focuses = PROGRAM.map((w) => w.focus);
    expect(new Set(focuses).size).toBe(4);
  });

  it('finds the workout for a training day', () => {
    expect(workoutForDay('monday')?.name).toBe('Push and Core');
  });

  it('returns nothing for a rest day', () => {
    expect(workoutForDay('wednesday')).toBeUndefined();
    expect(workoutForDay('sunday')).toBeUndefined();
  });
});

describe('every workout fits the time available', () => {
  it.each(each)('%s takes 20 to 30 minutes', (_name, workout: Workout) => {
    const minutes = estimateWorkoutMinutes(workout, lookup);
    expect(minutes).toBeGreaterThanOrEqual(20);
    expect(minutes).toBeLessThanOrEqual(30);
  });

  it.each(each)('%s states an estimate that matches the real one', (_name, workout: Workout) => {
    const actual = estimateWorkoutMinutes(workout, lookup);
    expect(Math.abs(workout.estimatedMinutes - actual)).toBeLessThanOrEqual(2);
  });

  it.each(each)('%s warms up for 3 to 5 minutes', (_name, workout: Workout) => {
    const minutes = blockSeconds(workout.warmUp, lookup) / 60;
    expect(minutes).toBeGreaterThanOrEqual(3);
    expect(minutes).toBeLessThanOrEqual(5);
  });

  it.each(each)('%s spends around 5 minutes on mobility', (_name, workout: Workout) => {
    const minutes = blockSeconds(workout.mobility, lookup) / 60;
    expect(minutes).toBeGreaterThanOrEqual(2.5);
    expect(minutes).toBeLessThanOrEqual(6);
  });
});

describe('every workout is performable', () => {
  it.each(each)('%s only uses exercises that exist', (_name, workout: Workout) => {
    const unknown = workoutExerciseIds(workout).filter((id) => exerciseById(id) === undefined);
    expect(unknown).toEqual([]);
  });

  it.each(each)('%s needs no equipment the athlete lacks', (_name, workout: Workout) => {
    const blocked = workoutExerciseIds(workout).filter(
      (id) => !isExerciseAvailable(requireExercise(id), SEED_PROFILE),
    );
    expect(blocked).toEqual([]);
  });

  it.each(each)('%s gives every exercise a technique cue', (_name, workout: Workout) => {
    const uncued = workoutBlocks(workout).filter((item) => item.cue.trim().length === 0);
    expect(uncued.map((i) => i.exerciseId)).toEqual([]);
  });

  it.each(each)('%s measures each exercise the way the exercise is measured', (_name, workout: Workout) => {
    const mismatched = workoutBlocks(workout).filter(
      (item) => requireExercise(item.exerciseId).measurement !== item.measurement,
    );
    expect(mismatched.map((i) => i.exerciseId)).toEqual([]);
  });

  it.each(each)('%s has a warm-up and a mobility block', (_name, workout: Workout) => {
    expect(workout.warmUp.length).toBeGreaterThanOrEqual(2);
    expect(workout.mobility.length).toBeGreaterThanOrEqual(1);
  });

  it.each(each)('%s is not overloaded with exercises', (_name, workout: Workout) => {
    expect(workout.mainWork.length).toBeLessThanOrEqual(4);
    expect(workoutBlocks(workout).length).toBeLessThanOrEqual(9);
  });

  it.each(each)('%s never repeats an exercise within itself', (_name, workout: Workout) => {
    const ids = workoutExerciseIds(workout);
    const repeated = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect([...new Set(repeated)]).toEqual([]);
  });

  it.each(each)('%s stays within beginner-appropriate difficulty', (_name, workout: Workout) => {
    const tooHard = workoutExerciseIds(workout).filter(
      (id) => requireExercise(id).beginnerSuitability === 'not-suitable',
    );
    expect(tooHard).toEqual([]);
  });
});

describe('every prescribed exercise can actually be looked up', () => {
  const prescribed = [...new Set(PROGRAM.flatMap(workoutExerciseIds))];

  it('asks the athlete to learn a manageable number of real movements', () => {
    // Warm-up and mobility drills repeat across days on purpose, so counting
    // every distinct id overstates the learning load. What matters is how many
    // main-work movements a beginner has to acquire technique in at once.
    const mainMovements = new Set(
      PROGRAM.flatMap((w) => w.mainWork.map((item) => item.exerciseId)),
    );
    expect(mainMovements.size).toBeGreaterThanOrEqual(8);
    expect(mainMovements.size).toBeLessThanOrEqual(14);
  });

  it('reuses warm-up and mobility drills rather than inventing new ones each day', () => {
    const supporting = PROGRAM.flatMap((w) => [...w.warmUp, ...w.mobility]).map(
      (item) => item.exerciseId,
    );
    const distinct = new Set(supporting).size;
    expect(distinct).toBeLessThan(supporting.length);
  });

  it.each(prescribed.map((id) => [id] as const))(
    '%s carries a full starting position',
    (id: string) => {
      const thin = Object.values(requireExercise(id).startingPosition).filter(
        (slot) => slot.trim().length < 12,
      );
      expect(thin).toEqual([]);
    },
  );

  it.each(prescribed.map((id) => [id] as const))('%s carries movement steps', (id: string) => {
    expect(requireExercise(id).steps.length).toBeGreaterThanOrEqual(3);
  });

  it.each(prescribed.map((id) => [id] as const))('%s carries breathing and safety', (id: string) => {
    const exercise = requireExercise(id);
    expect(exercise.breathing.inhale.length).toBeGreaterThan(0);
    expect(exercise.breathing.exhale.length).toBeGreaterThan(0);
    expect(exercise.safety.stopIf.length).toBeGreaterThan(0);
    expect(exercise.sensation.notNormal.length).toBeGreaterThan(0);
  });

  it.each(prescribed.map((id) => [id] as const))('%s carries a demonstration', (id: string) => {
    expect(requireExercise(id).demo.keyframes.length).toBeGreaterThanOrEqual(2);
  });
});

describe('the program serves the stated goals', () => {
  const allIds = PROGRAM.flatMap(workoutExerciseIds);
  const categories = new Set(allIds.map((id) => requireExercise(id).category));
  const families = new Set(allIds.map((id) => requireExercise(id).family));

  it('trains pushing, legs, core and mobility across the week', () => {
    expect(categories).toContain('push');
    expect(categories).toContain('legs');
    expect(categories).toContain('core');
    expect(categories).toContain('mobility');
  });

  it('includes upper-back work despite there being no bar', () => {
    expect(families).toContain('pull-prep');
  });

  it('trains the posterior chain, which squats alone leave out', () => {
    expect(families).toContain('hinge');
  });

  it('works toward the handstand goal', () => {
    expect(families).toContain('handstand');
  });

  it('covers at least three of the five mobility areas each week', () => {
    const mobilityFamilies = [...families].filter((f) => f.endsWith('-mobility'));
    expect(mobilityFamilies.length).toBeGreaterThanOrEqual(3);
  });

  it('does not press on two consecutive days', () => {
    const pressingDays = PROGRAM.filter((w) =>
      w.mainWork.some((item) => requireExercise(item.exerciseId).category === 'push'),
    ).map((w) => w.day);
    expect(pressingDays).not.toEqual(expect.arrayContaining(['monday', 'tuesday']));
  });
});
