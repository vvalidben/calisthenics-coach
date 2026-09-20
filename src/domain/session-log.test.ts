import { describe, expect, it } from 'vitest';
import {
  compareToPrevious,
  difficultyForRpe,
  plannedSetCount,
  recordSet,
  rpeFor,
  sessionSummary,
  startSession,
  finishSession,
} from './session-log';
import { workoutSessionSchema } from './session';
import { aWorkout } from '../test/factories';

const workout = aWorkout();
const STARTED = '2026-09-21T18:30:00.000Z';

const started = () => startSession(workout, '2026-09-21', STARTED);

describe('rpeFor', () => {
  it('maps the five difficulty words onto a rising scale', () => {
    expect(rpeFor('easy')).toBeLessThan(rpeFor('moderate'));
    expect(rpeFor('moderate')).toBeLessThan(rpeFor('hard'));
    expect(rpeFor('hard')).toBeLessThan(rpeFor('very-hard'));
    expect(rpeFor('very-hard')).toBeLessThan(rpeFor('failed'));
  });

  it('puts failure at the top of the scale', () => {
    expect(rpeFor('failed')).toBe(10);
  });
});

describe('difficultyForRpe', () => {
  it('round-trips every difficulty', () => {
    for (const word of ['easy', 'moderate', 'hard', 'very-hard', 'failed'] as const) {
      expect(difficultyForRpe(rpeFor(word))).toBe(word);
    }
  });

  it('picks the nearest word for a value in between', () => {
    expect(difficultyForRpe(5)).toBe('easy');
    expect(difficultyForRpe(7)).toBe('moderate');
  });
});

describe('startSession', () => {
  it('produces a valid session', () => {
    expect(() => workoutSessionSchema.parse(started())).not.toThrow();
  });

  it('starts in progress with nothing logged', () => {
    const session = started();
    expect(session.status).toBe('in-progress');
    expect(session.exercises.every((e) => e.sets.length === 0)).toBe(true);
  });

  it('includes every exercise from every block, in order', () => {
    const session = started();
    expect(session.exercises.map((e) => e.exerciseId)).toEqual([
      ...workout.warmUp.map((i) => i.exerciseId),
      ...workout.mainWork.map((i) => i.exerciseId),
      ...workout.mobility.map((i) => i.exerciseId),
    ]);
  });

  it('records which block each exercise came from', () => {
    const withMobility = aWorkout({
      mobility: [
        {
          exerciseId: 'deep-squat-hold',
          sets: 2,
          measurement: 'time',
          target: { min: 30, max: 45 },
          restSeconds: 30,
          cue: 'Relax into it.',
        },
      ],
    });
    const session = startSession(withMobility, '2026-09-21', STARTED);
    expect(session.exercises.map((e) => e.block)).toEqual(['warm-up', 'main', 'mobility']);
  });

  it('copies the prescription so history stays readable', () => {
    const session = started();
    const main = session.exercises.find((e) => e.exerciseId === 'push-up')!;
    expect(main.prescribed).toEqual({
      sets: 3,
      measurement: 'reps',
      target: { min: 6, max: 10 },
    });
  });

  it('gives the session a stable id, so reopening the same day resumes it', () => {
    expect(startSession(workout, '2026-09-21', STARTED).id).toBe(
      startSession(workout, '2026-09-21', '2026-09-21T20:00:00.000Z').id,
    );
  });
});

