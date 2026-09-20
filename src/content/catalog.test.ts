import { describe, expect, it } from 'vitest';
import { isExerciseAvailable, missingEquipmentFor } from '../domain/availability';
import { exerciseSchema } from '../domain/exercise';
import { familyInfoSchema } from '../domain/family';
import { EQUIPMENT, FAMILIES, type Family } from '../domain/primitives';
import { EXERCISES, exerciseById, exercisesInFamily, familyChain } from './catalog';
import {
  FAMILY_INFO,
  PATHWAY_INFO,
  familiesByPathway,
  familyInfo,
  requireFamilyInfo,
} from './families';
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
        e.steps.length < 3 ||
        Object.values(e.startingPosition).some((slot) => slot.trim().length === 0),
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
    const missing = risky.filter((e) => e.safety.concerningPain.length === 0);
    expect(missing.map((e) => e.id)).toEqual([]);
  });

  it('attaches a stability warning to every exercise that stands on furniture', () => {
    const onFurniture = EXERCISES.filter((e) => e.equipment.includes('chair'));
    const missing = onFurniture.filter(
      (e) =>
        ![...e.safety.stopIf, ...e.safety.modifyIf, ...e.steps]
          .join(' ')
          .toLowerCase()
          .match(/slide|shift|brace|test|load it|cannot move/),
    );
    expect(missing.map((e) => e.id)).toEqual([]);
  });

  it('measures every held position in time rather than reps', () => {
    const holds = EXERCISES.filter((e) => e.movementPattern === 'isometric-hold');
    const wrong = holds.filter((e) => e.measurement !== 'time' && e.measurement !== 'time-per-side');
    expect(wrong.map((e) => e.id)).toEqual([]);
  });

  it('only uses equipment the model knows about', () => {
    const known = new Set<string>(EQUIPMENT);
    const unknown = EXERCISES.flatMap((e) => e.equipment.filter((eq) => !known.has(eq)));
    expect(unknown).toEqual([]);
  });
});

describe('equipment gating', () => {
  it('never leaves an exercise unavailable by accident', () => {
    // An exercise the athlete cannot perform is fine, but only when its family
    // declares the equipment as a requirement. Anything else is an oversight.
    const accidental = EXERCISES.filter((exercise) => {
      if (isExerciseAvailable(exercise, SEED_PROFILE)) return false;
      const declared = new Set(requireFamilyInfo(exercise.family).requiresEquipment);
      return missingEquipmentFor(exercise, SEED_PROFILE).some((eq) => !declared.has(eq));
    });

    // The top dip step needs parallel bars the dip family does not require, so
    // it is listed here as a known, deliberate exception.
    expect(accidental.map((e) => e.id)).toEqual(['parallel-bar-dip']);
  });

  it('leaves every family with at least one exercise the athlete can do today, except the bar families', () => {
    const unusable = FAMILIES.filter(
      (family) => !exercisesInFamily(family).some((e) => isExerciseAvailable(e, SEED_PROFILE)),
    );
    expect(unusable).toEqual(['pull', 'hanging-core']);
  });

  it('unlocks both bar families the moment a bar is added to the profile', () => {
    const withBar = {
      ...SEED_PROFILE,
      availableEquipment: [...SEED_PROFILE.availableEquipment, 'pullup-bar' as const],
    };
    const stillLocked = (['pull', 'hanging-core'] as const).filter(
      (family) => !exercisesInFamily(family).every((e) => isExerciseAvailable(e, withBar)),
    );
    expect(stillLocked).toEqual([]);
  });
});

describe('family registry', () => {
  it.each(FAMILY_INFO.map((f) => [f.id, f] as const))('%s matches the family schema', (_id, info) => {
    expect(() => familyInfoSchema.parse(info)).not.toThrow();
  });

  it('describes every family exactly once', () => {
    expect(FAMILY_INFO.map((f) => f.id).sort()).toEqual([...FAMILIES].sort());
  });

  it('gives every family a category matching its exercises', () => {
    const mismatched = FAMILY_INFO.filter((info) =>
      exercisesInFamily(info.id).some((e) => e.category !== info.category),
    );
    expect(mismatched.map((f) => f.id)).toEqual([]);
  });

  it('declares equipment its entry exercise actually needs', () => {
    const inconsistent = FAMILY_INFO.filter((info) => {
      const entry = familyChain(info.id)[0];
      if (!entry) return true;
      return info.requiresEquipment.some((eq) => !entry.equipment.includes(eq));
    });
    expect(inconsistent.map((f) => f.id)).toEqual([]);
  });

  it('states a caveat on every family the athlete cannot currently train', () => {
    const lockedWithoutExplanation = FAMILY_INFO.filter(
      (info) =>
        info.requiresEquipment.some((eq) => !SEED_PROFILE.availableEquipment.includes(eq)) &&
        info.caveat === undefined,
    );
    expect(lockedWithoutExplanation.map((f) => f.id)).toEqual([]);
  });

  it('warns in the floor-pulling family that it is not real pulling', () => {
    expect(familyInfo('pull-prep')?.caveat).toMatch(/not pulling exercises/i);
  });

  it('says the pull family is locked until a bar exists', () => {
    expect(familyInfo('pull')?.caveat).toMatch(/pull-up bar/i);
  });
});

