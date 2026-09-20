import type { Exercise } from '../domain/exercise';
import { PLANK_BOTTOM, PLANK_TOP } from '../content/poses';
import type { UserProfile } from '../domain/profile';
import type { ProgressionState } from '../domain/progression';
import type { WorkoutSession } from '../domain/session';
import type { Workout } from '../domain/workout';

/**
 * Minimal valid fixtures for tests. Each builder takes an override so a test
 * can state only the field it cares about.
 */

export const anExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 'push-up',
  name: 'Push-Up',
  category: 'push',
  movementPattern: 'horizontal-push',
  family: 'push',
  primaryMuscles: ['chest', 'triceps'],
  secondaryMuscles: ['front-delts'],
  equipment: ['floor'],
  difficulty: 2,
  beginnerSuitability: 'ideal',
  measurement: 'reps',
  prescription: { sets: { min: 3, max: 4 }, target: { min: 6, max: 12 }, restSeconds: 90 },
  progressionLevel: 3,
  regression: null,
  progression: null,
  summary: 'The benchmark horizontal press.',
  startingPosition: {
    hands: 'Under your shoulders.',
    feet: 'Toes tucked, hip-width.',
    body: 'One straight line from heels to head.',
    spine: 'Neutral, ribs down.',
    head: 'Neck long, eyes on the floor.',
    shoulders: 'Over your hands, pulled down.',
    hips: 'Level with shoulders and heels.',
  },
  steps: ['Set your hands.', 'Lower your chest.', 'Press back up.'],
  breathing: { inhale: 'On the way down.', exhale: 'As you press up.' },
  sensation: {
    working: 'The chest and triceps.',
    alsoNormal: ['A burn in the last few reps.'],
    notNormal: ['A pinch at the front of the shoulder.'],
  },
  cues: ['Squeeze your glutes.'],
  commonMistakes: [{ mistake: 'Sagging hips.', fix: 'Brace your abs.' }],
  safety: {
    normalEffort: 'Hard by the last rep.',
    normalFatigue: 'A burn in the chest.',
    concerningPain: ['Sharp shoulder pain.'],
    stopIf: ['Anything sharp.'],
    modifyIf: ['Your wrists ache: press on your knuckles.'],
  },
  demo: {
    scene: 'floor',
    keyframes: [
      { id: 'top', label: 'Top', caption: 'Arms straight.', pose: PLANK_TOP },
      { id: 'bottom', label: 'Bottom', caption: 'Chest near the floor.', pose: PLANK_BOTTOM },
    ],
    loop: 'ping-pong',
  },
  tags: ['bodyweight'],
  ...overrides,
});

export const aProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  goals: ['build-muscle'],
  fitnessLevel: 'complete-beginner',
  currentAbilities: [
    { exerciseId: 'push-up', measurement: 'reps', value: 10, assessedAt: '2026-09-20' },
  ],
  availableEquipment: ['floor'],
  trainingDays: ['monday', 'thursday'],
  preferredTrainingTime: '18:30',
  sessionDuration: { min: 20, max: 30 },
  progressionRate: 'moderate',
  currentPhase: { name: 'foundation', startedAt: '2026-09-20', plannedWeeks: 4 },
  injuries: [],
  createdAt: '2026-09-20',
  updatedAt: '2026-09-20',
  ...overrides,
});

export const aWorkout = (overrides: Partial<Workout> = {}): Workout => ({
  id: 'foundation-w1-d1',
  name: 'Full Body A',
  day: 'monday',
  weekIndex: 1,
  focus: 'full-body',
  estimatedMinutes: 25,
  warmUp: [
    { exerciseId: 'cat-cow', sets: 1, measurement: 'reps', target: { min: 8, max: 10 }, restSeconds: 0 },
  ],
  mainWork: [
    { exerciseId: 'push-up', sets: 3, measurement: 'reps', target: { min: 6, max: 10 }, restSeconds: 90 },
  ],
  mobility: [],
  ...overrides,
});

export const aSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: '2026-09-21-foundation-w1-d1',
  workoutId: 'foundation-w1-d1',
  date: '2026-09-21',
  status: 'completed',
  startedAt: '2026-09-21T18:30:00.000Z',
  completedAt: '2026-09-21T18:55:00.000Z',
  durationSeconds: 1500,
  exercises: [
    {
      exerciseId: 'push-up',
      block: 'main',
      prescribed: { sets: 3, measurement: 'reps', target: { min: 6, max: 10 } },
      sets: [{ setNumber: 1, reps: 10, seconds: null, rpe: 7, completed: true }],
      rpe: 7,
    },
  ],
  overallRpe: 7,
  ...overrides,
});

export const aProgressionState = (
  overrides: Partial<ProgressionState> = {},
): ProgressionState => ({
  family: 'push',
  currentExerciseId: 'push-up',
  currentLevel: 3,
  performance: null,
  previousPerformance: null,
  progressionCriteria: {
    consecutiveSessions: 2,
    minSets: 3,
    minValuePerSet: 12,
    maxAverageRpe: 8,
  },
  regressionCriteria: { consecutiveSessions: 2, maxValuePerSet: 4, minAverageRpe: 9.5 },
  consecutiveQualifyingSessions: 0,
  consecutiveStrugglingSessions: 0,
  updatedAt: '2026-09-20',
  ...overrides,
});
