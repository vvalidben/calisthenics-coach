import { z } from 'zod';
import {
  measurementSchema,
  rangeSchema,
  slugSchema,
  weekdaySchema,
  type ExerciseId,
} from './primitives';

export const WORKOUT_FOCUSES = [
  'full-body',
  'upper-body',
  'lower-body',
  'push',
  'pull',
  'core',
  'skill',
  'mobility',
] as const;
export const workoutFocusSchema = z.enum(WORKOUT_FOCUSES);
export type WorkoutFocus = z.infer<typeof workoutFocusSchema>;

/**
 * One prescribed exercise inside a workout: what to do, how much, how long to
 * rest, and the one thing to concentrate on while doing it.
 *
 * `cue` is required and deliberately per-workout rather than read from the
 * exercise: the same movement is worth thinking about differently on a heavy
 * day and on a light one. Difficulty is not stored here — it belongs to the
 * exercise, and duplicating it would let the two disagree.
 */
export const workoutItemSchema = z.object({
  exerciseId: slugSchema,
  sets: z.number().int().positive(),
  measurement: measurementSchema,
  /** Reps per set, or seconds per set when measured in time. */
  target: rangeSchema,
  restSeconds: z.number().int().nonnegative(),
  /** The single technique cue to hold in mind for this exercise today. */
  cue: z.string().min(1),
  note: z.string().optional(),
});
export type WorkoutItem = z.infer<typeof workoutItemSchema>;

/**
 * A planned training day. Workouts are templates — performing one produces a
 * {@link WorkoutSession}, which is where actual numbers live.
 */
export const workoutSchema = z.object({
  id: slugSchema,
  name: z.string().min(1),
  day: weekdaySchema,
  /** 1-based week within the current training phase. */
  weekIndex: z.number().int().positive(),
  focus: workoutFocusSchema,
  estimatedMinutes: z.number().int().positive(),

  warmUp: z.array(workoutItemSchema).min(1, 'every workout needs a warm-up'),
  mainWork: z.array(workoutItemSchema).min(1, 'every workout needs main work'),
  mobility: z.array(workoutItemSchema),

  notes: z.string().optional(),
});
export type Workout = z.infer<typeof workoutSchema>;

/** Every exercise in a workout, in the order it is performed. */
export const workoutBlocks = (workout: Workout): WorkoutItem[] => [
  ...workout.warmUp,
  ...workout.mainWork,
  ...workout.mobility,
];

export const workoutExerciseIds = (workout: Workout): ExerciseId[] =>
  workoutBlocks(workout).map((item) => item.exerciseId);
