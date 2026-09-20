import type { Exercise } from '../../domain/exercise';

/**
 * Floor-based upper-back work for an athlete with nothing to hang from.
 *
 * These are honestly labelled throughout: they are not pulls. Lying face down
 * and lifting your arms loads the shoulder blades with the weight of your arms
 * and nothing else, which is roughly two percent of what a row loads. They keep
 * the upper back working and the shoulders healthy between now and a bar; they
 * do not build a pull-up, and no amount of them will.
 */
const NOT_A_PULL =
  'This is not a substitute for pulling. It loads the weight of your arms, not your bodyweight.';

export const PULL_PREP_EXERCISES: Exercise[] = [
  {
    id: 'prone-scapular-retraction',
    name: 'Prone Scapular Retraction',
    category: 'pull',
    movementPattern: 'horizontal-pull',
    family: 'pull-prep',
    primaryMuscles: ['rhomboids', 'traps'],
    secondaryMuscles: ['rear-delts'],
    equipment: ['floor'],
    difficulty: 1,
    beginnerSuitability: 'ideal',
    measurement: 'reps',
    prescription: { sets: { min: 2, max: 3 }, target: { min: 8, max: 12 }, restSeconds: 45 },
    progressionLevel: 1,
    regression: null,
    progression: 'prone-y-raise',
    summary: 'Squeezing the shoulder blades together while lying face down. The smallest honest pulling drill available without a bar.',
    instructions: {
      setup: [
        'Lie face down on the floor with your arms out to the sides at shoulder height, palms down.',
        'Rest your forehead on the floor and relax your neck.',
      ],
      execution: [
        'Without lifting your arms, squeeze your shoulder blades together and down.',
        'Hold the squeeze for two seconds.',
        'Release slowly and let the shoulder blades spread apart again.',
      ],
    },
    breathing: 'Exhale as you squeeze, inhale as you release.',
    cues: [
      'Nothing should lift. This is a squeeze, not a raise.',
      'Keep your neck relaxed; do not lift your head to help.',
    ],
    commonMistakes: [
      { mistake: 'Shrugging the shoulders toward the ears.', fix: 'Pull the shoulder blades down toward your back pockets as you squeeze.' },
      { mistake: 'Lifting the chest instead of moving the shoulder blades.', fix: 'Keep your chest on the floor and isolate the squeeze.' },
    ],
    safetyNotes: [NOT_A_PULL],
    demo: {
      keyframes: [
        { id: 'relaxed', label: 'Blades spread' },
        { id: 'squeezed', label: 'Blades squeezed' },
      ],
      loop: 'ping-pong',
    },
    tags: ['no-equipment', 'posture', 'shoulder-health', 'not-a-pull'],
  },
  {
    id: 'prone-y-raise',
    name: 'Prone Y Raise',
    category: 'pull',
    movementPattern: 'horizontal-pull',
    family: 'pull-prep',
    primaryMuscles: ['rear-delts', 'traps'],
    secondaryMuscles: ['rhomboids', 'lower-back'],
    equipment: ['floor'],
    difficulty: 2,
    beginnerSuitability: 'ideal',
    measurement: 'reps',
    prescription: { sets: { min: 2, max: 3 }, target: { min: 8, max: 12 }, restSeconds: 45 },
    progressionLevel: 2,
    regression: 'prone-scapular-retraction',
    progression: 'reverse-snow-angel',
    summary: 'Lifting the arms overhead in a Y while lying face down, training the lower traps that sitting switches off.',
    instructions: {
      setup: [
        'Lie face down with your arms extended overhead in a Y shape, thumbs pointing up.',
        'Rest your forehead on the floor.',
      ],
      execution: [
        'Squeeze your shoulder blades down toward your back pockets.',
        'Lift both arms a few centimetres off the floor, keeping the Y shape.',
        'Hold for two seconds at the top.',
        'Lower slowly under control.',
      ],
    },
    breathing: 'Exhale as you lift, inhale as you lower.',
    cues: [
      'Height is not the point. A small lift with the blades engaged beats a big lift without.',
      'Thumbs up throughout; it puts the shoulder in a safer position.',
    ],
    commonMistakes: [
      { mistake: 'Arching the lower back to get the arms higher.', fix: 'Press your hips into the floor and lift less.' },
      { mistake: 'Shrugging so the neck does the work.', fix: 'Set the shoulder blades down first, then lift.' },
    ],
    safetyNotes: [NOT_A_PULL],
    demo: {
      keyframes: [
        { id: 'down', label: 'Arms down' },
        { id: 'up', label: 'Y raised' },
      ],
      loop: 'ping-pong',
    },
    tags: ['no-equipment', 'posture', 'shoulder-health', 'not-a-pull'],
  },
  {
    id: 'reverse-snow-angel',
    name: 'Reverse Snow Angel',
    category: 'pull',
    movementPattern: 'horizontal-pull',
    family: 'pull-prep',
    primaryMuscles: ['rear-delts', 'rhomboids'],
    secondaryMuscles: ['traps', 'lower-back'],
    equipment: ['floor'],
    difficulty: 2,
    beginnerSuitability: 'ideal',
    measurement: 'reps',
    prescription: { sets: { min: 2, max: 3 }, target: { min: 6, max: 10 }, restSeconds: 60 },
    progressionLevel: 3,
    regression: 'prone-y-raise',
    progression: 'superman-hold',
    summary: 'Sweeping the arms through their full arc face down, taking the shoulder blades through every position.',
    instructions: {
      setup: [
        'Lie face down with your arms by your sides, palms down.',
        'Rest your forehead on the floor.',
      ],
      execution: [
        'Lift both arms slightly off the floor and keep them off for the whole set.',
        'Sweep them out and overhead until your thumbs nearly meet above your head.',
        'Sweep them back down to your sides along the same path.',
        'Keep the arms hovering the entire time.',
      ],
    },
    breathing: 'Exhale as the arms travel overhead, inhale as they return.',
    cues: [
      'Slow. One sweep each way should take about four seconds.',
      'If your arms touch the floor mid-sweep, the set is over.',
    ],
    commonMistakes: [
      { mistake: 'Resting the arms on the floor between sweeps.', fix: 'Reduce the reps so you can keep them hovering throughout.' },
      { mistake: 'Rushing, so momentum carries the arms.', fix: 'Slow to a four-second sweep and feel the upper back working.' },
    ],
    safetyNotes: [NOT_A_PULL],
    demo: {
      keyframes: [
        { id: 'sides', label: 'Arms at sides' },
        { id: 'overhead', label: 'Arms overhead' },
      ],
      loop: 'ping-pong',
    },
    tags: ['no-equipment', 'posture', 'shoulder-health', 'not-a-pull'],
  },
  {
    id: 'superman-hold',
    name: 'Superman Hold',
    category: 'pull',
    movementPattern: 'spinal-extension',
    family: 'pull-prep',
    primaryMuscles: ['lower-back', 'glutes'],
    secondaryMuscles: ['rear-delts', 'traps', 'hamstrings'],
    equipment: ['floor'],
    difficulty: 3,
    beginnerSuitability: 'suitable',
    measurement: 'time',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 15, max: 40 }, restSeconds: 45 },
    progressionLevel: 4,
    regression: 'reverse-snow-angel',
    progression: null,
    summary: 'A whole-back hold that trains the posterior chain from shoulders to hamstrings at once.',
    instructions: {
      setup: [
        'Lie face down with your arms extended overhead and your legs straight.',
        'Rest your forehead on the floor.',
      ],
      execution: [
        'Lift your arms, chest and legs off the floor at the same time.',
        'Squeeze your glutes and reach long in both directions.',
        'Hold, keeping your neck in line with your spine.',
        'Lower everything together at the end of the hold.',
      ],
    },
    breathing: 'Breathe shallowly and steadily. Do not hold your breath.',
    cues: [
      'Reach long rather than lifting high.',
      'Look at the floor, not forward. Your neck follows your spine.',
    ],
    commonMistakes: [
      { mistake: 'Cranking the head back to lift higher.', fix: 'Keep your gaze down and let the height come from the mid-back.' },
      { mistake: 'Lifting the legs with the lower back only.', fix: 'Squeeze your glutes first, then lift.' },
    ],
    safetyNotes: [
      NOT_A_PULL,
      'Stop if you feel compression or pinching in the lower back rather than muscular effort.',
    ],
    demo: {
      keyframes: [
        { id: 'down', label: 'Flat' },
        { id: 'up', label: 'Extended' },
      ],
      loop: 'ping-pong',
    },
    tags: ['no-equipment', 'posterior-chain', 'not-a-pull'],
  },
];