describe('recordSet', () => {
  it('appends a completed set', () => {
    const session = recordSet(started(), 'push-up', { reps: 8, difficulty: 'moderate' });
    const pushUp = session.exercises.find((e) => e.exerciseId === 'push-up')!;
    expect(pushUp.sets).toHaveLength(1);
    expect(pushUp.sets[0]).toMatchObject({ setNumber: 1, reps: 8, rpe: 6, completed: true });
  });

  it('numbers sets as they are logged', () => {
    let session = started();
    session = recordSet(session, 'push-up', { reps: 8, difficulty: 'easy' });
    session = recordSet(session, 'push-up', { reps: 7, difficulty: 'hard' });
    const pushUp = session.exercises.find((e) => e.exerciseId === 'push-up')!;
    expect(pushUp.sets.map((s) => s.setNumber)).toEqual([1, 2]);
  });

  it('records a timed set in seconds rather than reps', () => {
    const timed = aWorkout({
      mainWork: [
        {
          exerciseId: 'front-plank',
          sets: 2,
          measurement: 'time',
          target: { min: 20, max: 45 },
          restSeconds: 45,
          cue: 'Tuck your tailbone.',
        },
      ],
    });
    const session = recordSet(startSession(timed, '2026-09-21', STARTED), 'front-plank', {
      seconds: 34,
      difficulty: 'hard',
    });
    const plank = session.exercises.find((e) => e.exerciseId === 'front-plank')!;
    expect(plank.sets[0]).toMatchObject({ reps: null, seconds: 34, completed: true });
  });

  it('records a skipped set as not completed', () => {
    const session = recordSet(started(), 'push-up', { skipped: true });
    const pushUp = session.exercises.find((e) => e.exerciseId === 'push-up')!;
    expect(pushUp.sets[0]).toMatchObject({ completed: false, reps: null, rpe: null });
  });

  it('keeps the session valid', () => {
    const session = recordSet(started(), 'push-up', { reps: 8, difficulty: 'moderate' });
    expect(() => workoutSessionSchema.parse(session)).not.toThrow();
  });

  it('refuses to log against an exercise that is not in the session', () => {
    expect(() => recordSet(started(), 'pistol-squat', { reps: 3, difficulty: 'hard' })).toThrow(
      /pistol-squat/,
    );
  });

  it('does not mutate the session it was given', () => {
    const before = started();
    recordSet(before, 'push-up', { reps: 8, difficulty: 'moderate' });
    expect(before.exercises.find((e) => e.exerciseId === 'push-up')!.sets).toHaveLength(0);
  });
});

describe('finishSession', () => {
  const ENDED = '2026-09-21T18:56:00.000Z';

  const fullyLogged = () => {
    let session = started();
    for (const exercise of session.exercises) {
      for (let i = 0; i < exercise.prescribed.sets; i += 1) {
        session = recordSet(session, exercise.exerciseId, {
          reps: exercise.prescribed.measurement.startsWith('time') ? undefined : 8,
          seconds: exercise.prescribed.measurement.startsWith('time') ? 30 : undefined,
          difficulty: 'moderate',
        });
      }
    }
    return session;
  };

  it('marks a fully logged session as completed', () => {
    expect(finishSession(fullyLogged(), ENDED).status).toBe('completed');
  });

  it('marks a half-logged session as partial', () => {
    const session = recordSet(started(), 'push-up', { reps: 8, difficulty: 'moderate' });
    expect(finishSession(session, ENDED).status).toBe('partial');
  });

  it('marks a session with nothing completed as missed', () => {
    const session = recordSet(started(), 'push-up', { skipped: true });
    expect(finishSession(session, ENDED).status).toBe('missed');
  });

  it('drops the logged sets when the session counts as missed', () => {
    // The schema forbids a missed session carrying work, and it is right to:
    // a set nobody performed is not history.
    const session = finishSession(recordSet(started(), 'push-up', { skipped: true }), ENDED);
    expect(session.exercises).toEqual([]);
    expect(() => workoutSessionSchema.parse(session)).not.toThrow();
  });

  it('records the duration', () => {
    expect(finishSession(fullyLogged(), ENDED).durationSeconds).toBe(26 * 60);
  });

  it('records when it was completed', () => {
    expect(finishSession(fullyLogged(), ENDED).completedAt).toBe(ENDED);
  });

  it('averages the difficulty into an overall RPE', () => {
    expect(finishSession(fullyLogged(), ENDED).overallRpe).toBe(6);
  });

  it('keeps the finished session valid', () => {
    expect(() => workoutSessionSchema.parse(finishSession(fullyLogged(), ENDED))).not.toThrow();
  });

  it('carries the athlete’s note through', () => {
    const session = finishSession(fullyLogged(), ENDED, 'Shoulder felt tight.');
    expect(session.notes).toBe('Shoulder felt tight.');
  });
});

