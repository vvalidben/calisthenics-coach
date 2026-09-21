import { describe, expect, it } from 'vitest';
import {
  advanceTo,
  assessPhase,
  bestForBenchmark,
  consistency,
  sessionsInPhase,
  techniqueRatio,
  type PhaseSpec,
} from './phase';
import type { SessionExercise, SessionSet, WorkoutSession } from './session';
import { aProfile, aProgressionState, aSession } from '../test/factories';

const profile = aProfile({
  trainingDays: ['monday', 'tuesday', 'thursday', 'saturday'],
  currentPhase: { name: 'foundation', startedAt: '2026-09-01', plannedWeeks: 4 },
});

const TODAY = '2026-09-28';

const set = (setNumber: number, reps: number, rpe: number): SessionSet => ({
  setNumber,
  reps,
  seconds: null,
  rpe: rpe as SessionSet['rpe'],
  completed: true,
});

const pushUps = (sets: SessionSet[], exerciseId = 'push-up'): SessionExercise => ({
  exerciseId,
  block: 'main',
  prescribed: { sets: 3, measurement: 'reps', target: { min: 6, max: 10 } },
  sets,
  rpe: null,
});

const clean = [set(1, 10, 6), set(2, 10, 6), set(3, 10, 6)];
const hard = [set(1, 10, 9), set(2, 8, 9), set(3, 6, 9)];

const trained = (date: string, exercises = [pushUps(clean)]): WorkoutSession =>
  aSession({ id: date, date, kind: 'training', status: 'completed', exercises });

/** A spec with nothing required, which each test then adds one thing to. */
const spec = (overrides: Partial<PhaseSpec['exit']> = {}): PhaseSpec => ({
  name: 'foundation',
  ordinal: 1,
  title: 'Foundation',
  focus: 'Technique and consistency.',
  summary: 'Learn the movements and turn up.',
  next: 'strength-building',
  exit: {
    sessions: 0,
    consistency: 0,
    cleanRatio: 0,
    benchmarks: [],
    levels: [],
    ...overrides,
  },
});

const assess = (
  exit: Partial<PhaseSpec['exit']>,
  sessions: WorkoutSession[],
  progression = [aProgressionState()],
) =>
  assessPhase({
    spec: spec(exit),
    profile,
    sessions,
    progression,
    today: TODAY,
  });

describe('sessions inside the current phase', () => {
  it('counts the finished ones', () => {
    expect(sessionsInPhase([trained('2026-09-07'), trained('2026-09-08')], profile)).toHaveLength(2);
  });

  it('ignores anything from before the phase started', () => {
    expect(sessionsInPhase([trained('2026-08-30')], profile)).toHaveLength(0);
  });

  it('ignores mobility routines', () => {
    const routine = aSession({ id: 'm', date: '2026-09-07', kind: 'mobility', status: 'completed' });
    expect(sessionsInPhase([routine], profile)).toHaveLength(0);
  });

  it('ignores a missed day', () => {
    const missed = aSession({ id: 'x', date: '2026-09-07', status: 'missed', exercises: [] });
    expect(sessionsInPhase([missed], profile)).toHaveLength(0);
  });
});

describe('consistency', () => {
  it('measures sessions kept against sessions scheduled', () => {
    // Four weeks at four days a week is sixteen scheduled sessions.
    const kept = ['2026-09-07', '2026-09-08', '2026-09-10'].map((d) => trained(d));
    expect(consistency(kept, profile, TODAY, 4)).toEqual({ kept: 3, scheduled: 16 });
  });

  it('only looks at the window asked for', () => {
    const old = trained('2026-08-01');
    expect(consistency([old], profile, TODAY, 4).kept).toBe(0);
  });

  it('counts a partly finished session, because the athlete turned up', () => {
    const partial = aSession({ id: 'p', date: '2026-09-21', kind: 'training', status: 'partial' });
    expect(consistency([partial], profile, TODAY, 4).kept).toBe(1);
  });
});

