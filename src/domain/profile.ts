import { z } from 'zod';
import {
  equipmentSchema,
  isoDateSchema,
  measurementSchema,
  movementPatternSchema,
  rangeSchema,
  slugSchema,
  timeOfDaySchema,
  weekdaySchema,
} from './primitives';

export const GOALS = [
  'build-muscle',
  'get-stronger',
  'mobility-flexibility',
  'skill-mastery',
  'endurance',
  'lose-fat',
] as const;
export const goalSchema = z.enum(GOALS);
export type Goal = z.infer<typeof goalSchema>;

export const FITNESS_LEVELS = [
  'complete-beginner',
  'beginner',
  'intermediate',
  'advanced',
] as const;
export const fitnessLevelSchema = z.enum(FITNESS_LEVELS);
export type FitnessLevel = z.infer<typeof fitnessLevelSchema>;

export const PROGRESSION_RATES = ['conservative', 'moderate', 'aggressive'] as const;
export const progressionRateSchema = z.enum(PROGRESSION_RATES);
export type ProgressionRate = z.infer<typeof progressionRateSchema>;

/**
 * Training phases run for a planned number of weeks and change how the program
 * engine dose-loads work. `foundation` favours technique and volume tolerance;
 * `deload` deliberately reduces both.
 */
export const PHASE_NAMES = [
  'foundation',
  'strength-building',
  'skill-development',
  'deload',
] as const;
export const phaseNameSchema = z.enum(PHASE_NAMES);
export type PhaseName = z.infer<typeof phaseNameSchema>;

export const trainingPhaseSchema = z.object({
  name: phaseNameSchema,
  startedAt: isoDateSchema,
  plannedWeeks: z.number().int().positive(),
});
export type TrainingPhase = z.infer<typeof trainingPhaseSchema>;

/**
 * A measured starting point. `value: null` means *untested* — deliberately
 * distinct from zero, which means tested and unable to perform a single rep.
 */
export const abilitySchema = z.object({
  exerciseId: slugSchema,
  measurement: measurementSchema,
  value: z.number().nonnegative().nullable(),
  assessedAt: isoDateSchema,
});
export type Ability = z.infer<typeof abilitySchema>;

export const injurySchema = z.object({
  area: z.string().min(1),
  notes: z.string().optional(),
  since: isoDateSchema.optional(),
  /** Movement patterns to avoid while this injury is active. */
  restrictedPatterns: z.array(movementPatternSchema),
});
export type Injury = z.infer<typeof injurySchema>;

const hasNoDuplicates = <T>(items: T[]) => new Set(items).size === items.length;

export const userProfileSchema = z
  .object({
    goals: z.array(goalSchema).min(1, 'at least one goal is required'),
    fitnessLevel: fitnessLevelSchema,
    currentAbilities: z.array(abilitySchema),
    availableEquipment: z.array(equipmentSchema).min(1),

    trainingDays: z.array(weekdaySchema).min(1, 'at least one training day is required'),
    preferredTrainingTime: timeOfDaySchema,
    /** Session length in minutes. */
    sessionDuration: rangeSchema,

    progressionRate: progressionRateSchema,
    currentPhase: trainingPhaseSchema,
    injuries: z.array(injurySchema),

    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
  })
  .refine((p) => hasNoDuplicates(p.trainingDays), {
    message: 'training days must be unique',
    path: ['trainingDays'],
  })
  .refine((p) => hasNoDuplicates(p.currentAbilities.map((a) => a.exerciseId)), {
    message: 'each exercise may appear at most once in current abilities',
    path: ['currentAbilities'],
  });

export type UserProfile = z.infer<typeof userProfileSchema>;

export const trainingDaysPerWeek = (profile: UserProfile): number =>
  profile.trainingDays.length;

export const abilityFor = (
  profile: UserProfile,
  exerciseId: string,
): Ability | undefined => profile.currentAbilities.find((a) => a.exerciseId === exerciseId);