describe('the pull pathway', () => {
  const pull = PATHWAY_INFO.find((p) => p.id === 'pull');

  it('explains that vertical pulling needs a safe setup', () => {
    expect(pull?.note).toMatch(/safe to hang from/i);
  });

  it('warns against improvising one, naming the usual bad ideas', () => {
    expect(pull?.note).toMatch(/two chairs/i);
    expect(pull?.note).toMatch(/door handle/i);
    expect(pull?.note).toMatch(/door frame/i);
  });

  it('says what happens when a real bar arrives', () => {
    expect(pull?.note).toMatch(/unlocks at once/i);
  });

  it('is honest that floor work does not substitute', () => {
    expect(pull?.note).toMatch(/will build a pull-up|no substitute/i);
  });
});

describe('the pathway grouping', () => {
  it('places every family under exactly one pathway', () => {
    const grouped = familiesByPathway().flatMap((g) => g.families.map((f) => f.id));
    expect([...grouped].sort()).toEqual([...FAMILY_INFO.map((f) => f.id)].sort());
  });

  it('keeps the three core ladders separate', () => {
    const core = familiesByPathway().find((g) => g.pathway.id === 'core');
    expect(core?.families.map((f) => f.id)).toEqual(['core', 'side-core', 'hanging-core']);
  });

  it('explains why they are separate rather than merged', () => {
    const core = PATHWAY_INFO.find((p) => p.id === 'core');
    expect(core?.note).toMatch(/parallel ladders/i);
  });

  it('keeps the handstand out of the programme and says so', () => {
    const skill = PATHWAY_INFO.find((p) => p.id === 'skill');
    expect(skill?.note).toMatch(/not in your programme/i);
  });
});

describe('floor-based pulling', () => {
  it('needs no equipment beyond the floor', () => {
    const needsMore = exercisesInFamily('pull-prep').filter(
      (e) => !e.equipment.every((eq) => eq === 'floor' || eq === 'none'),
    );
    expect(needsMore.map((e) => e.id)).toEqual([]);
  });

  it('labels every exercise as not a substitute for pulling', () => {
    const unlabelled = exercisesInFamily('pull-prep').filter(
      (e) => !e.safety.modifyIf.some((note) => /not a substitute for pulling/i.test(note)),
    );
    expect(unlabelled.map((e) => e.id)).toEqual([]);
  });

  it('is tagged so it can never be presented as a pull', () => {
    const untagged = exercisesInFamily('pull-prep').filter((e) => !e.tags.includes('not-a-pull'));
    expect(untagged.map((e) => e.id)).toEqual([]);
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
  it('orders the push family from wall to archer', () => {
    const chain = familyChain('push').map((e) => e.id);
    expect(chain[0]).toBe('wall-push-up');
    expect(chain.at(-1)).toBe('archer-push-up');
    expect(chain.indexOf('knee-push-up')).toBeGreaterThan(chain.indexOf('incline-push-up'));
    expect(chain.indexOf('push-up')).toBeGreaterThan(chain.indexOf('knee-push-up'));
  });

  it('orders the squat family from assisted to pistol', () => {
    const chain = familyChain('squat').map((e) => e.id);
    expect(chain[0]).toBe('assisted-squat');
    expect(chain.at(-1)).toBe('pistol-squat');
    expect(chain).toContain('tempo-squat');
    expect(chain).toContain('reverse-lunge');
  });

  it('orders the core family from dead bug to hollow rock', () => {
    const chain = familyChain('core').map((e) => e.id);
    expect(chain[0]).toBe('dead-bug');
    expect(chain[1]).toBe('bird-dog');
    expect(chain).toContain('knee-plank');
    expect(chain.indexOf('front-plank')).toBeGreaterThan(chain.indexOf('knee-plank'));
  });
});
