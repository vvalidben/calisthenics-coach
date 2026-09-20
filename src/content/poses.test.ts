import { describe, expect, it } from 'vitest';
import { distance, poseSchema, type Pose } from '../domain/pose';
import * as POSES from './poses';
import { EXERCISES } from './catalog';

const named = Object.entries(POSES).filter(
  (entry): entry is [string, Pose] => typeof entry[1] === 'object' && entry[1] !== null,
);

/**
 * The poses are several hundred hand-entered coordinates. A typo produces a
 * figure with a forearm longer than its leg, which no schema would catch and
 * which nobody would notice until they opened that one exercise.
 *
 * These check the skeleton is a plausible human in every pose.
 */
const SEGMENTS = [
  { name: 'upper arm', from: 'shoulder', to: 'elbow', min: 8, max: 26 },
  { name: 'forearm', from: 'elbow', to: 'hand', min: 8, max: 26 },
  { name: 'torso', from: 'shoulder', to: 'hip', min: 18, max: 40 },
  { name: 'thigh', from: 'hip', to: 'knee', min: 12, max: 32 },
  { name: 'shin', from: 'knee', to: 'ankle', min: 10, max: 30 },
  { name: 'foot', from: 'ankle', to: 'toe', min: 3, max: 14 },
  { name: 'neck', from: 'shoulder', to: 'head', min: 6, max: 20 },
] as const;

describe('the pose library', () => {
  it('exports poses at all', () => {
    expect(named.length).toBeGreaterThan(40);
  });

  it.each(named)('%s is a valid pose', (_name, pose) => {
    expect(() => poseSchema.parse(pose)).not.toThrow();
  });

  it.each(SEGMENTS.map((s) => [s.name, s] as const))(
    'draws a plausible %s in every pose',
    (_name, segment) => {
      const wrong = named.flatMap(([name, pose]) => {
        const length = distance(pose[segment.from], pose[segment.to]);
        return length < segment.min || length > segment.max
          ? [`${name}: ${length.toFixed(1)}`]
          : [];
      });
      expect(wrong).toEqual([]);
    },
  );

  it('keeps every joint inside the drawing box', () => {
    const outside = named.flatMap(([name, pose]) =>
      Object.entries(pose)
        .filter(([, v]) => typeof v === 'object')
        .filter(([, v]) => {
          const p = v as { x: number; y: number };
          return p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100;
        })
        .map(([joint]) => `${name}.${joint}`),
    );
    expect(outside).toEqual([]);
  });

  it('never sinks a joint through the floor', () => {
    const sunk = named.flatMap(([name, pose]) =>
      Object.entries(pose)
        .filter(([, v]) => typeof v === 'object')
        .filter(([, v]) => (v as { y: number }).y > 89)
        .map(([joint]) => `${name}.${joint}`),
    );
    expect(sunk).toEqual([]);
  });

  it('keeps limb lengths consistent from pose to pose', () => {
    // The same skeleton is drawn every time, so a thigh should not be twice as
    // long in one pose as in another.
    for (const segment of SEGMENTS) {
      const lengths = named.map(([, pose]) => distance(pose[segment.from], pose[segment.to]));
      const min = Math.min(...lengths);
      const max = Math.max(...lengths);
      expect(max / min, `${segment.name} varies too much between poses`).toBeLessThan(2.6);
    }
  });
});

describe('every demonstration', () => {
  it('moves between its keyframes, unless the exercise genuinely does not move', () => {
    // A hold has one position by definition. The scapular pull moves the body
    // a few centimetres, which a stick figure with fixed limb lengths cannot
    // depict at all -- its caption says so rather than the drawing implying a
    // movement that is not visible.
    const CANNOT_SHOW_MOVEMENT = new Set(['scapular-pull']);

    const still = EXERCISES.filter((exercise) => {
      if (exercise.movementPattern === 'isometric-hold') return false;
      if (CANNOT_SHOW_MOVEMENT.has(exercise.id)) return false;
      const distinct = new Set(exercise.demo.keyframes.map((f) => JSON.stringify(f.pose)));
      return distinct.size < 2;
    });
    expect(still.map((e) => e.id)).toEqual([]);
  });

  it('tells the reader when the drawing cannot show the movement', () => {
    const scapular = EXERCISES.find((e) => e.id === 'scapular-pull');
    const captions = scapular?.demo.keyframes.map((f) => f.caption).join(' ') ?? '';
    expect(captions).toMatch(/cannot show|too little/i);
  });

  it('draws a scene the exercise could plausibly be performed in', () => {
    const barOnFloor = EXERCISES.filter(
      (e) => e.equipment.includes('pullup-bar') && e.demo.scene === 'floor',
    );
    expect(barOnFloor.map((e) => e.id)).toEqual([]);
  });

  it('names alignment guides that refer to real joints', () => {
    const joints = new Set(['head', 'shoulder', 'elbow', 'hand', 'hip', 'knee', 'ankle', 'toe']);
    const bad = EXERCISES.filter(
      (e) => e.demo.alignment !== undefined && e.demo.alignment.some((j) => !joints.has(j)),
    );
    expect(bad.map((e) => e.id)).toEqual([]);
  });
});
