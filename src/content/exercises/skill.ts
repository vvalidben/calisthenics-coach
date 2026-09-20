import type { Exercise } from '../../domain/exercise';

const INVERSION_SAFETY = [
  'Warm your wrists up before any weight-bearing on the hands.',
  'Train near a clear wall with nothing behind you to fall onto.',
  'Come down the way you went up; never collapse onto your head or neck.',
];

/** The handstand ladder. The athlete cannot currently hold a handstand. */
export const SKILL_EXERCISES: Exercise[] = [
  {
    id: 'plank-to-pike-hold',
    name: 'Plank to Pike Hold',
    category: 'skill',
    movementPattern: 'isometric-hold',
    family: 'handstand',
    primaryMuscles: ['front-delts', 'abs'],
    secondaryMuscles: ['wrists', 'traps', 'hamstrings'],
    equipment: ['floor'],
    difficulty: 2,
    beginnerSuitability: 'ideal',
    measurement: 'time',
    prescription: { sets: { min: 3, max: 3 }, target: { min: 20, max: 40 }, restSeconds: 60 },
    progressionLevel: 1,
    regression: null,
    progression: 'handstand-back-to-wall',
    summary: 'A straight-arm hold that teaches the hands to carry weight and the shoulders to open.',
    instructions: {
      setup: [
        'Start in a push-up position with straight arms, hands under your shoulders.',
        'Spread your fingers wide and grip the floor.',
      ],
      execution: [
        'Walk your feet toward your hands and lift your hips into a pike.',
        'Push the floor away so your shoulders open toward your ears.',
        'Hold the pike for the target time, keeping your arms locked straight.',
      ],
    },
    breathing: 'Breathe steadily; do not brace so hard you hold your breath.',
    cues: [
      'Push the floor away rather than sinking into your shoulders.',
      'Bend your knees if your hamstrings limit the hip height.',
    ],
    commonMistakes: [
      { mistake: 'Elbows bend, so the shoulders never load.', fix: 'Lock your elbows and reduce the hold time.' },
      { mistake: 'Shoulders stay closed, keeping weight in the feet.', fix: 'Shift more weight over your hands until your shoulders stack over your wrists.' },
    ],
    safetyNotes: INVERSION_SAFETY,
    demo: {
      keyframes: [
        { id: 'plank', label: 'Plank' },
        { id: 'pike', label: 'Pike' },
      ],
      loop: 'ping-pong',
    },
    tags: ['handstand', 'wrists', 'skill'],
  },
  {
    id: 'handstand-back-to-wall',
    name: 'Handstand, Back to Wall',
    category: 'skill',
    movementPattern: 'isometric-hold',
    family: 'handstand',
    primaryMuscles: ['front-delts', 'abs'],
    secondaryMuscles: ['wrists', 'traps', 'glutes'],
    equipment: ['wall', 'floor'],
    difficulty: 3,
    beginnerSuitability: 'with-caution',
    measurement: 'time',
    prescription: { sets: { min: 3, max: 4 }, target: { min: 15, max: 40 }, restSeconds: 90 },
    progressionLevel: 2,
    regression: 'plank-to-pike-hold',
    progression: null,
    summary: 'An inverted hold with your feet walked up a wall, building time upside down safely.',
    instructions: {
      setup: [
        'Sit with your back to a clear stretch of wall and mark where your hands should go.',
        'Place your hands on the floor and put your feet on the wall behind you.',
      ],
      execution: [
        'Walk your feet up the wall while walking your hands closer to it.',
        'Stop when your body is roughly vertical and your shoulders stack over your wrists.',
        'Hold for the target time, then walk back down the same way.',
      ],
    },
    breathing: 'Breathe steadily throughout; this is a hold, not a brace.',
    cues: [
      'Squeeze your glutes and point your toes to stay in one line.',
      'Push tall through your shoulders; do not sag into them.',
    ],
    commonMistakes: [
      { mistake: 'Ribs flare and the back arches into a banana shape.', fix: 'Tuck your ribs down and squeeze your glutes.' },
      { mistake: 'Hands too far from the wall, so the hold is really a plank.', fix: 'Walk your hands in until your body is close to vertical.' },
    ],
    safetyNotes: INVERSION_SAFETY,
    demo: {
      keyframes: [
        { id: 'start', label: 'Feet low' },
        { id: 'vertical', label: 'Vertical' },
      ],
      loop: 'ping-pong',
    },
    tags: ['handstand', 'skill', 'goal'],
  },
];
