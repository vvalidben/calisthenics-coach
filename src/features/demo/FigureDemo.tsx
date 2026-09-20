import { useEffect, useMemo, useState } from 'react';
import type { DemoSpec } from '../../domain/exercise';
import {
  FLOOR_Y,
  interpolatePose,
  largestMover,
  type Joint,
  type Pose,
  type Scene,
} from '../../domain/pose';

interface FigureDemoProps {
  exerciseName: string;
  demo: DemoSpec;
}

/** Read once per mount; the demo does not need to react to the setting changing. */
const usePrefersReducedMotion = (): boolean => {
  const [reduced] = useState(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });
  return reduced;
};

const Scenery = ({ scene }: { scene: Scene }) => (
  <g data-testid="demo-scene" data-scene={scene} className="figure__scene">
    {scene !== 'none' && (
      <line x1="2" y1={FLOOR_Y} x2="98" y2={FLOOR_Y} className="figure__floor" />
    )}
    {scene === 'wall' && <line x1="90" y1="4" x2="90" y2={FLOOR_Y} className="figure__wall" />}
    {scene === 'chair' && (
      <>
        <line x1="58" y1="66" x2="86" y2="66" className="figure__prop" />
        <line x1="62" y1="66" x2="62" y2={FLOOR_Y} className="figure__prop" />
        <line x1="82" y1="66" x2="82" y2={FLOOR_Y} className="figure__prop" />
      </>
    )}
    {scene === 'bar' && (
      <>
        <line x1="26" y1="14" x2="74" y2="14" className="figure__bar" />
        <line x1="30" y1="14" x2="30" y2="6" className="figure__prop" />
        <line x1="70" y1="14" x2="70" y2="6" className="figure__prop" />
      </>
    )}
    {scene === 'low-bar' && (
      <>
        <line x1="34" y1="50" x2="78" y2="50" className="figure__bar" />
        <line x1="38" y1="50" x2="38" y2={FLOOR_Y} className="figure__prop" />
        <line x1="74" y1="50" x2="74" y2={FLOOR_Y} className="figure__prop" />
      </>
    )}
  </g>
);

/**
 * Draws one pose. The spine is a curve rather than a line so a rounded back and
 * an arched back are visibly different, which matters for half the mobility work.
 */
const Figure = ({ pose }: { pose: Pose }) => {
  const bend = pose.spineBend ?? 0;
  const mx = (pose.shoulder.x + pose.hip.x) / 2;
  const my = (pose.shoulder.y + pose.hip.y) / 2;
  const dx = pose.hip.x - pose.shoulder.x;
  const dy = pose.hip.y - pose.shoulder.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;

  return (
    <g className="figure__body">
      <path
        d={`M ${pose.shoulder.x} ${pose.shoulder.y} Q ${cx} ${cy} ${pose.hip.x} ${pose.hip.y}`}
        className="figure__spine"
      />
      <line
        x1={pose.shoulder.x}
        y1={pose.shoulder.y}
        x2={pose.head.x}
        y2={pose.head.y}
        className="figure__limb"
      />
      <circle cx={pose.head.x} cy={pose.head.y} r="5.5" className="figure__head" />
      <polyline
        points={`${pose.shoulder.x},${pose.shoulder.y} ${pose.elbow.x},${pose.elbow.y} ${pose.hand.x},${pose.hand.y}`}
        className="figure__limb"
      />
      <polyline
        points={`${pose.hip.x},${pose.hip.y} ${pose.knee.x},${pose.knee.y} ${pose.ankle.x},${pose.ankle.y} ${pose.toe.x},${pose.toe.y}`}
        className="figure__limb"
      />
    </g>
  );
};

/** The dashed line showing the alignment that matters most for this exercise. */
const AlignmentGuide = ({ pose, joints }: { pose: Pose; joints: [Joint, Joint] }) => {
  const [from, to] = joints;
  return (
    <line
      data-testid="demo-alignment"
      x1={pose[from].x}
      y1={pose[from].y}
      x2={pose[to].x}
      y2={pose[to].y}
      className="figure__alignment"
    />
  );
};

/** An arrow showing which way the body travels into the next position. */
const DirectionArrow = ({ from, to }: { from: Pose; to: Pose }) => {
  const joint = largestMover(from, to);
  const a = from[joint];
  const b = to[joint];
  if (Math.hypot(b.x - a.x, b.y - a.y) < 6) return null;

  const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return (
    <g className="figure__arrow" aria-hidden="true">
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
      <polygon points="0,-2.4 5.5,0 0,2.4" transform={`translate(${b.x} ${b.y}) rotate(${angle})`} />
    </g>
  );
};

const isJointPair = (value: [string, string] | undefined): value is [Joint, Joint] =>
  value !== undefined;

/**
 * The visual sequence: start, the middle of the movement, and the end.
 *
 * The captions are always on screen. The drawing is a support for the written
 * instructions, never a replacement for them, so nothing here is the only place
 * a piece of information appears.
 */
export const FigureDemo = ({ exerciseName, demo }: FigureDemoProps) => {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState(0);

  const frames = demo.keyframes;
  const alignment = isJointPair(demo.alignment) ? demo.alignment : undefined;

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const timer = window.setInterval(() => {
      setPhase((p) => {
        const next = p + 0.04;
        if (next < 1) return next;
        setIndex((i) => (i + 1) % frames.length);
        return 0;
      });
    }, 40);
    return () => window.clearInterval(timer);
  }, [playing, reducedMotion, frames.length]);

  const current = frames[index]!;
  const next = frames[(index + 1) % frames.length]!;
  const shown = useMemo(
    () => (playing ? interpolatePose(current.pose, next.pose, phase) : current.pose),
    [playing, current, next, phase],
  );

  if (reducedMotion) {
    return (
      <div className="demo demo--static">
        <ol className="demo__frames">
          {frames.map((frame) => (
            <li key={frame.id} className="demo__frame">
              <svg
                viewBox="0 0 100 100"
                className="figure"
                role="img"
                aria-label={`${exerciseName}: ${frame.label}. ${frame.caption}`}
              >
                <Scenery scene={demo.scene} />
                {alignment && <AlignmentGuide pose={frame.pose} joints={alignment} />}
                <Figure pose={frame.pose} />
              </svg>
              <p className="demo__frame-label">{frame.label}</p>
              <p className="demo__frame-caption">{frame.caption}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <figure className="demo">
      <svg
        viewBox="0 0 100 100"
        className="figure"
        role="img"
        aria-label={`${exerciseName}: ${current.label}. ${current.caption}`}
      >
        <Scenery scene={demo.scene} />
        {alignment && <AlignmentGuide pose={shown} joints={alignment} />}
        {!playing && frames.length > 1 && <DirectionArrow from={current.pose} to={next.pose} />}
        <Figure pose={shown} />
      </svg>

      <figcaption className="demo__caption-block">
        <ol className="demo__steps" aria-label={`${exerciseName} sequence`}>
          {frames.map((frame, i) => (
            <li key={frame.id}>
              <button
                type="button"
                className="demo__step"
                aria-current={i === index ? 'true' : undefined}
                onClick={() => {
                  setPlaying(false);
                  setPhase(0);
                  setIndex(i);
                }}
              >
                {frame.label}
              </button>
            </li>
          ))}
        </ol>
        <p className="demo__caption" data-testid="demo-caption">
          {current.caption}
        </p>
      </figcaption>

      <button
        type="button"
        className="demo__play"
        onClick={() => {
          setPhase(0);
          setPlaying((p) => !p);
        }}
      >
        {playing ? 'Pause' : 'Play'}
      </button>
    </figure>
  );
};
