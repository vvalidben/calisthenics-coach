import type { Workout, WorkoutItem } from '../domain/workout';

/**
 * Optional restorative routines, offered rather than scheduled.
 *
 * These are not a fifth workout. Every set is held rather than driven, nothing
 * is counted toward progression, and finishing one should leave you looser than
 * you started. That is why they carry no warm-up, no rep targets to chase and
 * generous rest: the work *is* the rest.
 *
 * They are deliberately short, and mostly a single set of each position. Six
 * minutes on a rest day, done often, beats a thirty-minute session done once.
 */

const hold = (
  exerciseId: string,
  seconds: { min: number; max: number },
  cue: string,
  perSide = false,
  sets = 1,
): WorkoutItem => ({
  exerciseId,
  sets,
  measurement: perSide ? 'time-per-side' : 'time',
  target: seconds,
  restSeconds: 20,
  cue,
});

const move = (
  exerciseId: string,
  reps: { min: number; max: number },
  cue: string,
  perSide = false,
  sets = 1,
): WorkoutItem => ({
  exerciseId,
  sets,
  measurement: perSide ? 'reps-per-side' : 'reps',
  target: reps,
  restSeconds: 20,
  cue,
});

const routine = (
  id: string,
  name: string,
  minutes: number,
  notes: string,
  items: WorkoutItem[],
): Workout => ({
  id,
  name,
  day: null,
  kind: 'mobility',
  weekIndex: 1,
  focus: 'mobility',
  estimatedMinutes: minutes,
  notes,
  warmUp: [],
  mainWork: items,
  mobility: [],
});

export const ROUTINES: Workout[] = [
  routine(
    'mobility-shoulders',
    'Shoulders',
    5,
    'For the day after pressing, or any day you have been at a desk. Nothing here should feel like training.',
    [
      move('wall-angel', { min: 8, max: 10 }, 'Everything stays on the wall.'),
      move('towel-shoulder-dislocate', { min: 6, max: 8 }, 'Elbows locked, go slow at the back.'),
      hold('prone-chest-opener', { min: 40, max: 60 }, 'Relax completely.', true),
    ],
  ),
  routine(
    'mobility-thoracic',
    'Thoracic Spine',
    6,
    'The part of your back that stops moving first when you sit. Breathe into each position rather than forcing it.',
    [
      move('cat-cow', { min: 8, max: 12 }, 'Move the middle of your back.'),
      move('thread-the-needle', { min: 6, max: 8 }, 'Hips stay over the knees.', true),
      move('open-book-rotation', { min: 6, max: 8 }, 'Knees stay down.', true),
    ],
  ),
  routine(
    'mobility-hips',
    'Hips',
    6,
    'The one that pays off most if you sit for a living. Settle into each position and let it soften.',
    [
      move('ninety-ninety-hip-switch', { min: 6, max: 10 }, 'Sit tall, move slowly.'),
      hold('kneeling-hip-flexor-stretch', { min: 40, max: 60 }, 'Tuck the tailbone first.', true),
      hold('deep-squat-hold', { min: 45, max: 60 }, 'Relax into it.', false, 2),
    ],
  ),
  routine(
    'mobility-hamstrings',
    'Hamstrings',
    7,
    'Do this warm rather than cold: after a walk, a shower, or at the end of a session.',
    [
      move('standing-hamstring-sweep', { min: 8, max: 12 }, 'Flat back, no bouncing.', true),
      move('worlds-greatest-stretch', { min: 4, max: 6 }, 'Three parts, three breaths.', true),
      hold('seated-pike-fold', { min: 45, max: 60 }, 'Relax, do not pull.', false, 2),
    ],
  ),
  routine(
    'mobility-ankles',
    'Ankles',
    6,
    'The shortest routine here and the one that quietly decides your squat depth. Do it before leg days too.',
    [
      move('ankle-circles', { min: 8, max: 12 }, 'Biggest circle possible.', true),
      move('knee-to-wall-ankle-rock', { min: 8, max: 12 }, 'Heel stays down.', true),
      hold('kneeling-toe-stretch', { min: 30, max: 45 }, 'Hands control the intensity.', false, 2),
    ],
  ),
  routine(
    'mobility-reset',
    'Full Reset',
    9,
    'One drill from each area. The default if you do not want to choose, and the best use of ten minutes on a rest day.',
    [
      move('cat-cow', { min: 8, max: 12 }, 'Start from the tailbone.'),
      move('wall-angel', { min: 8, max: 10 }, 'Ribs down.'),
      move('ninety-ninety-hip-switch', { min: 6, max: 8 }, 'Sit tall.'),
      hold('deep-squat-hold', { min: 45, max: 60 }, 'Relax into it.'),
      move('standing-hamstring-sweep', { min: 8, max: 10 }, 'Flat back.', true),
      move('knee-to-wall-ankle-rock', { min: 8, max: 10 }, 'Heel stays down.', true),
    ],
  ),
];

export const routineById = (id: string): Workout | undefined =>
  ROUTINES.find((routine) => routine.id === id);
