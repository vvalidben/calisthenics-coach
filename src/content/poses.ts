import { FLOOR_Y, type Pose } from '../domain/pose';

/**
 * The shared pose vocabulary.
 *
 * Exercises reference these rather than carrying their own drawings, so a
 * push-up top and a plank hold are literally the same shape, and fixing one
 * figure fixes every exercise that uses it. Coordinates run 0-100 with the
 * floor at y=88 and y increasing downward. The figure faces right unless a
 * name says otherwise.
 */
/**
 * One skeleton, drawn in every pose.
 *
 * Poses are authored as approximate joint positions, but the builder keeps only
 * the *direction* of each segment and rebuilds it at a fixed length. Hand-typed
 * coordinates drift, and a figure with a forearm longer than its shin reads as
 * broken rather than as an exercise. `poses.test.ts` enforces the result.
 */
const SEGMENT = {
  torso: 26,
  neck: 12,
  upperArm: 15,
  forearm: 14,
  thigh: 18,
  shin: 18,
  foot: 7,
} as const;

type XY = { x: number; y: number };

const angleBetween = (from: XY, to: XY): number => Math.atan2(to.y - from.y, to.x - from.x);

const along = (from: XY, angle: number, length: number): XY => ({
  x: Math.round((from.x + Math.cos(angle) * length) * 10) / 10,
  y: Math.round((from.y + Math.sin(angle) * length) * 10) / 10,
});

/**
 * Slides a rebuilt pose back into frame: nothing below the floor, nothing off
 * the sides. Rebuilding at canonical lengths moves joints a little, and a foot
 * drawn through the floor line looks like a bug rather than an exercise.
 */
const fit = (joints: Record<string, XY>): Record<string, XY> => {
  const entries = Object.entries(joints);
  const xs = entries.map(([, j]) => j.x);
  const ys = entries.map(([, j]) => j.y);

  // A fully extended figure lying flat is nearly as wide as the whole box, so
  // scale before translating. Scaling is uniform, so proportions survive.
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  const scale = Math.min(1, 88 / Math.max(width, 1), 82 / Math.max(height, 1));

  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const scaled = entries.map(([name, j]) => [
    name,
    { x: cx + (j.x - cx) * scale, y: cy + (j.y - cy) * scale },
  ]) as [string, XY][];

  const sx = scaled.map(([, j]) => j.x);
  const sy = scaled.map(([, j]) => j.y);
  const dy = Math.min(0, FLOOR_Y - Math.max(...sy)) + Math.max(0, 4 - Math.min(...sy));
  const dx =
    Math.max(...sx) > 96 ? 96 - Math.max(...sx) : Math.min(...sx) < 4 ? 4 - Math.min(...sx) : 0;

  return Object.fromEntries(
    scaled.map(([name, j]) => [
      name,
      { x: Math.round((j.x + dx) * 10) / 10, y: Math.round((j.y + dy) * 10) / 10 },
    ]),
  );
};

const pose = (
  head: readonly [number, number],
  shoulder: readonly [number, number],
  elbow: readonly [number, number],
  hand: readonly [number, number],
  hip: readonly [number, number],
  knee: readonly [number, number],
  ankle: readonly [number, number],
  toe: readonly [number, number],
  spineBend?: number,
): Pose => {
  const draft = {
    head: { x: head[0], y: head[1] },
    shoulder: { x: shoulder[0], y: shoulder[1] },
    elbow: { x: elbow[0], y: elbow[1] },
    hand: { x: hand[0], y: hand[1] },
    hip: { x: hip[0], y: hip[1] },
    knee: { x: knee[0], y: knee[1] },
    ankle: { x: ankle[0], y: ankle[1] },
    toe: { x: toe[0], y: toe[1] },
  };

  const builtHip = draft.hip;
  const builtShoulder = along(builtHip, angleBetween(builtHip, draft.shoulder), SEGMENT.torso);
  const builtElbow = along(
    builtShoulder,
    angleBetween(draft.shoulder, draft.elbow),
    SEGMENT.upperArm,
  );
  const builtKnee = along(builtHip, angleBetween(builtHip, draft.knee), SEGMENT.thigh);
  const builtAnkle = along(builtKnee, angleBetween(draft.knee, draft.ankle), SEGMENT.shin);

  const built = {
    hip: builtHip,
    shoulder: builtShoulder,
    head: along(builtShoulder, angleBetween(draft.shoulder, draft.head), SEGMENT.neck),
    elbow: builtElbow,
    hand: along(builtElbow, angleBetween(draft.elbow, draft.hand), SEGMENT.forearm),
    knee: builtKnee,
    ankle: builtAnkle,
    toe: along(builtAnkle, angleBetween(draft.ankle, draft.toe), SEGMENT.foot),
  };

  return {
    ...(fit(built) as unknown as Pose),
    ...(spineBend === undefined ? {} : { spineBend }),
  };
};

