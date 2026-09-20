import { beforeEach, describe, expect, it } from 'vitest';
import { StorageKeys } from './adapter';
import { MemoryAdapter } from './memory-adapter';
import { createRepositories, type Repositories } from './repositories';
import { aProfile, aProgressionState, aSession, aWorkout } from '../test/factories';

let adapter: MemoryAdapter;
let repos: Repositories;

beforeEach(() => {
  adapter = new MemoryAdapter();
  repos = createRepositories(adapter);
});

describe('profile repository', () => {
  it('returns null before a profile has been saved', async () => {
    await expect(repos.profile.load()).resolves.toBeNull();
  });

  it('round-trips a profile', async () => {
    const profile = aProfile();
    await repos.profile.save(profile);
    await expect(repos.profile.load()).resolves.toEqual(profile);
  });

  it('rejects an invalid profile instead of storing it', async () => {
    const invalid = { ...aProfile(), goals: [] };
    await expect(repos.profile.save(invalid)).rejects.toThrow();
    await expect(adapter.get(StorageKeys.profile)).resolves.toBeNull();
  });

  it('throws a named error when the stored profile does not match the schema', async () => {
    await adapter.set(StorageKeys.profile, { nonsense: true });
    await expect(repos.profile.load()).rejects.toThrow(/profile/i);
  });
});

describe('workout repository', () => {
  it('returns null for an unknown id', async () => {
    await expect(repos.workouts.get('nope')).resolves.toBeNull();
  });

  it('round-trips a workout by id', async () => {
    const workout = aWorkout();
    await repos.workouts.save(workout);
    await expect(repos.workouts.get(workout.id)).resolves.toEqual(workout);
  });

  it('lists saved workouts', async () => {
    await repos.workouts.save(aWorkout({ id: 'foundation-w1-d1' }));
    await repos.workouts.save(aWorkout({ id: 'foundation-w1-d2', day: 'thursday' }));
    const ids = (await repos.workouts.list()).map((w) => w.id);
    expect(ids).toEqual(['foundation-w1-d1', 'foundation-w1-d2']);
  });

  it('removes a workout', async () => {
    const workout = aWorkout();
    await repos.workouts.save(workout);
    await repos.workouts.remove(workout.id);
    await expect(repos.workouts.get(workout.id)).resolves.toBeNull();
  });

  it('does not let one collection see another collection’s records', async () => {
    await repos.workouts.save(aWorkout());
    await expect(repos.sessions.list()).resolves.toEqual([]);
  });
});

describe('session repository', () => {
  it('round-trips a session', async () => {
    const session = aSession();
    await repos.sessions.save(session);
    await expect(repos.sessions.get(session.id)).resolves.toEqual(session);
  });

  it('lists sessions in chronological order', async () => {
    await repos.sessions.save(aSession({ id: 'c', date: '2026-09-23' }));
    await repos.sessions.save(aSession({ id: 'a', date: '2026-09-21' }));
    await repos.sessions.save(aSession({ id: 'b', date: '2026-09-22' }));
    const dates = (await repos.sessions.list()).map((s) => s.date);
    expect(dates).toEqual(['2026-09-21', '2026-09-22', '2026-09-23']);
  });

  it('stores a missed session without losing the reason it exists', async () => {
    const missed = aSession({
      id: 'missed-1',
      status: 'missed',
      exercises: [],
      startedAt: null,
      completedAt: null,
      durationSeconds: null,
      overallRpe: null,
    });
    await repos.sessions.save(missed);
    await expect(repos.sessions.get('missed-1')).resolves.toMatchObject({ status: 'missed' });
  });
});

describe('progression repository', () => {
  it('round-trips progression state keyed by family', async () => {
    const state = aProgressionState({ family: 'pull', currentExerciseId: 'pull-up' });
    await repos.progression.save(state);
    await expect(repos.progression.get('pull')).resolves.toEqual(state);
  });

  it('lists every family that has state', async () => {
    await repos.progression.save(aProgressionState({ family: 'push' }));
    await repos.progression.save(aProgressionState({ family: 'squat', currentExerciseId: 'bodyweight-squat' }));
    const families = (await repos.progression.list()).map((s) => s.family);
    expect(families).toEqual(['push', 'squat']);
  });
});
