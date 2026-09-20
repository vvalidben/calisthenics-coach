import type { Exercise } from '../../domain/exercise';

/**
 * Hip hinge work for the glutes and hamstrings.
 *
 * Not in the Sprint 2 brief, but included deliberately: squats and lunges are
 * quad-dominant, and with no bar there is no rowing or deadlifting either, so
 * without this family the whole posterior chain goes untrained.
 */
export const HINGE_EXERCISES: Exercise[] = [
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    category: 'legs',
    movementPattern: 'hinge',
    family: 'hinge',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'abs', 'lower-back'],
    equipment: ['floor'],
    difficulty: 1,
    beginnerSuitability: 'ideal',
    measurement: 'reps',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 10, max: 20 }, restSeconds: 45 },
    progressionLevel: 1,
    regression: null,
    progression: 'single-leg-glute-bridge',
    summary: 'The simplest way to load the glutes with nothing but the floor.',
    instructions: {
      setup: [
        'Lie on your back with your knees bent and your feet flat, heels close to your hips.',
        'Rest your arms by your sides, palms down.',
      ],
      execution: [
        'Press through your heels and lift your hips until your body forms a straight line from knees to shoulders.',
        'Squeeze your glutes hard at the top and hold for two seconds.',
        'Lower under control until your hips almost touch the floor.',
      ],
    },
    breathing: 'Exhale as you lift, inhale as you lower.',
    cues: [
      'Tuck your tailbone slightly before you lift, so the glutes work instead of the lower back.',
      'Push through your heels, not your toes.',
    ],
    commonMistakes: [
      { mistake: 'Arching the lower back to get the hips higher.', fix: 'Tuck your ribs down and stop where the glutes do the work.' },
      { mistake: 'Feet too far from the hips, so the hamstrings cramp.', fix: 'Walk your heels closer until they are under your knees.' },
    ],
    demo: {
      keyframes: [
        { id: 'down', label: 'Hips down' },
        { id: 'up', label: 'Hips up' },
      ],
      loop: 'ping-pong',
    },
    tags: ['no-equipment', 'posterior-chain', 'beginner'],
  },
  {
    id: 'single-leg-glute-bridge',
    name: 'Single-Leg Glute Bridge',
    category: 'legs',
    movementPattern: 'hinge',
    family: 'hinge',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings', 'abs', 'obliques'],
    equipment: ['floor'],
    difficulty: 2,
    beginnerSuitability: 'ideal',
    measurement: 'reps-per-side',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 8, max: 12 }, restSeconds: 60 },
    progressionLevel: 2,
    regression: 'glute-bridge',
    progression: 'single-leg-romanian-deadlift',
    summary: 'The same bridge on one leg, roughly doubling the load and exposing side-to-side differences.',
    instructions: {
      setup: [
        'Set up as for a glute bridge.',
        'Lift one foot off the floor and hold that knee toward your chest.',
      ],
      execution: [
        'Press through the planted heel and lift your hips.',
        'Keep your hips level; do not let the free side drop.',
        'Squeeze at the top for two seconds.',
        'Lower under control, then finish all reps before switching sides.',
      ],
    },
    breathing: 'Exhale as you lift, inhale as you lower.',
    cues: [
      'Level hips matter more than height. Watch your hip bones stay square.',
      'If one side is clearly weaker, start each set on that side.',
    ],
    commonMistakes: [
      { mistake: 'Hips tilting toward the free leg.', fix: 'Lower the range until you can hold them level.' },
      { mistake: 'Hamstring cramping instead of glutes working.', fix: 'Bring the heel closer to your hip and tuck the tailbone first.' },
    ],
    demo: {
      keyframes: [
        { id: 'down', label: 'Hips down' },
        { id: 'up', label: 'Hips up, level' },
      ],
      loop: 'ping-pong',
    },
    tags: ['no-equipment', 'posterior-chain', 'unilateral'],
  },
  {
    id: 'single-leg-romanian-deadlift',
    name: 'Single-Leg Romanian Deadlift',
    category: 'legs',
    movementPattern: 'hinge',
    family: 'hinge',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['lower-back', 'abs', 'calves'],
    equipment: ['none'],
    difficulty: 3,
    beginnerSuitability: 'suitable',
    measurement: 'reps-per-side',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 6, max: 10 }, restSeconds: 75 },
    progressionLevel: 3,
    regression: 'single-leg-glute-bridge',
    progression: null,
    summary: 'A standing hinge on one leg that trains the hamstrings through range and the balance alongside it.',
    instructions: {
      setup: [
        'Stand on one leg with a soft bend in the knee.',
        'Let your arms hang in front of you.',
      ],
      execution: [
        'Hinge at the hip, sending your free leg straight back as your chest lowers.',
        'Keep your back flat and your hips square to the floor.',
        'Lower until you feel a strong stretch in the standing hamstring.',
        'Squeeze the glute to return to standing. Finish all reps before switching.',
      ],
    },
    breathing: 'Inhale as you hinge forward, exhale as you stand.',
    cues: [
      'Think of your body as a see-saw: as the chest drops, the back leg rises.',
      'Fingertips on a wall are fine while you learn the balance.',
    ],
    commonMistakes: [
      { mistake: 'Rounding the back to reach lower.', fix: 'Stop where your back starts to round; that is your current range.' },
      { mistake: 'Free hip rotating open toward the ceiling.', fix: 'Point the toes of the free leg at the floor to keep the hips square.' },
    ],
    demo: {
      keyframes: [
        { id: 'stand', label: 'Standing' },
        { id: 'hinged', label: 'Hinged' },
      ],
      loop: 'ping-pong',
    },
    tags: ['no-equipment', 'posterior-chain', 'unilateral', 'balance'],
  },
];
