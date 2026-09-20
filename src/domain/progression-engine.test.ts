import { describe, expect, it } from 'vitest';
import {
  REP_HEADROOM,
  decide,
  judge,
  progressWorkout,
  type Decision,
} from './progression-engine';
import type { Exercise } from './exercise';
import type { SessionExercise } from './session';
import type { WorkoutItem } from './workout';
import { aProgressionState, aWorkout, anExercise } from '../test/factories';
import { finishSession, recordSet, startSession } from './session-log';

const TODAY = '2026-09-28';

const easier = anExercise({
  id: 'knee-push-up',
  name: 'Knee Push-Up',
  progressionLevel: 3,
  regression: null,
  progression: 'push-up',
  prescription: { sets: { min: 3, max: 3 }, target: { min: 8, max: 15 }, restSeconds: 75 },
});

const harder = anExercise({
  id: 'diamond-push-up',
  name: 'Diamond Push-Up',
  progressionLevel: 5,
  regression: 'push-up',
  progression: null,
  prescription: { sets: { min: 3, max: 4 }, target: { min: 5, max: 10 }, restSeconds: 90 },
});

const pushUp = anExercise({
  id: 'push-up',
  name: 'Push-Up',
  progressionLevel: 4,
  regression: 'knee-push-up',
  progression: 'diamond-push-up',
  prescription: { sets: { min: 3, max: 4 }, target: { min: 6, max: 12 }, restSeconds: 90 },
});

const CATALOG: Record<string, Exercise> = {
  'push-up': pushUp,
  'knee-push-up': easier,
  'diamond-push-up': harder,
};
const lookup = (id: string) => CATALOG[id];

const item = (overrides: Partial<WorkoutItem> = {}): WorkoutItem => ({
  exerciseId: 'push-up',
  sets: 3,
  measurement: 'reps',
  target: { min: 6, max: 10 },
  restSeconds: 90,
  cue: 'Squeeze your glutes.',
  ...overrides,
});

const performed = (reps: (number | null)[], rpe = 6): SessionExercise => ({
  exerciseId: 'push-up',
  block: 'main',
  prescribed: { sets: 3, measurement: 'reps', target: { min: 6, max: 10 } },
  sets: reps.map((value, i) => ({
    setNumber: i + 1,
    reps: value,
    seconds: null,
    rpe: value === null ? null : rpe,
    completed: value !== null,
  })),
  rpe,
});

const run = (
  args: {
    reps?: (number | null)[];
    rpe?: number;
    item?: WorkoutItem;
    state?: Partial<ReturnType<typeof aProgressionState>>;
    ownsVariation?: boolean;
  } = {},
): Decision =>
  decide({
    item: args.item ?? item(),
    performed: performed(args.reps ?? [10, 10, 10], args.rpe ?? 6),
    state: aProgressionState({ currentExerciseId: 'push-up', ...args.state }),
    exercise: pushUp,
    lookup,
    ownsVariation: args.ownsVariation ?? true,
    today: TODAY,
  });

describe('judge', () => {
  it('clears when every set hits the top of the range at a workable effort', () => {
    expect(judge(performed([10, 10, 10]), item())).toBe('cleared');
  });

  it('holds when the sets are in range but not at the top', () => {
    expect(judge(performed([8, 8, 7]), item())).toBe('held');
  });

  it('counts a maximal effort as a struggle even when the reps were hit', () => {
    expect(judge(performed([10, 10, 10], 10), item())).toBe('struggled');
  });

  it('fails when a set falls below the bottom of the range', () => {
    expect(judge(performed([10, 8, 4]), item())).toBe('failed');
  });

  it('fails when a prescribed set was never done', () => {
    expect(judge(performed([10, 10]), item())).toBe('failed');
  });

  it('fails when nothing was completed at all', () => {
    expect(judge(performed([null, null, null]), item())).toBe('failed');
  });
});

