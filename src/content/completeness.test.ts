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

  it('has setup instructions', () => {
    expect(offenders((e) => e.instructions.setup.length < 1)).toEqual([]);
  });

  it('has at least three execution steps', () => {
    expect(offenders((e) => e.instructions.execution.length < 3)).toEqual([]);
  });

  it('writes every instruction as a real sentence', () => {
    const shortSteps = (e: Exercise) =>
      [...e.instructions.setup, ...e.instructions.execution].some((s) => s.trim().length < 15);
    expect(offenders(shortSteps)).toEqual([]);
  });

  it('explains the breathing pattern', () => {
    expect(offenders((e) => e.breathing.trim().length < 20)).toEqual([]);
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
      e.breathing,
      ...e.instructions.setup,
      ...e.instructions.execution,
      ...e.cues,
      ...e.commonMistakes.flatMap((m) => [m.mistake, m.fix]),
      ...(e.safetyNotes ?? []),
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
        const warnsAgainst = (e.safetyNotes ?? [])
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
      (e) =>
        !(e.safetyNotes ?? [])
          .join(' ')
          .toLowerCase()
          .match(/slide|shift|stead|test it|load it|cannot move|cannot slide/),
    );
    expect(untested.map((e) => e.id)).toEqual([]);
  });
});
