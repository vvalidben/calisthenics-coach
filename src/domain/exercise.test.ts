import { describe, expect, it } from 'vitest';
import { exerciseSchema } from './exercise';
import { anExercise } from '../test/factories';

const validExercise = anExercise({ regression: 'incline-push-up', progression: 'diamond-push-up' });

describe('exerciseSchema', () => {
  it('accepts a fully specified exercise', () => {
    expect(exerciseSchema.parse(validExercise)).toEqual(validExercise);
  });

  it('rejects an id that is not a kebab-case slug', () => {
    expect(exerciseSchema.safeParse({ ...validExercise, id: 'Push Up' }).success).toBe(false);
  });

  it('requires at least one primary muscle', () => {
    expect(exerciseSchema.safeParse({ ...validExercise, primaryMuscles: [] }).success).toBe(false);
  });

  it('rejects a set range whose maximum is below its minimum', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      prescription: { ...validExercise.prescription, sets: { min: 4, max: 3 } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a rep range whose maximum is below its minimum', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      prescription: { ...validExercise.prescription, target: { min: 12, max: 6 } },
    });
    expect(result.success).toBe(false);
  });

  it('allows a terminal exercise to have no regression and no progression', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      regression: null,
      progression: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an exercise that lists itself as its own progression', () => {
    const result = exerciseSchema.safeParse({ ...validExercise, progression: validExercise.id });
    expect(result.success).toBe(false);
  });
});

describe('the starting position', () => {
  it.each(['hands', 'feet', 'body', 'spine', 'head', 'shoulders', 'hips'] as const)(
    'requires the %s to be described',
    (slot) => {
      const result = exerciseSchema.safeParse({
        ...validExercise,
        startingPosition: { ...validExercise.startingPosition, [slot]: '' },
      });
      expect(result.success).toBe(false);
    },
  );

  it('rejects an exercise with no starting position at all', () => {
    const { startingPosition: _s, ...without } = validExercise;
    expect(exerciseSchema.safeParse(without).success).toBe(false);
  });
});

describe('movement steps', () => {
  it('requires at least three steps', () => {
    const result = exerciseSchema.safeParse({ ...validExercise, steps: ['One.', 'Two.'] });
    expect(result.success).toBe(false);
  });

  it('rejects an empty step', () => {
    const result = exerciseSchema.safeParse({ ...validExercise, steps: ['One.', '', 'Three.'] });
    expect(result.success).toBe(false);
  });
});

describe('breathing', () => {
  it('requires both an inhale and an exhale cue', () => {
    expect(
      exerciseSchema.safeParse({ ...validExercise, breathing: { inhale: 'Down.' } }).success,
    ).toBe(false);
    expect(
      exerciseSchema.safeParse({ ...validExercise, breathing: { exhale: 'Up.' } }).success,
    ).toBe(false);
  });

  it('accepts an optional extra note', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      breathing: { inhale: 'Down.', exhale: 'Up.', note: 'Do not hold your breath.' },
    });
    expect(result.success).toBe(true);
  });
});

describe('tempo', () => {
  it('is optional', () => {
    const { tempo: _t, ...without } = validExercise;
    expect(exerciseSchema.safeParse(without).success).toBe(true);
  });

  it('needs at least two phases to be a tempo at all', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      tempo: { phases: [{ label: 'Lower', seconds: 2 }] },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a phase with no duration', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      tempo: { phases: [{ label: 'Lower', seconds: 0 }, { label: 'Press', seconds: 1 }] },
    });
    expect(result.success).toBe(false);
  });
});

describe('what you should feel', () => {
  it('requires the working muscles to be named', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      sensation: { ...validExercise.sensation, working: '' },
    });
    expect(result.success).toBe(false);
  });

  it('requires at least one sensation that is not normal', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      sensation: { ...validExercise.sensation, notNormal: [] },
    });
    expect(result.success).toBe(false);
  });
});

describe('safety', () => {
  it.each(['normalEffort', 'normalFatigue'] as const)('requires %s', (field) => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      safety: { ...validExercise.safety, [field]: '' },
    });
    expect(result.success).toBe(false);
  });

  it.each(['concerningPain', 'stopIf', 'modifyIf'] as const)(
    'requires at least one entry under %s',
    (field) => {
      const result = exerciseSchema.safeParse({
        ...validExercise,
        safety: { ...validExercise.safety, [field]: [] },
      });
      expect(result.success).toBe(false);
    },
  );
});

describe('the demonstration', () => {
  it('requires at least two keyframes', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      demo: { ...validExercise.demo, keyframes: [validExercise.demo.keyframes[0]] },
    });
    expect(result.success).toBe(false);
  });

  it('requires every keyframe to carry a caption as well as a drawing', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      demo: {
        ...validExercise.demo,
        keyframes: validExercise.demo.keyframes.map((k) => ({ ...k, caption: '' })),
      },
    });
    expect(result.success).toBe(false);
  });

  it('requires a pose on every keyframe', () => {
    const [first, second] = validExercise.demo.keyframes;
    const result = exerciseSchema.safeParse({
      ...validExercise,
      demo: {
        ...validExercise.demo,
        keyframes: [first, { id: second!.id, label: second!.label, caption: second!.caption }],
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown scene', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      demo: { ...validExercise.demo, scene: 'trampoline' },
    });
    expect(result.success).toBe(false);
  });
});