describe('earning a harder session', () => {
  it('holds after a single clean session, because one session is not a trend', () => {
    const decision = run({ state: { consecutiveQualifyingSessions: 0 } });
    expect(decision.action).toBe('hold');
    expect(decision.reason).toMatch(/one more session/i);
  });

  it('raises the reps after two clean sessions running', () => {
    const decision = run({ state: { consecutiveQualifyingSessions: 1 } });
    expect(decision.action).toBe('add-reps');
    expect(decision.nextItem.target).toEqual({ min: 7, max: 11 });
  });

  it('changes nothing but the reps', () => {
    const before = item();
    const { nextItem } = run({ item: before, state: { consecutiveQualifyingSessions: 1 } });
    expect({ ...nextItem, target: before.target }).toEqual(before);
  });

  it('resets the counter after acting, so each step is earned again', () => {
    const decision = run({ state: { consecutiveQualifyingSessions: 1 } });
    expect(decision.nextState.consecutiveQualifyingSessions).toBe(0);
  });

  it('adds a set only once the reps are capped', () => {
    const capped = item({ target: { min: 12, max: pushUp.prescription.target.max + REP_HEADROOM } });
    const decision = run({
      item: capped,
      reps: [capped.target.max, capped.target.max, capped.target.max],
      state: { consecutiveQualifyingSessions: 1 },
    });
    expect(decision.action).toBe('add-set');
    expect(decision.nextItem.sets).toBe(4);
    expect(decision.nextItem.target).toEqual(capped.target);
  });

  it('advances the variation only once sets are capped too', () => {
    const capped = item({
      sets: 4,
      target: { min: 12, max: pushUp.prescription.target.max + REP_HEADROOM },
    });
    const decision = run({
      item: capped,
      reps: Array(4).fill(capped.target.max),
      state: { consecutiveQualifyingSessions: 1 },
    });
    expect(decision.action).toBe('advance-variation');
    expect(decision.nextItem.exerciseId).toBe('diamond-push-up');
  });

  it('resets the new variation to its own starting prescription', () => {
    const capped = item({
      sets: 4,
      target: { min: 12, max: pushUp.prescription.target.max + REP_HEADROOM },
    });
    const { nextItem } = run({
      item: capped,
      reps: Array(4).fill(capped.target.max),
      state: { consecutiveQualifyingSessions: 1 },
    });
    expect(nextItem.sets).toBe(3);
    expect(nextItem.target).toEqual({ min: 5, max: 10 });
  });

  it('moves the family onto the new variation', () => {
    const capped = item({
      sets: 4,
      target: { min: 12, max: pushUp.prescription.target.max + REP_HEADROOM },
    });
    const { nextState } = run({
      item: capped,
      reps: Array(4).fill(capped.target.max),
      state: { consecutiveQualifyingSessions: 1 },
    });
    expect(nextState.currentExerciseId).toBe('diamond-push-up');
    expect(nextState.currentLevel).toBe(5);
  });

  it('will not change the variation for accessory volume', () => {
    const capped = item({
      sets: 4,
      target: { min: 12, max: pushUp.prescription.target.max + REP_HEADROOM },
    });
    const decision = run({
      item: capped,
      reps: Array(4).fill(capped.target.max),
      state: { consecutiveQualifyingSessions: 1 },
      ownsVariation: false,
    });
    expect(decision.action).toBe('hold');
    expect(decision.reason).toMatch(/main push work/i);
  });
});

describe('holding', () => {
  it('holds when the session was hard rather than clean', () => {
    const decision = run({ reps: [10, 10, 10], rpe: 10, state: { consecutiveQualifyingSessions: 1 } });
    expect(decision.action).toBe('hold');
    expect(decision.reason).toMatch(/very hard/i);
  });

  it('wipes the qualifying streak after a struggle', () => {
    const decision = run({ reps: [10, 10, 10], rpe: 10, state: { consecutiveQualifyingSessions: 1 } });
    expect(decision.nextState.consecutiveQualifyingSessions).toBe(0);
  });

  it('holds when the sets were in range but short of the top', () => {
    const decision = run({ reps: [9, 8, 8], state: { consecutiveQualifyingSessions: 1 } });
    expect(decision.action).toBe('hold');
    expect(decision.nextItem).toEqual(item());
  });
});

