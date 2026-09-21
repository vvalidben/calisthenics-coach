import { describe, expect, it } from 'vitest';
import { analyseSession, coachReport, needsRecovery, wasStrained } from './coach';
import type { Decision } from './progression-engine';
import type { SessionExercise, SessionSet, WorkoutSession } from './session';
import { aSession } from '../test/factories';

const set = (setNumber: number, reps: number | null, rpe: number | null): SessionSet => ({
  setNumber,
  reps,
  seconds: null,
  rpe: rpe as SessionSet['rpe'],
  completed: reps !== null,
});

const held = (setNumber: number, seconds: number, rpe: number): SessionSet => ({
  setNumber,
  reps: null,
  seconds,
  rpe: rpe as SessionSet['rpe'],
  completed: true,
});

const pushUps = (sets: SessionSet[], overrides: Partial<SessionExercise> = {}): SessionExercise => ({
  exerciseId: 'push-up',
  block: 'main',
  prescribed: { sets: 3, measurement: 'reps', target: { min: 6, max: 10 } },
  sets,
  rpe: null,
  ...overrides,
});

const squats = (sets: SessionSet[]): SessionExercise =>
  pushUps(sets, { exerciseId: 'bodyweight-squat' });

const session = (exercises: SessionExercise[], overrides: Partial<WorkoutSession> = {}) =>
  aSession({ id: 's', date: '2026-09-21', kind: 'training', status: 'completed', exercises, ...overrides });

/** Three clean sets at the top of the range. */
const cleanSets = [set(1, 10, 6), set(2, 10, 6), set(3, 10, 6)];

const analysisOf = (exercises: SessionExercise[], id = 'push-up') =>
  analyseSession(session(exercises)).find((a) => a.exerciseId === id)!;

describe('completion', () => {
  it('counts the sets that were asked for', () => {
    expect(analysisOf([pushUps(cleanSets)]).setsPrescribed).toBe(3);
  });

  it('counts the sets that were done', () => {
    expect(analysisOf([pushUps(cleanSets)]).setsCompleted).toBe(3);
  });

  it('notices a set that was never performed', () => {
    const short = [set(1, 10, 6), set(2, 10, 7)];
    expect(analysisOf([pushUps(short)]).setsCompleted).toBe(2);
  });

  it('leaves warm-ups and mobility out: they are preparation, not work to judge', () => {
    const warmUp = pushUps(cleanSets, { exerciseId: 'cat-cow', block: 'warm-up' });
    const stretch = pushUps(cleanSets, { exerciseId: 'cat-cow', block: 'mobility' });
    expect(analyseSession(session([warmUp, stretch, pushUps(cleanSets)]))).toHaveLength(1);
  });
});

describe('reps', () => {
  it('totals what was performed', () => {
    expect(analysisOf([pushUps(cleanSets)]).totalValue).toBe(30);
  });

  it('knows when every set reached the top of the range', () => {
    expect(analysisOf([pushUps(cleanSets)]).atTopOfRange).toBe(true);
  });

  it('knows when one set did not', () => {
    expect(analysisOf([pushUps([set(1, 10, 6), set(2, 10, 6), set(3, 8, 7)])]).atTopOfRange).toBe(
      false,
    );
  });

  it('measures how far the last set fell below the first', () => {
    expect(analysisOf([pushUps([set(1, 10, 6), set(2, 8, 8), set(3, 5, 9)])]).dropOff).toBe(5);
  });

  it('counts a timed hold in seconds', () => {
    const plank = pushUps([held(1, 30, 6), held(2, 25, 8)], {
      prescribed: { sets: 2, measurement: 'time', target: { min: 20, max: 30 } },
    });
    expect(analysisOf([plank])).toMatchObject({ totalValue: 55, measuredIn: 'seconds' });
  });
});

