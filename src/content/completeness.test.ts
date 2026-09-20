import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import type { Exercise } from '../domain/exercise';

/**
 * A field-by-field audit of the library.
 *
 * The schema proves each field is *present* and well-typed. This proves each
 * field was actually written: a one-word summary, a single cue or a placeholder
 * name all pass the schema and are all useless to someone standing in their
 * living room trying to do the exercise.
 *
 * Each test reports every offending id at once, so a failure is a work list.
 */
const offenders = (predicate: (e: Exercise) => boolean): string[] =>
  EXERCISES.filter(predicate).map((e) => e.id);

describe('every exercise is fully written', () => {
  it('has a human name distinct from its id', () => {
    expect(offenders((e) => e.name.length < 3 || e.name === e.id)).toEqual([]);
  });

  it('has a summary that says something', () => {
    expect(offenders((e) => e.summary.trim().length < 25)).toEqual([]);
  });

  it('describes all seven parts of the starting position', () => {
    const thin = (e: Exercise) =>
      Object.values(e.startingPosition).some((slot) => slot.trim().length < 12);
    expect(offenders(thin)).toEqual([]);
  });

  it('has at least three movement steps', () => {
    expect(offenders((e) => e.steps.length < 3)).toEqual([]);
  });

  it('writes every step as a real sentence', () => {
    expect(offenders((e) => e.steps.some((s) => s.trim().length < 15))).toEqual([]);
  });

  it('says when to inhale and when to exhale', () => {
    const thin = (e: Exercise) =>
      e.breathing.inhale.trim().length < 10 || e.breathing.exhale.trim().length < 10;
    expect(offenders(thin)).toEqual([]);
  });

  it('names the muscles that should be working', () => {
    expect(offenders((e) => e.sensation.working.trim().length < 20)).toEqual([]);
  });

  it('never presents pain as a normal sensation', () => {
    const paintedAsNormal = (e: Exercise) =>
      [e.sensation.working, ...e.sensation.alsoNormal].some((s) =>
        /sharp|pinch|stabbing|shooting/i.test(s),
      );
    expect(offenders(paintedAsNormal)).toEqual([]);
  });

  it('lists at least one sensation that means stop', () => {
    expect(offenders((e) => e.sensation.notNormal.length < 1)).toEqual([]);
  });

  it('explains normal effort and normal fatigue', () => {
    const thin = (e: Exercise) =>
      e.safety.normalEffort.trim().length < 12 || e.safety.normalFatigue.trim().length < 12;
    expect(offenders(thin)).toEqual([]);
  });

  it('says what pain is concerning, when to stop, and how to modify', () => {
    const thin = (e: Exercise) =>
      e.safety.concerningPain.length < 1 ||
      e.safety.stopIf.length < 1 ||
      e.safety.modifyIf.length < 1;
    expect(offenders(thin)).toEqual([]);
  });

  it('keeps coaching cues short enough to remember mid-set', () => {
    expect(offenders((e) => e.cues.some((c) => c.length > 45))).toEqual([]);
  });

  it('gives a tempo wherever the movement is counted in reps', () => {
    const counted = (e: Exercise) =>
      e.measurement === 'reps' || e.measurement === 'reps-per-side';
    expect(offenders((e) => counted(e) && e.tempo === undefined)).toEqual([]);
  });

  it('gives at least two coaching cues', () => {
    expect(offenders((e) => e.cues.length < 2)).toEqual([]);
  });

  it('gives at least two common mistakes', () => {
    expect(offenders((e) => e.commonMistakes.length < 2)).toEqual([]);
  });

  it('pairs every mistake with a fix that is not a restatement', () => {
    const bad = (e: Exercise) =>
      e.commonMistakes.some(
        (m) => m.mistake.trim().length < 15 || m.fix.trim().length < 15 || m.mistake === m.fix,
      );
    expect(offenders(bad)).toEqual([]);
  });

  it('names at least one primary muscle', () => {
    expect(offenders((e) => e.primaryMuscles.length < 1)).toEqual([]);
  });

  it('never lists the same muscle as both primary and secondary', () => {
    const overlap = (e: Exercise) =>
      e.secondaryMuscles.some((m) => e.primaryMuscles.includes(m));
    expect(offenders(overlap)).toEqual([]);
  });

  it('carries at least one tag', () => {
    expect(offenders((e) => e.tags.length < 1)).toEqual([]);
  });

  it('describes a demonstration with at least two distinctly labelled keyframes', () => {
    const bad = (e: Exercise) => {
      const labels = e.demo.keyframes.map((k) => k.label);
      return labels.length < 2 || new Set(labels).size !== labels.length;
    };
    expect(offenders(bad)).toEqual([]);
  });

  it('captions every keyframe so the picture is never the only explanation', () => {
    const bad = (e: Exercise) => e.demo.keyframes.some((k) => k.caption.trim().length < 15);
    expect(offenders(bad)).toEqual([]);
  });

  it('prescribes a sensible dose', () => {
    const bad = (e: Exercise) => {
      const { sets, target, restSeconds } = e.prescription;
      return sets.min < 1 || target.min < 1 || restSeconds > 300;
    };
    expect(offenders(bad)).toEqual([]);
  });

  it('gives timed work a target in seconds, not a rep count', () => {
    const timed = (e: Exercise) => e.measurement === 'time' || e.measurement === 'time-per-side';
    const bad = (e: Exercise) => timed(e) && e.prescription.target.max < 10;
    expect(offenders(bad)).toEqual([]);
  });

  it('keeps rep targets in a plausible range', () => {
    const counted = (e: Exercise) => e.measurement === 'reps' || e.measurement === 'reps-per-side';
    const bad = (e: Exercise) => counted(e) && e.prescription.target.max > 30;
    expect(offenders(bad)).toEqual([]);
  });
});

