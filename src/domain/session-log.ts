import type { Rpe } from './primitives';
import type {
  SessionExercise,
  SessionSet,
  SessionStatus,
  WorkoutSession,
} from './session';
import { completedSetCount, totalRepsPerformed, totalSecondsHeld } from './session';
import type { Workout } from './workout';

/**
 * Performing a workout: starting a session, logging sets into it, and closing
 * it out.
 *
 * Everything here is a pure function over a {@link WorkoutSession}. Nothing
 * decides what to do next — no weight is changed, no variation is advanced.
 * That is the progression engine's job, and it does not exist yet.
 */

/** What the athlete is asked after each set, in the words they are offered. */
export const PERCEIVED_DIFFICULTIES = [
  'easy',
  'moderate',
  'hard',
  'very-hard',
  'failed',
] as const;
export type PerceivedDifficulty = (typeof PERCEIVED_DIFFICULTIES)[number];

const RPE_BY_DIFFICULTY: Record<PerceivedDifficulty, Rpe> = {
  easy: 4,
  moderate: 6,
  hard: 8,
  'very-hard': 9,
  failed: 10,
};

export const rpeFor = (difficulty: PerceivedDifficulty): Rpe =>
  RPE_BY_DIFFICULTY[difficulty];

/** The closest difficulty word to a recorded RPE, for reading history back. */
export const difficultyForRpe = (rpe: number): PerceivedDifficulty =>
  PERCEIVED_DIFFICULTIES.reduce((best, word) =>
    Math.abs(rpeFor(word) - rpe) < Math.abs(rpeFor(best) - rpe) ? word : best,
  );

export const LABELS: Record<PerceivedDifficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
  'very-hard': 'Very hard',
  failed: 'Failed',
};

/** One set as the player reports it: a number and a word, or a skip. */
export interface SetReport {
  reps?: number | undefined;
  seconds?: number | undefined;
  difficulty?: PerceivedDifficulty | undefined;
  skipped?: boolean | undefined;
  note?: string | undefined;
}

/** The id a session gets, so reopening the same workout the same day resumes it. */
export const sessionIdFor = (workoutId: string, date: string): string =>
  `${date}-${workoutId}`;

export const startSession = (
  workout: Workout,
  date: string,
  startedAt: string,
): WorkoutSession => ({
  id: sessionIdFor(workout.id, date),
  workoutId: workout.id,
  kind: workout.kind,
  date,
  status: 'in-progress',
  startedAt,
  completedAt: null,
  durationSeconds: null,
  overallRpe: null,
  exercises: [
    ...workout.warmUp.map((item) => ({ item, block: 'warm-up' as const })),
    ...workout.mainWork.map((item) => ({ item, block: 'main' as const })),
    ...workout.mobility.map((item) => ({ item, block: 'mobility' as const })),
  ].map(({ item, block }) => ({
    exerciseId: item.exerciseId,
    block,
    prescribed: {
      sets: item.sets,
      measurement: item.measurement,
      target: item.target,
    },
    sets: [],
    rpe: null,
  })),
});

const averageRpe = (sets: SessionSet[]): number | null => {
  const scored = sets.filter((s) => s.rpe !== null).map((s) => s.rpe as number);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((sum, rpe) => sum + rpe, 0) / scored.length);
};

export const recordSet = (
  session: WorkoutSession,
  exerciseId: string,
  report: SetReport,
): WorkoutSession => {
  const target = session.exercises.find((e) => e.exerciseId === exerciseId);
  if (!target) {
    throw new Error(`Cannot log a set: "${exerciseId}" is not part of this session`);
  }

  const set: SessionSet = {
    setNumber: target.sets.length + 1,
    reps: report.skipped ? null : (report.reps ?? null),
    seconds: report.skipped ? null : (report.seconds ?? null),
    rpe: report.skipped || !report.difficulty ? null : rpeFor(report.difficulty),
    completed: !report.skipped && (report.reps !== undefined || report.seconds !== undefined),
    ...(report.note === undefined ? {} : { note: report.note }),
  };

  return {
    ...session,
    exercises: session.exercises.map((exercise) => {
      if (exercise.exerciseId !== exerciseId) return exercise;
      const sets = [...exercise.sets, set];
      return { ...exercise, sets, rpe: averageRpe(sets) };
    }),
  };
};

export const plannedSetCount = (session: WorkoutSession): number =>
  session.exercises.reduce((total, exercise) => total + exercise.prescribed.sets, 0);

