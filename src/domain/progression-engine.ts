import type { Exercise } from './exercise';
import type { ProgressionState } from './progression';
import type { SessionExercise, WorkoutSession } from './session';
import type { Workout, WorkoutItem } from './workout';

/**
 * Deciding what to prescribe next.
 *
 * Three rules, applied in order, and only ever **one** change at a time:
 *
 * 1. Clear the whole range on every set, twice running → make it slightly
 *    harder. Reps first; only when reps are capped does a set get added; only
 *    when sets are capped does the variation change.
 * 2. Struggle, or fall short once → change nothing. Repeating a session is a
 *    legitimate outcome, not a failure of the system.
 * 3. Fall short twice running → take something away, in the same order
 *    reversed: reps first, and only at the bottom of the range does the
 *    variation step back.
 *
 * **What this does not measure.** The brief asks for progression on good
 * technique, range of motion and tempo. The app records reps, seconds, whether
 * a set was completed, and how hard it felt. It cannot see your elbows flaring
 * or your hips sagging, so "good technique" here is a proxy: sets finished at a
 * difficulty below very-hard. Rest and tempo are deliberately held constant —
 * cutting rest makes a session harder without making the athlete stronger, and
 * changing tempo at the same time as reps would confound both.
 */

export const VERDICTS = ['cleared', 'held', 'struggled', 'failed'] as const;
export type Verdict = (typeof VERDICTS)[number];

export const PROGRESSION_ACTIONS = [
  'hold',
  'add-reps',
  'add-set',
  'advance-variation',
  'reduce-reps',
  'regress-variation',
] as const;
export type ProgressionAction = (typeof PROGRESSION_ACTIONS)[number];

/** How far a target may grow before the next variable is touched. */
export const REP_STEP = 1;
export const SECONDS_STEP = 5;
export const REP_HEADROOM = 4;
export const SECONDS_HEADROOM = 20;

/** At or above this average, the set was too hard to count as clean. */
export const TOO_HARD_RPE = 9;

const isTimed = (item: Pick<WorkoutItem, 'measurement'>) =>
  item.measurement === 'time' || item.measurement === 'time-per-side';

const valueOf = (set: { reps: number | null; seconds: number | null }): number =>
  set.reps ?? set.seconds ?? 0;

const averageRpe = (values: (number | null)[]): number | null => {
  const scored = values.filter((v): v is number => v !== null);
  if (scored.length === 0) return null;
  return scored.reduce((sum, v) => sum + v, 0) / scored.length;
};

/**
 * How one exercise went, judged only against what was asked of it.
 *
 * `cleared` means every prescribed set was completed at the top of the range
 * and none of it felt like a maximum effort.
 */
export const judge = (performed: SessionExercise, item: WorkoutItem): Verdict => {
  const completed = performed.sets.filter((s) => s.completed);
  if (completed.length === 0) return 'failed';

  const values = completed.map(valueOf);
  const rpe = averageRpe(completed.map((s) => s.rpe));
  const allSetsDone = completed.length >= item.sets;
  const shortOfMinimum = values.some((v) => v < item.target.min);

  if (!allSetsDone || shortOfMinimum) return 'failed';
  if (rpe !== null && rpe >= TOO_HARD_RPE) return 'struggled';
  if (values.every((v) => v >= item.target.max)) return 'cleared';
  return 'held';
};

export interface Decision {
  exerciseId: string;
  verdict: Verdict;
  action: ProgressionAction;
  /** Plain language, addressed to the athlete. */
  reason: string;
  nextItem: WorkoutItem;
  nextState: ProgressionState;
}

interface DecideArgs {
  item: WorkoutItem;
  performed: SessionExercise;
  state: ProgressionState;
  exercise: Exercise;
  lookup: (id: string) => Exercise | undefined;
  /** Only the exercise the family currently sits on may change variation. */
  ownsVariation: boolean;
  today: string;
}

