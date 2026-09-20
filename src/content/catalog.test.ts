import { describe, expect, it } from 'vitest';
import { exerciseSchema } from '../domain/exercise';
import { FAMILIES, type Family } from '../domain/primitives';
import { EXERCISES, exerciseById, exercisesInFamily, familyChain } from './catalog';
import { SEED_PROFILE } from './seed-profile';

describe('exercise catalog', () => {
  it('is not empty', () => {
    expect(EXERCISES.length).toBeGreaterThan(0);
  });

  it.each(EXERCISES.map((e) => [e.id, e] as const))('%s matches the exercise schema', (_id, exercise) => {
    expect(() => exerciseSchema.parse(exercise)).not.toThrow();
  });

  it('has no duplicate ids', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only prescribes equipment the athlete actually has', () => {
    const available = new Set(SEED_PROFILE.availableEquipment);
    const offenders = EXERCISES.filter((e) => e.equipment.some((eq) => !available.has(eq)));
    expect(offenders.map((e) => e.id)).toEqual([]);
  });

  it('resolves every regression link to a real exercise', () => {
    const broken = EXERCISES.filter(
      (e) => e.regression !== null && exerciseById(e.regression) === undefined,
    );
    expect(broken.map((e) => `${e.id} -> ${e.regression}`)).toEqual([]);
  });

  it('resolves every progression link to a real exercise', () => {
    const broken = EXERCISES.filter(
      (e) => e.progression !== null && exerciseById(e.progression) === undefined,
    );
    expect(broken.map((e) => `${e.id} -> ${e.progression}`)).toEqual([]);
  });

  it('keeps regression and progression links symmetric', () => {
    const asymmetric = EXERCISES.flatMap((e) => {
      const next = e.progression === null ? undefined : exerciseById(e.progression);
      return next && next.regression !== e.id ? [`${e.id} -> ${next.id} -> ${next.regression}`] : [];
    });
    expect(asymmetric).toEqual([]);
  });

  it('keeps a progression inside its own family', () => {
    const crossings = EXERCISES.flatMap((e) => {
      const next = e.progression === null ? undefined : exerciseById(e.progression);
      return next && next.family !== e.family ? [`${e.id} (${e.family}) -> ${next.id} (${next.family})`] : [];
    });
    expect(crossings).toEqual([]);
  });

  it.each(FAMILIES.map((f) => [f] as const))(
    'the %s family forms one unbroken chain',
    (family: Family) => {
      const members = exercisesInFamily(family);
      expect(members.length, `family ${family} has no exercises`).toBeGreaterThan(0);

      const roots = members.filter((e) => e.regression === null);
      const tips = members.filter((e) => e.progression === null);
      expect(roots.map((e) => e.id), 'expected exactly one easiest variation').toHaveLength(1);
      expect(tips.map((e) => e.id), 'expected exactly one hardest variation').toHaveLength(1);

      expect(familyChain(family).map((e) => e.id)).toHaveLength(members.length);
    },
  );

  it.each(FAMILIES.map((f) => [f] as const))(
    'the %s family numbers its levels 1..n in chain order',
    (family: Family) => {
      const levels = familyChain(family).map((e) => e.progressionLevel);
      expect(levels).toEqual(levels.map((_, i) => i + 1));
    },
  );

  it.each(FAMILIES.map((f) => [f] as const))(
    'the %s family never gets easier as it goes up',
    (family: Family) => {
      const difficulties = familyChain(family).map((e) => e.difficulty);
      const descending = difficulties.filter((d, i) => i > 0 && d < difficulties[i - 1]!);
      expect(descending).toEqual([]);
    },
  );

  it('gives every exercise coaching content, not just a name', () => {
    const thin = EXERCISES.filter(
      (e) =>
        e.cues.length === 0 ||
        e.commonMistakes.length === 0 ||
        e.instructions.execution.length < 2,
    );
    expect(thin.map((e) => e.id)).toEqual([]);
  });

  it('attaches safety notes to every hanging, inverted or wrist-loaded movement', () => {
    const risky = EXERCISES.filter(
      (e) =>
        e.equipment.includes('pullup-bar') ||
        e.equipment.includes('parallel-bars') ||
        e.family === 'handstand',
    );
    const missing = risky.filter((e) => (e.safetyNotes ?? []).length === 0);
    expect(missing.map((e) => e.id)).toEqual([]);
  });

  it('measures every mobility exercise in time rather than reps where it holds a position', () => {
    const holds = EXERCISES.filter((e) => e.movementPattern === 'isometric-hold');
    const wrong = holds.filter((e) => e.measurement !== 'time' && e.measurement !== 'time-per-side');
    expect(wrong.map((e) => e.id)).toEqual([]);
  });
});

describe('exerciseById', () => {
  it('finds a known exercise', () => {
    expect(exerciseById('push-up')?.name).toBe('Push-Up');
  });

  it('returns undefined for an unknown id', () => {
    expect(exerciseById('backflip')).toBeUndefined();
  });
});

describe('familyChain', () => {
  it('orders a family from easiest to hardest', () => {
    const chain = familyChain('push').map((e) => e.id);
    expect(chain[0]).toBe('wall-push-up');
    expect(chain).toContain('push-up');
    expect(chain.indexOf('push-up')).toBeGreaterThan(chain.indexOf('incline-push-up'));
  });
});
