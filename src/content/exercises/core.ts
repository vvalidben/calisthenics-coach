import type { Exercise } from '../../domain/exercise';

/**
 * Trunk work on the floor. The chain runs from learning to brace while lying
 * down, through holds, to moving under load.
 */
export const CORE_EXERCISES: Exercise[] = [
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    category: 'core',
    movementPattern: 'core-anti-extension',
    family: 'core',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['obliques', 'hip-flexors'],
    equipment: ['floor'],
    difficulty: 1,
    beginnerSuitability: 'ideal',
    measurement: 'reps-per-side',
    prescription: { sets: { min: 2, max: 3 }, target: { min: 6, max: 10 }, restSeconds: 45 },
    progressionLevel: 1,
    regression: null,
    progression: 'bird-dog',
    summary: 'Lying on your back moving opposite limbs while the lower back stays glued to the floor. The safest way to learn bracing.',
    instructions: {
      setup: [
        'Lie on your back and lift your arms straight up over your shoulders.',
        'Lift your knees over your hips, bent to ninety degrees.',
        'Press your lower back flat into the floor and keep it there.',
      ],
      execution: [
        'Slowly lower one arm overhead and the opposite leg toward the floor.',
        'Stop before your lower back lifts, even slightly.',
        'Return to the start under control.',
        'Repeat on the other side. One rep is one side.',
      ],
    },
    breathing: 'Exhale as the limbs extend, inhale as they return.',
    cues: [
      'Your lower back staying down is the entire exercise. Range is secondary.',
      'Slide a hand under your lower back to check: it should stay pinned.',
    ],
    commonMistakes: [
      { mistake: 'Lower back arching as the leg lowers.', fix: 'Shorten the range and keep the knee more bent.' },
      { mistake: 'Rushing, so momentum does the work.', fix: 'Take three seconds out and three seconds back.' },
    ],
    demo: {
      keyframes: [
        { id: 'start', label: 'Tabletop' },
        { id: 'extended', label: 'Opposite limbs out' },
      ],
      loop: 'ping-pong',
    },
    tags: ['beginner', 'core', 'no-equipment'],
  },
  {
    id: 'bird-dog',
    name: 'Bird Dog',
    category: 'core',
    movementPattern: 'core-anti-rotation',
    family: 'core',
    primaryMuscles: ['abs', 'lower-back'],
    secondaryMuscles: ['glutes', 'obliques', 'rear-delts'],
    equipment: ['floor'],
    difficulty: 1,
    beginnerSuitability: 'ideal',
    measurement: 'reps-per-side',
    prescription: { sets: { min: 2, max: 3 }, target: { min: 6, max: 10 }, restSeconds: 45 },
    progressionLevel: 2,
    regression: 'dead-bug',
    progression: 'knee-plank',
    summary: 'Extending opposite arm and leg on all fours while refusing to twist. Trains the trunk to resist rotation.',
    instructions: {
      setup: [
        'Kneel on all fours with your hands under your shoulders and knees under your hips.',
        'Set your back flat and brace your abs.',
      ],
      execution: [
        'Reach one arm forward and the opposite leg straight back.',
        'Stop at shoulder and hip height; do not lift higher.',
        'Hold for two seconds without letting your hips rotate.',
        'Return under control and repeat on the other side.',
      ],
    },
    breathing: 'Exhale as you extend, inhale as you return.',
    cues: [
      'Imagine balancing a glass of water on your lower back.',
      'Reach long rather than lifting high.',
    ],
    commonMistakes: [
      { mistake: 'Hips rotating open as the leg lifts.', fix: 'Lift the leg no higher than hip height and keep both hip bones facing the floor.' },
      { mistake: 'Lower back sagging into an arch.', fix: 'Brace your abs before you move and keep your ribs down.' },
    ],
    demo: {
      keyframes: [
        { id: 'start', label: 'All fours' },
        { id: 'extended', label: 'Opposite limbs out' },
      ],
      loop: 'ping-pong',
    },
    tags: ['beginner', 'core', 'no-equipment', 'anti-rotation'],
  },
  {
    id: 'knee-plank',
    name: 'Knee Plank',
    category: 'core',
    movementPattern: 'isometric-hold',
    family: 'core',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['obliques', 'front-delts'],
    equipment: ['floor'],
    difficulty: 1,
    beginnerSuitability: 'ideal',
    measurement: 'time',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 20, max: 45 }, restSeconds: 45 },
    progressionLevel: 3,
    regression: 'bird-dog',
    progression: 'front-plank',
    summary: 'The plank with knees down, shortening the lever so the position can be held properly from day one.',
    instructions: {
      setup: [
        'Lie face down and place your forearms on the floor, elbows under your shoulders.',
        'Keep your knees on the floor and cross your ankles.',
      ],
      execution: [
        'Lift your hips until your body is a straight line from knees to head.',
        'Squeeze your glutes and brace your abs.',
        'Hold for the target time, breathing steadily.',
      ],
    },
    breathing: 'Breathe shallowly and continuously. Never hold your breath.',
    cues: [
      'Tuck your tailbone slightly so your lower back flattens.',
      'Push the floor away with your forearms.',
    ],
    commonMistakes: [
      { mistake: 'Hips sitting back toward the heels.', fix: 'Walk your knees back until your hips are in line with your shoulders.' },
      { mistake: 'Holding on past the point where the line breaks.', fix: 'End the set the moment your hips drop. Quality decides the time.' },
    ],
    demo: {
      keyframes: [
        { id: 'hold', label: 'Straight line' },
        { id: 'brace', label: 'Braced' },
      ],
      loop: 'cycle',
    },
    tags: ['beginner', 'core', 'no-equipment'],
  },
  {
    id: 'front-plank',
    name: 'Front Plank',
    category: 'core',
    movementPattern: 'isometric-hold',
    family: 'core',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['obliques', 'glutes', 'front-delts'],
    equipment: ['floor'],
    difficulty: 2,
    beginnerSuitability: 'ideal',
    measurement: 'time',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 20, max: 60 }, restSeconds: 45 },
    progressionLevel: 4,
    regression: 'knee-plank',
    progression: 'plank-shoulder-tap',
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
    id: 'plank-shoulder-tap',
    name: 'Plank Shoulder Tap',
    category: 'core',
    movementPattern: 'core-anti-rotation',
    family: 'core',
    primaryMuscles: ['abs', 'obliques'],
    secondaryMuscles: ['front-delts', 'glutes'],
    equipment: ['floor'],
    difficulty: 3,
    beginnerSuitability: 'suitable',
    measurement: 'reps-per-side',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 6, max: 12 }, restSeconds: 60 },
    progressionLevel: 5,
    regression: 'front-plank',
    progression: 'hollow-body-hold',
    summary: 'A straight-arm plank where lifting one hand forces the trunk to resist twisting.',
    instructions: {
      setup: [
        'Start in a straight-arm plank with your hands under your shoulders.',
        'Widen your feet to about shoulder width for stability.',
      ],
      execution: [
        'Lift one hand and tap the opposite shoulder.',
        'Keep your hips completely still; they should not rotate at all.',
        'Replace the hand and repeat on the other side.',
      ],
    },
    breathing: 'Exhale as you tap, inhale as the hand returns.',
    cues: [
      'Wider feet make it easier. Narrow them as you get stronger.',
      'Slow down until the hips stop moving, then add reps.',
    ],
    commonMistakes: [
      { mistake: 'Hips rocking side to side with each tap.', fix: 'Widen your feet and slow the tempo right down.' },
      { mistake: 'Hips piking up to make balance easier.', fix: 'Hold the straight line from heels to head throughout.' },
    ],
    demo: {
      keyframes: [
        { id: 'plank', label: 'Both hands down' },
        { id: 'tap', label: 'Tapping shoulder' },
      ],
      loop: 'ping-pong',
    },
    tags: ['core', 'anti-rotation', 'no-equipment'],
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
    difficulty: 3,
    beginnerSuitability: 'suitable',
    measurement: 'time',
    prescription: { sets: { min: 3, max: 4 }, target: { min: 15, max: 40 }, restSeconds: 60 },
    progressionLevel: 6,
    regression: 'plank-shoulder-tap',
    progression: 'hollow-rock',
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
    id: 'hollow-rock',
    name: 'Hollow Rock',
    category: 'core',
    movementPattern: 'core-anti-extension',
    family: 'core',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['hip-flexors', 'obliques'],
    equipment: ['floor'],
    difficulty: 4,
    beginnerSuitability: 'with-caution',
    measurement: 'reps',
    prescription: { sets: { min: 3, max: 4 }, target: { min: 8, max: 20 }, restSeconds: 60 },
    progressionLevel: 7,
    regression: 'hollow-body-hold',
    progression: null,
    summary: 'Rocking back and forth in the hollow position, which punishes any loss of tension.',
    instructions: {
      setup: [
        'Take a hollow body position you can hold for at least thirty seconds.',
        'Extend your arms overhead by your ears.',
      ],
      execution: [
        'Rock back and forth from shoulders to hips, driving from the shoulders.',
        'Keep the hollow shape rigid; only the contact point with the floor moves.',
        'Do not let your feet or hands touch the floor.',
      ],
    },
    breathing: 'Breathe steadily in rhythm with the rocking.',
    cues: [
      'The shape never changes. If it bends, stop the set.',
      'Drive the rock from your upper back, not by kicking your legs.',
    ],
    commonMistakes: [
      { mistake: 'Folding in the middle so the body bends with each rock.', fix: 'Go back to static hollow holds until thirty seconds is easy.' },
      { mistake: 'Kicking the legs to generate the rock.', fix: 'Initiate from the shoulders and keep the legs locked in place.' },
    ],
    safetyNotes: ['Rock on a mat or carpet. On a hard floor this is uncomfortable on the spine.'],
    demo: {
      keyframes: [
        { id: 'back', label: 'Rocked back' },
        { id: 'forward', label: 'Rocked forward' },
      ],
      loop: 'ping-pong',
    },
    tags: ['core', 'gymnastics', 'advanced'],
  },
];

