import { z } from 'zod';
import { poseSchema, sceneSchema } from './pose';
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
 * Where every body part goes before the first rep.
 *
 * Seven named slots rather than a list of sentences, because "get into a
 * push-up position" is exactly the instruction a beginner cannot follow. Every
 * slot is required: if a part of the body does not matter for an exercise, that
 * is itself worth saying.
 */
export const startingPositionSchema = z.object({
  hands: z.string().min(1),
  feet: z.string().min(1),
  body: z.string().min(1),
  spine: z.string().min(1),
  head: z.string().min(1),
  shoulders: z.string().min(1),
  hips: z.string().min(1),
});
export type StartingPosition = z.infer<typeof startingPositionSchema>;

/** When to breathe in and when to breathe out, stated separately. */
export const breathingSchema = z.object({
  inhale: z.string().min(1),
  exhale: z.string().min(1),
  note: z.string().optional(),
});
export type Breathing = z.infer<typeof breathingSchema>;

/**
 * Movement speed, as named phases with a duration each, e.g.
 * 2s lower -> 1s pause -> 1s press. Optional: tempo is not meaningful for
 * every drill.
 */
export const tempoSchema = z.object({
  phases: z
    .array(z.object({ label: z.string().min(1), seconds: z.number().positive() }))
    .min(2),
  note: z.string().optional(),
});
export type Tempo = z.infer<typeof tempoSchema>;

/**
 * What the exercise should feel like.
 *
 * `notNormal` exists so pain is never filed under "normal". Anything listed
 * there is a reason to stop, not something to push through.
 */
export const sensationSchema = z.object({
  /** The muscles that should be doing the work. */
  working: z.string().min(1),
  /** Sensations that are expected and fine. */
  alsoNormal: z.array(z.string().min(1)).min(1),
  /** Sensations that mean stop. Never described as normal. */
  notNormal: z.array(z.string().min(1)).min(1),
});
export type Sensation = z.infer<typeof sensationSchema>;

/** Effort and fatigue you should expect, against pain you should not. */
export const safetySchema = z.object({
  normalEffort: z.string().min(1),
  normalFatigue: z.string().min(1),
  concerningPain: z.array(z.string().min(1)).min(1),
  stopIf: z.array(z.string().min(1)).min(1),
  modifyIf: z.array(z.string().min(1)).min(1),
});
export type Safety = z.infer<typeof safetySchema>;

/**
 * The visual sequence: start, the middle of the movement, and the end.
 *
 * `pose` is the figure's shape at that moment; `caption` says what the picture
 * is showing. The written instructions never depend on it.
 */
export const keyframeSchema = z.object({
  id: slugSchema,
  label: z.string().min(1),
  caption: z.string().min(1),
  pose: poseSchema,
});
export type Keyframe = z.infer<typeof keyframeSchema>;

export const demoSpecSchema = z.object({
  scene: sceneSchema,
  keyframes: z.array(keyframeSchema).min(2, 'a demonstration needs at least two keyframes'),
  loop: z.enum(['cycle', 'ping-pong']),
  /**
   * A dashed guide line between two joints, showing the alignment that matters
   * most, e.g. ankle to head for a plank.
   */
  alignment: z.tuple([z.string(), z.string()]).optional(),
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

    // --- the instruction experience ---
    startingPosition: startingPositionSchema,
    steps: z.array(z.string().min(1)).min(3),
    /**
     * How far to go, and how to know you have gone far enough. Separate from
     * the steps because "how deep" is the question people actually get wrong,
     * and burying it in step four hides it.
     */
    rangeOfMotion: z.string().min(1),
    breathing: breathingSchema,
    tempo: tempoSchema.optional(),
    sensation: sensationSchema,
    commonMistakes: z.array(commonMistakeSchema).min(1),
    cues: z.array(z.string().min(1)).min(1),
    safety: safetySchema,
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
