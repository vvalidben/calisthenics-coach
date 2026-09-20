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
 * Where the athlete starts in each family, read off the stated baselines:
 * already doing push-ups and squats, no dips at all, and untested on the plank
 * and handstand so both start at the bottom.
 *
 * The bar families and the handstand are seeded at their entry step. Nothing in
 * them has been trained, so claiming a position further up would be a lie the
 * progression engine would later act on.
 *
 * When a bar arrives, the two pull families get re-assessed like any other
 * untested movement.
 */
const STARTING_VARIATIONS: ExerciseId[] = [
  'push-up',
  'bench-dip-bent-knee',
  'prone-scapular-retraction',
  'dead-hang',
  'bodyweight-squat',
  'glute-bridge',
  'front-plank',
  'knee-side-plank',
  'hanging-knee-raise',
  'wrist-preparation',
  'wall-angel',
  'cat-cow',
  'ninety-ninety-hip-switch',
  'standing-hamstring-sweep',
  'ankle-circles',
];

export const SEED_PROGRESSION: ProgressionState[] = STARTING_VARIATIONS.map((id) =>
  initialProgressionFor(id),
);
