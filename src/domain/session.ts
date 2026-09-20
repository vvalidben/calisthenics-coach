import { z } from 'zod';
import {
  isoDateSchema,
  isoDateTimeSchema,
  measurementSchema,
  rangeSchema,
  rpeSchema,
  slugSchema,
  type ExerciseId,
} from './primitives';

/**
 * A missed workout is recorded, never rescheduled — the athlete's stated rule.
 * `partial` means the session was started and some work was logged; `missed`
 * means the day went by untrained.
 */
export const SESSION_STATUSES = [
  'scheduled',
  'in-progress',
  'completed',
  'partial',
  'missed',
] as const;
export const sessionStatusSchema = z.enum(SESSION_STATUSES);
export type SessionStatus = z.infer<typeof sessionStatusSchema>;

export const WORKOUT_BLOCKS = ['warm-up', 'main', 'mobility'] as const;
export const workoutBlockSchema = z.enum(WORKOUT_BLOCKS);
export type WorkoutBlockName = z.infer<typeof workoutBlockSchema>;

/**
 * One performed set. `reps` and `seconds` are both nullable because a set is
 * one or the other — and an abandoned set is neither.
 */
export const sessionSetSchema = z
  .object({
    setNumber: z.number().int().positive(),
    reps: z.number().int().nonnegative().nullable(),
    seconds: z.number().int().nonnegative().nullable(),
    rpe: rpeSchema.nullable(),
    completed: z.boolean(),
    note: z.string().optional(),
  })
  .refine((s) => !s.completed || s.reps !== null || s.seconds !== null, {
    message: 'a completed set must record reps or seconds',
    path: ['reps'],
  });
export type SessionSet = z.infer<typeof sessionSetSchema>;

export const sessionExerciseSchema = z.object({
  exerciseId: slugSchema,
  block: workoutBlockSchema,
  /** What the workout asked for, copied in so history stays readable. */
  prescribed: z.object({
    sets: z.number().int().positive(),
    measurement: measurementSchema,
    target: rangeSchema,
  }),
  sets: z.array(sessionSetSchema),
  rpe: rpeSchema.nullable(),
  note: z.string().optional(),
});
export type SessionExercise = z.infer<typeof sessionExerciseSchema>;

export const workoutSessionSchema = z
  .object({
    id: z.string().min(1),
    /** The template this came from, or null for an ad-hoc session. */
    workoutId: slugSchema.nullable(),
    date: isoDateSchema,
    status: sessionStatusSchema,

    startedAt: isoDateTimeSchema.nullable(),
    completedAt: isoDateTimeSchema.nullable(),
    durationSeconds: z.number().int().nonnegative().nullable(),

    exercises: z.array(sessionExerciseSchema),
    overallRpe: rpeSchema.nullable(),
    notes: z.string().optional(),
  })
  .refine((s) => s.status !== 'missed' || s.exercises.length === 0, {
    message: 'a missed session cannot contain logged work',
    path: ['exercises'],
  })
  .refine((s) => s.status !== 'missed' || s.durationSeconds === null, {
    message: 'a missed session has no duration',
    path: ['durationSeconds'],
  })
  .refine((s) => s.status !== 'completed' || s.completedAt !== null, {
    message: 'a completed session must record when it was completed',
    path: ['completedAt'],
  });
export type WorkoutSession = z.infer<typeof workoutSessionSchema>;

const completedSets = (session: WorkoutSession, exerciseId?: ExerciseId): SessionSet[] =>
  session.exercises
    .filter((e) => exerciseId === undefined || e.exerciseId === exerciseId)
    .flatMap((e) => e.sets)
    .filter((s) => s.completed);

export const completedSetCount = (
  session: WorkoutSession,
  exerciseId?: ExerciseId,
): number => completedSets(session, exerciseId).length;

export const totalRepsPerformed = (
  session: WorkoutSession,
  exerciseId?: ExerciseId,
): number =>
  completedSets(session, exerciseId).reduce((sum, set) => sum + (set.reps ?? 0), 0);

export const totalSecondsHeld = (
  session: WorkoutSession,
  exerciseId?: ExerciseId,
): number =>
  completedSets(session, exerciseId).reduce((sum, set) => sum + (set.seconds ?? 0), 0);
