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
export const WORKOUT_KINDS = ['training', 'mobility'] as const;
export const workoutKindSchema = z.enum(WORKOUT_KINDS);
export type WorkoutKind = z.infer<typeof workoutKindSchema>;

export const workoutSchema = z
  .object({
    id: slugSchema,
    name: z.string().min(1),
    /**
     * Training sessions sit on a weekday. Restorative routines are null: they
     * are offered rather than scheduled, and pinning one to a Tuesday would
     * make skipping it feel like a failure.
     */
    day: weekdaySchema.nullable(),
    /** Training drives progression; mobility is tracked separately. */
    kind: workoutKindSchema,
    /** 1-based week within the current training phase. */
    weekIndex: z.number().int().positive(),
    focus: workoutFocusSchema,
    estimatedMinutes: z.number().int().positive(),

    warmUp: z.array(workoutItemSchema),
    mainWork: z.array(workoutItemSchema).min(1, 'every workout needs main work'),
    mobility: z.array(workoutItemSchema),

    notes: z.string().optional(),
  })
  .refine((w) => w.kind === 'mobility' || w.warmUp.length > 0, {
    message: 'every training workout needs a warm-up',
    path: ['warmUp'],
  })
  .refine((w) => w.kind === 'training' || w.day === null, {
    message: 'a restorative routine is offered rather than scheduled',
    path: ['day'],
  })
  .refine((w) => w.kind === 'mobility' || w.day !== null, {
    message: 'a training workout belongs to a day',
    path: ['day'],
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

/**
 * A prescription in words: "6-10 reps", "20-45 seconds", "8 reps per side".
 *
 * Lives here rather than in a screen because two features render it and they
 * must not drift apart.
 */
export const describeTarget = (item: WorkoutItem): string => {
  const range =
    item.target.min === item.target.max
      ? `${item.target.min}`
      : `${item.target.min}–${item.target.max}`;

  switch (item.measurement) {
    case 'reps':
      return `${range} reps`;
    case 'reps-per-side':
      return `${range} reps per side`;
    case 'time':
      return `${range} seconds`;
    case 'time-per-side':
      return `${range} seconds per side`;
  }
};