const completedSetsFor = (exercise: SessionExercise): number =>
  exercise.sets.filter((s) => s.completed).length;

const statusFor = (session: WorkoutSession): SessionStatus => {
  const completed = completedSetCount(session);
  if (completed === 0) return 'missed';
  const everySetDone = session.exercises.every(
    (exercise) => completedSetsFor(exercise) >= exercise.prescribed.sets,
  );
  return everySetDone ? 'completed' : 'partial';
};

const secondsBetween = (from: string, to: string): number =>
  Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 1000));

export const finishSession = (
  session: WorkoutSession,
  endedAt: string,
  notes?: string,
): WorkoutSession => {
  const status = statusFor(session);
  const duration = session.startedAt === null ? null : secondsBetween(session.startedAt, endedAt);

  // A missed session cannot carry logged work: a set nobody performed is not
  // history, and the schema is right to refuse it.
  const missed = status === 'missed';

  return {
    ...session,
    status,
    completedAt: missed ? null : endedAt,
    durationSeconds: missed ? null : duration,
    exercises: missed ? [] : session.exercises,
    overallRpe: missed ? null : averageRpe(session.exercises.flatMap((e) => e.sets)),
    ...(notes === undefined ? {} : { notes }),
  };
};

export interface SessionSummary {
  durationSeconds: number | null;
  exercisesCompleted: number;
  exercisesPlanned: number;
  setsCompleted: number;
  setsPlanned: number;
  totalReps: number;
  totalSeconds: number;
  difficulty: PerceivedDifficulty | null;
}

export const sessionSummary = (session: WorkoutSession): SessionSummary => {
  const rpe = averageRpe(session.exercises.flatMap((e) => e.sets));
  return {
    durationSeconds: session.durationSeconds,
    exercisesCompleted: session.exercises.filter((e) => completedSetsFor(e) > 0).length,
    exercisesPlanned: session.exercises.length,
    setsCompleted: completedSetCount(session),
    setsPlanned: plannedSetCount(session),
    totalReps: totalRepsPerformed(session),
    totalSeconds: totalSecondsHeld(session),
    difficulty: rpe === null ? null : difficultyForRpe(rpe),
  };
};

export interface ExerciseComparison {
  exerciseId: string;
  /** Reps, or seconds for a timed exercise. */
  total: number;
  previousTotal: number;
  totalDelta: number;
  measuredIn: 'reps' | 'seconds';
}

/**
 * What changed since the last time this workout was performed.
 *
 * Reporting only. Nothing here decides to make anything harder.
 */
export const compareToPrevious = (
  session: WorkoutSession,
  previous: WorkoutSession | undefined,
): ExerciseComparison[] => {
  if (!previous) return [];

  return session.exercises.flatMap((exercise) => {
    const before = previous.exercises.find((e) => e.exerciseId === exercise.exerciseId);
    if (!before) return [];

    const timed = exercise.prescribed.measurement.startsWith('time');

    const total = timed
      ? totalSecondsHeld(session, exercise.exerciseId)
      : totalRepsPerformed(session, exercise.exerciseId);
    const previousTotal = timed
      ? totalSecondsHeld(previous, exercise.exerciseId)
      : totalRepsPerformed(previous, exercise.exerciseId);

    // An exercise nobody logged either time is not a comparison, it is noise.
    if (total === 0 && previousTotal === 0) return [];

    return [
      {
        exerciseId: exercise.exerciseId,
        total,
        previousTotal,
        totalDelta: total - previousTotal,
        measuredIn: timed ? ('seconds' as const) : ('reps' as const),
      },
    ];
  });
};

/**
 * Mobility sessions finished in the seven days up to `today`.
 *
 * Counted separately from training on purpose: mobility is a habit measured in
 * frequency, and mixing it into the training count would let a good week of
 * stretching disguise a missed workout.
 */
export const mobilitySessionsInLastWeek = (
  sessions: WorkoutSession[],
  today: string,
): number => {
  const end = new Date(`${today}T12:00:00`).getTime();
  const start = end - 6 * 24 * 60 * 60 * 1000;

  return sessions.filter((session) => {
    if (session.kind !== 'mobility') return false;
    if (session.status !== 'completed' && session.status !== 'partial') return false;
    const at = new Date(`${session.date}T12:00:00`).getTime();
    return at >= start && at <= end;
  }).length;
};
