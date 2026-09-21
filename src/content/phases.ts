import type { PhaseSpec } from '../domain/phase';
import type { PhaseName } from '../domain/profile';

/**
 * The long-term ladder: four phases, each ended by what the athlete can do
 * rather than by how long they have been in it.
 *
 * Every number here is content, deliberately. The evaluator in
 * `domain/phase.ts` knows how to measure consistency, technique, strength,
 * performance and recovery; it has no opinion about how much of each a phase
 * should ask for. Changing what Foundation demands is an edit to this file.
 *
 * Two rules the criteria have to respect:
 *
 * 1. **Nothing may need equipment the athlete does not have.** A criterion
 *    resting on a pull-up bar or parallel bars would lock the ladder shut for
 *    good. `phases.test.ts` enforces this against the seeded equipment.
 * 2. **Nothing may rest on time.** There is no minimum number of weeks in a
 *    phase anywhere in this file, and there is nowhere to put one.
 */
export const PHASES: PhaseSpec[] = [
  {
    name: 'foundation',
    ordinal: 1,
    title: 'Foundation',
    focus: 'Technique and consistency.',
    summary:
      'Learn the movements properly and turn up four times a week. Nothing here is about doing more — it is about the same work becoming repeatable.',
    next: 'strength-building',
    exit: {
      sessions: 12,
      consistency: 0.75,
      cleanRatio: 0.75,
      benchmarks: [
        {
          exerciseId: 'push-up',
          sets: 3,
          value: 10,
          measurement: 'reps',
          label: '3 sets of 10 push-ups',
        },
        {
          exerciseId: 'bodyweight-squat',
          sets: 3,
          value: 16,
          measurement: 'reps',
          label: '3 sets of 16 bodyweight squats',
        },
        {
          exerciseId: 'front-plank',
          sets: 3,
          value: 45,
          measurement: 'time',
          label: '3 planks of 45 seconds',
        },
      ],
      levels: [],
    },
  },
  {
    name: 'strength-building',
    ordinal: 2,
    title: 'Strength Development',
    focus: 'More volume, and harder versions of what you already do.',
    summary:
      'The same movements, loaded properly: slower push-ups, single-leg work, longer holds. Volume goes up before difficulty does.',
    next: 'intermediate',
    exit: {
      sessions: 16,
      consistency: 0.8,
      cleanRatio: 0.8,
      benchmarks: [
        {
          exerciseId: 'bench-dip-straight-leg',
          sets: 3,
          value: 10,
          measurement: 'reps',
          label: '3 sets of 10 straight-leg bench dips',
        },
      ],
      levels: [
        { family: 'push', level: 5, label: 'Push: tempo push-ups' },
        { family: 'squat', level: 4, label: 'Squat: reverse lunges' },
        { family: 'core', level: 5, label: 'Core: plank shoulder taps' },
      ],
    },
  },
  {
    name: 'intermediate',
    ordinal: 3,
    title: 'Intermediate Calisthenics',
    focus: 'Harder movement variations.',
    summary:
      'Where the exercises stop looking like beginner exercises: decline and archer push-ups, single-leg squats, hollow work, and the first honest handstand preparation.',
    next: 'skill-development',
    exit: {
      sessions: 20,
      consistency: 0.8,
      cleanRatio: 0.85,
      benchmarks: [
        {
          exerciseId: 'tempo-push-up',
          sets: 3,
          value: 8,
          measurement: 'reps',
          label: '3 sets of 8 tempo push-ups',
        },
      ],
      levels: [
        { family: 'push', level: 7, label: 'Push: decline push-ups' },
        { family: 'squat', level: 6, label: 'Squat: Bulgarian split squats' },
        { family: 'core', level: 6, label: 'Core: hollow body holds' },
        { family: 'handstand', level: 2, label: 'Handstand: plank to pike holds' },
      ],
    },
  },
  {
    name: 'skill-development',
    ordinal: 4,
    title: 'Skill Development',
    focus: 'Advanced calisthenics skills.',
    summary:
      'Handstands, levers and the strength that holds them. Skills are practised, not grinded: short, frequent, fresh.',
    next: null,
    exit: {
      sessions: 0,
      consistency: 0,
      cleanRatio: 0,
      benchmarks: [],
      levels: [],
    },
  },
];

export const phaseSpec = (name: PhaseName): PhaseSpec | undefined =>
  PHASES.find((phase) => phase.name === name);

/**
 * The spec for a phase, falling back to Foundation.
 *
 * `deload` is a stored phase name from Sprint 1 that the ladder never uses; an
 * athlete somehow sitting in it is treated as being in Foundation rather than
 * shown a screen with nothing on it.
 */
export const requirePhaseSpec = (name: PhaseName): PhaseSpec => phaseSpec(name) ?? PHASES[0]!;
