import type { Weekday } from '../domain/primitives';
import type { Workout } from '../domain/workout';

/**
 * The foundation program: four sessions a week, 20 to 30 minutes each, nothing
 * but the floor, a wall and a chair.
 *
 * **Why these four days.** Monday and Tuesday are back to back, so they cannot
 * both load the same tissue. Day 1 is upper-body pressing, Day 2 is legs, and
 * the two sit beside each other without competing. Thursday and Saturday then
 * have a full rest day in front of them, which is where the harder pressing and
 * the full-body session go.
 *
 * **Why the doses look conservative.** He presses 10 clean push-ups, so a set
 * of 6 to 10 is roughly 70 to 100 percent of a maximum effort set. Three sets
 * of that, four days a week, is already a real weekly load for someone with no
 * training history. The programme is built to be repeatable in week six, not
 * impressive in week one.
 *
 * **What is deliberately absent.** No dips beyond the chair version, because he
 * has none. No vertical pulling at all, because there is no bar: Day 3 leans on
 * floor-based upper-back work, which maintains posture and shoulder health and
 * is labelled throughout as not being a pull. And no handstand work: it is a
 * skill built over years and belongs on its own time, not inside a 26-minute
 * beginner session. The pathway is there to follow whenever he wants it.
 *
 * Nothing here adapts. Progression is the next sprint's job.
 */

const WEEK = 1;

const day1: Workout = {
  id: 'foundation-w1-d1',
  name: 'Push and Core',
  day: 'monday' satisfies Weekday,
  kind: 'training',
  weekIndex: WEEK,
  focus: 'push',
  estimatedMinutes: 26,
  notes:
    'The first session of the week, on fresh shoulders. Stop every set two reps short of the point where form breaks.',
  warmUp: [
    {
      exerciseId: 'cat-cow',
      sets: 1,
      measurement: 'reps',
      target: { min: 8, max: 10 },
      restSeconds: 0,
      cue: 'Start from the tailbone.',
    },
    {
      exerciseId: 'wall-angel',
      sets: 1,
      measurement: 'reps',
      target: { min: 8, max: 10 },
      restSeconds: 15,
      cue: 'Everything stays on the wall.',
    },
    {
      exerciseId: 'prone-scapular-retraction',
      sets: 1,
      measurement: 'reps',
      target: { min: 8, max: 12 },
      restSeconds: 15,
      cue: 'Blades to your back pockets.',
    },
  ],
  mainWork: [
    {
      exerciseId: 'push-up',
      sets: 3,
      measurement: 'reps',
      target: { min: 6, max: 10 },
      restSeconds: 75,
      cue: 'Squeeze your glutes.',
      note: 'Your best set is 10. Working at 6 to 10 leaves you a rep or two in reserve, which is the point.',
    },
    {
      exerciseId: 'bench-dip-bent-knee',
      sets: 3,
      measurement: 'reps',
      target: { min: 8, max: 12 },
      restSeconds: 60,
      cue: 'Shoulders down.',
      note: 'Your entry into dipping. Brace the chair against a wall before the first rep.',
    },
    {
      exerciseId: 'front-plank',
      sets: 3,
      measurement: 'time',
      target: { min: 20, max: 45 },
      restSeconds: 45,
      cue: 'Tuck your tailbone.',
      note: 'Untested, so treat the first session as the test. End each hold when the hips drop.',
    },
    {
      exerciseId: 'knee-side-plank',
      sets: 2,
      measurement: 'time-per-side',
      target: { min: 15, max: 30 },
      restSeconds: 45,
      cue: 'Stack the hips.',
    },
  ],
  mobility: [
    {
      exerciseId: 'prone-chest-opener',
      sets: 1,
      measurement: 'time-per-side',
      target: { min: 30, max: 45 },
      restSeconds: 20,
      cue: 'Relax completely.',
    },
    {
      exerciseId: 'kneeling-hip-flexor-stretch',
      sets: 1,
      measurement: 'time-per-side',
      target: { min: 30, max: 45 },
      restSeconds: 20,
      cue: 'Tuck the tailbone.',
    },
  ],
};

