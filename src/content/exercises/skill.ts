import type { Exercise } from '../../domain/exercise';
import { PIKE_HOLD, PLANK_TOP, WALL_HANDSTAND } from '../poses';

const INVERSION_PAIN = [
  'Sharp pain in the wrist joint rather than a stretch across the front of it.',
  'Pain or pinching at the front of the shoulder.',
  'Headache, or a pounding feeling behind the eyes, which means the hold was too long.',
];

const INVERSION_STOP = [
  'Anything sharp in the wrists, shoulders or neck.',
  'Dizziness, or a pounding head.',
  'You can no longer control coming down.',
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
    startingPosition: {
      hands: 'Flat on the floor under your shoulders, fingers spread wide and gripping.',
      feet: 'Toes tucked, feet hip-width, walked in toward your hands.',
      body: 'An upside-down V, hips high, weight shifted toward the hands.',
      spine: 'Long, rounding slightly is fine; do not force a flat back.',
      head: 'Between your arms, looking back toward your feet.',
      shoulders: 'Open toward your ears, pushing the floor away.',
      hips: 'As high as your hamstrings allow, directly above or slightly behind your hands.',
    },
    steps: [
      'Warm your wrists up first with gentle circles and rocking.',
      'Start in a straight-arm plank with your hands under your shoulders.',
      'Spread your fingers wide and grip the floor.',
      'Walk your feet toward your hands and lift your hips into a pike.',
      'Push the floor away so your shoulders open toward your ears.',
      'Bend your knees if your hamstrings limit how high the hips go.',
      'Hold for the target time with your elbows locked straight, then walk back to a plank.',
    ],
    breathing: {
      inhale: 'Steadily through the hold.',
      exhale: 'Steadily through the hold.',
      note: 'Do not brace so hard that you stop breathing. This is a position, not a maximal effort.',
    },
    sensation: {
      working: 'The front of the shoulders, taking weight in an overhead position.',
      alsoNormal: [
        'A stretch across the front of the wrists.',
        'A hamstring stretch if your hips are high.',
      ],
      notNormal: INVERSION_PAIN,
    },
    commonMistakes: [
      { mistake: 'Elbows bend, so the shoulders never load.', fix: 'Lock your elbows and reduce the hold time.' },
      { mistake: 'Shoulders stay closed, keeping weight in the feet.', fix: 'Shift more weight over your hands until your shoulders stack over your wrists.' },
      { mistake: 'Forcing straight legs and losing the hip height.', fix: 'Bend your knees; hip height matters more than straight legs here.' },
    ],
    cues: ['Push the floor away.', 'Elbows locked.', 'Hips high, knees bent if needed.'],
    safety: {
      normalEffort: 'Moderate on the shoulders, and surprisingly demanding on the wrists.',
      normalFatigue: 'Shoulders burning and wrists feeling the load.',
      concerningPain: INVERSION_PAIN,
      stopIf: INVERSION_STOP,
      modifyIf: [
        'Your wrists hurt: hold the position on your fists, or on a rolled towel under your palms.',
        'Your hamstrings limit you: bend your knees as much as needed.',
      ],
    },
    demo: {
      scene: 'floor',
      keyframes: [
        { id: 'plank', label: 'Plank', caption: 'Straight-arm plank, hands under shoulders.', pose: PLANK_TOP },
        { id: 'pike', label: 'Pike hold', caption: 'Hips lifted high, shoulders open, elbows locked.', pose: PIKE_HOLD },
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
    startingPosition: {
      hands: 'Flat on the floor, shoulder-width apart, fingers spread and gripping, a hand’s length from the wall once you are up.',
      feet: 'Flat against the wall behind you, roughly at hip height or above.',
      body: 'Close to vertical, stacked from hands to feet.',
      spine: 'Neutral with the ribs pulled down. The banana shape is the thing to avoid.',
      head: 'Neutral between your arms; do not crane to look at the floor.',
      shoulders: 'Pushed tall toward your ears, stacked over your wrists.',
      hips: 'Stacked over your shoulders, squeezed by the glutes to stay in line.',
    },
    steps: [
      'Warm your wrists thoroughly and clear the space behind you.',
      'Sit with your back to the wall and mark where your heels are; that is roughly where your hands go.',
      'Place your hands on the floor and put your feet on the wall behind you.',
      'Walk your feet up the wall while walking your hands in closer to it.',
      'Stop when your body is roughly vertical and your shoulders stack over your wrists.',
      'Squeeze your glutes, pull your ribs down and push tall through your shoulders.',
      'Hold for the target time, then walk back down the same way you came up.',
    ],
    breathing: {
      inhale: 'Steadily through the hold.',
      exhale: 'Steadily through the hold.',
      note: 'Being upside down makes breathing feel odd. Keep it steady and keep the holds short at first.',
    },
    sensation: {
      working: 'The shoulders, holding your bodyweight overhead.',
      alsoNormal: [
        'A strong stretch and load through the wrists.',
        'Blood pressure in the head, mild and settling quickly once you come down.',
      ],
      notNormal: [...INVERSION_PAIN, 'Pain in the neck.'],
    },
    commonMistakes: [
      { mistake: 'Ribs flare and the back arches into a banana shape.', fix: 'Tuck your ribs down and squeeze your glutes.' },
      { mistake: 'Hands too far from the wall, so the hold is really a plank.', fix: 'Walk your hands in until your body is close to vertical.' },
      { mistake: 'Holding for too long on the first attempts.', fix: 'Start with 10 to 15 seconds and build up over weeks.' },
    ],
    cues: ['Ribs down.', 'Push tall.', 'Walk down, do not fall down.'],
    safety: {
      normalEffort: 'Hard on the shoulders and wrists.',
      normalFatigue: 'Shoulders burning, wrists loaded, and a mild head-rush on coming down.',
      concerningPain: INVERSION_PAIN,
      stopIf: [...INVERSION_STOP, 'Your wrists or shoulders start to give.'],
      modifyIf: [
        'Your wrists hurt: reduce the hold time, and spend a week on wrist preparation and pike holds first.',
        'You feel dizzy: come down immediately and use much shorter holds.',
        'You cannot walk far up the wall: hold where you are; a partial position still builds the shoulders.',
      ],
    },
    demo: {
      scene: 'wall',
      keyframes: [
        { id: 'start', label: 'Feet low', caption: 'Hands on the floor, feet low on the wall.', pose: PIKE_HOLD },
        { id: 'vertical', label: 'Vertical', caption: 'Walked up to near-vertical, shoulders over wrists, ribs down.', pose: WALL_HANDSTAND },
      ],
      loop: 'ping-pong',
      alignment: ['hand', 'toe'],
    },
    tags: ['handstand', 'skill', 'goal'],
  },
];
