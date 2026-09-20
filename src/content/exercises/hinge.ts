import type { Exercise } from '../../domain/exercise';
import { BRIDGE_DOWN, BRIDGE_UP, HINGE_BOTTOM, STAND } from '../poses';

const BACK_PAIN = [
  'Pinching or compression in the lower back rather than effort in the glutes or hamstrings.',
  'Any tingling, numbness or shooting sensation down a leg.',
  'A cramping hamstring that will not release.',
];

const HINGE_STOP = [
  'Anything sharp, stabbing or electric in the back or legs.',
  'Your lower back takes over from the glutes and starts to ache.',
  'A hamstring cramps hard enough that you cannot continue smoothly.',
];

/**
 * Hip hinge work for the glutes and hamstrings.
 *
 * Squats and lunges are quad-dominant, and with no bar there is no rowing or
 * deadlifting either, so without this family the whole back of the body goes
 * untrained.
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
    startingPosition: {
      hands: 'By your sides, palms down, pressing lightly into the floor.',
      feet: 'Flat on the floor, hip-width apart, heels close enough that your fingertips could brush them.',
      body: 'Lying on your back with your knees bent.',
      spine: 'Lower back lightly flattened toward the floor, tailbone slightly tucked.',
      head: 'Resting on the floor, neck relaxed, chin neither tucked hard nor lifted.',
      shoulders: 'Flat on the floor, relaxed.',
      hips: 'On the floor at the start, ready to lift.',
    },
    steps: [
      'Lie on your back with your knees bent and your feet flat, heels close to your hips.',
      'Tuck your tailbone slightly so your lower back flattens toward the floor.',
      'Press through your heels and lift your hips.',
      'Rise until your body forms a straight line from knees to shoulders.',
      'Squeeze your glutes hard at the top and hold for two seconds.',
      'Lower under control until your hips almost touch the floor.',
      'Start the next rep without resting your hips down fully.',
    ],
    breathing: {
      inhale: 'As you lower.',
      exhale: 'As you lift and squeeze.',
    },
    tempo: {
      phases: [
        { label: 'Lift', seconds: 1 },
        { label: 'Squeeze at the top', seconds: 2 },
        { label: 'Lower', seconds: 2 },
      ],
    },
    sensation: {
      working: 'The glutes, as a strong squeeze at the top of each rep.',
      alsoNormal: [
        'Some hamstring involvement, especially if your feet are further away.',
        'A glute burn building over the set.',
      ],
      notNormal: BACK_PAIN,
    },
    commonMistakes: [
      { mistake: 'Arching the lower back to get the hips higher.', fix: 'Tuck your ribs down and stop where the glutes are doing the work.' },
      { mistake: 'Feet too far from the hips, so the hamstrings cramp.', fix: 'Walk your heels closer until they are nearly under your knees.' },
      { mistake: 'Pushing through the toes.', fix: 'Drive through your heels; lift your toes if it helps.' },
    ],
    cues: ['Tuck your tailbone.', 'Drive through your heels.', 'Squeeze at the top.'],
    safety: {
      normalEffort: 'Light to moderate.',
      normalFatigue: 'A strong glute burn by the end of the set.',
      concerningPain: BACK_PAIN,
      stopIf: HINGE_STOP,
      modifyIf: [
        'Your hamstrings cramp: bring your heels closer to your hips.',
        'You feel it in your lower back: reduce the height and tuck the tailbone harder before lifting.',
        'It feels too easy at 20 reps: move to the single-leg version rather than adding reps.',
      ],
    },
    demo: {
      scene: 'floor',
      keyframes: [
        { id: 'down', label: 'Start', caption: 'On your back, knees bent, heels close, hips down.', pose: BRIDGE_DOWN },
        { id: 'up', label: 'Top', caption: 'Straight line from knees to shoulders, glutes squeezed.', pose: BRIDGE_UP },
      ],
      loop: 'ping-pong',
      alignment: ['knee', 'shoulder'],
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
    startingPosition: {
      hands: 'By your sides, palms down for stability.',
      feet: 'One foot flat with the heel close to your hip; the other lifted with that knee held toward your chest.',
      body: 'Lying on your back, ready to lift on one leg.',
      spine: 'Lower back lightly flattened, tailbone tucked.',
      head: 'Resting on the floor, neck relaxed.',
      shoulders: 'Flat and level on the floor.',
      hips: 'Level and square. Keeping them level is the whole difficulty of this exercise.',
    },
    steps: [
      'Set up as for a glute bridge.',
      'Lift one foot off the floor and hold that knee toward your chest.',
      'Tuck your tailbone and press through the planted heel.',
      'Lift your hips until your body is in line from knee to shoulder.',
      'Keep both hip bones level; do not let the free side drop.',
      'Squeeze at the top for two seconds, then lower under control.',
      'Finish all reps on one side before switching.',
    ],
    breathing: {
      inhale: 'As you lower.',
      exhale: 'As you lift.',
    },
    tempo: {
      phases: [
        { label: 'Lift', seconds: 1 },
        { label: 'Squeeze', seconds: 2 },
        { label: 'Lower', seconds: 2 },
      ],
      note: 'Level hips matter more than height. Watch your hip bones rather than chasing a bigger lift.',
    },
    sensation: {
      working: 'The glute of the planted leg, working considerably harder than in the two-leg version.',
      alsoNormal: [
        'The hamstring of the working leg joining in.',
        'One side being clearly weaker than the other.',
      ],
      notNormal: BACK_PAIN,
    },
    commonMistakes: [
      { mistake: 'Hips tilting toward the free leg.', fix: 'Lower the range until you can hold them level throughout.' },
      { mistake: 'Hamstring cramping instead of the glute working.', fix: 'Bring the heel closer to your hip and tuck the tailbone first.' },
      { mistake: 'Pushing off the floor with the free leg.', fix: 'Hold the free knee toward your chest so it cannot help.' },
    ],
    cues: ['Hips stay level.', 'Drive through the heel.', 'Tailbone tucked.'],
    safety: {
      normalEffort: 'Moderate. Considerably harder than it looks.',
      normalFatigue: 'A deep glute burn on the working side.',
      concerningPain: BACK_PAIN,
      stopIf: HINGE_STOP,
      modifyIf: [
        'Your hips will not stay level: go back to two-legged bridges for a few weeks.',
        'The hamstring cramps: move the heel closer to your hip.',
      ],
    },
    demo: {
      scene: 'floor',
      keyframes: [
        { id: 'down', label: 'Start', caption: 'One foot planted, the other knee held to the chest, hips down.', pose: BRIDGE_DOWN },
        { id: 'up', label: 'Top', caption: 'Hips lifted and level, line from knee to shoulder.', pose: BRIDGE_UP },
      ],
      loop: 'ping-pong',
      alignment: ['knee', 'shoulder'],
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
    startingPosition: {
      hands: 'Hanging in front of you, or fingertips on a wall while you learn the balance.',
      feet: 'Standing on one foot with a soft bend in that knee; the other leg ready to travel backward.',
      body: 'Tall, weight over the middle of the standing foot.',
      spine: 'Neutral and long. Keeping it long is the whole exercise.',
      head: 'In line with your spine, eyes on a spot on the floor a couple of metres ahead.',
      shoulders: 'Square and level.',
      hips: 'Square to the floor, and staying square as the free leg rises.',
    },
    steps: [
      'Stand on one leg with a soft bend in that knee.',
      'Fix your eyes on a spot on the floor a couple of metres ahead.',
      'Hinge at the hip, sending your free leg straight back as your chest lowers.',
      'Move like a see-saw: as the chest drops, the back leg rises the same amount.',
      'Keep your back flat and both hip bones pointing at the floor.',
      'Lower until you feel a strong stretch in the standing hamstring, then stop.',
      'Squeeze the glute to return to standing, then finish all reps before switching.',
    ],
    breathing: {
      inhale: 'As you hinge forward.',
      exhale: 'As you stand back up.',
    },
    tempo: {
      phases: [
        { label: 'Hinge down', seconds: 3 },
        { label: 'Pause', seconds: 1 },
        { label: 'Stand', seconds: 2 },
      ],
      note: 'Slow is what makes this trainable. Fast reps become a balance scramble.',
    },
    sensation: {
      working: 'A strong stretch and then a pull in the standing leg’s hamstring, with the glute finishing the movement.',
      alsoNormal: [
        'The standing foot and calf working constantly to balance you.',
        'Wobbling, especially in the first few sessions.',
      ],
      notNormal: BACK_PAIN,
    },
    commonMistakes: [
      { mistake: 'Rounding the back to reach lower.', fix: 'Stop where your back starts to round; that is your current range.' },
      { mistake: 'Free hip rotating open toward the ceiling.', fix: 'Point the toes of the free leg at the floor to keep the hips square.' },
      { mistake: 'Bending the standing knee more and more as you descend.', fix: 'Set a soft bend at the start and keep the same angle throughout.' },
    ],
    cues: ['See-saw, not a bow.', 'Hips square.', 'Long spine.'],
    safety: {
      normalEffort: 'Moderate. Balance and hamstring flexibility limit it before strength does.',
      normalFatigue: 'Hamstring and glute working, and the standing foot tiring.',
      concerningPain: BACK_PAIN,
      stopIf: [...HINGE_STOP, 'You are wobbling so much you cannot control the descent.'],
      modifyIf: [
        'Your balance is poor: put fingertips on a wall, or lightly touch the free toes down behind you.',
        'Your back rounds early: reduce the range considerably and work on hamstring mobility.',
      ],
    },
    demo: {
      scene: 'floor',
      keyframes: [
        { id: 'stand', label: 'Start', caption: 'Standing on one leg, soft knee, tall spine.', pose: STAND },
        { id: 'hinged', label: 'Hinged', caption: 'Chest down and free leg back, hips square, back flat.', pose: HINGE_BOTTOM },
        { id: 'end', label: 'Stand up', caption: 'Squeezing the glute back to standing.', pose: STAND },
      ],
      loop: 'cycle',
      alignment: ['head', 'toe'],
    },
    tags: ['no-equipment', 'posterior-chain', 'unilateral', 'balance'],
  },
];