const day2: Workout = {
  id: 'foundation-w1-d2',
  name: 'Legs and Mobility',
  day: 'tuesday' satisfies Weekday,
  kind: 'training',
  weekIndex: WEEK,
  focus: 'lower-body',
  estimatedMinutes: 26,
  notes:
    'Straight after a pressing day on purpose: nothing here competes with yesterday, so both sessions get fresh muscle.',
  warmUp: [
    {
      exerciseId: 'ankle-circles',
      sets: 1,
      measurement: 'reps-per-side',
      target: { min: 8, max: 10 },
      restSeconds: 15,
      cue: 'Hold the shin still.',
      note: 'Ankle range decides your squat depth more than leg strength does.',
    },
    {
      exerciseId: 'cat-cow',
      sets: 1,
      measurement: 'reps',
      target: { min: 8, max: 10 },
      restSeconds: 0,
      cue: 'Three seconds each way.',
    },
    {
      exerciseId: 'ninety-ninety-hip-switch',
      sets: 1,
      measurement: 'reps',
      target: { min: 6, max: 8 },
      restSeconds: 20,
      cue: 'Sit tall.',
    },
  ],
  mainWork: [
    {
      exerciseId: 'bodyweight-squat',
      sets: 3,
      measurement: 'reps',
      target: { min: 12, max: 16 },
      restSeconds: 60,
      cue: 'Knees out.',
      note: 'Your best set is 12, so this range asks you to hold quality across three sets rather than chase one.',
    },
    {
      exerciseId: 'reverse-lunge',
      sets: 3,
      measurement: 'reps-per-side',
      target: { min: 6, max: 8 },
      restSeconds: 60,
      cue: 'Step straight back.',
      note: 'Your first single-leg work. Expect the balance to be worse than the strength.',
    },
    {
      exerciseId: 'glute-bridge',
      sets: 3,
      measurement: 'reps',
      target: { min: 12, max: 16 },
      restSeconds: 45,
      cue: 'Squeeze at the top.',
      note: 'Squats are quad-dominant and there is no rowing without a bar, so this is where the back of your body gets trained.',
    },
  ],
  mobility: [
    {
      exerciseId: 'deep-squat-hold',
      sets: 2,
      measurement: 'time',
      target: { min: 30, max: 45 },
      restSeconds: 30,
      cue: 'Relax into it.',
    },
    {
      exerciseId: 'standing-hamstring-sweep',
      sets: 1,
      measurement: 'reps-per-side',
      target: { min: 8, max: 10 },
      restSeconds: 20,
      cue: 'Flat back.',
    },
  ],
};

const day3: Workout = {
  id: 'foundation-w1-d3',
  name: 'Upper Body and Core',
  day: 'thursday' satisfies Weekday,
  kind: 'training',
  weekIndex: WEEK,
  focus: 'upper-body',
  estimatedMinutes: 27,
  notes:
    'The back-focused day. None of the pulling work here builds a pull-up, and it is not pretending to; it keeps your shoulders healthy and your posture honest until you have a bar.',
  warmUp: [
    {
      exerciseId: 'wall-angel',
      sets: 1,
      measurement: 'reps',
      target: { min: 8, max: 10 },
      restSeconds: 15,
      cue: 'Ribs down.',
    },
    {
      exerciseId: 'prone-scapular-retraction',
      sets: 1,
      measurement: 'reps',
      target: { min: 8, max: 12 },
      restSeconds: 15,
      cue: 'Nothing lifts.',
    },
    {
      exerciseId: 'cat-cow',
      sets: 1,
      measurement: 'reps',
      target: { min: 8, max: 10 },
      restSeconds: 0,
      cue: 'Move the middle of your back.',
    },
  ],
  mainWork: [
    {
      exerciseId: 'prone-y-raise',
      sets: 3,
      measurement: 'reps',
      target: { min: 8, max: 12 },
      restSeconds: 45,
      cue: 'Lift small, squeeze hard.',
      note: 'This is not a pull. It trains the lower traps, which sitting switches off.',
    },
    {
      exerciseId: 'reverse-snow-angel',
      sets: 2,
      measurement: 'reps',
      target: { min: 6, max: 8 },
      restSeconds: 45,
      cue: 'Arms never touch down.',
    },
    {
      exerciseId: 'knee-push-up',
      sets: 3,
      measurement: 'reps',
      target: { min: 10, max: 14 },
      restSeconds: 60,
      cue: 'Hips over knees.',
      note: 'Deliberately easier than Monday. Use it to accumulate clean volume, not to test yourself.',
    },
    {
      exerciseId: 'dead-bug',
      sets: 2,
      measurement: 'reps-per-side',
      target: { min: 6, max: 8 },
      restSeconds: 45,
      cue: 'Back stays flat.',
    },
  ],
  mobility: [
    {
      exerciseId: 'open-book-rotation',
      sets: 1,
      measurement: 'reps-per-side',
      target: { min: 6, max: 8 },
      restSeconds: 20,
      cue: 'Knees stay down.',
    },
    {
      exerciseId: 'thread-the-needle',
      sets: 1,
      measurement: 'reps-per-side',
      target: { min: 6, max: 8 },
      restSeconds: 20,
      cue: 'Hips stay over the knees.',
    },
  ],
};

