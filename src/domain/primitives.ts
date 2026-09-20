import { z } from 'zod';

/**
 * Shared vocabulary for every domain model.
 *
 * Everything here is a value type: no behaviour, no I/O, no React. Adding a
 * member to one of these enums is the normal way to extend the system.
 */

/** Stable kebab-case identifier, e.g. `incline-push-up`. */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a kebab-case slug');

/** ISO-8601 calendar date, e.g. `2026-09-20`. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO calendar date (YYYY-MM-DD)');

/** ISO-8601 instant, e.g. `2026-09-20T18:30:00.000Z`. */
export const isoDateTimeSchema = z.iso.datetime();

/** 24-hour clock time, e.g. `18:30`. */
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be a 24-hour time (HH:MM)');

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
export const weekdaySchema = z.enum(WEEKDAYS);
export type Weekday = z.infer<typeof weekdaySchema>;

export const CATEGORIES = ['push', 'pull', 'legs', 'core', 'skill', 'mobility'] as const;
export const categorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof categorySchema>;

/**
 * How a movement loads the body. Drives session balance in the program engine
 * (Sprint 2) — two exercises sharing a pattern are substitutes, not additions.
 */
export const MOVEMENT_PATTERNS = [
  'horizontal-push',
  'vertical-push',
  'horizontal-pull',
  'vertical-pull',
  'squat',
  'hinge',
  'lunge',
  'core-anti-extension',
  'core-flexion',
  'core-anti-rotation',
  'isometric-hold',
  'balance',
  'mobility',
] as const;
export const movementPatternSchema = z.enum(MOVEMENT_PATTERNS);
export type MovementPattern = z.infer<typeof movementPatternSchema>;

/**
 * A chain of progressively harder variations of the same movement. The
 * progression engine (Sprint 4) moves the athlete up and down one family at a
 * time.
 */
export const FAMILIES = [
  'push',
  'dip',
  'pull',
  'squat',
  'core',
  'handstand',
  'shoulder-mobility',
  'hip-mobility',
  'spine-hamstring-mobility',
] as const;
export const familySchema = z.enum(FAMILIES);
export type Family = z.infer<typeof familySchema>;

export const MUSCLE_GROUPS = [
  'chest',
  'front-delts',
  'side-delts',
  'rear-delts',
  'triceps',
  'biceps',
  'forearms',
  'lats',
  'traps',
  'rhomboids',
  'lower-back',
  'abs',
  'obliques',
  'hip-flexors',
  'glutes',
  'quads',
  'hamstrings',
  'adductors',
  'calves',
  'wrists',
  'thoracic-spine',
] as const;
export const muscleGroupSchema = z.enum(MUSCLE_GROUPS);
export type MuscleGroup = z.infer<typeof muscleGroupSchema>;

export const EQUIPMENT = [
  'none',
  'floor',
  'wall',
  'chair',
  'towel',
  'pullup-bar',
  'parallel-bars',
] as const;
export const equipmentSchema = z.enum(EQUIPMENT);
export type Equipment = z.infer<typeof equipmentSchema>;

/** Whether an effort is counted in repetitions or in seconds. */
export const MEASUREMENTS = ['reps', 'time', 'reps-per-side', 'time-per-side'] as const;
export const measurementSchema = z.enum(MEASUREMENTS);
export type Measurement = z.infer<typeof measurementSchema>;

export const difficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type Difficulty = z.infer<typeof difficultySchema>;

export const BEGINNER_SUITABILITIES = [
  'ideal',
  'suitable',
  'with-caution',
  'not-suitable',
] as const;
export const beginnerSuitabilitySchema = z.enum(BEGINNER_SUITABILITIES);
export type BeginnerSuitability = z.infer<typeof beginnerSuitabilitySchema>;

/** Rate of perceived exertion, 1 (trivial) to 10 (absolute failure). */
export const rpeSchema = z.number().int().min(1).max(10);
export type Rpe = z.infer<typeof rpeSchema>;

/** An inclusive integer range where `max` is never below `min`. */
export const rangeSchema = z
  .object({ min: z.number().int().nonnegative(), max: z.number().int().nonnegative() })
  .refine((r) => r.max >= r.min, { message: 'max must be greater than or equal to min' });
export type Range = z.infer<typeof rangeSchema>;

export type ExerciseId = string;
export type WorkoutId = string;
export type SessionId = string;
