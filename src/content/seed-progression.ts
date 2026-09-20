import type { ProgressionState } from '../domain/progression';
import type { ExerciseId } from '../domain/primitives';
import { requireExercise } from './catalog';
import { SEED_DATE } from './seed-profile';

/**
 * A starting progression state for one family, anchored at the variation the
 * athlete can currently perform.
 *
 * The thresholds come from the exercise's own prescribed range: clear the top
 * of the range for the prescribed sets, twice in a row, at RPE 8 or below, and
 * you have earned the next variation. This is starting *state*, not the engine
 * that acts on it — that arrives in the progression sprint.
 */
export const initialProgressionFor = (
  exerciseId: ExerciseId,
  date: string = SEED_DATE,
): ProgressionState => {
  const exercise = requireExercise(exerciseId);
  const { sets, target } = exercise.prescription;

  return {
    family: exercise.family,
    currentExerciseId: exercise.id,
    currentLevel: exercise.progressionLevel,

    performance: null,
    previousPerformance: null,

    progressionCriteria: {
      consecutiveSessions: 2,
      minSets: sets.max,
      minValuePerSet: target.max,
      maxAverageRpe: 8,
    },
    regressionCriteria: {
      consecutiveSessions: 2,
      maxValuePerSet: Math.max(0, target.min - 1),
      minAverageRpe: 9.5,
    },

    consecutiveQualifyingSessions: 0,
    consecutiveStrugglingSessions: 0,
    updatedAt: date,
  };
};

/**
 * Where the athlete starts in each family, read straight off the stated
 * baselines: already doing push-ups and pull-ups, no dips at all, and untested
 * on the plank and handstand so both start at the bottom.
 */
const STARTING_VARIATIONS: ExerciseId[] = [
  'push-up',
  'bench-dip-bent-knee',
  'pull-up',
  'bodyweight-squat',
  'front-plank',
  'plank-to-pike-hold',
  'wall-angel',
  'ninety-ninety-hip-switch',
  'cat-cow',
];

export const SEED_PROGRESSION: ProgressionState[] = STARTING_VARIATIONS.map((id) =>
  initialProgressionFor(id),
);
