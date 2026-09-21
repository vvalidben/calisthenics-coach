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
 * The long-term ladder, in order. What each phase is for, and what it takes to
 * leave one, is content: see `content/phases.ts`.
 *
 * Phases are earned, never waited out. `plannedWeeks` below is a note to the
 * athlete about the likely shape of things and is read by nothing that decides
 * anything.
 *
 * `deload` predates the ladder and is not part of it. It is kept so profiles
 * written before Sprint 13 still parse.
 */
export const PHASE_NAMES = [
  'foundation',
  'strength-building',
  'intermediate',
  'skill-development',
  'deload',
] as const;
export const phaseNameSchema = z.enum(PHASE_NAMES);
export type PhaseName = z.infer<typeof phaseNameSchema>;

export const trainingPhaseSchema = z.object({
  name: phaseNameSchema,
  startedAt: isoDateSchema,
  /** Indicative only. Nothing advances a phase because weeks went by. */
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

/**
 * How the athlete wants to be reminded.
 *
 * `minutesBefore` is a lead time, not a schedule of its own: the reminder is
 * always tied to the training time, so changing the time moves the reminder
 * with it and there is only ever one clock to keep correct.
 */
export const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  /** Minutes before the training time the reminder becomes due. */
  minutesBefore: z.number().int().min(0).max(180),
  /** Whether a rest day gets an optional, easy-to-ignore mobility nudge. */
  mobilityOnRestDays: z.boolean(),
});
export type ReminderSettings = z.infer<typeof reminderSettingsSchema>;

/**
 * On, at the training time, and silent on rest days.
 *
 * On by default because a reminder nobody asked for is easier to turn off than
 * one nobody knows exists. Silent on rest days because a rest day that nags is
 * a rest day that stops feeling like rest.
 */
export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: true,
  minutesBefore: 0,
  mobilityOnRestDays: false,
};

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
    /**
     * Defaulted rather than migrated: a profile written before Sprint 11 has
     * no reminder settings, and the sensible ones are not worth a migration.
     */
    reminders: reminderSettingsSchema.default(DEFAULT_REMINDERS),

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
