import { describe, expect, it } from 'vitest';
import {
  interpolatePose,
  jointTravel,
  largestMover,
  mirrorPose,
  poseSchema,
  type Pose,
} from './pose';

const standing: Pose = {
  head: { x: 50, y: 14 },
  shoulder: { x: 50, y: 26 },
  elbow: { x: 50, y: 40 },
  hand: { x: 50, y: 54 },
  hip: { x: 50, y: 54 },
  knee: { x: 50, y: 71 },
  ankle: { x: 50, y: 88 },
  toe: { x: 58, y: 88 },
};

const squatting: Pose = {
  ...standing,
  head: { x: 52, y: 40 },
  shoulder: { x: 52, y: 50 },
  hip: { x: 46, y: 72 },
  knee: { x: 56, y: 74 },
};

describe('poseSchema', () => {
  it('accepts a pose with all eight joints', () => {
    expect(poseSchema.parse(standing)).toEqual(standing);
  });

  it('rejects a pose missing a joint', () => {
    const { toe: _toe, ...incomplete } = standing;
    expect(poseSchema.safeParse(incomplete).success).toBe(false);
  });

  it('rejects a joint placed far outside the drawing box', () => {
    expect(poseSchema.safeParse({ ...standing, head: { x: 500, y: 14 } }).success).toBe(false);
  });
});

describe('jointTravel', () => {
  it('is zero for a joint that does not move', () => {
    expect(jointTravel(standing, squatting, 'toe')).toBe(0);
  });

  it('measures how far a joint moved', () => {
    expect(jointTravel(standing, squatting, 'head')).toBeCloseTo(Math.hypot(2, 26), 5);
  });
});

describe('largestMover', () => {
  it('finds the joint that travels furthest between two poses', () => {
    expect(largestMover(standing, squatting)).toBe('head');
  });
});

describe('interpolatePose', () => {
  it('returns the start pose at t=0', () => {
    expect(interpolatePose(standing, squatting, 0)).toEqual(standing);
  });

  it('returns the end pose at t=1', () => {
    expect(interpolatePose(standing, squatting, 1)).toEqual(squatting);
  });

  it('lands halfway at t=0.5', () => {
    expect(interpolatePose(standing, squatting, 0.5).head).toEqual({ x: 51, y: 27 });
  });

  it('interpolates the spine curve too', () => {
    const rounded = { ...standing, spineBend: 10 };
    const arched = { ...standing, spineBend: -10 };
    expect(interpolatePose(rounded, arched, 0.5).spineBend).toBe(0);
  });

  it('treats a missing spine curve as straight', () => {
    expect(interpolatePose(standing, { ...standing, spineBend: 8 }, 0.5).spineBend).toBe(4);
  });

  it('clamps out-of-range values instead of overshooting', () => {
    expect(interpolatePose(standing, squatting, 2)).toEqual(squatting);
    expect(interpolatePose(standing, squatting, -1)).toEqual(standing);
  });
});

describe('mirrorPose', () => {
  it('flips horizontally around the centre line', () => {
    expect(mirrorPose(standing).toe).toEqual({ x: 42, y: 88 });
  });

  it('leaves vertical positions alone', () => {
    expect(mirrorPose(standing).head.y).toBe(14);
  });

  it('is its own inverse', () => {
    expect(mirrorPose(mirrorPose(squatting))).toEqual(squatting);
  });

  it('keeps a rounded back rounded when mirrored', () => {
    expect(mirrorPose({ ...standing, spineBend: 9 }).spineBend).toBe(9);
  });
});
