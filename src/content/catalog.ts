import type { Exercise } from '../domain/exercise';
import type { Category, ExerciseId, Family } from '../domain/primitives';
import { CORE_EXERCISES } from './exercises/core';
import { DIP_EXERCISES } from './exercises/dip';
import { LEG_EXERCISES } from './exercises/legs';
import { MOBILITY_EXERCISES } from './exercises/mobility';
import { PULL_EXERCISES } from './exercises/pull';
import { PUSH_EXERCISES } from './exercises/push';
import { SKILL_EXERCISES } from './exercises/skill';

/**
 * The seed catalog. Deliberately a representative subset rather than a complete
 * reference: it covers every family, category, movement pattern and measurement
 * type so the data model is exercised end to end. Filling it out is the exercise
 * library sprint's job.
 *
 * `catalog.test.ts` enforces the invariants that keep it coherent — unbroken
 * progression chains, symmetric links, equipment the athlete actually has.
 */
export const EXERCISES: readonly Exercise[] = [
  ...PUSH_EXERCISES,
  ...DIP_EXERCISES,
  ...PULL_EXERCISES,
  ...LEG_EXERCISES,
  ...CORE_EXERCISES,
  ...SKILL_EXERCISES,
  ...MOBILITY_EXERCISES,
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export const exerciseById = (id: ExerciseId): Exercise | undefined => BY_ID.get(id);

/**
 * Like {@link exerciseById}, but for the many places where a missing exercise
 * means the catalog is broken rather than the input being wrong.
 */
export const requireExercise = (id: ExerciseId): Exercise => {
  const exercise = BY_ID.get(id);
  if (!exercise) throw new Error(`Unknown exercise: ${id}`);
  return exercise;
};

export const exercisesInFamily = (family: Family): Exercise[] =>
  EXERCISES.filter((e) => e.family === family);

export const exercisesInCategory = (category: Category): Exercise[] =>
  EXERCISES.filter((e) => e.category === category);

/**
 * A family walked from its easiest variation to its hardest, following the
 * progression links rather than trusting `progressionLevel`. Stops if the chain
 * ever loops, so a broken catalog fails a test instead of hanging the app.
 */
export const familyChain = (family: Family): Exercise[] => {
  const members = exercisesInFamily(family);
  const root = members.find((e) => e.regression === null);
  if (!root) return [];

  const chain: Exercise[] = [];
  const seen = new Set<ExerciseId>();
  let current: Exercise | undefined = root;

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.push(current);
    current = current.progression === null ? undefined : exerciseById(current.progression);
  }

  return chain;
};

/** The easier variation of an exercise, if one exists. */
export const easierThan = (id: ExerciseId): Exercise | undefined => {
  const regression = exerciseById(id)?.regression;
  return regression ? exerciseById(regression) : undefined;
};

/** The harder variation of an exercise, if one exists. */
export const harderThan = (id: ExerciseId): Exercise | undefined => {
  const progression = exerciseById(id)?.progression;
  return progression ? exerciseById(progression) : undefined;
};
