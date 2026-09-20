import type { Exercise } from './exercise';
import type { Workout, WorkoutItem } from './workout';
import { workoutBlocks } from './workout';

/**
 * How long a workout actually takes.
 *
 * "20 to 30 minutes" is a requirement, not an aspiration, so it has to be
 * computable. Everything here is deliberately a slight over-estimate: rest is
 * charged after the final set too, because in practice that time is spent
 * walking to the next exercise.
 */
export const DEFAULT_SECONDS_PER_REP = 3;
export const TRANSITION_SECONDS = 15;

type Timing = Pick<Exercise, 'tempo'>;

/** A rep takes as long as its tempo says, or a sensible default if unstated. */
export const secondsPerRep = (exercise: Timing): number =>
  exercise.tempo
    ? exercise.tempo.phases.reduce((sum, phase) => sum + phase.seconds, 0)
    : DEFAULT_SECONDS_PER_REP;

const midpoint = (range: { min: number; max: number }): number =>
  Math.round((range.min + range.max) / 2);

/** Working time for one set, ignoring rest. */
export const workSecondsPerSet = (item: WorkoutItem, exercise: Timing): number => {
  const target = midpoint(item.target);
  switch (item.measurement) {
    case 'time':
      return target;
    case 'time-per-side':
      return target * 2;
    case 'reps':
      return target * secondsPerRep(exercise);
    case 'reps-per-side':
      return target * secondsPerRep(exercise) * 2;
  }
};

export const itemSeconds = (item: WorkoutItem, exercise: Timing): number =>
  item.sets * (workSecondsPerSet(item, exercise) + item.restSeconds) + TRANSITION_SECONDS;

/** How long one block — the warm-up, the main work, the mobility — takes. */
export const blockSeconds = (
  items: WorkoutItem[],
  lookup: (id: string) => Timing | undefined,
): number =>
  items.reduce((total, item) => {
    const exercise = lookup(item.exerciseId);
    if (!exercise) {
      throw new Error(`Cannot estimate duration: unknown exercise "${item.exerciseId}"`);
    }
    return total + itemSeconds(item, exercise);
  }, 0);

export const estimateWorkoutSeconds = (
  workout: Workout,
  lookup: (id: string) => Timing | undefined,
): number => blockSeconds(workoutBlocks(workout), lookup);

export const estimateWorkoutMinutes = (
  workout: Workout,
  lookup: (id: string) => Timing | undefined,
): number => Math.round(estimateWorkoutSeconds(workout, lookup) / 60);
