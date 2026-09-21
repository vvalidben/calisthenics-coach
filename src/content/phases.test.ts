import { describe, expect, it } from 'vitest';
import { PHASES, phaseSpec, requirePhaseSpec } from './phases';
import { exerciseById, exercisesInFamily } from './catalog';
import { SEED_PROFILE } from './seed-profile';
import { isExerciseAvailable } from '../domain/availability';

describe('the ladder', () => {
  it('has the four phases', () => {
    expect(PHASES.map((p) => p.title)).toEqual([
      'Foundation',
      'Strength Development',
      'Intermediate Calisthenics',
      'Skill Development',
    ]);
  });

  it('is numbered in order', () => {
    expect(PHASES.map((p) => p.ordinal)).toEqual([1, 2, 3, 4]);
  });

  it('links each phase to the next', () => {
    expect(PHASES.map((p) => p.next)).toEqual([
      'strength-building',
      'intermediate',
      'skill-development',
      null,
    ]);
  });

  it('starts where the athlete starts', () => {
    expect(SEED_PROFILE.currentPhase.name).toBe('foundation');
  });

  it('says what each phase is for, in one line', () => {
    for (const phase of PHASES) {
      expect(phase.focus.length).toBeGreaterThan(10);
      expect(phase.summary.length).toBeGreaterThan(40);
    }
  });
});

describe('the criteria', () => {
  const laddered = PHASES.filter((p) => p.next !== null);

  it('asks for more sessions as the phases go on', () => {
    const sessions = laddered.map((p) => p.exit.sessions);
    expect(sessions).toEqual([...sessions].sort((a, b) => a - b));
  });

  it('never demands perfect attendance, because life happens', () => {
    for (const phase of laddered) {
      expect(phase.exit.consistency).toBeLessThan(1);
    }
  });

  it('names a real exercise in every benchmark', () => {
    for (const phase of PHASES) {
      for (const benchmark of phase.exit.benchmarks) {
        expect(exerciseById(benchmark.exerciseId)).toBeDefined();
      }
    }
  });

  it('measures each benchmark the way its exercise is measured', () => {
    for (const phase of PHASES) {
      for (const benchmark of phase.exit.benchmarks) {
        expect(benchmark.measurement).toBe(exerciseById(benchmark.exerciseId)!.measurement);
      }
    }
  });

  it('asks for a number the exercise can actually reach', () => {
    for (const phase of PHASES) {
      for (const benchmark of phase.exit.benchmarks) {
        const exercise = exerciseById(benchmark.exerciseId)!;
        expect(benchmark.value).toBeGreaterThanOrEqual(exercise.prescription.target.min);
        expect(benchmark.sets).toBeGreaterThanOrEqual(exercise.prescription.sets.min);
      }
    }
  });

  it('names a step that exists in every family it asks about', () => {
    for (const phase of PHASES) {
      for (const level of phase.exit.levels) {
        const reachable = exercisesInFamily(level.family).map((e) => e.progressionLevel);
        expect(reachable).toContain(level.level);
      }
    }
  });

  it('never asks for equipment the athlete does not have', () => {
    // A criterion resting on a bar would lock the ladder shut for good.
    for (const phase of PHASES) {
      for (const benchmark of phase.exit.benchmarks) {
        expect(isExerciseAvailable(exerciseById(benchmark.exerciseId)!, SEED_PROFILE)).toBe(true);
      }

      for (const level of phase.exit.levels) {
        const step = exercisesInFamily(level.family).find(
          (e) => e.progressionLevel === level.level,
        )!;
        expect(isExerciseAvailable(step, SEED_PROFILE)).toBe(true);
      }
    }
  });

  it('never asks the athlete to wait, only to earn it', () => {
    // There is nowhere in a spec to put a duration, and this is the test that
    // keeps it that way.
    for (const phase of PHASES) {
      expect(Object.keys(phase.exit).sort()).toEqual([
        'benchmarks',
        'cleanRatio',
        'consistency',
        'levels',
        'sessions',
      ]);
    }
  });
});

describe('the last phase', () => {
  const last = PHASES.at(-1)!;

  it('leads nowhere, because there is nowhere further to go', () => {
    expect(last.next).toBeNull();
  });

  it('asks for nothing, because nothing would be unlocked by it', () => {
    expect(last.exit.benchmarks).toEqual([]);
    expect(last.exit.levels).toEqual([]);
    expect(last.exit.sessions).toBe(0);
  });
});

describe('looking a phase up', () => {
  it('finds one by name', () => {
    expect(phaseSpec('intermediate')?.title).toBe('Intermediate Calisthenics');
  });

  it('has nothing for a name outside the ladder', () => {
    expect(phaseSpec('deload')).toBeUndefined();
  });

  it('falls back to Foundation rather than rendering nothing', () => {
    expect(requirePhaseSpec('deload').name).toBe('foundation');
  });
});
