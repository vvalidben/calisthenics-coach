import { describe, expect, it } from 'vitest';
import { DEFAULT_REMINDERS, trainingDaysPerWeek, userProfileSchema } from './profile';
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
  reminders: { enabled: true, minutesBefore: 0, mobilityOnRestDays: false },
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

describe('reminder settings', () => {
  it('fills them in for a profile written before reminders existed', () => {
    const { reminders: _dropped, ...older } = validProfile;
    expect(userProfileSchema.parse(older).reminders).toEqual(DEFAULT_REMINDERS);
  });

  it('is on by default, because a reminder nobody asked for is easier to turn off than to discover', () => {
    expect(DEFAULT_REMINDERS.enabled).toBe(true);
  });

  it('fires at the training time by default', () => {
    expect(DEFAULT_REMINDERS.minutesBefore).toBe(0);
  });

  it('leaves rest days quiet by default', () => {
    expect(DEFAULT_REMINDERS.mobilityOnRestDays).toBe(false);
  });

  it('accepts a lead time', () => {
    const early = { ...validProfile, reminders: { ...DEFAULT_REMINDERS, minutesBefore: 30 } };
    expect(userProfileSchema.parse(early).reminders.minutesBefore).toBe(30);
  });

  it('refuses a negative lead time', () => {
    const wrong = { ...validProfile, reminders: { ...DEFAULT_REMINDERS, minutesBefore: -5 } };
    expect(userProfileSchema.safeParse(wrong).success).toBe(false);
  });

  it('refuses a lead time longer than three hours, which is not a reminder', () => {
    const wrong = { ...validProfile, reminders: { ...DEFAULT_REMINDERS, minutesBefore: 240 } };
    expect(userProfileSchema.safeParse(wrong).success).toBe(false);
  });
});

describe('trainingDaysPerWeek', () => {
  it('counts the scheduled days', () => {
    expect(trainingDaysPerWeek(validProfile)).toBe(4);
  });
});