// --- standing -------------------------------------------------------------

export const STAND = pose([50, 16], [50, 28], [50, 42], [50, 55], [50, 54], [50, 71], [50, 86], [57, 88]);
export const STAND_ARMS_FORWARD = pose([50, 16], [50, 28], [58, 36], [66, 42], [50, 54], [50, 71], [50, 86], [57, 88]);

export const SQUAT_BOTTOM = pose([58, 38], [56, 48], [62, 56], [68, 58], [42, 68], [58, 72], [48, 86], [56, 88]);
export const SQUAT_ASSISTED_BOTTOM = pose([58, 38], [56, 48], [66, 48], [76, 46], [42, 68], [58, 72], [48, 86], [56, 88]);
export const SQUAT_DEEP = pose([58, 46], [56, 55], [60, 64], [56, 70], [44, 76], [60, 72], [50, 86], [58, 88]);

export const SPLIT_TOP = pose([50, 16], [50, 28], [50, 42], [50, 55], [50, 54], [62, 70], [64, 86], [71, 88]);
export const SPLIT_BOTTOM = pose([50, 28], [50, 40], [50, 54], [50, 66], [50, 66], [64, 74], [64, 86], [71, 88]);
export const LUNGE_BACK_BOTTOM = pose([52, 26], [52, 38], [52, 52], [52, 64], [52, 64], [36, 82], [28, 88], [22, 88]);

export const PISTOL_BOTTOM = pose([56, 52], [54, 60], [62, 62], [70, 62], [42, 78], [56, 78], [48, 86], [56, 88]);
export const PISTOL_ASSISTED_BOTTOM = pose([56, 52], [54, 60], [66, 54], [78, 48], [42, 78], [56, 78], [48, 86], [56, 88]);

export const HINGE_BOTTOM = pose([72, 44], [64, 46], [62, 58], [60, 70], [44, 52], [46, 70], [48, 86], [56, 88]);
export const HAMSTRING_FOLD = pose([62, 50], [54, 52], [58, 64], [62, 76], [40, 58], [54, 72], [60, 86], [68, 86]);

// --- prone pressing -------------------------------------------------------

export const PLANK_TOP = pose([76, 52], [68, 58], [69, 73], [70, 88], [44, 66], [30, 74], [16, 84], [11, 88]);
export const PLANK_BOTTOM = pose([74, 68], [66, 74], [78, 80], [70, 88], [44, 76], [30, 81], [17, 86], [11, 88]);
export const PLANK_SHOULDER_TAP = pose([76, 52], [68, 58], [75, 62], [70, 57], [44, 66], [30, 74], [16, 84], [11, 88]);

export const KNEE_PLANK_TOP = pose([76, 52], [68, 58], [69, 73], [70, 88], [46, 68], [32, 86], [20, 78], [14, 74]);
export const KNEE_PLANK_BOTTOM = pose([74, 68], [66, 74], [78, 80], [70, 88], [46, 78], [32, 86], [20, 79], [14, 75]);

export const FOREARM_PLANK = pose([76, 58], [68, 62], [70, 88], [82, 88], [44, 68], [30, 76], [16, 85], [11, 88]);
export const KNEE_FOREARM_PLANK = pose([76, 58], [68, 62], [70, 88], [82, 88], [46, 70], [32, 86], [20, 79], [14, 75]);

