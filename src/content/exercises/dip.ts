import type { Exercise } from '../../domain/exercise';

/** Vertical pressing from a support position. The athlete starts at zero dips. */
export const DIP_EXERCISES: Exercise[] = [
  {
    id: 'bench-dip-bent-knee',
    name: 'Bench Dip (Bent Knee)',
    category: 'push',
    movementPattern: 'vertical-push',
    family: 'dip',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'front-delts'],
    equipment: ['chair', 'floor'],
    difficulty: 1,
    beginnerSuitability: 'ideal',
    measurement: 'reps',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 8, max: 12 }, restSeconds: 75 },
    progressionLevel: 1,
    regression: null,
    progression: 'bench-dip-straight-leg',
    summary: 'The entry point to dipping: feet close, knees bent, most weight on the legs.',
    instructions: {
      setup: [
        'Sit on the front edge of a stable chair with your hands beside your hips, fingers pointing forward.',
        'Slide your hips off the front of the seat.',
        'Bend your knees and keep your feet flat on the floor close to the chair.',
      ],
      execution: [
        'Bend your elbows straight back and lower your hips toward the floor.',
        'Stop when your upper arms are roughly parallel to the floor.',
        'Press through your palms until your elbows are straight.',
      ],
    },
    breathing: 'Inhale as you lower, exhale as you press up.',
    cues: [
      'Keep your chest tall and your shoulders pulled down away from your ears.',
      'Stay close to the chair; drifting forward strains the shoulders.',
    ],
    commonMistakes: [
      { mistake: 'Shoulders shrug up toward the ears.', fix: 'Set your shoulders down and back before the first rep.' },
      { mistake: 'Hips drift away from the chair.', fix: 'Keep your back brushing the seat edge the whole way down.' },
    ],
    safetyNotes: ['Brace the chair against a wall so it cannot slide.'],
    demo: {
      keyframes: [
        { id: 'top', label: 'Arms straight' },
        { id: 'bottom', label: 'Elbows bent' },
      ],
      loop: 'ping-pong',
    },
    tags: ['beginner', 'triceps'],
  },
  {
    id: 'bench-dip-straight-leg',
    name: 'Bench Dip (Straight Leg)',
    category: 'push',
    movementPattern: 'vertical-push',
    family: 'dip',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'front-delts'],
    equipment: ['chair', 'floor'],
    difficulty: 2,
    beginnerSuitability: 'suitable',
    measurement: 'reps',
    prescription: { sets: { min: 3, max: 4 }, target: { min: 6, max: 12 }, restSeconds: 90 },
    progressionLevel: 2,
    regression: 'bench-dip-bent-knee',
    progression: 'parallel-bar-dip',
    summary: 'The same dip with your legs extended, so your arms carry far more of you.',
    instructions: {
      setup: [
        'Set up as for a bent-knee bench dip.',
        'Walk your feet out until your legs are straight and only your heels touch the floor.',
      ],
      execution: [
        'Lower your hips by bending your elbows straight back.',
        'Stop when your upper arms are roughly parallel to the floor.',
        'Press back up to straight arms without locking harshly.',
      ],
    },
    breathing: 'Inhale down, exhale up.',
    cues: [
      'The further your heels, the harder the rep.',
      'Keep your hips brushing the chair the entire time.',
    ],
    commonMistakes: [
      { mistake: 'Dropping far below parallel to chase depth.', fix: 'Stop at parallel; deeper loads the shoulder joint, not the triceps.' },
      { mistake: 'Bouncing out of the bottom.', fix: 'Pause for a beat at the bottom of every rep.' },
    ],
    safetyNotes: [
      'Bench dips put the shoulder in a stretched, rotated position. Keep the range short and stop at any pinching.',
    ],
    demo: {
      keyframes: [
        { id: 'top', label: 'Arms straight' },
        { id: 'bottom', label: 'Parallel' },
      ],
      loop: 'ping-pong',
    },
    tags: ['triceps'],
  },
  {
    id: 'parallel-bar-dip',
    name: 'Parallel Bar Dip',
    category: 'push',
    movementPattern: 'vertical-push',
    family: 'dip',
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['front-delts', 'abs'],
    equipment: ['parallel-bars'],
    difficulty: 4,
    beginnerSuitability: 'with-caution',
    measurement: 'reps',
    prescription: { sets: { min: 3, max: 4 }, target: { min: 3, max: 8 }, restSeconds: 120 },
    progressionLevel: 3,
    regression: 'bench-dip-straight-leg',
    progression: null,
    summary: 'The full dip, carrying your whole bodyweight between two bars.',
    instructions: {
      setup: [
        'Grip both bars and press up to a support hold with straight arms.',
        'Pull your shoulders down away from your ears and brace your abs.',
        'Lean your torso forward slightly and cross your ankles.',
      ],
      execution: [
        'Lower yourself by bending your elbows, keeping them close to your body.',
        'Stop when your upper arms reach roughly parallel to the bars.',
        'Press back up to a straight-arm support hold.',
      ],
    },
    breathing: 'Inhale as you descend, exhale hard through the press.',
    cues: [
      'Own the top support hold for 20 seconds before adding reps.',
      'Lean forward for chest, stay upright for triceps.',
    ],
    commonMistakes: [
      { mistake: 'Shoulders roll forward and up at the bottom.', fix: 'Shorten the range and keep the shoulders packed down.' },
      { mistake: 'Kipping with the legs to get out of the bottom.', fix: 'Reduce reps and use slow negatives instead.' },
    ],
    safetyNotes: [
      'Build to a 20-second straight-arm support hold before attempting reps.',
      'Never drop into the bottom position; the shoulder is vulnerable there.',
      'Stop immediately at any sharp pain in the front of the shoulder.',
    ],
    demo: {
      keyframes: [
        { id: 'support', label: 'Support hold' },
        { id: 'bottom', label: 'Parallel' },
      ],
      loop: 'ping-pong',
    },
    tags: ['upper-body', 'goal'],
  },
];
