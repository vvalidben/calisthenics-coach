import { describe, expect, it } from 'vitest';
import { exerciseSchema } from './exercise';
import type { Exercise } from './exercise';

const validExercise: Exercise = {
  id: 'push-up',
  name: 'Push-Up',
  category: 'push',
  movementPattern: 'horizontal-push',
  family: 'push',
  primaryMuscles: ['chest', 'triceps'],
  secondaryMuscles: ['front-delts', 'abs'],
  equipment: ['floor'],
  difficulty: 2,
  beginnerSuitability: 'ideal',
  measurement: 'reps',
  prescription: { sets: { min: 3, max: 4 }, target: { min: 6, max: 12 }, restSeconds: 90 },
  progressionLevel: 3,
  regression: 'incline-push-up',
  progression: 'diamond-push-up',
  summary: 'The benchmark horizontal press.',
  instructions: {
    setup: ['Place your hands under your shoulders on the floor.'],
    execution: ['Lower your chest toward the floor.', 'Press back to the start.'],
  },
  breathing: 'Inhale on the way down, exhale as you press up.',
  cues: ['Squeeze your glutes.'],
  commonMistakes: [{ mistake: 'Hips sag toward the floor.', fix: 'Brace your abs and squeeze your glutes.' }],
  safetyNotes: ['Stop if you feel pinching in the front of the shoulder.'],
  demo: {
    keyframes: [
      { id: 'top', label: 'Top' },
      { id: 'bottom', label: 'Bottom' },
    ],
    loop: 'ping-pong',
  },
  tags: ['bodyweight', 'upper-body'],
};

describe('exerciseSchema', () => {
  it('accepts a fully specified exercise', () => {
    expect(exerciseSchema.parse(validExercise)).toEqual(validExercise);
  });

  it('rejects an id that is not a kebab-case slug', () => {
    const result = exerciseSchema.safeParse({ ...validExercise, id: 'Push Up' });
    expect(result.success).toBe(false);
  });

  it('requires at least one primary muscle', () => {
    const result = exerciseSchema.safeParse({ ...validExercise, primaryMuscles: [] });
    expect(result.success).toBe(false);
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

  it('requires a demo to have at least two keyframes', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      demo: { keyframes: [{ id: 'top', label: 'Top' }], loop: 'cycle' },
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
    const result = exerciseSchema.safeParse({ ...validExercise, progression: 'push-up' });
    expect(result.success).toBe(false);
  });
});
