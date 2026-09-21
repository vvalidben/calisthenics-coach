import { Link } from 'react-router-dom';
import type { Exercise } from '../../domain/exercise';

/**
 * How to do it, without leaving the set.
 *
 * The full instructions are a screen of their own, and navigating to them
 * mid-workout loses the session's place. This is the part an athlete needs
 * while they are actually on the floor: how to start, what to do, what to
 * think about, and when to stop. Everything else stays one link away.
 *
 * Closed by default so the buttons never move out from under the thumb.
 */
export const QuickInstructions = ({ exercise }: { exercise: Exercise }) => (
  <details className="brief" data-testid="brief">
    <summary className="brief__summary">How to do it</summary>

    <div className="brief__body">
      <h2 className="brief__heading">Start here</h2>
      <p className="brief__start">{exercise.startingPosition.body}</p>

      <h2 className="brief__heading" id="brief-steps">
        The movement
      </h2>
      <ol className="brief__steps" aria-labelledby="brief-steps">
        {exercise.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <h2 className="brief__heading">Breathing</h2>
      <p className="brief__line">
        In: {exercise.breathing.inhale} Out: {exercise.breathing.exhale}
      </p>

      <h2 className="brief__heading" id="brief-cues">
        Think about
      </h2>
      <ul className="brief__cues" aria-labelledby="brief-cues">
        {exercise.cues.map((cue) => (
          <li key={cue}>{cue}</li>
        ))}
      </ul>

      <p className="brief__stop">
        <strong>Stop if:</strong> {exercise.safety.stopIf.join(' ')}
      </p>

      <Link className="brief__full" to={`/library/${exercise.id}`}>
        Full instructions
      </Link>
    </div>
  </details>
);
