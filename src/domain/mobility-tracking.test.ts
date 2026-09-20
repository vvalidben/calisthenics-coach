import { describe, expect, it } from 'vitest';
import { finishSession, mobilitySessionsInLastWeek, recordSet, startSession } from './session-log';
import type { WorkoutSession } from './session';
import { aWorkout } from '../test/factories';

const TODAY = '2026-09-28';

const routine = aWorkout({
  id: 'mobility-hips',
  kind: 'mobility',
  day: null,
  focus: 'mobility',
  warmUp: [],
  mainWork: [
    {
      exerciseId: 'deep-squat-hold',
      sets: 1,
      measurement: 'time',
      target: { min: 45, max: 60 },
      restSeconds: 20,
      cue: 'Relax into it.',
    },
  ],
  mobility: [],
});

const training = aWorkout();

const done = (workout = routine, date = TODAY, complete = true): WorkoutSession => {
  let session = startSession(workout, date, `${date}T09:00:00.000Z`);
  if (complete) {
    for (const exercise of session.exercises) {
      for (let i = 0; i < exercise.prescribed.sets; i += 1) {
        session = recordSet(session, exercise.exerciseId, {
          seconds: exercise.prescribed.measurement.startsWith('time') ? 50 : undefined,
          reps: exercise.prescribed.measurement.startsWith('time') ? undefined : 10,
          difficulty: 'easy',
        });
      }
    }
  }
  return finishSession(session, `${date}T09:08:00.000Z`);
};

describe('a mobility session', () => {
  it('records itself as mobility, not training', () => {
    expect(done().kind).toBe('mobility');
  });

  it('keeps a training session marked as training', () => {
    expect(done(training).kind).toBe('training');
  });

  it('is still a normal session in every other respect', () => {
    const session = done();
    expect(session.status).toBe('completed');
    expect(session.durationSeconds).toBe(8 * 60);
  });
});

describe('mobilitySessionsInLastWeek', () => {
  it('counts a mobility session done today', () => {
    expect(mobilitySessionsInLastWeek([done()], TODAY)).toBe(1);
  });

  it('ignores training sessions entirely', () => {
    expect(mobilitySessionsInLastWeek([done(training)], TODAY)).toBe(0);
  });

  it('counts across the whole week', () => {
    const week = ['2026-09-22', '2026-09-24', '2026-09-28'].map((date) => done(routine, date));
    expect(mobilitySessionsInLastWeek(week, TODAY)).toBe(3);
  });

  it('drops anything older than seven days', () => {
    expect(mobilitySessionsInLastWeek([done(routine, '2026-09-21')], TODAY)).toBe(0);
  });

  it('includes the seventh day itself', () => {
    expect(mobilitySessionsInLastWeek([done(routine, '2026-09-22')], TODAY)).toBe(1);
  });

  it('counts a partly finished routine, because some of it still happened', () => {
    let session = startSession(
      aWorkout({
        ...routine,
        mainWork: [{ ...routine.mainWork[0]!, sets: 3 }],
      }),
      TODAY,
      `${TODAY}T09:00:00.000Z`,
    );
    session = recordSet(session, 'deep-squat-hold', { seconds: 45, difficulty: 'easy' });
    const partial = finishSession(session, `${TODAY}T09:05:00.000Z`);

    expect(partial.status).toBe('partial');
    expect(mobilitySessionsInLastWeek([partial], TODAY)).toBe(1);
  });

  it('does not count a routine where nothing was done', () => {
    expect(mobilitySessionsInLastWeek([done(routine, TODAY, false)], TODAY)).toBe(0);
  });

  it('is zero when there is no history at all', () => {
    expect(mobilitySessionsInLastWeek([], TODAY)).toBe(0);
  });
});