describe('nothing in the library improvises a rig', () => {
  const allText = (e: Exercise) =>
    [
      e.summary,
      e.breathing.inhale,
      e.breathing.exhale,
      ...Object.values(e.startingPosition),
      ...e.steps,
      ...e.cues,
      ...e.commonMistakes.flatMap((m) => [m.mistake, m.fix]),
      ...e.safety.concerningPain,
      ...e.safety.stopIf,
      ...e.safety.modifyIf,
    ]
      .join(' ')
      .toLowerCase();

  // Every one of these is a real, commonly recommended improvisation that puts
  // bodyweight on something never designed to hold it.
  const BANNED = [
    'between two chairs',
    'across two chairs',
    'broom',
    'mop handle',
    'door knob',
    'doorknob',
    'door handle',
    'hang from a door',
    'hang from the door',
    'under a table',
    'table edge',
    'banister',
  ];

  it.each(BANNED.map((phrase) => [phrase] as const))(
    'never tells you to use %s',
    (phrase: string) => {
      const found = EXERCISES.filter((e) => {
        const text = allText(e);
        // A safety note warning *against* the thing is the point, not a breach.
        const warnsAgainst = [
          ...e.safety.stopIf,
          ...e.safety.modifyIf,
          ...e.safety.concerningPain,
        ]
          .join(' ')
          .toLowerCase()
          .includes(phrase);
        return text.includes(phrase) && !warnsAgainst;
      });
      expect(found.map((e) => e.id)).toEqual([]);
    },
  );

  it('only ever stands on furniture that a safety note tells you to test first', () => {
    const onFurniture = EXERCISES.filter((e) => e.equipment.includes('chair'));
    expect(onFurniture.length).toBeGreaterThan(0);

    const untested = onFurniture.filter(
      (e) => !allText(e).match(/slide|shift|stead|test it|load it|cannot move|brace/),
    );
    expect(untested.map((e) => e.id)).toEqual([]);
  });
});