const grownRange = (item: WorkoutItem) => {
  const step = isTimed(item) ? SECONDS_STEP : REP_STEP;
  return { min: item.target.min + step, max: item.target.max + step };
};

const ceilingFor = (item: WorkoutItem, exercise: Exercise) =>
  exercise.prescription.target.max + (isTimed(item) ? SECONDS_HEADROOM : REP_HEADROOM);

const unit = (item: WorkoutItem) => (isTimed(item) ? 'seconds' : 'reps');

const range = (target: { min: number; max: number }) => `${target.min}–${target.max}`;

/** A fresh prescription when the variation changes. */
const itemForExercise = (exercise: Exercise): Omit<WorkoutItem, 'note'> => ({
  exerciseId: exercise.id,
  sets: exercise.prescription.sets.min,
  measurement: exercise.measurement,
  target: exercise.prescription.target,
  restSeconds: exercise.prescription.restSeconds,
  cue: exercise.cues[0] ?? 'Move well.',
});

export const decide = ({
  item,
  performed,
  state,
  exercise,
  lookup,
  ownsVariation,
  today,
}: DecideArgs): Decision => {
  const verdict = judge(performed, item);

  const qualifying = verdict === 'cleared' ? state.consecutiveQualifyingSessions + 1 : 0;
  const struggling = verdict === 'failed' ? state.consecutiveStrugglingSessions + 1 : 0;

  const base = { exerciseId: item.exerciseId, verdict };
  const nextState: ProgressionState = {
    ...state,
    consecutiveQualifyingSessions: qualifying,
    consecutiveStrugglingSessions: struggling,
    updatedAt: today,
  };

  const hold = (reason: string): Decision => ({
    ...base,
    action: 'hold',
    reason,
    nextItem: item,
    nextState,
  });

  // --- earning something harder ------------------------------------------
  if (verdict === 'cleared') {
    const needed = state.progressionCriteria.consecutiveSessions;
    if (qualifying < needed) {
      return hold(
        `Every set at the top of the range and it did not feel maximal. One more session like this and the target goes up.`,
      );
    }

    const atRepCeiling = item.target.max >= ceilingFor(item, exercise);
    const atSetCeiling = item.sets >= exercise.prescription.sets.max;

    if (!atRepCeiling) {
      const target = grownRange(item);
      return {
        ...base,
        action: 'add-reps',
        reason: `You cleared the top of the range ${qualifying} sessions running, so the target goes up to ${range(target)} ${unit(item)}. Reps move first; nothing else changes.`,
        nextItem: { ...item, target },
        nextState: { ...nextState, consecutiveQualifyingSessions: 0 },
      };
    }

    if (!atSetCeiling) {
      return {
        ...base,
        action: 'add-set',
        reason: `You are at the top of the rep range and it is still comfortable, so you get a ${item.sets + 1}th set instead. The reps stay where they are.`,
        nextItem: { ...item, sets: item.sets + 1 },
        nextState: { ...nextState, consecutiveQualifyingSessions: 0 },
      };
    }

    const harder = exercise.progression ? lookup(exercise.progression) : undefined;
    if (!ownsVariation) {
      return hold(
        `This one is capped at ${item.sets} sets of ${range(item.target)}, which is as far as it goes here. Your main ${exercise.family} work is where the variation changes.`,
      );
    }
    if (!harder) {
      return hold(
        `You have maxed out the sets and reps and there is nothing harder in this family yet. Holding here until there is.`,
      );
    }

    const fresh = itemForExercise(harder);
    return {
      ...base,
      action: 'advance-variation',
      reason: `Sets and reps are both maxed out on ${exercise.name}, so it is time for ${harder.name}. Starting at ${fresh.sets} sets of ${range(fresh.target)} — expect it to feel hard again.`,
      nextItem: { ...fresh, cue: fresh.cue },
      nextState: {
        ...nextState,
        currentExerciseId: harder.id,
        currentLevel: harder.progressionLevel,
        consecutiveQualifyingSessions: 0,
        consecutiveStrugglingSessions: 0,
      },
    };
  }

  // --- holding -----------------------------------------------------------
  if (verdict === 'struggled') {
    return hold(
      `You finished every set but they were very hard, so the target stays at ${range(item.target)} ${unit(item)}. Repeating a session until it feels solid is the point, not a setback.`,
    );
  }

  if (verdict === 'held') {
    return hold(
      `Solid session, but not every set reached ${item.target.max} ${unit(item)}. Same target next time.`,
    );
  }

  // --- backing off -------------------------------------------------------
  const needed = state.regressionCriteria.consecutiveSessions;
  if (struggling < needed) {
    return hold(
      `You came up short this time. Nothing changes yet — one bad session is a bad session, not a trend.`,
    );
  }

  const atBase = item.target.max <= exercise.prescription.target.max;
  if (!atBase) {
    // Straight back to the dose that was known to work, not one rep at a
    // time. Creeping down leaves the athlete failing for weeks while the
    // numbers catch up with them.
    const target = exercise.prescription.target;
    return {
      ...base,
      action: 'reduce-reps',
      reason: `Two sessions short of the target, so it goes back to ${range(target)} ${unit(item)} — the dose you were handling before. Build up from there.`,
      nextItem: { ...item, target },
      nextState: { ...nextState, consecutiveStrugglingSessions: 0 },
    };
  }

  const easier = exercise.regression ? lookup(exercise.regression) : undefined;
  if (!ownsVariation || !easier) {
    return hold(
      `Two short sessions, but ${exercise.name} is already as easy as this family gets. Staying here and building into it.`,
    );
  }

  const fresh = itemForExercise(easier);
  return {
    ...base,
    action: 'regress-variation',
    reason: `Two sessions short at the bottom of the range, so we are stepping back to ${easier.name}. Build it there and ${exercise.name} will come back.`,
    nextItem: fresh,
    nextState: {
      ...nextState,
      currentExerciseId: easier.id,
      currentLevel: easier.progressionLevel,
      consecutiveQualifyingSessions: 0,
      consecutiveStrugglingSessions: 0,
    },
  };
};