export const INCLINE_TOP = pose([76, 38], [68, 44], [69, 55], [70, 66], [46, 58], [32, 70], [18, 84], [13, 88]);
export const INCLINE_BOTTOM = pose([74, 52], [66, 58], [78, 62], [70, 66], [46, 66], [32, 75], [18, 86], [13, 88]);

export const DECLINE_TOP = pose([78, 56], [70, 60], [71, 74], [72, 88], [46, 62], [32, 64], [20, 66], [15, 66]);
export const DECLINE_BOTTOM = pose([76, 72], [68, 76], [80, 82], [72, 88], [46, 72], [32, 70], [20, 67], [15, 66]);

export const WALL_PUSH_TOP = pose([44, 24], [42, 32], [62, 34], [84, 36], [34, 56], [30, 72], [26, 86], [33, 88]);
export const WALL_PUSH_BOTTOM = pose([58, 26], [54, 34], [64, 46], [84, 36], [44, 57], [36, 72], [28, 86], [35, 88]);

// --- prone floor work -----------------------------------------------------

export const PRONE_ARMS_OVERHEAD = pose([64, 84], [56, 86], [70, 86], [84, 86], [32, 87], [22, 88], [12, 88], [8, 88]);
export const PRONE_Y_LIFTED = pose([64, 83], [56, 85], [70, 80], [84, 74], [32, 87], [22, 88], [12, 88], [8, 88]);
export const PRONE_ARMS_SIDE = pose([64, 84], [56, 86], [62, 80], [68, 74], [32, 87], [22, 88], [12, 88], [8, 88]);
export const PRONE_ARMS_SIDE_LIFTED = pose([64, 82], [56, 84], [63, 76], [70, 68], [32, 87], [22, 88], [12, 88], [8, 88]);
export const SUPERMAN = pose([66, 76], [56, 80], [70, 76], [84, 72], [32, 85], [22, 82], [12, 78], [8, 76], -4);
export const PRONE_CHEST_ROLLED = pose([62, 80], [54, 77], [60, 82], [68, 85], [34, 82], [44, 73], [52, 83], [58, 86]);

// --- supine ---------------------------------------------------------------

export const SUPINE_TABLETOP = pose([22, 80], [30, 83], [30, 70], [30, 58], [54, 85], [58, 70], [72, 72], [78, 70]);
export const SUPINE_EXTENDED = pose([22, 80], [30, 83], [18, 76], [8, 70], [54, 85], [70, 78], [84, 82], [90, 80]);
export const HOLLOW_HOLD = pose([24, 74], [32, 78], [22, 72], [12, 66], [54, 84], [68, 78], [82, 72], [88, 70]);
export const HOLLOW_ROCK_BACK = pose([21, 76], [29, 80], [19, 74], [9, 68], [51, 85], [65, 80], [79, 75], [85, 73]);
export const HOLLOW_ROCK_FORWARD = pose([27, 72], [35, 76], [25, 70], [15, 64], [57, 82], [71, 76], [85, 69], [91, 67]);

export const BRIDGE_DOWN = pose([24, 80], [32, 83], [26, 86], [20, 88], [56, 85], [70, 74], [76, 88], [82, 88]);
export const BRIDGE_UP = pose([24, 80], [32, 83], [26, 86], [20, 88], [56, 70], [72, 74], [76, 88], [82, 88]);

// --- all fours ------------------------------------------------------------

export const QUADRUPED = pose([74, 56], [66, 60], [68, 74], [70, 88], [38, 62], [34, 88], [24, 84], [18, 82]);
export const CAT_ROUNDED = pose([72, 66], [66, 60], [68, 74], [70, 88], [38, 62], [34, 88], [24, 84], [18, 82], 9);
export const COW_ARCHED = pose([76, 52], [66, 60], [68, 74], [70, 88], [38, 62], [34, 88], [24, 84], [18, 82], -8);
export const BIRD_DOG = pose([74, 56], [66, 60], [78, 58], [90, 56], [38, 62], [24, 60], [10, 58], [5, 57]);
export const THREAD_NEEDLE = pose([70, 76], [62, 68], [50, 76], [38, 82], [38, 62], [34, 88], [24, 84], [18, 82]);
export const KNEEL_TOES_FORWARD = pose([66, 52], [58, 58], [60, 72], [62, 88], [34, 70], [30, 88], [20, 84], [14, 88]);
export const KNEEL_TOES_BACK = pose([44, 50], [40, 58], [50, 68], [60, 78], [30, 78], [32, 88], [22, 84], [16, 88]);

