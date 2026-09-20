import { z } from 'zod';
import {
  beginnerSuitabilitySchema,
  categorySchema,
  difficultySchema,
  equipmentSchema,
  familySchema,
  measurementSchema,
  movementPatternSchema,
  muscleGroupSchema,
  rangeSchema,
  slugSchema,
} from './primitives';

/**
 * Information needed to draw an exercise. Sprint 1 stores the description of
 * the demonstration; rendering it is the demonstrations sprint's job.
 */
export const demoSpecSchema = z.object({
  /** Ordered positions the figure moves through, e.g. Top -> Bottom. */
  keyframes: z
    .array(z.object({ id: slugSchema, label: z.string().min(1) }))
    .min(2, 'a demonstration needs at least two keyframes'),
  loop: z.enum(['cycle', 'ping-pong']),
  /** Optional external demonstration. Never embedded, never required. */
  videoUrl: z.url().optional(),
});
export type DemoSpec = z.infer<typeof demoSpecSchema>;

/** Default dosing for an exercise, before the program engine adapts it. */
export const prescriptionSchema = z.object({
  sets: rangeSchema,
  /** Reps, or seconds when the exercise is measured in time. */
  target: rangeSchema,
  restSeconds: z.number().int().positive(),
});
export type Prescription = z.infer<typeof prescriptionSchema>;

export const commonMistakeSchema = z.object({
  mistake: z.string().min(1),
  fix: z.string().min(1),
});
export type CommonMistake = z.infer<typeof commonMistakeSchema>;

export const instructionsSchema = z.object({
  setup: z.array(z.string().min(1)).min(1),
  execution: z.array(z.string().min(1)).min(1),
});
export type Instructions = z.infer<typeof instructionsSchema>;

export const exerciseSchema = z
  .object({
    id: slugSchema,
    name: z.string().min(1),
    category: categorySchema,
    movementPattern: movementPatternSchema,
    /** The progression chain this variation belongs to. */
    family: familySchema,

    primaryMuscles: z.array(muscleGroupSchema).min(1),
    secondaryMuscles: z.array(muscleGroupSchema),
    equipment: z.array(equipmentSchema).min(1),

    difficulty: difficultySchema,
    beginnerSuitability: beginnerSuitabilitySchema,
    measurement: measurementSchema,
    prescription: prescriptionSchema,

    /** Position within the family, 1 = easiest. */
    progressionLevel: z.number().int().positive(),
    /** The next easiest variation, or null at the bottom of the family. */
    regression: slugSchema.nullable(),
    /** The next hardest variation, or null at the top of the family. */
    progression: slugSchema.nullable(),

    summary: z.string().min(1),
    instructions: instructionsSchema,
    breathing: z.string().min(1),
    cues: z.array(z.string().min(1)),
    commonMistakes: z.array(commonMistakeSchema),
    safetyNotes: z.array(z.string().min(1)).optional(),

    demo: demoSpecSchema,
    tags: z.array(z.string().min(1)),
  })
  .refine((e) => e.regression !== e.id, {
    message: 'an exercise cannot be its own regression',
    path: ['regression'],
  })
  .refine((e) => e.progression !== e.id, {
    message: 'an exercise cannot be its own progression',
    path: ['progression'],
  });

export type Exercise = z.infer<typeof exerciseSchema>;