describe('technique, as far as the app can see it', () => {
  it('counts exercises that finished clean', () => {
    expect(techniqueRatio([trained('2026-09-21')], 6)).toEqual({ clean: 1, total: 1 });
  });

  it('counts one that did not', () => {
    expect(techniqueRatio([trained('2026-09-21', [pushUps(hard)])], 6)).toEqual({
      clean: 0,
      total: 1,
    });
  });

  it('looks only at the most recent sessions', () => {
    const sessions = [
      trained('2026-09-01', [pushUps(hard)]),
      trained('2026-09-21'),
      trained('2026-09-22'),
    ];
    expect(techniqueRatio(sessions, 2)).toEqual({ clean: 2, total: 2 });
  });

  it('has nothing to measure before anything is logged', () => {
    expect(techniqueRatio([], 6)).toEqual({ clean: 0, total: 0 });
  });
});

describe('a strength benchmark', () => {
  const benchmark = {
    exerciseId: 'push-up',
    sets: 3,
    value: 10,
    measurement: 'reps' as const,
    label: '3 sets of 10 push-ups',
  };

  it('reads the best session, not the latest', () => {
    const sessions = [trained('2026-09-07'), trained('2026-09-08', [pushUps(hard)])];
    expect(bestForBenchmark(sessions, benchmark)).toBe(10);
  });

  it('is nothing when there were fewer sets than the benchmark asks for', () => {
    const twoSets = [set(1, 10, 6), set(2, 10, 8)];
    expect(bestForBenchmark([trained('2026-09-07', [pushUps(twoSets)])], benchmark)).toBe(0);
  });

  it('reads the weakest of the required sets, not the best one', () => {
    const uneven = [set(1, 10, 6), set(2, 10, 7), set(3, 6, 9)];
    expect(bestForBenchmark([trained('2026-09-07', [pushUps(uneven)])], benchmark)).toBe(6);
  });

  it('is nothing when the exercise has never been done', () => {
    expect(bestForBenchmark([trained('2026-09-07', [pushUps(clean, 'squat')])], benchmark)).toBe(0);
  });

  it('reads a timed hold in seconds', () => {
    const hold = (setNumber: number, seconds: number): SessionSet => ({
      setNumber,
      reps: null,
      seconds,
      rpe: 7,
      completed: true,
    });
    const plank: SessionExercise = {
      exerciseId: 'front-plank',
      block: 'main',
      prescribed: { sets: 3, measurement: 'time', target: { min: 20, max: 45 } },
      sets: [hold(1, 45), hold(2, 45), hold(3, 40)],
      rpe: null,
    };
    expect(
      bestForBenchmark([trained('2026-09-07', [plank])], {
        exerciseId: 'front-plank',
        sets: 3,
        value: 45,
        measurement: 'time',
        label: '3 holds of 45 seconds',
      }),
    ).toBe(40);
  });
});

describe('what the phase asks for', () => {
  it('reports a requirement for each dimension it uses', () => {
    const assessment = assess(
      {
        sessions: 12,
        consistency: 0.8,
        cleanRatio: 0.75,
        benchmarks: [
          {
            exerciseId: 'push-up',
            sets: 3,
            value: 10,
            measurement: 'reps',
            label: '3 sets of 10 push-ups',
          },
        ],
        levels: [{ family: 'push', level: 5, label: 'Tempo push-ups' }],
      },
      [],
    );

    expect(assessment.requirements.map((r) => r.dimension)).toEqual([
      'consistency',
      'consistency',
      'technique',
      'strength',
      'performance',
      'recovery',
    ]);
  });

  it('always asks about recovery, even when it asks for nothing else', () => {
    expect(assess({}, []).requirements.map((r) => r.id)).toEqual(['recovery']);
  });

  it('says how far along each one is', () => {
    const sessions = [trained('2026-09-21'), trained('2026-09-22')];
    const requirement = assess({ sessions: 12 }, sessions).requirements.find(
      (r) => r.id === 'sessions',
    );
    expect(requirement?.progress).toBe('2 of 12');
  });
});