export interface ProgressionResult {
  workout: Workout;
  states: ProgressionState[];
  decisions: Decision[];
}

/**
 * Applies the rules across a finished session.
 *
 * Only main work progresses. Warm-ups and mobility are there to prepare the
 * body, not to be driven upward, and a cat-cow that keeps gaining reps helps
 * nobody.
 */
export const progressWorkout = (
  session: WorkoutSession,
  workout: Workout,
  states: ProgressionState[],
  lookup: (id: string) => Exercise | undefined,
  today: string,
): ProgressionResult => {
  const decisions: Decision[] = [];
  const nextStates = new Map(states.map((s) => [s.family, s]));

  // A restorative routine is not training. Driving mobility drills upward would
  // turn a rest day into a fifth workout, which is exactly what it is not.
  if (workout.kind === 'mobility') {
    return { workout, states, decisions };
  }

  const mainWork = workout.mainWork.map((item) => {
    const performed = session.exercises.find(
      (e) => e.exerciseId === item.exerciseId && e.block === 'main',
    );
    const exercise = lookup(item.exerciseId);
    const state = exercise ? nextStates.get(exercise.family) : undefined;
    if (!performed || !exercise || !state) return item;

    // Nothing logged at all: the athlete never got to this one. Running out of
    // time is not the same as trying and falling short, and must not push them
    // down a level. A set that was *skipped* still counts — that is a recorded
    // outcome, an absent set is not.
    if (performed.sets.length === 0) return item;

    const decision = decide({
      item,
      performed,
      state,
      exercise,
      lookup,
      ownsVariation: state.currentExerciseId === item.exerciseId,
      today,
    });

    decisions.push(decision);
    nextStates.set(decision.nextState.family, decision.nextState);
    return decision.nextItem;
  });

  return {
    workout: { ...workout, mainWork },
    states: [...nextStates.values()],
    decisions,
  };
};
