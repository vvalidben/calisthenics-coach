import type { Exercise } from '../../domain/exercise';
import {
  BENCH_DIP_BOTTOM,
  BENCH_DIP_STRAIGHT_BOTTOM,
  BENCH_DIP_STRAIGHT_TOP,
  BENCH_DIP_TOP,
  PARALLEL_DIP_BOTTOM,
  PARALLEL_DIP_TOP,
} from '../poses';

const DIP_PAIN = [
  'A sharp pinch at the front of the shoulder, especially at the bottom.',
  'Pain inside the elbow joint rather than effort in the triceps.',
  'Pain in the wrist joint rather than a stretch across the front of it.',
];

const STOP_RULES = [
  'Anything sharp, stabbing or electric.',
  'Pain that grows rep by rep instead of easing.',
  'Your shoulders roll forward at the bottom and you cannot pull them back.',
];

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
    summary: 'The entry point to dipping: feet close, knees bent, most of the weight still on the legs.',
    startingPosition: {
      hands: 'On the front edge of the seat beside your hips, fingers pointing forward over the edge.',
      feet: 'Flat on the floor, close to the chair, knees bent to about 90 degrees.',
      body: 'Upright and close to the chair, hips just in front of the seat edge.',
      spine: 'Tall and neutral, chest lifted rather than collapsed forward.',
      head: 'Neutral, eyes forward.',
      shoulders: 'Pulled down hard away from your ears. This is the whole safety of the exercise.',
      hips: 'Just off the front of the seat, brushing the edge on the way down.',
    },
    steps: [
      'Brace the chair against a wall and sit on the front edge with your hands beside your hips.',
      'Slide your hips forward off the seat, keeping them close to the edge.',
      'Bend your knees and plant your feet flat on the floor near the chair.',
      'Set your shoulders down away from your ears and lift your chest.',
      'Bend your elbows straight back and lower your hips toward the floor.',
      'Stop when your upper arms are roughly parallel to the floor.',
      'Press through your palms until your elbows are straight again.',
    ],
    rangeOfMotion:
      'Down until your upper arms are roughly parallel to the floor, and no further. Depth past parallel loads the shoulder joint rather than the triceps.',
    breathing: {
      inhale: 'As you lower your hips.',
      exhale: 'As you press back up to straight arms.',
    },
    tempo: {
      phases: [
        { label: 'Lower', seconds: 2 },
        { label: 'Pause', seconds: 1 },
        { label: 'Press', seconds: 1 },
      ],
    },
    sensation: {
      working: 'The triceps, at the back of the upper arms.',
      alsoNormal: [
        'A stretch across the front of the shoulders at the bottom.',
        'Pressure through the heels of your hands.',
      ],
      notNormal: DIP_PAIN,
    },
    commonMistakes: [
      { mistake: 'Shoulders shrug up toward the ears.', fix: 'Set them down and back before the first rep and hold them there.' },
      { mistake: 'Hips drift forward away from the chair.', fix: 'Keep your back brushing the seat edge the whole way down.' },
      { mistake: 'Going far below parallel to chase depth.', fix: 'Stop at parallel. Deeper loads the shoulder joint, not the triceps.' },
    ],
    cues: ['Shoulders down.', 'Stay close to the chair.', 'Elbows straight back.'],
    safety: {
      normalEffort: 'Moderate. The legs are taking a good share of the load here.',
      normalFatigue: 'A burn at the back of the upper arms in the last few reps.',
      concerningPain: DIP_PAIN,
      stopIf: [...STOP_RULES, 'The chair shifts underneath you.'],
      modifyIf: [
        'Your shoulders feel stretched or pinched: shorten the range and stop higher.',
        'Your wrists ache: turn your hands slightly outward, or grip the seat edge instead of pressing flat.',
      ],
    },
    demo: {
      scene: 'chair',
      keyframes: [
        { id: 'start', label: 'Start', caption: 'Arms straight, hips just off the seat, knees bent.', pose: BENCH_DIP_TOP },
        { id: 'bottom', label: 'Bottom', caption: 'Elbows bent to parallel, hips close to the chair.', pose: BENCH_DIP_BOTTOM },
        { id: 'end', label: 'Press up', caption: 'Back to straight arms with the shoulders still down.', pose: BENCH_DIP_TOP },
      ],
      loop: 'cycle',
    },
    tags: ['beginner', 'triceps', 'furniture'],
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
    startingPosition: {
      hands: 'On the front edge of the seat beside your hips, fingers pointing forward.',
      feet: 'Walked out until your legs are straight, only your heels touching the floor.',
      body: 'Upright torso with the legs extended forward, hips just off the seat edge.',
      spine: 'Tall and neutral, chest up.',
      head: 'Neutral, eyes forward.',
      shoulders: 'Pulled down away from your ears throughout.',
      hips: 'Close to the chair, brushing the edge as they travel down.',
    },
    steps: [
      'Brace the chair against a wall and set up as for a bent-knee bench dip.',
      'Load the chair with your weight before you move your feet, because straight legs pull it toward you.',
      'Walk your feet out until your legs are straight and only your heels touch the floor.',
      'Set your shoulders down and lift your chest.',
      'Bend your elbows straight back and lower your hips.',
      'Stop when your upper arms reach roughly parallel to the floor.',
      'Press back up to straight arms without snapping the elbows.',
    ],
    rangeOfMotion:
      'Stop at parallel, exactly as in the bent-knee version. Straight legs add load, not depth.',
    breathing: {
      inhale: 'On the way down.',
      exhale: 'As you press back up.',
    },
    tempo: {
      phases: [
        { label: 'Lower', seconds: 2 },
        { label: 'Pause', seconds: 1 },
        { label: 'Press', seconds: 1 },
      ],
      note: 'The further out your heels, the harder the rep. Move them out a few centimetres at a time across sessions.',
    },
    sensation: {
      working: 'The triceps, carrying much more of your bodyweight than the bent-knee version.',
      alsoNormal: [
        'A strong stretch across the front of the shoulders at the bottom.',
        'Your abs working to keep your legs and torso in position.',
      ],
      notNormal: DIP_PAIN,
    },
    commonMistakes: [
      { mistake: 'Dropping far below parallel to chase depth.', fix: 'Stop at parallel; deeper loads the shoulder joint rather than the triceps.' },
      { mistake: 'Bouncing out of the bottom.', fix: 'Pause for a beat at the bottom of every rep.' },
      { mistake: 'Shoulders rolling forward as fatigue sets in.', fix: 'End the set when you can no longer hold them down and back.' },
    ],
    cues: ['Shoulders down.', 'Stop at parallel.', 'Pause at the bottom.'],
    safety: {
      normalEffort: 'Hard. Expect noticeably fewer reps than with bent knees.',
      normalFatigue: 'Triceps burning strongly and arms shaking on the last rep.',
      concerningPain: DIP_PAIN,
      stopIf: [...STOP_RULES, 'The chair slides or tips at any point.'],
      modifyIf: [
        'Your shoulders feel stretched at the bottom: shorten the range considerably.',
        'You cannot manage 6 clean reps: bend your knees slightly and bring your feet closer.',
      ],
    },
    demo: {
      scene: 'chair',
      keyframes: [
        { id: 'start', label: 'Start', caption: 'Arms straight, legs extended, heels on the floor.', pose: BENCH_DIP_STRAIGHT_TOP },
        { id: 'bottom', label: 'Bottom', caption: 'Upper arms parallel to the floor, hips near the chair.', pose: BENCH_DIP_STRAIGHT_BOTTOM },
        { id: 'end', label: 'Press up', caption: 'Back to straight arms, shoulders still packed down.', pose: BENCH_DIP_STRAIGHT_TOP },
      ],
      loop: 'cycle',
    },
    tags: ['triceps', 'furniture'],
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
    startingPosition: {
      hands: 'Gripping both bars with straight arms, wrists stacked directly over the bars.',
      feet: 'Off the floor with your ankles crossed behind you.',
      body: 'Hanging in a straight-arm support with a slight forward lean.',
      spine: 'Neutral with the ribs pulled down; do not let the lower back arch.',
      head: 'Neutral, eyes forward and slightly down.',
      shoulders: 'Pressed down hard away from your ears. If they rise, you are not ready for reps yet.',
      hips: 'Under your shoulders, body held as one piece rather than swinging.',
    },
    steps: [
      'Grip both bars and press up to a support hold with straight arms.',
      'Pull your shoulders down away from your ears and brace your abs.',
      'Lean your torso forward slightly and cross your ankles behind you.',
      'Bend your elbows and lower yourself under control, keeping them close to your body.',
      'Stop when your upper arms reach roughly parallel to the bars.',
      'Press back up to a straight-arm support hold.',
      'Reset the shoulder position before the next rep.',
    ],
    rangeOfMotion:
      'Down until your upper arms reach roughly parallel to the bars. Build depth over months; the bottom of a dip is the most vulnerable position in the library.',
    breathing: {
      inhale: 'As you descend.',
      exhale: 'Hard through the press back up.',
    },
    tempo: {
      phases: [
        { label: 'Lower', seconds: 3 },
        { label: 'Pause', seconds: 1 },
        { label: 'Press', seconds: 1 },
      ],
      note: 'Never drop into the bottom. A slow descent is what protects the shoulder here.',
    },
    sensation: {
      working: 'The chest and triceps together, with the lean deciding which does more.',
      alsoNormal: [
        'A strong stretch across the chest at the bottom.',
        'Grip and forearms working to hold the bars.',
      ],
      notNormal: [
        'A sharp pinch at the front of the shoulder.',
        'A feeling of the shoulder slipping or moving where it should not.',
        'Pain in the collarbone area.',
      ],
    },
    commonMistakes: [
      { mistake: 'Shoulders roll forward and up at the bottom.', fix: 'Shorten the range and keep the shoulders packed down throughout.' },
      { mistake: 'Kipping with the legs to get out of the bottom.', fix: 'Reduce the reps and use slow negatives instead.' },
      { mistake: 'Attempting reps before owning the support hold.', fix: 'Build to a 20-second straight-arm support hold first.' },
    ],
    cues: ['Shoulders down.', 'Lower slowly.', 'Stop at parallel.'],
    safety: {
      normalEffort: 'Very hard. This is the most demanding press in the library.',
      normalFatigue: 'Chest and triceps burning, grip tiring, arms shaking near the end.',
      concerningPain: [
        'A sharp pinch at the front of the shoulder.',
        'Any sense of instability or slipping in the shoulder joint.',
      ],
      stopIf: [
        'Anything sharp in the shoulder, at any depth.',
        'Your shoulders rise toward your ears and will not come back down.',
        'You can no longer control the descent.',
      ],
      modifyIf: [
        'You cannot hold a 20-second support: train only that hold until you can.',
        'The bottom pinches: stop well above parallel and add depth over months.',
        'You have no parallel bars: stay on bench dips, which is where this library expects you to be.',
      ],
    },
    demo: {
      scene: 'bar',
      keyframes: [
        { id: 'start', label: 'Support hold', caption: 'Straight arms, shoulders pressed down, ankles crossed.', pose: PARALLEL_DIP_TOP },
        { id: 'bottom', label: 'Bottom', caption: 'Upper arms parallel to the bars, slight forward lean.', pose: PARALLEL_DIP_BOTTOM },
        { id: 'end', label: 'Press up', caption: 'Back to the support hold without shrugging.', pose: PARALLEL_DIP_TOP },
      ],
      loop: 'cycle',
    },
    tags: ['upper-body', 'goal'],
  },
];