describe('plannedSetCount', () => {
  it('adds up every prescribed set in the session', () => {
    const expected = [...workout.warmUp, ...workout.mainWork, ...workout.mobility].reduce(
      (total, item) => total + item.sets,
      0,
    );
    expect(plannedSetCount(started())).toBe(expected);
  });
});

describe('sessionSummary', () => {
  it('counts completed sets, ignoring skipped ones', () => {
    let session = started();
    session = recordSet(session, 'push-up', { reps: 8, difficulty: 'moderate' });
    session = recordSet(session, 'push-up', { skipped: true });
    expect(sessionSummary(session).setsCompleted).toBe(1);
  });

  it('totals the reps performed', () => {
    let session = started();
    session = recordSet(session, 'push-up', { reps: 8, difficulty: 'moderate' });
    session = recordSet(session, 'push-up', { reps: 6, difficulty: 'hard' });
    expect(sessionSummary(session).totalReps).toBe(14);
  });

  it('counts exercises that got at least one completed set', () => {
    const session = recordSet(started(), 'push-up', { reps: 8, difficulty: 'moderate' });
    const summary = sessionSummary(session);
    expect(summary.exercisesCompleted).toBe(1);
    expect(summary.exercisesPlanned).toBe(started().exercises.length);
  });

  it('reports the average difficulty as a word', () => {
    let session = started();
    session = recordSet(session, 'push-up', { reps: 8, difficulty: 'easy' });
    session = recordSet(session, 'push-up', { reps: 6, difficulty: 'hard' });
    expect(sessionSummary(session).difficulty).toBe('moderate');
  });

  it('reports no difficulty when nothing was logged', () => {
    expect(sessionSummary(started()).difficulty).toBeNull();
  });
});

describe('compareToPrevious', () => {
  const build = (reps: number[]) => {
    let session = started();
    for (const value of reps) {
      session = recordSet(session, 'push-up', { reps: value, difficulty: 'moderate' });
    }
    return finishSession(session, '2026-09-21T19:00:00.000Z');
  };

  it('reports nothing to compare when there is no previous session', () => {
    expect(compareToPrevious(build([8, 8]), undefined)).toEqual([]);
  });

  it('reports the change in reps for an exercise done both times', () => {
    const comparison = compareToPrevious(build([8, 8]), build([6, 6]));
    expect(comparison).toContainEqual(
      expect.objectContaining({ exerciseId: 'push-up', totalDelta: 4 }),
    );
  });

  it('reports a decrease as a negative change', () => {
    const comparison = compareToPrevious(build([5]), build([9]));
    const pushUp = comparison.find((c) => c.exerciseId === 'push-up');
    expect(pushUp?.totalDelta).toBe(-4);
  });

  it('leaves out exercises neither session logged', () => {
    const comparison = compareToPrevious(build([8]), build([6]));
    expect(comparison.map((c) => c.exerciseId)).toEqual(['push-up']);
  });

  it('skips exercises that were not in both sessions', () => {
    const previous = finishSession(
      recordSet(startSession(aWorkout({ mainWork: [
        { exerciseId: 'bodyweight-squat', sets: 1, measurement: 'reps', target: { min: 8, max: 12 }, restSeconds: 60, cue: 'Knees out.' },
      ] }), '2026-09-18', STARTED), 'bodyweight-squat', { reps: 10, difficulty: 'easy' }),
      '2026-09-18T19:00:00.000Z',
    );
    expect(compareToPrevious(build([8]), previous).map((c) => c.exerciseId)).not.toContain(
      'bodyweight-squat',
    );
  });
});
