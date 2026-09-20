import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { WorkoutSession } from '../../domain/session';
import {
  LABELS,
  PERCEIVED_DIFFICULTIES,
  finishSession,
  recordSet,
  startSession,
  type PerceivedDifficulty,
} from '../../domain/session-log';
import {
  describeTarget,
  workoutBlocks,
  type Workout,
  type WorkoutItem,
} from '../../domain/workout';
import { exerciseById } from '../../content/catalog';
import { FigureDemo } from '../demo/FigureDemo';
import { WorkoutComplete } from './WorkoutComplete';

interface WorkoutPlayerProps {
  workout: Workout;
  /** ISO date; injected so the session id is deterministic in tests. */
  date: string;
  previousSession?: WorkoutSession | undefined;
  /** Called after every change, so a closed tab never loses the workout. */
  onSessionChange: (session: WorkoutSession) => void;
}

type Phase = 'ready' | 'working' | 'logging' | 'resting' | 'complete';

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

const RestTimer = ({ secondsLeft, onSkip }: { secondsLeft: number; onSkip: () => void }) => (
  <div className="rest">
    <p className="rest__label">Rest</p>
    <p className="rest__clock" role="timer" aria-live="off">
      {clock(secondsLeft)}
    </p>
    <button type="button" className="button button--quiet" onClick={onSkip}>
      Skip rest
    </button>
  </div>
);

/**
 * Guides one workout, one set at a time.
 *
 * The player records what happened and nothing more. It never changes a target,
 * advances a variation or decides what the next session should be — that is the
 * progression engine, which does not exist yet.
 */
export const WorkoutPlayer = ({
  workout,
  date,
  previousSession,
  onSessionChange,
}: WorkoutPlayerProps) => {
  const items = workoutBlocks(workout);

  const [session, setSession] = useState<WorkoutSession>(() =>
    startSession(workout, date, new Date().toISOString()),
  );
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [restLeft, setRestLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [entry, setEntry] = useState('');
  const [notes, setNotes] = useState('');

  const save = (next: WorkoutSession) => {
    setSession(next);
    onSessionChange(next);
  };

  const item = (items[index] ?? items[items.length - 1]) as WorkoutItem;
  const exercise = exerciseById(item.exerciseId);
  const timed = item.measurement === 'time' || item.measurement === 'time-per-side';
  const logged = session.exercises[index]?.sets.length ?? 0;
  const setNumber = Math.min(logged + 1, item.sets);
  const defaultEntry = timed ? Math.max(item.target.max, elapsed) : item.target.max;

  const finish = (from: WorkoutSession = session) => {
    save(finishSession(from, new Date().toISOString(), notes || undefined));
    setPhase('complete');
  };

  /** Move to the next set, the next exercise, or the end of the workout. */
  const advance = () => {
    const setsDone = session.exercises[index]?.sets.length ?? 0;
    if (setsDone < item.sets) {
      setPhase('ready');
      return;
    }
    if (index + 1 < items.length) {
      setIndex(index + 1);
      setPhase('ready');
      return;
    }
    finish();
  };

  // The rest timer fires from inside an interval, which closes over the render
  // that created it. Keeping the latest `advance` on a ref -- written in an
  // effect, never during render -- lets it move on using current state.
  const advanceRef = useRef<() => void>(() => {});
  useEffect(() => {
    advanceRef.current = advance;
  });

  // Count up while a set is being performed, so a timed hold can be logged
  // without watching a separate clock.
  useEffect(() => {
    if (phase !== 'working') return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'resting') return;
    const timer = window.setInterval(() => {
      setRestLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          advanceRef.current();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  if (phase === 'complete') {
    return (
      <WorkoutComplete
        workout={workout}
        session={session}
        previousSession={previousSession}
        notes={notes}
        onNotesChange={(value) => {
          setNotes(value);
          save({ ...session, notes: value });
        }}
      />
    );
  }

  const afterSet = (next: WorkoutSession) => {
    save(next);
    setElapsed(0);
    setEntry('');

    const setsDone = next.exercises[index]?.sets.length ?? 0;
    const lastSet = setsDone >= item.sets;
    const lastExercise = index + 1 >= items.length;

    if (lastSet && lastExercise) {
      finish(next);
      return;
    }

    if (item.restSeconds > 0) {
      setRestLeft(item.restSeconds);
      setPhase('resting');
      return;
    }

    if (lastSet) setIndex(index + 1);
    setPhase('ready');
  };

  const logDifficulty = (difficulty: PerceivedDifficulty) => {
    const value = Number(entry === '' ? defaultEntry : entry);
    const report = timed ? { seconds: value, difficulty } : { reps: value, difficulty };
    afterSet(recordSet(session, item.exerciseId, report));
  };

  return (
    <div className="player">
      <div className="player__progress">
        <span>
          Exercise {index + 1} of {items.length}
        </span>
        <button type="button" className="button button--quiet" onClick={() => finish()}>
          End workout
        </button>
      </div>

      <h1 className="player__title">{exercise?.name ?? item.exerciseId}</h1>
      <p className="player__setcount" data-testid="player-set-count">
        Set {setNumber} of {item.sets}
      </p>

      {exercise && <FigureDemo exerciseName={exercise.name} demo={exercise.demo} />}

      <dl className="player__prescription">
        <div>
          <dt>Target</dt>
          <dd data-testid="player-target">{describeTarget(item)}</dd>
        </div>
        <div>
          <dt>Rest</dt>
          <dd>{item.restSeconds}s</dd>
        </div>
      </dl>

      <p className="player__cue">{item.cue}</p>

      <Link className="player__how" to={`/library/${item.exerciseId}`}>
        How to do it
      </Link>

      {phase === 'ready' && (
        <div className="player__actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              setElapsed(0);
              setPhase('working');
            }}
          >
            Start set
          </button>
        </div>
      )}

      {phase === 'working' && (
        <div className="player__actions">
          <p className="player__elapsed" aria-live="off">
            {clock(elapsed)}
          </p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              setEntry(String(defaultEntry));
              setPhase('logging');
            }}
          >
            Finish set
          </button>
          <button
            type="button"
            className="button button--quiet"
            onClick={() => afterSet(recordSet(session, item.exerciseId, { skipped: true }))}
          >
            Skip this set
          </button>
        </div>
      )}

      {phase === 'logging' && (
        <div className="player__log">
          <label className="player__label" htmlFor="set-entry">
            {timed ? 'How many seconds did you hold?' : 'How many reps did you complete?'}
          </label>
          <input
            id="set-entry"
            className="player__entry"
            type="number"
            inputMode="numeric"
            min={0}
            value={entry}
            onChange={(event) => setEntry(event.target.value)}
          />

          <p className="player__label">How difficult was it?</p>
          <div className="player__difficulties">
            {PERCEIVED_DIFFICULTIES.map((difficulty) => (
              <button
                key={difficulty}
                type="button"
                className={`difficulty difficulty--${difficulty}`}
                onClick={() => logDifficulty(difficulty)}
              >
                {LABELS[difficulty]}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'resting' && <RestTimer secondsLeft={restLeft} onSkip={advance} />}
    </div>
  );
};
