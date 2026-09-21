import { TOO_HARD_RPE, type Decision } from './progression-engine';
import type { SessionExercise, SessionSet, WorkoutSession } from './session';
import { LABELS, difficultyForRpe, type PerceivedDifficulty } from './session-log';

/**
 * Reading a finished session back, and saying one sensible thing about it.
 *
 * The progression engine decides what the *numbers* do next. This decides what
 * to **say**, and adds the one judgement the engine cannot make on its own:
 * whether the athlete needs a easier week rather than a different prescription.
 *
 * Everything is read from the session itself. `SessionExercise.prescribed`
 * records what was asked for at the time, so any session — including one from
 * months ago, prescribed differently — can be analysed without the workout it
 * came from.
 *
 * **Quality is a proxy, and stays one.** The app sees reps, seconds, whether a
 * set was finished and how hard it felt. It cannot see a sagging hip or a
 * half-range squat. "Quality" here means completion, effort and how far the
 * reps fell away across the sets — never form, and the wording never pretends
 * otherwise.
 */

export const EXERCISE_QUALITIES = ['clean', 'strained', 'broke-down'] as const;
export type ExerciseQuality = (typeof EXERCISE_QUALITIES)[number];

export const SESSION_FOCUSES = ['progress', 'steady', 'recovery'] as const;
export type SessionFocus = (typeof SESSION_FOCUSES)[number];

/** The rep drop-off, first set to last, that counts as fading. */
const REP_FADE = 3;
const SECONDS_FADE = 10;

/** The answer "Failed" is recorded as this, and means exactly that. */
const FAILED_RPE = 10;

export interface ExerciseAnalysis {
  exerciseId: string;
  setsPrescribed: number;
  setsCompleted: number;
  failedSets: number;
  /** Reps, or seconds for a timed exercise. */
  totalValue: number;
  measuredIn: 'reps' | 'seconds';
  averageRpe: number | null;
  difficulty: PerceivedDifficulty | null;
  /** Every completed set reached the top of what was asked for. */
  atTopOfRange: boolean;
  /** How far the last set fell below the first. Zero when it held up. */
  dropOff: number;
  quality: ExerciseQuality;
}

const mean = (values: number[]): number | null =>
  values.length === 0 ? null : values.reduce((sum, v) => sum + v, 0) / values.length;

const analyse = (performed: SessionExercise): ExerciseAnalysis => {
  const timed = performed.prescribed.measurement.startsWith('time');
  const done = performed.sets.filter((s) => s.completed);
  const valueOf = (set: SessionSet) => (timed ? (set.seconds ?? 0) : (set.reps ?? 0));

  const values = done.map(valueOf);
  const rpe = mean(done.map((s) => s.rpe).filter((r): r is number => r !== null));

  // A set is failed when it was abandoned, or when it was rated "Failed" *and*
  // came up short. Hitting the top of the range and having nothing left is a
  // grind, not a failure, and the coach should not treat it as one.
  const failedSets =
    performed.sets.filter((s) => !s.completed).length +
    done.filter((s) => s.rpe === FAILED_RPE && valueOf(s) < performed.prescribed.target.min)
      .length;

  const first = values[0] ?? 0;
  const last = values.at(-1) ?? 0;
  const dropOff = Math.max(0, first - last);

  const shortOfSets = done.length < performed.prescribed.sets;
  const faded = dropOff >= (timed ? SECONDS_FADE : REP_FADE);

  const quality: ExerciseQuality =
    failedSets > 0 || shortOfSets
      ? 'broke-down'
      : (rpe !== null && rpe >= TOO_HARD_RPE) || faded
        ? 'strained'
        : 'clean';

  return {
    exerciseId: performed.exerciseId,
    setsPrescribed: performed.prescribed.sets,
    setsCompleted: done.length,
    failedSets,
    totalValue: values.reduce((sum, v) => sum + v, 0),
    measuredIn: timed ? 'seconds' : 'reps',
    averageRpe: rpe,
    difficulty: rpe === null ? null : difficultyForRpe(rpe),
    atTopOfRange: values.length > 0 && values.every((v) => v >= performed.prescribed.target.max),
    dropOff,
    quality,
  };
};

/**
 * How each exercise went.
 *
 * Main work only. Warm-ups and mobility are there to prepare the body, and
 * judging a cat-cow would be judging the wrong thing.
 */
export const analyseSession = (session: WorkoutSession): ExerciseAnalysis[] =>
  session.exercises.filter((e) => e.block === 'main').map(analyse);

/**
 * Whether the session as a whole took more out of the athlete than it should.
 *
 * Half the exercises, not one: a single hard lift in a session of four is a
 * hard lift, and calling that a hard session would have the coach flinching at
 * ordinary training.
 */