describe('backing off', () => {
  it('changes nothing after a single short session', () => {
    const decision = run({ reps: [10, 8, 3], state: { consecutiveStrugglingSessions: 0 } });
    expect(decision.action).toBe('hold');
    expect(decision.reason).toMatch(/not a trend/i);
  });

  it('counts the short session toward a trend', () => {
    const decision = run({ reps: [10, 8, 3], state: { consecutiveStrugglingSessions: 0 } });
    expect(decision.nextState.consecutiveStrugglingSessions).toBe(1);
  });

  it('reduces the reps after two short sessions running', () => {
    const grown = item({ target: { min: 10, max: 14 } });
    const decision = run({
      item: grown,
      reps: [10, 8, 3],
      state: { consecutiveStrugglingSessions: 1 },
    });
    expect(decision.action).toBe('reduce-reps');
    // Straight back to the exercise's own base range, not one rep at a time.
    expect(decision.nextItem.target).toEqual(pushUp.prescription.target);
  });

  it('steps back a variation once the reps are already at the base range', () => {
    const decision = run({
      reps: [10, 8, 3],
      state: { consecutiveStrugglingSessions: 1 },
    });
    expect(decision.action).toBe('regress-variation');
    expect(decision.nextItem.exerciseId).toBe('knee-push-up');
  });

  it('resets the family onto the easier variation', () => {
    const { nextState } = run({ reps: [10, 8, 3], state: { consecutiveStrugglingSessions: 1 } });
    expect(nextState.currentExerciseId).toBe('knee-push-up');
    expect(nextState.consecutiveStrugglingSessions).toBe(0);
  });

  it('holds rather than regressing when there is nothing easier', () => {
    const decision = decide({
      item: item({ exerciseId: 'knee-push-up', target: easier.prescription.target }),
      performed: { ...performed([15, 15, 2]), exerciseId: 'knee-push-up' },
      state: aProgressionState({ currentExerciseId: 'knee-push-up', consecutiveStrugglingSessions: 1 }),
      exercise: easier,
      lookup,
      ownsVariation: true,
      today: TODAY,
    });
    expect(decision.action).toBe('hold');
    expect(decision.reason).toMatch(/as easy as this family gets/i);
  });

  it('never drops two things at once', () => {
    const grown = item({ sets: 4, target: { min: 10, max: 14 } });
    const { nextItem } = run({
      item: grown,
      reps: [10, 8, 3],
      state: { consecutiveStrugglingSessions: 1 },
    });
    expect(nextItem.sets).toBe(4);
  });
});

describe('repeated failure', () => {
  it('walks all the way down the ladder rather than stalling', () => {
    // Start above the base range, so there are grown reps to give back before
    // the variation is allowed to change.
    let current = item({ target: { min: 11, max: 15 } });
    let state = aProgressionState({ currentExerciseId: 'push-up' });
    const actions: string[] = [];

    for (let session = 0; session < 6; session += 1) {
      const exercise = lookup(current.exerciseId)!;
      const decision = decide({
        item: current,
        performed: {
          ...performed([current.target.min - 2, current.target.min - 2, null]),
          exerciseId: current.exerciseId,
        },
        state,
        exercise,
        lookup,
        ownsVariation: state.currentExerciseId === current.exerciseId,
        today: TODAY,
      });
      actions.push(decision.action);
      current = decision.nextItem;
      state = decision.nextState;
    }

    expect(actions).toContain('reduce-reps');
    expect(actions).toContain('regress-variation');
    expect(state.currentExerciseId).toBe('knee-push-up');
  });

  it('does not fall past the bottom of the ladder', () => {
    let current = item({ exerciseId: 'knee-push-up', target: easier.prescription.target });
    let state = aProgressionState({ currentExerciseId: 'knee-push-up' });

    for (let session = 0; session < 6; session += 1) {
      const decision = decide({
        item: current,
        performed: { ...performed([1, null, null]), exerciseId: 'knee-push-up' },
        state,
        exercise: easier,
        lookup,
        ownsVariation: true,
        today: TODAY,
      });
      current = decision.nextItem;
      state = decision.nextState;
    }

    expect(state.currentExerciseId).toBe('knee-push-up');
    expect(current.target).toEqual(easier.prescription.target);
  });
});

