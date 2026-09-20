import { z } from 'zod';
import { familySchema, isoDateSchema, slugSchema } from './primitives';

/**
 * What the athlete actually managed on one exercise in one session, reduced to
 * the numbers the progression engine cares about.
 */
export const performanceSnapshotSchema = z.object({
  exerciseId: slugSchema,
  date: isoDateSchema,
  bestSetReps: z.number().int().nonnegative().nullable(),
  bestSetSeconds: z.number().int().nonnegative().nullable(),
  /** Reps or seconds summed across completed sets. */
  totalVolume: z.number().int().nonnegative(),
  setsCompleted: z.number().int().nonnegative(),
  averageRpe: z.number().min(1).max(10).nullable(),
  /** Whether the prescribed target range was reached on every working set. */
  metTarget: z.boolean(),
});
export type PerformanceSnapshot = z.infer<typeof performanceSnapshotSchema>;

/** When to move the athlete up to the next variation in the family. */
export const progressionCriteriaSchema = z.object({
  consecutiveSessions: z.number().int().positive(),
  minSets: z.number().int().positive(),
  /** Reps, or seconds for a timed hold. */
  minValuePerSet: z.number().int().positive(),
  maxAverageRpe: z.number().min(1).max(10),
});
export type ProgressionCriteria = z.infer<typeof progressionCriteriaSchema>;

/** When to step the athlete back down to an easier variation. */
export const regressionCriteriaSchema = z.object({
  consecutiveSessions: z.number().int().positive(),
  /** Falling at or below this per set signals the variation is too hard. */
  maxValuePerSet: z.number().int().nonnegative(),
  minAverageRpe: z.number().min(1).max(10),
});
export type RegressionCriteria = z.infer<typeof regressionCriteriaSchema>;

/**
 * Where the athlete stands on one progression family. The engine that reads
 * and advances this arrives in the progression sprint; Sprint 1 only defines
 * and stores the shape.
 */
export const progressionStateSchema = z
  .object({
    family: familySchema,
    currentExerciseId: slugSchema,
    currentLevel: z.number().int().positive(),

    performance: performanceSnapshotSchema.nullable(),
    previousPerformance: performanceSnapshotSchema.nullable(),

    progressionCriteria: progressionCriteriaSchema,
    regressionCriteria: regressionCriteriaSchema,

    consecutiveQualifyingSessions: z.number().int().nonnegative(),
    consecutiveStrugglingSessions: z.number().int().nonnegative(),

    updatedAt: isoDateSchema,
  })
  .refine((s) => s.performance !== null || s.previousPerformance === null, {
    message: 'a previous performance requires a current performance',
    path: ['previousPerformance'],
  });
export type ProgressionState = z.infer<typeof progressionStateSchema>;

/** Change in total volume since the previous recorded performance. */
export const performanceDelta = (state: ProgressionState): number | null => {
  if (state.performance === null || state.previousPerformance === null) return null;
  return state.performance.totalVolume - state.previousPerformance.totalVolume;
};
