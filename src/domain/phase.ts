import { shiftDays } from './calendar';
import { analyseSession, needsRecovery } from './coach';
import type { Family, Measurement } from './primitives';
import type { PhaseName, UserProfile } from './profile';
import type { ProgressionState } from './progression';
import type { WorkoutSession } from './session';

/**
 * Long-term phases, and what it takes to leave one.
 *
 * **Nothing here advances on time.** A phase has no deadline and no timetable;
 * it ends when the athlete has demonstrably earned the next one. Weeks in a
 * phase is information, never a criterion — a beginner who trains twice a month
 * should not be handed harder work in April because April arrived.
 *
 * Five dimensions, all read from what was actually logged:
 *
 * - **consistency** — sessions kept against sessions scheduled
 * - **technique** — the same proxy the coach uses: exercises finishing clean
 * - **strength** — named benchmarks, at a real number of sets
 * - **performance** — how far each family has climbed its own ladder
 * - **recovery** — not arriving at the next phase already run down
 *
 * The criteria themselves are content, not logic: a {@link PhaseSpec} is data,
 * and `content/phases.ts` holds the four of them.
 */

export const PHASE_DIMENSIONS = [
  'consistency',
  'technique',
  'strength',
  'performance',
  'recovery',
] as const;
export type PhaseDimension = (typeof PHASE_DIMENSIONS)[number];

export interface Benchmark {
  exerciseId: string;
  /** How many sets must reach the value, in a single session. */
  sets: number;
  /** Reps, or seconds for a timed hold. */
  value: number;
  measurement: Measurement;
  label: string;
}

export interface LevelRequirement {
  family: Family;
  level: number;
  label: string;
}

export interface PhaseSpec {
  name: PhaseName;
  /** Position in the ladder, from one. */
  ordinal: number;
  title: string;
  /** One line: what this phase is for. */
  focus: string;
  summary: string;
  /** The phase this one leads to, or null at the top. */
  next: PhaseName | null;
  exit: {
    /** Finished training sessions inside this phase. */
    sessions: number;
    /** Fraction of scheduled sessions kept over the recent window. */
    consistency: number;
    /** Fraction of main-work exercises finishing clean. */
    cleanRatio: number;
    benchmarks: Benchmark[];
    levels: LevelRequirement[];
  };
}

/** How far back consistency and technique are measured. */
export const CONSISTENCY_WEEKS = 4;
export const TECHNIQUE_SESSIONS = 6;

const finished = (session: WorkoutSession) =>
  session.kind === 'training' && (session.status === 'completed' || session.status === 'partial');

const byDate = (a: WorkoutSession, b: WorkoutSession) => a.date.localeCompare(b.date);

/**
 * Finished training sessions since the current phase began.
 *
 * Inclusive of the start date: a phase begins on a day, and work done on that
 * day counts toward it. The session that earns a phase is therefore also its
 * first — one session out of sixteen, and far better than an off-by-one that
 * silently drops the first day an athlete ever trains.
 */
export const sessionsInPhase = (
  sessions: WorkoutSession[],
  profile: UserProfile,
): WorkoutSession[] =>
  sessions.filter((s) => finished(s) && s.date >= profile.currentPhase.startedAt).sort(byDate);

export interface Consistency {
  kept: number;
  scheduled: number;
}

/** Sessions kept against sessions scheduled, over the last `weeks` weeks. */
export const consistency = (
  sessions: WorkoutSession[],
  profile: UserProfile,
  today: string,
  weeks: number = CONSISTENCY_WEEKS,
): Consistency => {
  const from = shiftDays(today, -7 * weeks);
  return {
    kept: sessions.filter((s) => finished(s) && s.date > from && s.date <= today).length,
    scheduled: profile.trainingDays.length * weeks,
  };
};

export interface TechniqueRatio {
  clean: number;
  total: number;
}

/**
 * How much of the recent work finished clean.
 *
 * The same proxy the coach uses, and the same caveat: the app cannot see the
 * athlete move. "Clean" means every set completed, none of it maximal, and the
 * reps not falling away — never form.
 */
export const techniqueRatio = (
  sessions: WorkoutSession[],
  count: number = TECHNIQUE_SESSIONS,
): TechniqueRatio => {
  const recent = sessions.filter(finished).sort(byDate).slice(-count);
  const analyses = recent.flatMap(analyseSession);

  return {
    clean: analyses.filter((a) => a.quality === 'clean').length,
    total: analyses.length,
  };
};

/**
 * The best the athlete has managed against a benchmark, in one session.
 *
 * The value of the *n*th best set, so "3 sets of 10" cannot be claimed with one
 * good set and two poor ones.
 */