describe('difficulty', () => {
  it('averages how hard the sets felt', () => {
    expect(analysisOf([pushUps([set(1, 10, 6), set(2, 10, 8)])]).averageRpe).toBe(7);
  });

  it('reports it as a word', () => {
    expect(analysisOf([pushUps(cleanSets)]).difficulty).toBe('moderate');
  });

  it('has nothing to report when nothing was rated', () => {
    expect(analysisOf([pushUps([set(1, 10, null)])]).difficulty).toBeNull();
  });
});

describe('failed sets', () => {
  it('counts a set that was abandoned', () => {
    expect(analysisOf([pushUps([set(1, 10, 6), set(2, null, null)])]).failedSets).toBe(1);
  });

  it('counts a set the athlete said they failed', () => {
    expect(analysisOf([pushUps([set(1, 10, 6), set(2, 4, 10)])]).failedSets).toBe(1);
  });

  it('does not count a set that was merely very hard', () => {
    expect(analysisOf([pushUps([set(1, 10, 6), set(2, 9, 9)])]).failedSets).toBe(0);
  });

  it('does not count a set that hit the target and had nothing left: that is a grind', () => {
    expect(analysisOf([pushUps([set(1, 10, 8), set(2, 10, 10)])]).failedSets).toBe(0);
  });
});

describe('falling short of the target', () => {
  it('counts the sets that did not reach the bottom of the range', () => {
    expect(analysisOf([pushUps([set(1, 10, 6), set(2, 5, 8), set(3, 4, 8)])]).shortSets).toBe(2);
  });

  it('counts none when every set was inside the range', () => {
    expect(analysisOf([pushUps([set(1, 6, 6), set(2, 7, 7)])]).shortSets).toBe(0);
  });

  it('is what the athlete is told about, rather than how hard it felt', () => {
    // Three reps against a target of six: short on every set, however it felt.
    const short = [pushUps([set(1, 3, 9), set(2, 3, 9), set(3, 3, 9)])];
    expect(report(short, [decision('hold', 'failed')]).headline).toMatch(/came up short/i);
  });

  it('agrees with the engine, which calls the same session a failure', () => {
    const short = [pushUps([set(1, 3, 9), set(2, 3, 9), set(3, 3, 9)])];
    expect(analysisOf(short).quality).toBe('broke-down');
  });
});

describe('exercise quality', () => {
  it('is clean when every set was completed and none of it was maximal', () => {
    expect(analysisOf([pushUps(cleanSets)]).quality).toBe('clean');
  });

  it('is strained when the sets were very hard throughout', () => {
    expect(analysisOf([pushUps([set(1, 10, 9), set(2, 10, 9), set(3, 10, 9)])]).quality).toBe(
      'strained',
    );
  });

  it('is strained when the reps fell away across the sets', () => {
    expect(analysisOf([pushUps([set(1, 10, 6), set(2, 8, 7), set(3, 6, 8)])]).quality).toBe(
      'strained',
    );
  });

  it('broke down when a set was failed', () => {
    expect(analysisOf([pushUps([set(1, 10, 6), set(2, 8, 8), set(3, 3, 10)])]).quality).toBe(
      'broke-down',
    );
  });

  it('broke down when a set was never performed', () => {
    expect(analysisOf([pushUps([set(1, 10, 6), set(2, 10, 7)])]).quality).toBe('broke-down');
  });

  it('is only ever a proxy: the app cannot see the athlete move', () => {
    // A reminder in test form. Quality here is completion, effort and
    // rep drop-off — never form, which nothing in the app can observe.
    expect(analysisOf([pushUps(cleanSets)])).not.toHaveProperty('form');
  });
});

