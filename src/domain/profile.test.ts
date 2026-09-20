import { describe, expect, it } from 'vitest';
import { trainingDaysPerWeek, userProfileSchema } from './profile';
import type { UserProfile } from './profile';

const validProfile: UserProfile = {
  goals: ['build-muscle', 'get-stronger', 'mobility-flexibility'],
  fitnessLevel: 'complete-beginner',
  currentAbilities: [
    { exerciseId: 'push-up', measurement: 'reps', value: 10, assessedAt: '2026-09-20' },
    { exerciseId: 'front-plank', measurement: 'time', value: null, assessedAt: '2026-09-20' },
  ],
  availableEquipment: ['none', 'floor', 'wall', 'chair', 'towel', 'pullup-bar'],
  trainingDays: ['monday', 'tuesday', 'thursday', 'friday'],
  preferredTrainingTime: '18:30',
  sessionDuration: { min: 20, max: 30 },
  progressionRate: 'moderate',
  currentPhase: { name: 'foundation', startedAt: '2026-09-20', plannedWeeks: 4 },
  injuries: [],
  createdAt: '2026-09-20',
  updatedAt: '2026-09-20',
};

describe('userProfileSchema', () => {
  it('accepts a fully specified profile', () => {
    expect(userProfileSchema.parse(validProfile)).toEqual(validProfile);
  });

  it('requires at least one goal', () => {
    expect(userProfileSchema.safeParse({ ...validProfile, goals: [] }).success).toBe(false);
  });

  it('requires at least one training day', () => {
    expect(userProfileSchema.safeParse({ ...validProfile, trainingDays: [] }).success).toBe(false);
  });

  it('rejects a repeated training day', () => {
    const result = userProfileSchema.safeParse({
      ...validProfile,
      trainingDays: ['monday', 'monday', 'thursday'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a session duration whose maximum is below its minimum', () => {
    const result = userProfileSchema.safeParse({
      ...validProfile,
      sessionDuration: { min: 30, max: 20 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a preferred training time that is not a 24-hour clock time', () => {
    const result = userProfileSchema.safeParse({ ...validProfile, preferredTrainingTime: '6pm' });
    expect(result.success).toBe(false);
  });

  it('rejects two ability entries for the same exercise', () => {
    const result = userProfileSchema.safeParse({
      ...validProfile,
      currentAbilities: [
        { exerciseId: 'push-up', measurement: 'reps', value: 10, assessedAt: '2026-09-20' },
        { exerciseId: 'push-up', measurement: 'reps', value: 12, assessedAt: '2026-09-21' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('treats a null ability value as untested rather than as zero', () => {
    const parsed = userProfileSchema.parse(validProfile);
    const plank = parsed.currentAbilities.find((a) => a.exerciseId === 'front-plank');
    expect(plank?.value).toBeNull();
  });

  it('rejects a negative ability value', () => {
    const result = userProfileSchema.safeParse({
      ...validProfile,
      currentAbilities: [
        { exerciseId: 'push-up', measurement: 'reps', value: -1, assessedAt: '2026-09-20' },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('trainingDaysPerWeek', () => {
  it('counts the scheduled days', () => {
    expect(trainingDaysPerWeek(validProfile)).toBe(4);
  });
});