// --- side-lying -----------------------------------------------------------

export const SIDE_PLANK_DOWN = pose([78, 70], [68, 74], [70, 88], [82, 88], [44, 86], [30, 88], [16, 88], [11, 88]);
export const SIDE_PLANK_UP = pose([78, 62], [68, 66], [70, 88], [82, 88], [44, 74], [30, 82], [16, 88], [11, 88]);
export const KNEE_SIDE_PLANK_UP = pose([78, 62], [68, 66], [70, 88], [82, 88], [46, 74], [32, 88], [22, 80], [17, 76]);
export const OPEN_BOOK_CLOSED = pose([34, 60], [38, 66], [52, 68], [66, 70], [34, 80], [52, 78], [48, 88], [42, 88]);
export const OPEN_BOOK_OPEN = pose([34, 62], [38, 68], [26, 62], [14, 56], [34, 80], [52, 78], [48, 88], [42, 88]);

// --- seated / kneeling ----------------------------------------------------

export const SEATED_TALL = pose([34, 46], [34, 56], [42, 62], [50, 66], [34, 80], [54, 84], [74, 86], [80, 80]);
export const SEATED_FOLD = pose([52, 62], [42, 62], [54, 70], [66, 78], [34, 80], [54, 84], [74, 86], [80, 80], 4);
export const NINETY_NINETY_LEFT = pose([40, 44], [40, 54], [32, 64], [26, 76], [40, 78], [58, 80], [66, 68], [72, 66]);
export const NINETY_NINETY_RIGHT = pose([40, 44], [40, 54], [48, 64], [54, 76], [40, 78], [22, 80], [14, 68], [8, 66]);
export const KNEEL_HIP_NEUTRAL = pose([48, 36], [48, 46], [48, 58], [48, 68], [46, 66], [32, 86], [24, 88], [20, 88]);
export const KNEEL_HIP_STRETCH = pose([54, 36], [54, 46], [54, 58], [54, 68], [52, 66], [34, 86], [26, 88], [22, 88]);

// --- lunge stretches ------------------------------------------------------

export const LUNGE_HANDS_DOWN = pose([60, 54], [54, 58], [56, 72], [58, 86], [38, 66], [26, 82], [18, 88], [14, 88]);
export const LUNGE_ROTATED = pose([60, 50], [54, 56], [62, 44], [70, 32], [38, 66], [26, 82], [18, 88], [14, 88]);
export const LUNGE_LEG_STRAIGHT = pose([58, 58], [50, 60], [54, 72], [58, 84], [36, 62], [52, 72], [66, 84], [72, 82]);

// --- dips -----------------------------------------------------------------

export const BENCH_DIP_TOP = pose([44, 40], [46, 50], [52, 58], [58, 66], [36, 70], [22, 72], [12, 86], [6, 88]);
export const BENCH_DIP_BOTTOM = pose([44, 52], [46, 62], [60, 64], [58, 66], [36, 80], [22, 78], [12, 86], [6, 88]);
export const BENCH_DIP_STRAIGHT_TOP = pose([44, 40], [46, 50], [52, 58], [58, 66], [34, 72], [18, 80], [8, 86], [3, 88]);
export const BENCH_DIP_STRAIGHT_BOTTOM = pose([44, 52], [46, 62], [60, 64], [58, 66], [34, 82], [18, 84], [8, 86], [3, 88]);
export const PARALLEL_DIP_TOP = pose([54, 26], [52, 36], [53, 46], [54, 56], [50, 58], [56, 72], [50, 82], [56, 84]);
export const PARALLEL_DIP_BOTTOM = pose([56, 42], [54, 52], [44, 58], [54, 56], [50, 72], [44, 82], [36, 86], [31, 86]);