describe('whether a session was strained', () => {
  it('is not, when the work was clean', () => {
    expect(wasStrained(session([pushUps(cleanSets), squats(cleanSets)]))).toBe(false);
  });

  it('is, when half the exercises or more did not hold up', () => {
    const hard = [set(1, 10, 9), set(2, 9, 9), set(3, 8, 10)];
    expect(wasStrained(session([pushUps(hard), squats(cleanSets)]))).toBe(true);
  });

  it('is not, when a single exercise of several was hard', () => {
    const hard = [set(1, 10, 9), set(2, 9, 9), set(3, 8, 10)];
    const third = pushUps(cleanSets, { exerciseId: 'front-plank' });
    expect(wasStrained(session([pushUps(hard), squats(cleanSets), third]))).toBe(false);
  });

  it('is not, for a session with nothing logged', () => {
    expect(wasStrained(session([], { status: 'missed' }))).toBe(false);
  });
});

/** The engine's decision, which the coach reports rather than re-derives. */
const decision = (action: Decision['action'], verdict: Decision['verdict']): Decision =>
  ({ exerciseId: 'push-up', action, verdict, reason: 'because' }) as Decision;

const report = (
  exercises: SessionExercise[],
  decisions: Decision[] = [],
  history: WorkoutSession[] = [],
) => coachReport({ session: session(exercises), decisions, history });

describe('a session that earned something', () => {
  const clean = [pushUps(cleanSets)];
  const progressed = [decision('add-reps', 'cleared')];

  it('is about progressing', () => {
    expect(report(clean, progressed).focus).toBe('progress');
  });

  it('says what was done and what happens next', () => {
    expect(report(clean, progressed).headline).toBe(
      "You completed all 3 sets at the top of the range with moderate difficulty. We'll progress slightly next time.",
    );
  });

  it('counts a changed variation as progress too', () => {
    expect(report(clean, [decision('advance-variation', 'cleared')]).focus).toBe('progress');
  });

  it('says only one thing is changing', () => {
    expect(report(clean, progressed).advice).toMatch(/one thing at a time/i);
  });
});

describe('a session that was clean but not at the top', () => {
  const nearly = [pushUps([set(1, 9, 6), set(2, 9, 7), set(3, 8, 7)])];

  it('holds steady', () => {
    expect(report(nearly, [decision('hold', 'held')]).focus).toBe('steady');
  });

  it('says the targets are unchanged', () => {
    expect(report(nearly, [decision('hold', 'held')]).headline).toMatch(/same targets/i);
  });
});

describe('a session the athlete struggled through', () => {
  const struggled = [pushUps([set(1, 10, 8), set(2, 10, 9), set(3, 10, 10)])];

  it('holds steady rather than backing off after one session', () => {
    expect(report(struggled, [decision('hold', 'struggled')]).focus).toBe('steady');
  });

  it('names the set that went wrong', () => {
    expect(report(struggled, [decision('hold', 'struggled')]).headline).toMatch(
      /struggled with the final set/i,
    );
  });

  it('asks for control rather than more reps', () => {
    const { headline, advice } = report(struggled, [decision('hold', 'struggled')]);
    expect(`${headline} ${advice}`).toMatch(/controlled reps/i);
    expect(advice).not.toMatch(/more reps/i);
  });
});

describe('a session with failed sets', () => {
  const failed = [pushUps([set(1, 8, 9), set(2, 5, 10), set(3, null, null)])];

  it('does not panic after one', () => {
    expect(report(failed, [decision('hold', 'failed')]).focus).toBe('steady');
  });

  it('says plainly that one session is not a trend', () => {
    expect(report(failed, [decision('hold', 'failed')]).advice).toMatch(/not a trend/i);
  });

  it('reports the engine backing off when it does', () => {
    const backed = report(failed, [decision('reduce-reps', 'failed')]);
    expect(backed.focus).toBe('steady');
    expect(backed.headline).toMatch(/easier/i);
  });
});

