import { describe, expect, it } from 'vitest';
import { userProfileSchema } from '../domain/profile';
import { progressionStateSchema } from '../domain/progression';
import { FAMILIES } from '../domain/primitives';
import { isExerciseAvailable } from '../domain/availability';
import { exerciseById } from './catalog';
import { SEED_PROFILE } from './seed-profile';
import { SEED_PROGRESSION, initialProgressionFor } from './seed-progression';

describe('SEED_PROFILE', () => {
  it('is a valid profile', () => {
    expect(() => userProfileSchema.parse(SEED_PROFILE)).not.toThrow();
  });

  it('records the three stated goals', () => {
    expect(SEED_PROFILE.goals).toEqual([
      'build-muscle',
      'get-stronger',
      'mobility-flexibility',
    ]);
  });

  it('schedules four training days', () => {
    expect(SEED_PROFILE.trainingDays).toHaveLength(4);
  });

  it('allows a twenty to thirty minute session', () => {
    expect(SEED_PROFILE.sessionDuration).toEqual({ min: 20, max: 30 });
  });

  it('starts in the foundation phase', () => {
    expect(SEED_PROFILE.currentPhase.name).toBe('foundation');
  });

  it('records the measured baselines', () => {
    const byId = Object.fromEntries(SEED_PROFILE.currentAbilities.map((a) => [a.exerciseId, a.value]));
    expect(byId['push-up']).toBe(10);
    expect(byId['bodyweight-squat']).toBe(12);
    expect(byId['pull-up']).toBe(7);
  });

  it('records zero dips as tested-and-zero, not as untested', () => {
    const dip = SEED_PROFILE.currentAbilities.find((a) => a.exerciseId === 'parallel-bar-dip');
    expect(dip?.value).toBe(0);
  });

  it('records the plank as untested rather than as zero', () => {
    const plank = SEED_PROFILE.currentAbilities.find((a) => a.exerciseId === 'front-plank');
    expect(plank?.value).toBeNull();
  });

  it('only names exercises that exist in the catalog', () => {
    const unknown = SEED_PROFILE.currentAbilities.filter(
      (a) => exerciseById(a.exerciseId) === undefined,
    );
    expect(unknown.map((a) => a.exerciseId)).toEqual([]);
  });

  it('matches each baseline to how that exercise is measured', () => {
    const mismatched = SEED_PROFILE.currentAbilities.filter(
      (a) => exerciseById(a.exerciseId)?.measurement !== a.measurement,
    );
    expect(mismatched.map((a) => a.exerciseId)).toEqual([]);
  });
});

describe('initialProgressionFor', () => {
  it('anchors the athlete at the given variation', () => {
    const state = initialProgressionFor('push-up', '2026-09-20');
    expect(state.family).toBe('push');
    expect(state.currentExerciseId).toBe('push-up');
    expect(state.currentLevel).toBe(4);
  });

  it('starts with no recorded performance', () => {
    const state = initialProgressionFor('push-up', '2026-09-20');
    expect(state.performance).toBeNull();
    expect(state.previousPerformance).toBeNull();
  });

  it('derives the progression threshold from the top of the prescribed range', () => {
    const exercise = exerciseById('push-up')!;
    const state = initialProgressionFor('push-up', '2026-09-20');
    expect(state.progressionCriteria.minValuePerSet).toBe(exercise.prescription.target.max);
    expect(state.progressionCriteria.minSets).toBe(exercise.prescription.sets.max);
  });

  it('derives the regression threshold from the bottom of the prescribed range', () => {
    const exercise = exerciseById('push-up')!;
    const state = initialProgressionFor('push-up', '2026-09-20');
    expect(state.regressionCriteria.maxValuePerSet).toBeLessThan(exercise.prescription.target.min);
  });

  it('refuses an exercise that is not in the catalog', () => {
    expect(() => initialProgressionFor('backflip', '2026-09-20')).toThrow(/unknown exercise/i);
  });
});

describe('SEED_PROGRESSION', () => {
  it('is valid progression state', () => {
    for (const state of SEED_PROGRESSION) {
      expect(() => progressionStateSchema.parse(state)).not.toThrow();
    }
  });

  it('covers every family exactly once', () => {
    expect(SEED_PROGRESSION.map((s) => s.family).sort()).toEqual([...FAMILIES].sort());
  });

  it('only anchors the athlete on exercises they can actually perform today', () => {
    const unavailable = SEED_PROGRESSION.filter((s) => {
      const exercise = exerciseById(s.currentExerciseId);
      return exercise && !isExerciseAvailable(exercise, SEED_PROFILE);
    });
    // The two bar families are the known exceptions: they are seeded ready for
    // the day a bar arrives, and nothing programs from them meanwhile.
    expect(unavailable.map((s) => s.family)).toEqual(['pull', 'hanging-core']);
  });

  it('starts the push family at the push-up the athlete can already do', () => {
    const push = SEED_PROGRESSION.find((s) => s.family === 'push');
    expect(push?.currentExerciseId).toBe('push-up');
  });

  it('starts the dip family at the easiest variation, since the athlete has no dips', () => {
    const dip = SEED_PROGRESSION.find((s) => s.family === 'dip');
    expect(dip?.currentExerciseId).toBe('bench-dip-bent-knee');
  });

  it('starts the bar families at their entry step, not at the recorded pull-up ability', () => {
    // There is no bar, so nothing in these families can be trained. Claiming a
    // position on a ladder the athlete cannot reach would be a lie the
    // progression engine would later act on.
    expect(SEED_PROGRESSION.find((s) => s.family === 'pull')?.currentExerciseId).toBe('dead-hang');
    expect(SEED_PROGRESSION.find((s) => s.family === 'hanging-core')?.currentExerciseId).toBe(
      'hanging-knee-raise',
    );
  });

  it('starts the floor-pulling family at its easiest step', () => {
    const prep = SEED_PROGRESSION.find((s) => s.family === 'pull-prep');
    expect(prep?.currentExerciseId).toBe('prone-scapular-retraction');
  });

  it('names only exercises that exist in the catalog', () => {
    const unknown = SEED_PROGRESSION.filter(
      (s) => exerciseById(s.currentExerciseId) === undefined,
    );
    expect(unknown.map((s) => s.currentExerciseId)).toEqual([]);
  });

  it('keeps each state in the family of its own exercise', () => {
    const mismatched = SEED_PROGRESSION.filter(
      (s) => exerciseById(s.currentExerciseId)?.family !== s.family,
    );
    expect(mismatched.map((s) => s.family)).toEqual([]);
  });
});