const day4: Workout = {
  id: 'foundation-w1-d4',
  name: 'Full Body',
  day: 'saturday' satisfies Weekday,
  kind: 'training',
  weekIndex: WEEK,
  focus: 'full-body',
  estimatedMinutes: 26,
  notes:
    'A rest day in front of it, so this is the strongest session of the week. Handstand work is deliberately not here — it is a skill to train on its own time, not something to squeeze into 26 minutes.',
  warmUp: [
    {
      exerciseId: 'cat-cow',
      sets: 1,
      measurement: 'reps',
      target: { min: 8, max: 10 },
      restSeconds: 0,
      cue: 'Start from the tailbone.',
    },
    {
      exerciseId: 'ankle-circles',
      sets: 1,
      measurement: 'reps-per-side',
      target: { min: 8, max: 8 },
      restSeconds: 15,
      cue: 'Biggest circle possible.',
    },
    {
      exerciseId: 'ninety-ninety-hip-switch',
      sets: 1,
      measurement: 'reps',
      target: { min: 6, max: 6 },
      restSeconds: 20,
      cue: 'Slow rotation.',
    },
  ],
  mainWork: [
    {
      exerciseId: 'push-up',
      sets: 3,
      measurement: 'reps',
      target: { min: 6, max: 8 },
      restSeconds: 75,
      cue: 'Elbows back, not out.',
      note: 'Lower than Monday on purpose. This is the second pressing day of the week, not a repeat of the first.',
    },
    {
      exerciseId: 'bodyweight-squat',
      sets: 3,
      measurement: 'reps',
      target: { min: 12, max: 15 },
      restSeconds: 60,
      cue: 'Chest up.',
    },
    {
      exerciseId: 'single-leg-glute-bridge',
      sets: 2,
      measurement: 'reps-per-side',
      target: { min: 8, max: 10 },
      restSeconds: 45,
      cue: 'Hips stay level.',
    },
    {
      exerciseId: 'knee-side-plank',
      sets: 2,
      measurement: 'time-per-side',
      target: { min: 15, max: 30 },
      restSeconds: 45,
      cue: 'Stack the hips.',
      note: 'The front plank trains the front of the trunk; this trains the sides, which it never touches.',
    },
  ],
  mobility: [
    {
      exerciseId: 'kneeling-hip-flexor-stretch',
      sets: 1,
      measurement: 'time-per-side',
      target: { min: 30, max: 45 },
      restSeconds: 20,
      cue: 'Small shift, big stretch.',
    },
    {
      exerciseId: 'standing-hamstring-sweep',
      sets: 1,
      measurement: 'reps-per-side',
      target: { min: 8, max: 8 },
      restSeconds: 20,
      cue: 'Hinge from the hip.',
    },
  ],
};

export const PROGRAM: Workout[] = [day1, day2, day3, day4];

/** The workout scheduled for a given weekday, if any. */
export const workoutForDay = (day: Weekday): Workout | undefined =>
  PROGRAM.find((workout) => workout.day === day);

/** The days the program trains on, in week order. */
export const PROGRAM_DAYS: Weekday[] = PROGRAM.flatMap((workout) =>
  workout.day === null ? [] : [workout.day],
);
