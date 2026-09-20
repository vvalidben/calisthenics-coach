import { z } from 'zod';
import { categorySchema, equipmentSchema, familySchema } from './primitives';

/**
 * Describes one progression family: what it trains, what it is working toward,
 * and what it needs before the athlete can start it at all.
 *
 * `requiresEquipment` is what the *entry* step needs. A family that requires
 * nothing can still have a locked step further up — that is handled per
 * exercise by {@link ./availability}.
 *
 * `caveat` exists so a family can state a limitation in the data rather than in
 * a comment nobody reads. Floor-based pulling uses it to say plainly that it is
 * not a substitute for hanging from a bar.
 */
export const PATHWAYS = ['push', 'legs', 'core', 'pull', 'skill', 'mobility'] as const;
export const pathwaySchema = z.enum(PATHWAYS);
export type Pathway = z.infer<typeof pathwaySchema>;

export const familyInfoSchema = z.object({
  id: familySchema,
  /** The movement pattern this family belongs to, for grouping. */
  pathway: pathwaySchema,
  name: z.string().min(1),
  category: categorySchema,
  /** What reaching the top of this family means. */
  goal: z.string().min(1),
  requiresEquipment: z.array(equipmentSchema),
  caveat: z.string().min(1).optional(),
});

export type FamilyInfo = z.infer<typeof familyInfoSchema>;
