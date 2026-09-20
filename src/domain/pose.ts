import { z } from 'zod';

/**
 * A side-on stick figure, described by eight joints in a 100x100 box with the
 * floor at y=88 and y increasing downward.
 *
 * Poses are data, not drawings. One renderer draws any pose, so all sixty
 * exercises look like one set, poses can be shared between exercises that use
 * the same shape, and a keyframe sequence can be checked by a test rather than
 * eyeballed.
 */
export const pointSchema = z.object({
  x: z.number().min(-10).max(110),
  y: z.number().min(-10).max(110),
});
export type Point = z.infer<typeof pointSchema>;

export const JOINTS = [
  'head',
  'shoulder',
  'elbow',
  'hand',
  'hip',
  'knee',
  'ankle',
  'toe',
] as const;
export const jointSchema = z.enum(JOINTS);
export type Joint = z.infer<typeof jointSchema>;

export const poseSchema = z.object({
  head: pointSchema,
  shoulder: pointSchema,
  elbow: pointSchema,
  hand: pointSchema,
  hip: pointSchema,
  knee: pointSchema,
  ankle: pointSchema,
  toe: pointSchema,
  /**
   * Curvature of the spine between shoulder and hip. Positive rounds the back
   * (cat), negative arches it (cow), absent is straight. A straight line cannot
   * show the difference, and for spinal mobility work the difference is the
   * whole exercise.
   */
  spineBend: z.number().min(-20).max(20).optional(),
});
export type Pose = z.infer<typeof poseSchema>;

/** Props the figure is drawn against, so a position reads in context. */
export const SCENES = ['floor', 'wall', 'chair', 'bar', 'low-bar', 'none'] as const;
export const sceneSchema = z.enum(SCENES);
export type Scene = z.infer<typeof sceneSchema>;

export const FLOOR_Y = 88;

/** Straight-line distance between two joints in a pose. */
export const distance = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

/**
 * How far a joint travels between two poses. The renderer uses the largest
 * mover to decide where to draw the direction arrow.
 */
export const jointTravel = (from: Pose, to: Pose, joint: Joint): number =>
  distance(from[joint], to[joint]);

export const largestMover = (from: Pose, to: Pose): Joint =>
  JOINTS.reduce((best, joint) =>
    jointTravel(from, to, joint) > jointTravel(from, to, best) ? joint : best,
  );

/** Linear interpolation between two poses, used to animate the sequence. */
export const interpolatePose = (from: Pose, to: Pose, t: number): Pose => {
  const clamped = Math.min(1, Math.max(0, t));
  const lerp = (a: Point, b: Point): Point => ({
    x: a.x + (b.x - a.x) * clamped,
    y: a.y + (b.y - a.y) * clamped,
  });
  // A straight spine is expressed by the field being absent, so an
  // interpolation between two straight poses must stay absent rather than
  // becoming an explicit zero.
  const bendless = from.spineBend === undefined && to.spineBend === undefined;
  const fromBend = from.spineBend ?? 0;
  const toBend = to.spineBend ?? 0;
  return {
    ...(bendless ? {} : { spineBend: fromBend + (toBend - fromBend) * clamped }),
    head: lerp(from.head, to.head),
    shoulder: lerp(from.shoulder, to.shoulder),
    elbow: lerp(from.elbow, to.elbow),
    hand: lerp(from.hand, to.hand),
    hip: lerp(from.hip, to.hip),
    knee: lerp(from.knee, to.knee),
    ankle: lerp(from.ankle, to.ankle),
    toe: lerp(from.toe, to.toe),
  };
};

/** Mirror a pose left-to-right, so one pose serves both facing directions. */
export const mirrorPose = (pose: Pose): Pose => {
  const flip = (p: Point): Point => ({ x: 100 - p.x, y: p.y });
  return {
    ...pose,
    head: flip(pose.head),
    shoulder: flip(pose.shoulder),
    elbow: flip(pose.elbow),
    hand: flip(pose.hand),
    hip: flip(pose.hip),
    knee: flip(pose.knee),
    ankle: flip(pose.ankle),
    toe: flip(pose.toe),
  };
};