export const wasStrained = (session: WorkoutSession): boolean => {
  const analyses = analyseSession(session);
  if (analyses.length === 0) return false;

  const rough = analyses.filter((a) => a.quality !== 'clean').length;
  return rough * 2 >= analyses.length;
};

export interface CoachReport {
  focus: SessionFocus;
  /** What happened, and what it means. One sentence. */
  headline: string;
  /** What to do about it. One sentence. */
  advice: string;
  analyses: ExerciseAnalysis[];
}

interface CoachArgs {
  session: WorkoutSession;
  /** What the progression engine decided. Reported, never re-derived. */
  decisions: Decision[];
  /** Earlier sessions, for the one judgement a single session cannot make. */
  history: WorkoutSession[];
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

const PROGRESS_ACTIONS: Decision['action'][] = ['add-reps', 'add-set', 'advance-variation'];
const EASIER_ACTIONS: Decision['action'][] = ['reduce-reps', 'regress-variation'];

const trainingInOrder = (sessions: WorkoutSession[]): WorkoutSession[] =>
  sessions
    .filter(
      (s) => s.kind === 'training' && (s.status === 'completed' || s.status === 'partial'),
    )
    .sort((a, b) => a.date.localeCompare(b.date));

/**
 * Whether the last two training sessions both took more out of the athlete
 * than they should have.
 *
 * Two, not one: one hard session is training. Read from the sessions alone, so
 * it can be asked before a workout as well as after one — which is when it is
 * actually useful.
 */
export const needsRecovery = (sessions: WorkoutSession[]): boolean => {
  const recent = trainingInOrder(sessions).slice(-2);
  return recent.length === 2 && recent.every(wasStrained);
};

/**
 * One reading of the session, in the athlete's language.
 *
 * Nothing here changes a prescription. Recovery in particular is advice, not a
 * reduction: the engine has already decided whether the numbers move, and
 * stacking a deload on top of that would be two changes at once — exactly what
 * the whole system is built to avoid.
 */
export const coachReport = ({ session, decisions, history }: CoachArgs): CoachReport => {
  const analyses = analyseSession(session);

  if (analyses.length === 0) {
    return {
      focus: 'steady',
      headline: 'Nothing logged for this session, so there is nothing to read into it.',
      advice: 'The next session is unchanged and waiting whenever you are.',
      analyses,
    };
  }

  // Recovery needs a pattern. One hard session is training; two in a row is a
  // signal, and it is the only thing here that looks beyond today.
  if (needsRecovery([...history.filter((s) => s.id !== session.id), session])) {
    return {
      focus: 'recovery',
      headline:
        'That was the second hard session in a row. The targets stay exactly where they are.',
      advice:
        'Treat the next one as easy work: full rest between sets, stop each set with something left, and put a mobility routine and an early night in between.',
      analyses,
    };
  }

  const progressing = decisions.filter((d) => PROGRESS_ACTIONS.includes(d.action));
  const easing = decisions.filter((d) => EASIER_ACTIONS.includes(d.action));
  const broken = analyses.filter((a) => a.quality === 'broke-down');
  const strainedLifts = analyses.filter((a) => a.quality === 'strained');

  if (progressing.length > 0 && broken.length === 0) {
    const best = analyses.find((a) => a.atTopOfRange) ?? analyses[0]!;
    const difficulty = best.difficulty === null ? 'no difficulty logged' : LABELS[best.difficulty];

    return {
      focus: 'progress',
      headline: `You completed all ${plural(best.setsCompleted, 'set')} at the top of the range with ${difficulty.toLowerCase()} difficulty. We'll progress slightly next time.`,
      advice: `One thing at a time: ${progressing.length === 1 ? 'a single exercise moves' : `${progressing.length} exercises move`} and everything else stays as it was.`,
      analyses,
    };
  }

  if (easing.length > 0) {
    return {
      focus: 'steady',
      headline: `Two sessions short of the target now, so ${plural(easing.length, 'exercise')} goes back to something easier.`,
      advice: 'Rebuild from a dose you were handling. It comes back faster than it went.',
      analyses,
    };
  }

  if (broken.length > 0) {
    const worst = broken[0]!;
    return {
      focus: 'steady',
      headline: `You came up short on ${plural(worst.failedSets, 'set')}. Same variation, same targets next time.`,
      advice:
        'One session is not a trend, so nothing changes yet. Take the full rest between sets and stop each one while the reps still look like reps.',
      analyses,
    };
  }

  if (strainedLifts.length > 0) {
    return {
      focus: 'steady',
      headline:
        'You struggled with the final set. We’ll keep the same variation and focus on controlled reps.',
      advice:
        'Slow the lowering phase and take the full rest. The target only moves once the last set looks like the first.',
      analyses,
    };
  }

  return {
    focus: 'steady',
    headline: 'Solid session, though not every set reached the top of the range. Same targets next time.',
    advice: 'Clear the top of the range on every set and the target goes up from there.',
    analyses,
  };
};
