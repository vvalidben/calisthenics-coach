import type { UserProfile } from '../domain/profile';

/** The date the athlete's baselines were taken. */
export const SEED_DATE = '2026-09-20';

/**
 * The athlete's stated starting point, written on first run and editable from
 * Sprint 2 onward.
 *
 * Two fields are assumptions rather than stated facts, flagged so they are easy
 * to correct: which four days of the week are training days, and the preferred
 * training time (which only matters once reminders exist).
 */
export const SEED_PROFILE: UserProfile = {
  goals: ['build-muscle', 'get-stronger', 'mobility-flexibility'],
  fitnessLevel: 'complete-beginner',

  currentAbilities: [
    { exerciseId: 'push-up', measurement: 'reps', value: 10, assessedAt: SEED_DATE },
    { exerciseId: 'bodyweight-squat', measurement: 'reps', value: 12, assessedAt: SEED_DATE },
    { exerciseId: 'pull-up', measurement: 'reps', value: 7, assessedAt: SEED_DATE },
    // Tested at zero, which is different from untested.
    { exerciseId: 'parallel-bar-dip', measurement: 'reps', value: 0, assessedAt: SEED_DATE },
    // Untested: null, so the program engine must not assume a number.
    { exerciseId: 'front-plank', measurement: 'time', value: null, assessedAt: SEED_DATE },
    { exerciseId: 'handstand-back-to-wall', measurement: 'time', value: null, assessedAt: SEED_DATE },
  ],

  availableEquipment: ['none', 'floor', 'wall', 'chair', 'towel', 'pullup-bar', 'parallel-bars'],

  // ASSUMPTION: an even Mon/Tue + Thu/Fri split. Change freely.
  trainingDays: ['monday', 'tuesday', 'thursday', 'friday'],
  // ASSUMPTION: evening training. Only used once reminders land.
  preferredTrainingTime: '18:00',
  sessionDuration: { min: 20, max: 30 },

  progressionRate: 'moderate',
  currentPhase: { name: 'foundation', startedAt: SEED_DATE, plannedWeeks: 4 },
  injuries: [],

  createdAt: SEED_DATE,
  updatedAt: SEED_DATE,
};