/** Resisting sideways collapse, which the front plank never trains. */
export const SIDE_CORE_EXERCISES: Exercise[] = [
  {
    id: 'knee-side-plank',
    name: 'Knee Side Plank',
    category: 'core',
    movementPattern: 'core-anti-lateral-flexion',
    family: 'side-core',
    primaryMuscles: ['obliques'],
    secondaryMuscles: ['abs', 'glutes', 'side-delts'],
    equipment: ['floor'],
    difficulty: 1,
    beginnerSuitability: 'ideal',
    measurement: 'time-per-side',
    prescription: { sets: { min: 2, max: 3 }, target: { min: 15, max: 40 }, restSeconds: 45 },
    progressionLevel: 1,
    regression: null,
    progression: 'side-plank',
    summary: 'The side plank with knees bent, which is where the side plank should start.',
    instructions: {
      setup: [
        'Lie on one side with your forearm on the floor, elbow under your shoulder.',
        'Bend your knees to ninety degrees and stack them on top of each other.',
      ],
      execution: [
        'Lift your hips until your body is a straight line from knees to head.',
        'Keep your top hip stacked directly over the bottom one.',
        'Hold for the target time, then switch sides.',
      ],
    },
    breathing: 'Breathe steadily; do not hold your breath.',
    cues: [
      'Push the floor away with your forearm so your shoulder does not sink.',
      'Stack the hips. Rolling forward makes it much easier and pointless.',
    ],
    commonMistakes: [
      { mistake: 'Hips rolling forward toward the floor.', fix: 'Stack your top hip directly over the bottom one and hold it there.' },
      { mistake: 'Sinking into the bottom shoulder.', fix: 'Actively press the forearm down and lift the ribcage away from the floor.' },
    ],
    demo: {
      keyframes: [
        { id: 'down', label: 'Hips down' },
        { id: 'up', label: 'Hips lifted' },
      ],
      loop: 'ping-pong',
    },
    tags: ['beginner', 'core', 'no-equipment'],
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    category: 'core',
    movementPattern: 'core-anti-lateral-flexion',
    family: 'side-core',
    primaryMuscles: ['obliques'],
    secondaryMuscles: ['abs', 'glutes', 'side-delts', 'adductors'],
    equipment: ['floor'],
    difficulty: 2,
    beginnerSuitability: 'ideal',
    measurement: 'time-per-side',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 20, max: 60 }, restSeconds: 45 },
    progressionLevel: 2,
    regression: 'knee-side-plank',
    progression: 'side-plank-hip-dip',
    summary: 'The full side plank on your feet, holding the body rigid against gravity pulling sideways.',
    instructions: {
      setup: [
        'Lie on one side with your forearm on the floor, elbow under your shoulder.',
        'Extend your legs and stack your feet, or stagger them for more stability.',
      ],
      execution: [
        'Lift your hips until your body is a straight line from heels to head.',
        'Keep your top hip stacked over the bottom one.',
        'Hold for the target time, then switch sides.',
      ],
    },
    breathing: 'Breathe steadily throughout the hold.',
    cues: [
      'Squeeze your glutes; a side plank sags at the hips first.',
      'Staggering the feet is a legitimate way to hold the position longer while you build up.',
    ],
    commonMistakes: [
      { mistake: 'Hips dropping toward the floor as the hold goes on.', fix: 'End the set when the line breaks rather than pushing through.' },
      { mistake: 'Body rotating so it becomes a front plank on one arm.', fix: 'Point your top hip at the ceiling and keep it there.' },
    ],
    demo: {
      keyframes: [
        { id: 'down', label: 'Hips down' },
        { id: 'up', label: 'Straight line' },
      ],
      loop: 'ping-pong',
    },
    tags: ['staple', 'core', 'no-equipment'],
  },
  {
    id: 'side-plank-hip-dip',
    name: 'Side Plank Hip Dip',
    category: 'core',
    movementPattern: 'core-anti-lateral-flexion',
    family: 'side-core',
    primaryMuscles: ['obliques'],
    secondaryMuscles: ['abs', 'glutes', 'side-delts'],
    equipment: ['floor'],
    difficulty: 3,
    beginnerSuitability: 'suitable',
    measurement: 'reps-per-side',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 8, max: 15 }, restSeconds: 60 },
    progressionLevel: 3,
    regression: 'side-plank',
    progression: null,
    summary: 'A side plank that moves, adding repetitions to what was only a hold.',
    instructions: {
      setup: [
        'Take a full side plank position on your forearm.',
        'Rest your top hand on your hip.',
      ],
      execution: [
        'Lower your hips toward the floor under control without touching down.',
        'Drive them back up until your body is a straight line again.',
        'Squeeze at the top for a moment, then repeat. Finish one side before switching.',
      ],
    },
    breathing: 'Inhale as you lower, exhale as you lift.',
    cues: [
      'Stay on the side. The dip is straight down and straight up, not a twist.',
      'Stop the set when the top of the rep no longer reaches a straight line.',
    ],
    commonMistakes: [
      { mistake: 'Rotating toward the floor as the hips dip.', fix: 'Keep your top hip pointed at the ceiling throughout.' },
      { mistake: 'Resting the hip on the floor at the bottom.', fix: 'Stop a few centimetres short so tension never releases.' },
    ],
    demo: {
      keyframes: [
        { id: 'dipped', label: 'Hips dipped' },
        { id: 'lifted', label: 'Straight line' },
      ],
      loop: 'ping-pong',
    },
    tags: ['core', 'no-equipment'],
  },
];

