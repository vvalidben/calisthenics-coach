import type { Exercise } from '../../domain/exercise';

/** Trunk work, from a floor hold up to hanging. Plank is currently untested. */
export const CORE_EXERCISES: Exercise[] = [
  {
    id: 'front-plank',
    name: 'Front Plank',
    category: 'core',
    movementPattern: 'isometric-hold',
    family: 'core',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['obliques', 'glutes', 'front-delts'],
    equipment: ['floor'],
    difficulty: 1,
    beginnerSuitability: 'ideal',
    measurement: 'time',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 20, max: 45 }, restSeconds: 45 },
    progressionLevel: 1,
    regression: null,
    progression: 'hollow-body-hold',
    summary: 'The baseline trunk hold: resist your hips sagging for time.',
    instructions: {
      setup: [
        'Lie face down and place your forearms on the floor, elbows under your shoulders.',
        'Tuck your toes under.',
      ],
      execution: [
        'Lift your hips until your body forms one straight line from heels to head.',
        'Squeeze your glutes and brace your abs as if bracing for a punch.',
        'Hold for the target time, breathing steadily.',
      ],
    },
    breathing: 'Breathe shallowly and continuously through the hold. Never hold your breath.',
    cues: [
      'Tuck your tailbone slightly so your lower back flattens.',
      'Push the floor away with your forearms.',
    ],
    commonMistakes: [
      { mistake: 'Hips sag, arching the lower back.', fix: 'End the set the moment your hips drop; a shorter clean hold beats a long sloppy one.' },
      { mistake: 'Hips pike up into an easy tent shape.', fix: 'Lower your hips until your body is one flat line.' },
    ],
    demo: {
      keyframes: [
        { id: 'hold', label: 'Straight line' },
        { id: 'brace', label: 'Braced' },
      ],
      loop: 'cycle',
    },
    tags: ['staple', 'core', 'untested'],
  },
  {
    id: 'hollow-body-hold',
    name: 'Hollow Body Hold',
    category: 'core',
    movementPattern: 'isometric-hold',
    family: 'core',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['hip-flexors', 'obliques'],
    equipment: ['floor'],
    difficulty: 2,
    beginnerSuitability: 'suitable',
    measurement: 'time',
    prescription: { sets: { min: 3, max: 4 }, target: { min: 15, max: 40 }, restSeconds: 60 },
    progressionLevel: 2,
    regression: 'front-plank',
    progression: 'hanging-knee-raise',
    summary: 'The gymnastics trunk position that underpins every hanging and handstand skill.',
    instructions: {
      setup: [
        'Lie on your back with your arms by your sides.',
        'Press your lower back flat into the floor.',
      ],
      execution: [
        'Lift your shoulder blades and legs a few centimetres off the floor.',
        'Keep your lower back pressed down the whole time.',
        'Hold, then lower everything together at the end of the set.',
      ],
    },
    breathing: 'Take small, steady breaths without letting your ribs flare.',
    cues: [
      'The lower your legs, the harder the hold.',
      'If your lower back lifts, raise your legs higher until it flattens again.',
    ],
    commonMistakes: [
      { mistake: 'Lower back arches off the floor.', fix: 'Raise your legs until your back is flat; that is your working height.' },
      { mistake: 'Straining the neck by lifting with the head.', fix: 'Lift from the shoulder blades and keep your chin tucked.' },
    ],
    demo: {
      keyframes: [
        { id: 'flat', label: 'Back flat' },
        { id: 'hollow', label: 'Hollow' },
      ],
      loop: 'ping-pong',
    },
    tags: ['core', 'gymnastics'],
  },
  {
    id: 'hanging-knee-raise',
    name: 'Hanging Knee Raise',
    category: 'core',
    movementPattern: 'core-flexion',
    family: 'core',
    primaryMuscles: ['abs', 'hip-flexors'],
    secondaryMuscles: ['forearms', 'obliques'],
    equipment: ['pullup-bar'],
    difficulty: 3,
    beginnerSuitability: 'suitable',
    measurement: 'reps',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 6, max: 12 }, restSeconds: 75 },
    progressionLevel: 3,
    regression: 'hollow-body-hold',
    progression: null,
    summary: 'Trunk flexion performed hanging, which also builds grip and shoulder stability.',
    instructions: {
      setup: [
        'Hang from the bar with straight arms and a shoulder-width grip.',
        'Pull your shoulder blades down so you are not hanging passively.',
      ],
      execution: [
        'Without swinging, raise your knees toward your chest.',
        'Curl your pelvis slightly at the top rather than only lifting the thighs.',
        'Lower your legs slowly all the way down.',
      ],
    },
    breathing: 'Exhale as you raise your knees, inhale as you lower them.',
    cues: ['Lead with your pelvis, not your knees.', 'Stop the set as soon as you start swinging.'],
    commonMistakes: [
      { mistake: 'Swinging the legs up with momentum.', fix: 'Pause for a beat at the bottom of every rep.' },
      { mistake: 'Only lifting the thighs, so the abs barely work.', fix: 'Tuck your pelvis under at the top of each rep.' },
    ],
    safetyNotes: [
      'Check the bar takes your weight before hanging from it.',
      'Lower yourself under control rather than dropping off the bar.',
    ],
    demo: {
      keyframes: [
        { id: 'hang', label: 'Hanging' },
        { id: 'top', label: 'Knees up' },
      ],
      loop: 'ping-pong',
    },
    tags: ['core', 'grip'],
  },
];