export const bestForBenchmark = (sessions: WorkoutSession[], benchmark: Benchmark): number => {
  const timed = benchmark.measurement.startsWith('time');

  return sessions.filter(finished).reduce((best, session) => {
    const performed = session.exercises.filter(
      (e) => e.exerciseId === benchmark.exerciseId && e.block === 'main',
    );
    const values = performed
      .flatMap((e) => e.sets)
      .filter((s) => s.completed)
      .map((s) => (timed ? (s.seconds ?? 0) : (s.reps ?? 0)))
      .sort((a, b) => b - a);

    return Math.max(best, values.length < benchmark.sets ? 0 : (values[benchmark.sets - 1] ?? 0));
  }, 0);
};

export interface Requirement {
  id: string;
  dimension: PhaseDimension;
  label: string;
  /** Where the athlete stands, in their own numbers. */
  progress: string;
  met: boolean;
}

export interface PhaseAssessment {
  spec: PhaseSpec;
  requirements: Requirement[];
  metCount: number;
  /** Every criterion met, and somewhere to go. */
  ready: boolean;
  next: PhaseName | null;
}

interface AssessArgs {
  spec: PhaseSpec;
  profile: UserProfile;
  sessions: WorkoutSession[];
  progression: ProgressionState[];
  today: string;
}

const percent = (part: number, whole: number) => (whole === 0 ? 0 : part / whole);

export const assessPhase = ({
  spec,
  profile,
  sessions,
  progression,
  today,
}: AssessArgs): PhaseAssessment => {
  const requirements: Requirement[] = [];
  const inPhase = sessionsInPhase(sessions, profile);

  if (spec.exit.sessions > 0) {
    requirements.push({
      id: 'sessions',
      dimension: 'consistency',
      label: `${spec.exit.sessions} sessions in this phase`,
      progress: `${inPhase.length} of ${spec.exit.sessions}`,
      met: inPhase.length >= spec.exit.sessions,
    });
  }

  if (spec.exit.consistency > 0) {
    const kept = consistency(sessions, profile, today);
    const ratio = percent(kept.kept, kept.scheduled);
    requirements.push({
      id: 'consistency',
      dimension: 'consistency',
      label: `${Math.round(spec.exit.consistency * 100)}% of sessions kept over ${CONSISTENCY_WEEKS} weeks`,
      progress: `${kept.kept} of ${kept.scheduled}`,
      met: ratio >= spec.exit.consistency,
    });
  }

  if (spec.exit.cleanRatio > 0) {
    const technique = techniqueRatio(sessions);
    const ratio = percent(technique.clean, technique.total);
    requirements.push({
      id: 'technique',
      dimension: 'technique',
      label: `${Math.round(spec.exit.cleanRatio * 100)}% of recent work finishing clean`,
      progress: `${technique.clean} of ${technique.total}`,
      met: technique.total > 0 && ratio >= spec.exit.cleanRatio,
    });
  }

  for (const benchmark of spec.exit.benchmarks) {
    const best = bestForBenchmark(sessions, benchmark);
    const unit = benchmark.measurement.startsWith('time') ? 'seconds' : 'reps';
    requirements.push({
      id: `benchmark:${benchmark.exerciseId}`,
      dimension: 'strength',
      label: benchmark.label,
      progress: `${best} of ${benchmark.value} ${unit}`,
      met: best >= benchmark.value,
    });
  }

  for (const level of spec.exit.levels) {
    const state = progression.find((s) => s.family === level.family);
    const reached = state?.currentLevel ?? 0;
    requirements.push({
      id: `level:${level.family}`,
      dimension: 'performance',
      label: level.label,
      progress: `step ${reached} of ${level.level}`,
      met: reached >= level.level,
    });
  }

  // Always asked, never configurable. Arriving at a harder phase already run
  // down is how a training plan turns into an injury.
  const recovered = !needsRecovery(sessions);
  requirements.push({
    id: 'recovery',
    dimension: 'recovery',
    label: 'Recovered, not fighting the last two sessions',
    progress: recovered ? 'settled' : 'two hard sessions',
    met: recovered,
  });

  const metCount = requirements.filter((r) => r.met).length;

  return {
    spec,
    requirements,
    metCount,
    ready: spec.next !== null && metCount === requirements.length,
    next: spec.next,
  };
};

/**
 * Moves the athlete on.
 *
 * The new phase starts today, so everything earned under the old one stops
 * counting: the next phase is measured from here.
 */
export const advanceTo = (
  profile: UserProfile,
  next: PhaseName,
  today: string,
): UserProfile => ({
  ...profile,
  currentPhase: { ...profile.currentPhase, name: next, startedAt: today },
  updatedAt: today,
});
