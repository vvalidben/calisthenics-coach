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
 * rest. The range lets the progression engine move a target without rewriting
 * the workout.
 */
export const workoutItemSchema = z.object({
  exerciseId: slugSchema,
  sets: z.number().int().positive(),
  measurement: measurementSchema,
  /** Reps per set, or seconds per set when measured in time. */
  target: rangeSchema,
  restSeconds: z.number().int().nonnegative(),
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
