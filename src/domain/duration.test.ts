import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SECONDS_PER_REP,
  TRANSITION_SECONDS,
  estimateWorkoutSeconds,
  itemSeconds,
  secondsPerRep,
  workSecondsPerSet,
} from './duration';
import type { WorkoutItem } from './workout';
import { anExercise, aWorkout } from '../test/factories';

const repExercise = anExercise({
  id: 'push-up',
  measurement: 'reps',
  tempo: {
    phases: [
      { label: 'Lower', seconds: 2 },
      { label: 'Pause', seconds: 1 },
      { label: 'Press', seconds: 1 },
    ],
  },
});

const noTempo = anExercise({ id: 'no-tempo', measurement: 'reps', tempo: undefined });

const item = (overrides: Partial<WorkoutItem> = {}): WorkoutItem => ({
  exerciseId: 'push-up',
  sets: 3,
  measurement: 'reps',
  target: { min: 6, max: 10 },
  restSeconds: 60,
  cue: 'Push the floor away.',
  ...overrides,
});

describe('secondsPerRep', () => {
  it('adds up the tempo phases', () => {
    expect(secondsPerRep(repExercise)).toBe(4);
  });

  it('falls back to a sensible default when there is no tempo', () => {
    expect(secondsPerRep(noTempo)).toBe(DEFAULT_SECONDS_PER_REP);
  });
});

describe('workSecondsPerSet', () => {
  it('counts reps at the tempo, using the middle of the target range', () => {
    // midpoint of 6-10 is 8 reps, at 4 seconds each
    expect(workSecondsPerSet(item(), repExercise)).toBe(32);
  });

  it('doubles the work when an exercise is done per side', () => {
    const perSide = anExercise({ measurement: 'reps-per-side', tempo: repExercise.tempo });
    expect(workSecondsPerSet(item({ measurement: 'reps-per-side' }), perSide)).toBe(64);
  });

  it('takes a timed target as seconds directly', () => {
    const timed = anExercise({ measurement: 'time' });
    expect(workSecondsPerSet(item({ measurement: 'time', target: { min: 20, max: 40 } }), timed)).toBe(30);
  });

  it('doubles a timed target held on each side', () => {
    const timed = anExercise({ measurement: 'time-per-side' });
    const result = workSecondsPerSet(
      item({ measurement: 'time-per-side', target: { min: 20, max: 40 } }),
      timed,
    );
    expect(result).toBe(60);
  });
});

describe('itemSeconds', () => {
  it('counts work and rest for every set, plus one transition', () => {
    // 3 sets x (32s work + 60s rest) + 15s transition
    expect(itemSeconds(item(), repExercise)).toBe(3 * (32 + 60) + TRANSITION_SECONDS);
  });

  it('charges rest for every set, including the last', () => {
    // The rest after the final set is the walk to the next exercise, so it is
    // real time either way.
    const one = itemSeconds(item({ sets: 1 }), repExercise);
    const two = itemSeconds(item({ sets: 2 }), repExercise);
    expect(two - one).toBe(32 + 60);
  });
});

describe('estimateWorkoutSeconds', () => {
  const lookup = (id: string) => (id === 'no-tempo' ? noTempo : repExercise);

  it('adds up warm-up, main work and mobility', () => {
    const workout = aWorkout({
      warmUp: [item({ sets: 1, restSeconds: 0 })],
      mainWork: [item()],
      mobility: [item({ sets: 2, restSeconds: 30 })],
    });

    const expected =
      itemSeconds(item({ sets: 1, restSeconds: 0 }), repExercise) +
      itemSeconds(item(), repExercise) +
      itemSeconds(item({ sets: 2, restSeconds: 30 }), repExercise);

    expect(estimateWorkoutSeconds(workout, lookup)).toBe(expected);
  });

  it('is zero-safe for an empty mobility block', () => {
    const workout = aWorkout({ mobility: [] });
    expect(estimateWorkoutSeconds(workout, lookup)).toBeGreaterThan(0);
  });

  it('refuses to guess when an exercise is missing from the catalog', () => {
    const workout = aWorkout({ mainWork: [item({ exerciseId: 'nonsense' })] });
    expect(() =>
      estimateWorkoutSeconds(workout, (id) => (id === 'nonsense' ? undefined : repExercise)),
    ).toThrow(/nonsense/);
  });
});
