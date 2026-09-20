import type { Exercise } from '../../domain/exercise';
import {
  PRONE_ARMS_OVERHEAD,
  PRONE_ARMS_SIDE,
  PRONE_ARMS_SIDE_LIFTED,
  PRONE_Y_LIFTED,
  SUPERMAN,
} from '../poses';

/**
 * Floor-based upper-back work for an athlete with nothing to hang from.
 *
 * Honestly labelled throughout: these are not pulls. Lying face down and
 * lifting your arms loads the weight of your arms and nothing else. They keep
 * the upper back working and the shoulders healthy between now and a bar; they
 * do not build a pull-up, and no amount of them will.
 */
const NOT_A_PULL =
  'You are hoping this builds a pull-up: it will not. This is not a substitute for pulling — '
  + 'it loads the weight of your arms, not your bodyweight. A bar is the only fix.';

const PRONE_PAIN = [
  'Pinching or compression in the lower back rather than muscular effort.',
  'Sharp pain between the shoulder blades as opposed to a working ache.',
  'Any tingling or numbness down the arms.',
];

const STOP_RULES = [
  'Anything sharp, stabbing or electric.',
  'Lower back discomfort that builds rather than easing.',
  'You can no longer keep your neck relaxed.',
];

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
    summary: 'Squeezing the shoulder blades together while lying face down. The smallest honest back drill available without a bar.',
    startingPosition: {
      hands: 'Palms down on the floor, arms out to the sides at shoulder height.',
      feet: 'Relaxed, toes pointing behind you, legs straight and still.',
      body: 'Flat on the floor, fully relaxed apart from the upper back.',
      spine: 'Neutral and resting on the floor; nothing should lift.',
      head: 'Forehead resting on the floor, neck completely relaxed.',
      shoulders: 'Starting position is relaxed and spread apart.',
      hips: 'Flat on the floor and staying there.',
    },
    steps: [
      'Lie face down with your arms out to the sides at shoulder height, palms down.',
      'Rest your forehead on the floor and let your neck go slack.',
      'Without lifting your arms at all, squeeze your shoulder blades together and down.',
      'Hold the squeeze for a full two seconds.',
      'Release slowly and let the shoulder blades spread apart again.',
      'Pause for a moment before the next rep so each squeeze starts from relaxed.',
    ],
    breathing: {
      inhale: 'As you release and the shoulder blades spread.',
      exhale: 'As you squeeze the shoulder blades together.',
    },
    tempo: {
      phases: [
        { label: 'Squeeze', seconds: 1 },
        { label: 'Hold', seconds: 2 },
        { label: 'Release', seconds: 2 },
      ],
    },
    sensation: {
      working: 'The muscles between your shoulder blades, in a small area in the middle of your upper back.',
      alsoNormal: [
        'Very little sensation at first. This is a small movement.',
        'A mild ache between the shoulder blades after a few sets.',
      ],
      notNormal: PRONE_PAIN,
    },
    commonMistakes: [
      { mistake: 'Shrugging the shoulders toward the ears.', fix: 'Pull the shoulder blades down toward your back pockets as you squeeze.' },
      { mistake: 'Lifting the chest instead of moving the shoulder blades.', fix: 'Keep your chest on the floor and isolate the squeeze.' },
      { mistake: 'Rushing so the squeeze never actually happens.', fix: 'Hold each squeeze for two full seconds before releasing.' },
    ],
    cues: ['Blades to your back pockets.', 'Nothing lifts.', 'Relax your neck.'],
    safety: {
      normalEffort: 'Very light. This is a technique drill, not a strength set.',
      normalFatigue: 'A mild ache between the shoulder blades, nothing more.',
      concerningPain: PRONE_PAIN,
      stopIf: STOP_RULES,
      modifyIf: [
        'You cannot feel anything: lower the arms slightly and squeeze harder for longer.',
        'Your neck tenses: rest your forehead on a folded towel.',
        NOT_A_PULL,
      ],
    },
    demo: {
      scene: 'floor',
      keyframes: [
        { id: 'relaxed', label: 'Relaxed', caption: 'Lying flat, shoulder blades spread apart.', pose: PRONE_ARMS_SIDE },
        { id: 'squeezed', label: 'Squeezed', caption: 'Shoulder blades pulled together and down, nothing lifted.', pose: PRONE_ARMS_SIDE_LIFTED },
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
    startingPosition: {
      hands: 'Extended overhead in a wide Y, thumbs pointing up toward the ceiling.',
      feet: 'Relaxed, legs straight and still on the floor.',
      body: 'Flat on the floor, hips pressed down.',
      spine: 'Neutral. The lower back should not arch when the arms lift.',
      head: 'Forehead on the floor, neck relaxed.',
      shoulders: 'Set down away from your ears before anything lifts.',
      hips: 'Pressed into the floor and staying there for the whole set.',
    },
    steps: [
      'Lie face down with your arms extended overhead in a wide Y, thumbs up.',
      'Rest your forehead on the floor and press your hips down.',
      'Squeeze your shoulder blades down toward your back pockets.',
      'Lift both arms a few centimetres off the floor, keeping the Y shape.',
      'Hold the top for two seconds without letting your lower back arch.',
      'Lower slowly under control until your hands touch the floor.',
    ],
    breathing: {
      inhale: 'As you lower the arms.',
      exhale: 'As you lift.',
    },
    tempo: {
      phases: [
        { label: 'Lift', seconds: 1 },
        { label: 'Hold', seconds: 2 },
        { label: 'Lower', seconds: 2 },
      ],
      note: 'Height is not the point. A small lift with the shoulder blades engaged beats a big lift without.',
    },
    sensation: {
      working: 'The lower traps, in a band running down and in from the shoulder blades.',
      alsoNormal: [
        'The back of the shoulders working.',
        'A mild ache in the upper back the next day.',
      ],
      notNormal: PRONE_PAIN,
    },
    commonMistakes: [
      { mistake: 'Arching the lower back to get the arms higher.', fix: 'Press your hips into the floor and lift the arms less.' },
      { mistake: 'Shrugging so the neck does the work.', fix: 'Set the shoulder blades down first, then lift.' },
      { mistake: 'Turning the palms down.', fix: 'Keep the thumbs pointing up, which puts the shoulder in a safer position.' },
    ],
    cues: ['Thumbs up.', 'Hips stay down.', 'Lift small, squeeze hard.'],
    safety: {
      normalEffort: 'Light to moderate. It should feel easy in the arms and awkward in the upper back.',
      normalFatigue: 'A clear ache between and below the shoulder blades.',
      concerningPain: PRONE_PAIN,
      stopIf: STOP_RULES,
      modifyIf: [
        'Your lower back complains: put a folded towel under your hips.',
        'You feel it only in the neck: lower the arms into more of a Y and squeeze the blades down before lifting.',
        NOT_A_PULL,
      ],
    },
    demo: {
      scene: 'floor',
      keyframes: [
        { id: 'down', label: 'Start', caption: 'Arms overhead in a Y, hands resting on the floor.', pose: PRONE_ARMS_OVERHEAD },
        { id: 'up', label: 'Lifted', caption: 'Arms raised a few centimetres, hips still pressed down.', pose: PRONE_Y_LIFTED },
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
    startingPosition: {
      hands: 'Palms down by your sides, close to your hips.',
      feet: 'Relaxed, legs straight and still.',
      body: 'Flat on the floor with the hips pressed down.',
      spine: 'Neutral, no arching when the arms lift.',
      head: 'Forehead on the floor, neck relaxed.',
      shoulders: 'Set down away from the ears before the first sweep.',
      hips: 'Pressed into the floor for the whole set.',
    },
    steps: [
      'Lie face down with your arms by your sides, palms down.',
      'Lift both arms slightly off the floor and keep them off for the whole set.',
      'Sweep them out and overhead until your thumbs nearly meet above your head.',
      'Sweep them back down to your sides along exactly the same path.',
      'Keep the arms hovering throughout; touching down ends the set.',
      'Stop as soon as the arms drag on the floor.',
    ],
    breathing: {
      inhale: 'As the arms return to your sides.',
      exhale: 'As the arms travel overhead.',
    },
    tempo: {
      phases: [
        { label: 'Sweep overhead', seconds: 4 },
        { label: 'Sweep back', seconds: 4 },
      ],
      note: 'Slow is the point. Speed lets momentum carry the arms and the upper back does nothing.',
    },
    sensation: {
      working: 'The back of the shoulders and the muscles between the shoulder blades, burning as the arc goes on.',
      alsoNormal: [
        'A burn that builds quickly even though the load is tiny.',
        'The upper back tiring long before the arms do.',
      ],
      notNormal: PRONE_PAIN,
    },
    commonMistakes: [
      { mistake: 'Resting the arms on the floor between sweeps.', fix: 'Reduce the reps so you can keep them hovering the whole set.' },
      { mistake: 'Rushing, so momentum carries the arms.', fix: 'Slow to a four-second sweep each way and feel the upper back working.' },
      { mistake: 'Lifting the chest to help the arms travel.', fix: 'Keep the chest down and let the arms do the moving.' },
    ],
    cues: ['Arms never touch down.', 'Four seconds each way.', 'Hips stay down.'],
    safety: {
      normalEffort: 'Moderate. The burn arrives faster than the tiny load suggests.',
      normalFatigue: 'A strong burn across the upper back and rear shoulders.',
      concerningPain: PRONE_PAIN,
      stopIf: STOP_RULES,
      modifyIf: [
        'Your shoulders catch near the overhead position: reduce the range and stop where it is smooth.',
        'Your lower back aches: put a folded towel under your hips.',
        NOT_A_PULL,
      ],
    },
    demo: {
      scene: 'floor',
      keyframes: [
        { id: 'sides', label: 'Arms at sides', caption: 'Hands hovering beside the hips.', pose: PRONE_ARMS_SIDE_LIFTED },
        { id: 'overhead', label: 'Arms overhead', caption: 'Swept overhead, still hovering clear of the floor.', pose: PRONE_Y_LIFTED },
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
    startingPosition: {
      hands: 'Extended overhead, arms straight, thumbs up.',
      feet: 'Legs straight and together, toes pointed behind you.',
      body: 'Flat on the floor, long from fingertips to toes.',
      spine: 'Neutral at the start; it will extend gently as you lift.',
      head: 'Forehead on the floor, and staying in line with the spine once you lift.',
      shoulders: 'Set down away from the ears.',
      hips: 'Flat on the floor. They stay down; only the limbs and chest lift.',
    },
    steps: [
      'Lie face down with your arms extended overhead and your legs straight.',
      'Squeeze your glutes first, before anything moves.',
      'Lift your arms, chest and legs off the floor at the same time.',
      'Reach long in both directions rather than trying to lift high.',
      'Keep your gaze at the floor so your neck stays in line with your spine.',
      'Hold for the target time, breathing steadily.',
      'Lower everything together at the end of the hold.',
    ],
    breathing: {
      inhale: 'Shallow and steady through the hold.',
      exhale: 'Shallow and steady through the hold.',
      note: 'Holding your breath here spikes pressure in the lower back. Keep breathing even if it feels awkward.',
    },
    sensation: {
      working: 'The whole back of the body: lower back, glutes and hamstrings, with the upper back helping.',
      alsoNormal: [
        'A strong ache across the lower back and glutes.',
        'The hold becoming difficult well before 40 seconds at first.',
      ],
      notNormal: [
        'Pinching or compression in the lower back rather than muscular effort.',
        'Any tingling down the legs.',
        'Neck strain from craning to look forward.',
      ],
    },
    commonMistakes: [
      { mistake: 'Cranking the head back to lift higher.', fix: 'Keep your gaze down and let the height come from the mid-back.' },
      { mistake: 'Lifting the legs with the lower back only.', fix: 'Squeeze your glutes before you lift, and keep them squeezed.' },
      { mistake: 'Holding your breath through the whole hold.', fix: 'Breathe shallowly and continuously, even if it feels odd.' },
    ],
    cues: ['Squeeze your glutes first.', 'Reach long, not high.', 'Look at the floor.'],
    safety: {
      normalEffort: 'Moderate to hard. The lower back tires quickly at first.',
      normalFatigue: 'A deep ache across the lower back and glutes that fades within a minute of stopping.',
      concerningPain: [
        'Compression or pinching in the lower back.',
        'Any tingling, numbness or shooting sensation down the legs.',
      ],
      stopIf: [
        'You feel pinching rather than muscular effort.',
        'Anything travels down a leg.',
        'You cannot keep breathing through the hold.',
      ],
      modifyIf: [
        'Your lower back pinches: lift only the arms, keeping the legs down, until it is comfortable.',
        'Your neck tires: rest your forehead lightly rather than lifting your head.',
        NOT_A_PULL,
      ],
    },
    demo: {
      scene: 'floor',
      keyframes: [
        { id: 'flat', label: 'Start', caption: 'Lying flat, arms overhead, legs long.', pose: PRONE_ARMS_OVERHEAD },
        { id: 'lifted', label: 'Hold', caption: 'Arms, chest and legs lifted, gaze down, hips on the floor.', pose: SUPERMAN },
      ],
      loop: 'ping-pong',
    },
    tags: ['no-equipment', 'posterior-chain', 'not-a-pull'],
  },
];