describe('successful progression over many sessions', () => {
  it('climbs reps, then sets, then the variation, in that order', () => {
    let current = item();
    let state = aProgressionState({ currentExerciseId: 'push-up' });
    const order: string[] = [];

    for (let session = 0; session < 40; session += 1) {
      const exercise = lookup(current.exerciseId)!;
      const decision = decide({
        item: current,
        performed: {
          ...performed(Array(current.sets).fill(current.target.max)),
          exerciseId: current.exerciseId,
          prescribed: { sets: current.sets, measurement: 'reps', target: current.target },
        },
        state,
        exercise,
        lookup,
        ownsVariation: state.currentExerciseId === current.exerciseId,
        today: TODAY,
      });
      if (decision.action !== 'hold') order.push(decision.action);
      current = decision.nextItem;
      state = decision.nextState;
    }

    const firstSet = order.indexOf('add-set');
    const firstAdvance = order.indexOf('advance-variation');
    expect(order[0]).toBe('add-reps');
    expect(firstSet).toBeGreaterThan(0);
    expect(firstAdvance).toBeGreaterThan(firstSet);
    expect(state.currentExerciseId).toBe('diamond-push-up');
  });

  it('takes several weeks rather than several sessions', () => {
    let current = item();
    let state = aProgressionState({ currentExerciseId: 'push-up' });
    let sessions = 0;

    while (state.currentExerciseId === 'push-up' && sessions < 100) {
      const decision = decide({
        item: current,
        performed: {
          ...performed(Array(current.sets).fill(current.target.max)),
          prescribed: { sets: current.sets, measurement: 'reps', target: current.target },
        },
        state,
        exercise: pushUp,
        lookup,
        ownsVariation: true,
        today: TODAY,
      });
      current = decision.nextItem;
      state = decision.nextState;
      sessions += 1;
    }

    // Four sessions a week, so a dozen or more sessions is several weeks of
    // clean work before the variation moves. That is the "moderate" in
    // moderate progression.
    expect(sessions).toBeGreaterThanOrEqual(12);
  });
});

describe('every decision explains itself', () => {
  const samples: Decision[] = [
    run({ state: { consecutiveQualifyingSessions: 0 } }),
    run({ state: { consecutiveQualifyingSessions: 1 } }),
    run({ reps: [9, 8, 8] }),
    run({ reps: [10, 10, 10], rpe: 10 }),
    run({ reps: [10, 8, 3] }),
    run({ reps: [10, 8, 3], state: { consecutiveStrugglingSessions: 1 } }),
  ];

  it.each(samples.map((d) => [d.action, d] as const))(
    '%s says why in a full sentence',
    (_action, decision: Decision) => {
      expect(decision.reason.length).toBeGreaterThan(40);
      expect(decision.reason).toMatch(/\.$/);
    },
  );

  it('addresses the athlete rather than describing the system', () => {
    for (const decision of samples) {
      expect(decision.reason).not.toMatch(/\bRPE\b|consecutiveQualifying|verdict/i);
    }
  });
});

describe('progressWorkout', () => {
  const workout = aWorkout();

  const sessionWith = (reps: number[]) => {
    let session = startSession(workout, '2026-09-21', '2026-09-21T18:30:00.000Z');
    for (const value of reps) {
      session = recordSet(session, 'push-up', { reps: value, difficulty: 'moderate' });
    }
    session = recordSet(session, 'cat-cow', { reps: 10, difficulty: 'easy' });
    return finishSession(session, '2026-09-21T19:00:00.000Z');
  };

  it('returns a decision for each main exercise', () => {
    const result = progressWorkout(
      sessionWith([10, 10, 10]),
      workout,
      [aProgressionState({ currentExerciseId: 'push-up' })],
      lookup,
      TODAY,
    );
    expect(result.decisions.map((d) => d.exerciseId)).toEqual(['push-up']);
  });

  it('leaves the warm-up alone', () => {
    const result = progressWorkout(
      sessionWith([10, 10, 10]),
      workout,
      [aProgressionState({ currentExerciseId: 'push-up', consecutiveQualifyingSessions: 1 })],
      lookup,
      TODAY,
    );
    expect(result.workout.warmUp).toEqual(workout.warmUp);
  });

  it('writes the new prescription into the workout', () => {
    const result = progressWorkout(
      sessionWith([10, 10, 10]),
      workout,
      [aProgressionState({ currentExerciseId: 'push-up', consecutiveQualifyingSessions: 1 })],
      lookup,
      TODAY,
    );
    expect(result.workout.mainWork[0]!.target).toEqual({ min: 7, max: 11 });
  });

  it('carries the updated family state back out', () => {
    const result = progressWorkout(
      sessionWith([10, 10, 10]),
      workout,
      [aProgressionState({ currentExerciseId: 'push-up' })],
      lookup,
      TODAY,
    );
    expect(result.states[0]!.consecutiveQualifyingSessions).toBe(1);
  });

  it('leaves an exercise alone when nothing was logged for it', () => {
    const untouched = progressWorkout(
      sessionWith([]),
      workout,
      [aProgressionState({ currentExerciseId: 'push-up' })],
      lookup,
      TODAY,
    );
    expect(untouched.workout.mainWork[0]).toEqual(workout.mainWork[0]);
  });
});