// --- hanging --------------------------------------------------------------

export const DEAD_HANG = pose([50, 30], [50, 38], [50, 26], [50, 14], [50, 60], [50, 74], [50, 84], [54, 88]);
export const SCAP_PULL = pose([50, 26], [50, 34], [50, 24], [50, 14], [50, 56], [50, 70], [50, 80], [54, 84]);
export const PULL_UP_TOP = pose([50, 10], [50, 22], [40, 26], [50, 14], [50, 46], [50, 60], [50, 72], [54, 76]);
export const ROW_BOTTOM = pose([68, 56], [60, 58], [58, 54], [56, 50], [36, 68], [24, 76], [12, 86], [7, 88]);
export const ROW_TOP = pose([66, 50], [58, 52], [68, 56], [56, 50], [36, 64], [24, 74], [12, 86], [7, 88]);
export const HANG_KNEES_UP = pose([50, 30], [50, 38], [50, 26], [50, 14], [50, 58], [62, 54], [66, 66], [70, 70]);
export const HANG_LEGS_UP = pose([50, 30], [50, 38], [50, 26], [50, 14], [50, 58], [64, 58], [78, 58], [84, 58]);

// --- inverted -------------------------------------------------------------

export const PIKE_HOLD = pose([60, 60], [64, 54], [66, 70], [68, 88], [40, 38], [34, 60], [28, 84], [22, 88]);
export const WALL_HANDSTAND = pose([44, 72], [44, 62], [44, 74], [44, 88], [46, 40], [48, 26], [50, 14], [56, 12]);

// --- standing mobility ----------------------------------------------------

export const WALL_ANGEL_LOW = pose([22, 22], [24, 32], [36, 34], [34, 22], [24, 56], [26, 72], [26, 86], [34, 88]);
export const WALL_ANGEL_HIGH = pose([22, 22], [24, 32], [30, 20], [30, 8], [24, 56], [26, 72], [26, 86], [34, 88]);
export const TOWEL_FRONT = pose([50, 16], [50, 28], [56, 40], [62, 50], [50, 56], [50, 72], [50, 86], [57, 88]);
export const TOWEL_OVERHEAD = pose([50, 16], [50, 28], [52, 18], [54, 6], [50, 56], [50, 72], [50, 86], [57, 88]);
export const TOWEL_BEHIND = pose([50, 16], [50, 28], [44, 18], [38, 10], [50, 56], [50, 72], [50, 86], [57, 88]);
export const ANKLE_WALL_START = pose([46, 22], [46, 32], [56, 38], [66, 40], [46, 56], [48, 72], [48, 86], [56, 88]);
export const ANKLE_WALL_FORWARD = pose([44, 24], [44, 34], [56, 38], [68, 40], [42, 58], [60, 72], [48, 86], [56, 88]);
export const ANKLE_CIRCLE_POINT = pose([34, 44], [34, 54], [44, 62], [56, 66], [34, 78], [54, 82], [70, 78], [78, 72]);
export const ANKLE_CIRCLE_FLEX = pose([34, 44], [34, 54], [44, 62], [56, 66], [34, 78], [54, 82], [70, 78], [74, 68]);

// --- wrist and handstand preparation --------------------------------------

export const WRIST_ROCK_BACK = pose([70, 58], [64, 62], [66, 75], [68, 88], [38, 64], [34, 88], [24, 84], [18, 82]);
export const WRIST_ROCK_FORWARD = pose([80, 56], [74, 60], [73, 74], [72, 88], [46, 64], [40, 88], [30, 84], [24, 82]);
export const HANDSTAND_CHEST_WALL = pose([52, 70], [52, 60], [52, 74], [52, 88], [50, 38], [48, 24], [46, 12], [40, 10]);
export const HANDSTAND_SHOULDER_TAP = pose([44, 72], [44, 62], [50, 68], [46, 64], [46, 40], [48, 26], [50, 14], [56, 12]);