/**
 * Trunk flexion performed hanging. Locked until a pull-up bar exists; kept here
 * in full so it works the day one does.
 */
export const HANGING_CORE_EXERCISES: Exercise[] = [
  {
    id: 'hanging-knee-raise',
    name: 'Hanging Knee Raise',
    category: 'core',
    movementPattern: 'core-flexion',
    family: 'hanging-core',
    primaryMuscles: ['abs', 'hip-flexors'],
    secondaryMuscles: ['forearms', 'obliques'],
    equipment: ['pullup-bar'],
    difficulty: 3,
    beginnerSuitability: 'suitable',
    measurement: 'reps',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 6, max: 12 }, restSeconds: 75 },
    progressionLevel: 1,
    regression: null,
    progression: 'hanging-leg-raise',
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
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'core',
    movementPattern: 'core-flexion',
    family: 'hanging-core',
    primaryMuscles: ['abs', 'hip-flexors'],
    secondaryMuscles: ['forearms', 'obliques', 'quads'],
    equipment: ['pullup-bar'],
    difficulty: 4,
    beginnerSuitability: 'with-caution',
    measurement: 'reps',
    prescription: { sets: { min: 3, max: 4 }, target: { min: 5, max: 10 }, restSeconds: 90 },
    progressionLevel: 2,
    regression: 'hanging-knee-raise',
    progression: null,
    summary: 'The same raise with straight legs, roughly doubling the leverage the abs must overcome.',
    instructions: {
      setup: [
        'Hang from the bar with straight arms and your shoulder blades pulled down.',
        'Point your toes and squeeze your legs together.',
      ],
      execution: [
        'Raise your straight legs until they are at least parallel to the floor.',
        'Curl your pelvis under at the top.',
        'Lower slowly all the way to a dead hang without swinging.',
      ],
    },
    breathing: 'Exhale as you raise, inhale on the way down.',
    cues: [
      'Bend the knees slightly if your hamstrings limit the range.',
      'The descent is where the strength is. Do not drop the legs.',
    ],
    commonMistakes: [
      { mistake: 'Swinging between reps.', fix: 'Pause in a dead hang for a full second before each rep.' },
      { mistake: 'Stopping well below parallel.', fix: 'Return to knee raises until you can reach parallel cleanly.' },
    ],
    safetyNotes: [
      'Check the bar takes your weight before hanging from it.',
      'Lower yourself under control rather than dropping off the bar.',
    ],
    demo: {
      keyframes: [
        { id: 'hang', label: 'Dead hang' },
        { id: 'top', label: 'Legs parallel' },
      ],
      loop: 'ping-pong',
    },
    tags: ['core', 'grip', 'advanced'],
  },
];
