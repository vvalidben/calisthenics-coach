import { Link } from 'react-router-dom';
import { exerciseById } from '../../content/catalog';
import type { SessionExercise, WorkoutBlockName, WorkoutSession } from '../../domain/session';
import { LABELS, difficultyForRpe, sessionSummary } from '../../domain/session-log';
import type { Workout } from '../../domain/workout';

interface SessionDetailProps {
  session: WorkoutSession;
  /** Absent if the workout has since been removed from the program. */
  workout: Workout | undefined;
}

const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const BLOCK_LABELS: Record<WorkoutBlockName, string> = {
  'warm-up': 'Warm-up',
  main: 'Main work',
  mobility: 'Mobility',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Every set done',
  partial: 'Partly done',
  missed: 'Nothing was logged',
  'in-progress': 'Left unfinished',
  scheduled: 'Never started',
};

const minutes = (seconds: number | null) =>
  seconds === null ? '\u2014' : `${Math.max(1, Math.round(seconds / 60))} min`;

const isTimed = (exercise: SessionExercise) => exercise.prescribed.measurement.startsWith('time');

/** What the workout asked for, read back in the same words the player used. */
const describePrescription = (exercise: SessionExercise): string => {
  const { sets, measurement, target } = exercise.prescribed;
  const range = target.min === target.max ? `${target.min}` : `${target.min}\u2013${target.max}`;
  const unit = isTimed(exercise) ? 'seconds' : 'reps';
  const perSide = measurement.endsWith('per-side') ? ' per side' : '';
  return `${sets} ${sets === 1 ? 'set' : 'sets'} of ${range} ${unit}${perSide}`;
};

/** One performed set: what was done, and how hard it felt. */
const Set = ({ set, timed }: { set: SessionExercise['sets'][number]; timed: boolean }) => {
  if (!set.completed) {
    return (
      <li className="set set--skipped" data-testid="set-row">
        <span className="set__number">{set.setNumber}</span>
        <span className="set__amount">Skipped</span>
      </li>
    );
  }

  const amount = timed ? `${set.seconds ?? 0}s` : `${set.reps ?? 0} reps`;

  return (
    <li className="set" data-testid="set-row">
      <span className="set__number">{set.setNumber}</span>
      <span className="set__amount">{amount}</span>
      {set.rpe !== null && (
        <span className={`set__effort set__effort--${difficultyForRpe(set.rpe)}`}>
          {LABELS[difficultyForRpe(set.rpe)]}
        </span>
      )}
    </li>
  );
};

const Exercise = ({ exercise }: { exercise: SessionExercise }) => {
  const name = exerciseById(exercise.exerciseId)?.name ?? exercise.exerciseId;
  const prescription = describePrescription(exercise);

  return (
    <li className="logged" aria-label={`${name}, ${prescription}`}>
      <div className="logged__head">
        <Link className="logged__name" to={`/library/${exercise.exerciseId}`}>
          {name}
        </Link>
        <span className="logged__prescription">{prescription}</span>
      </div>
      <ol className="logged__sets">
        {exercise.sets.map((set) => (
          <Set key={set.setNumber} set={set} timed={isTimed(exercise)} />
        ))}
      </ol>
      {exercise.note !== undefined && <p className="logged__note">{exercise.note}</p>}
    </li>
  );
};

const Stat = ({ id, label, value }: { id: string; label: string; value: string }) => (
  <div className="tile" data-testid={`detail-${id}`}>
    <dt className="tile__label">{label}</dt>
    <dd className="tile__value">{value}</dd>
  </div>
);

/**
 * One session, read back.
 *
 * History only. Nothing on this screen changes the program — it answers "how
 * did that one go", and the progression engine has already had its say.
 */
export const SessionDetail = ({ session, workout }: SessionDetailProps) => {
  const summary = sessionSummary(session);
  const blocks: WorkoutBlockName[] = ['warm-up', 'main', 'mobility'];

  return (
    <div className="detail">
      <Link className="detail__back" to="/history">
        &larr; History
      </Link>

      <h1 className="page__title">{workout?.name ?? 'Workout'}</h1>
      <p className="page__lede">
        {LONG_DATE.format(new Date(`${session.date}T12:00:00`))} &middot;{' '}
        {STATUS_LABELS[session.status] ?? session.status}
      </p>

      {session.status === 'missed' ? (
        <p className="detail__missed">
          This session was missed. It stays on the day it was scheduled and is not made up
          later &mdash; the next session is the one that counts.
        </p>
      ) : (
        <>
          <dl className="tiles">
            <Stat id="duration" label="Duration" value={minutes(summary.durationSeconds)} />
            <Stat
              id="exercises"
              label="Exercises"
              value={`${summary.exercisesCompleted} of ${summary.exercisesPlanned}`}
            />
            <Stat
              id="sets"
              label="Sets"
              value={`${summary.setsCompleted} of ${summary.setsPlanned}`}
            />
            <Stat id="reps" label="Total reps" value={`${summary.totalReps}`} />
            {summary.totalSeconds > 0 && (
              <Stat id="held" label="Time held" value={`${summary.totalSeconds}s`} />
            )}
            <Stat
              id="difficulty"
              label="Difficulty"
              value={summary.difficulty === null ? '\u2014' : LABELS[summary.difficulty]}
            />
          </dl>

          {blocks.map((block) => {
            const logged = session.exercises.filter((e) => e.block === block);
            if (logged.length === 0) return null;

            return (
              <section className="detail__block" key={block}>
                <h2 className="detail__heading">{BLOCK_LABELS[block]}</h2>
                <ol className="detail__exercises">
                  {logged.map((exercise) => (
                    <Exercise key={exercise.exerciseId} exercise={exercise} />
                  ))}
                </ol>
              </section>
            );
          })}
        </>
      )}

      <section className="detail__block">
        <h2 className="detail__heading">Notes</h2>
        {session.notes === undefined || session.notes.trim() === '' ? (
          <p className="detail__none">Nothing written down for this session.</p>
        ) : (
          <p className="detail__notes">{session.notes}</p>
        )}
      </section>
    </div>
  );
};
