import type { UserProfile } from '../domain/profile';

/** The date the athlete's baselines were taken. */
export const SEED_DATE = '2026-09-20';

/**
 * The athlete's stated starting point, written on first run and editable from
 * a later sprint.
 *
 * Note what is *not* here: `pullup-bar` and `parallel-bars`. There is no bar,
 * so every exercise needing one is unavailable. The 7 pull-ups below are still
 * recorded, because an ability is a fact about the athlete while availability
 * is a fact about their equipment. Adding `'pullup-bar'` to the list below is
 * the only change needed to unlock the entire pull ladder.
 *
 * The training days come from the athlete's own suggested schedule. The
 * preferred training time is still an assumption, flagged so it is easy to
 * correct; it only matters once reminders exist.
 */
export const SEED_PROFILE: UserProfile = {
  goals: ['build-muscle', 'get-stronger', 'mobility-flexibility'],
  fitnessLevel: 'complete-beginner',

  currentAbilities: [
    { exerciseId: 'push-up', measurement: 'reps', value: 10, assessedAt: SEED_DATE },
    { exerciseId: 'bodyweight-squat', measurement: 'reps', value: 12, assessedAt: SEED_DATE },
    // Recorded ability, but currently unavailable to train: there is no bar.
    { exerciseId: 'pull-up', measurement: 'reps', value: 7, assessedAt: SEED_DATE },
    // Tested at zero, which is different from untested.
    { exerciseId: 'parallel-bar-dip', measurement: 'reps', value: 0, assessedAt: SEED_DATE },
    // Untested: null, so the program engine must not assume a number.
    { exerciseId: 'front-plank', measurement: 'time', value: null, assessedAt: SEED_DATE },
    { exerciseId: 'handstand-back-to-wall', measurement: 'time', value: null, assessedAt: SEED_DATE },
  ],

  availableEquipment: ['none', 'floor', 'wall', 'chair', 'towel'],

  // Mon, Tue, rest, Thu, rest, Sat, rest. Never more than two days in a row,
  // and a full rest day before each of the two harder sessions.
  trainingDays: ['monday', 'tuesday', 'thursday', 'saturday'],
  // ASSUMPTION: evening training. Only used once reminders land.
  preferredTrainingTime: '18:00',
  sessionDuration: { min: 20, max: 30 },

  progressionRate: 'moderate',
  currentPhase: { name: 'foundation', startedAt: SEED_DATE, plannedWeeks: 4 },
  injuries: [],

  createdAt: SEED_DATE,
  updatedAt: SEED_DATE,
};