describe('difficulty that repeats', () => {
  const hard = [set(1, 10, 9), set(2, 9, 9), set(3, 8, 10)];
  const strainedSession = session([pushUps(hard), squats(hard)], { id: 'earlier', date: '2026-09-19' });

  it('asks for recovery when two sessions running have been this hard', () => {
    const now = [pushUps(hard), squats(hard)];
    expect(report(now, [decision('hold', 'struggled')], [strainedSession]).focus).toBe('recovery');
  });

  it('says what recovery means, rather than just saying rest', () => {
    const now = [pushUps(hard), squats(hard)];
    const advice = report(now, [decision('hold', 'struggled')], [strainedSession]).advice;
    expect(advice).toMatch(/mobility|sleep|easy/i);
  });

  it('still leaves the targets alone, because recovery is not a reduction', () => {
    const now = [pushUps(hard), squats(hard)];
    const headline = report(now, [decision('hold', 'struggled')], [strainedSession]).headline;
    expect(headline).toMatch(/second hard session/i);
  });

  it('does not ask for recovery when only the last one was hard', () => {
    const easy = session([pushUps(cleanSets), squats(cleanSets)], { id: 'earlier' });
    const now = [pushUps(hard), squats(hard)];
    expect(report(now, [decision('hold', 'struggled')], [easy]).focus).toBe('steady');
  });

  it('ignores mobility routines when looking back', () => {
    const routine = aSession({ id: 'm', date: '2026-09-20', kind: 'mobility', status: 'completed' });
    const now = [pushUps(hard), squats(hard)];
    expect(report(now, [decision('hold', 'struggled')], [routine, strainedSession]).focus).toBe(
      'recovery',
    );
  });

  it('looks at the most recent training session, not an older one', () => {
    const easy = session([pushUps(cleanSets), squats(cleanSets)], { id: 'mid', date: '2026-09-20' });
    const now = [pushUps(hard), squats(hard)];
    expect(report(now, [decision('hold', 'struggled')], [strainedSession, easy]).focus).toBe(
      'steady',
    );
  });
});

describe('needing recovery, read from history alone', () => {
  const hard = [set(1, 10, 9), set(2, 9, 9), set(3, 8, 10)];
  const strainedOn = (date: string, id: string) =>
    session([pushUps(hard), squats(hard)], { id, date });
  const easyOn = (date: string, id: string) =>
    session([pushUps(cleanSets), squats(cleanSets)], { id, date });

  it('is false with no history at all', () => {
    expect(needsRecovery([])).toBe(false);
  });

  it('is false after a single hard session', () => {
    expect(needsRecovery([strainedOn('2026-09-21', 'a')])).toBe(false);
  });

  it('is true after two hard ones in a row', () => {
    expect(needsRecovery([strainedOn('2026-09-19', 'a'), strainedOn('2026-09-21', 'b')])).toBe(
      true,
    );
  });

  it('is false once a clean session breaks the run', () => {
    expect(
      needsRecovery([
        strainedOn('2026-09-19', 'a'),
        strainedOn('2026-09-21', 'b'),
        easyOn('2026-09-22', 'c'),
      ]),
    ).toBe(false);
  });

  it('reads the dates rather than trusting the order they arrive in', () => {
    expect(needsRecovery([easyOn('2026-09-22', 'c'), strainedOn('2026-09-21', 'b')])).toBe(false);
  });

  it('ignores mobility routines entirely', () => {
    const routine = aSession({ id: 'm', date: '2026-09-22', kind: 'mobility', status: 'completed' });
    expect(
      needsRecovery([strainedOn('2026-09-19', 'a'), strainedOn('2026-09-21', 'b'), routine]),
    ).toBe(true);
  });

  it('ignores a missed day, which took nothing out of anyone', () => {
    const missed = aSession({ id: 'x', date: '2026-09-22', status: 'missed', exercises: [] });
    expect(
      needsRecovery([strainedOn('2026-09-19', 'a'), strainedOn('2026-09-21', 'b'), missed]),
    ).toBe(true);
  });
});

describe('a session with nothing in it', () => {
  it('has nothing to say about work that did not happen', () => {
    const missed = coachReport({
      session: session([], { status: 'missed' }),
      decisions: [],
      history: [],
    });
    expect(missed.focus).toBe('steady');
    expect(missed.headline).toMatch(/nothing logged/i);
  });
});