describe('meeting the criteria', () => {
  const twelve = Array.from({ length: 12 }, (_, i) =>
    trained(`2026-09-${`${i + 10}`.padStart(2, '0')}`),
  );

  it('is not ready before the sessions are done', () => {
    expect(assess({ sessions: 12 }, twelve.slice(0, 5)).ready).toBe(false);
  });

  it('is ready once they are', () => {
    expect(assess({ sessions: 12 }, twelve).ready).toBe(true);
  });

  it('counts how many criteria are met', () => {
    const assessment = assess({ sessions: 12, cleanRatio: 0.75 }, twelve);
    expect(assessment.metCount).toBe(3);
  });

  it('is not ready while technique is short, however many sessions there are', () => {
    const sloppy = twelve.map((s) => ({ ...s, exercises: [pushUps(hard)] }));
    expect(assess({ sessions: 12, cleanRatio: 0.75 }, sloppy).ready).toBe(false);
  });

  it('is not ready while the athlete needs recovery', () => {
    const strained = [
      trained('2026-09-21', [pushUps(hard), pushUps(hard, 'squat')]),
      trained('2026-09-22', [pushUps(hard), pushUps(hard, 'squat')]),
    ];
    expect(assess({}, strained).ready).toBe(false);
  });

  it('is not ready while a benchmark is unmet', () => {
    const benchmarks = [
      {
        exerciseId: 'push-up',
        sets: 3,
        value: 20,
        measurement: 'reps' as const,
        label: '3 sets of 20 push-ups',
      },
    ];
    expect(assess({ benchmarks }, twelve).ready).toBe(false);
  });

  it('is not ready while a family has not climbed far enough', () => {
    const levels = [{ family: 'push' as const, level: 6, label: 'Diamond push-ups' }];
    // The seeded state sits at level 3.
    expect(assess({ levels }, twelve).ready).toBe(false);
  });

  it('is ready when the family has climbed', () => {
    const levels = [{ family: 'push' as const, level: 3, label: 'Knee push-ups' }];
    expect(assess({ levels }, twelve).ready).toBe(true);
  });

  it('is never ready in the last phase, because there is nowhere to go', () => {
    const last = { ...spec(), next: null };
    const assessment = assessPhase({
      spec: last,
      profile,
      sessions: twelve,
      progression: [aProgressionState()],
      today: TODAY,
    });
    expect(assessment.ready).toBe(false);
  });

  it('does not advance on time alone', () => {
    // A whole year in the phase, and nothing logged.
    const stale = aProfile({
      currentPhase: { name: 'foundation', startedAt: '2025-09-01', plannedWeeks: 4 },
    });
    const assessment = assessPhase({
      spec: spec({ sessions: 12 }),
      profile: stale,
      sessions: [],
      progression: [aProgressionState()],
      today: TODAY,
    });
    expect(assessment.ready).toBe(false);
  });
});

describe('moving to the next phase', () => {
  it('records the new phase', () => {
    expect(advanceTo(profile, 'strength-building', TODAY).currentPhase.name).toBe(
      'strength-building',
    );
  });

  it('starts it today, so its criteria are measured from now', () => {
    expect(advanceTo(profile, 'strength-building', TODAY).currentPhase.startedAt).toBe(TODAY);
  });

  it('stamps the profile as changed', () => {
    expect(advanceTo(profile, 'strength-building', TODAY).updatedAt).toBe(TODAY);
  });

  it('changes nothing else about the athlete', () => {
    const moved = advanceTo(profile, 'strength-building', TODAY);
    expect(moved.trainingDays).toEqual(profile.trainingDays);
    expect(moved.currentAbilities).toEqual(profile.currentAbilities);
  });
});
