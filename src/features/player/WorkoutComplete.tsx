import { Link } from 'react-router-dom';
import type { WorkoutSession } from '../../domain/session';
import { LABELS, compareToPrevious, sessionSummary } from '../../domain/session-log';
import type { Workout } from '../../domain/workout';
import { exerciseById } from '../../content/catalog';

interface WorkoutCompleteProps {
  workout: Workout;
  session: WorkoutSession;
  previousSession: WorkoutSession | undefined;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/** What just happened, and how it compares with the last time. */
export const WorkoutComplete = ({
  workout,
  session,
  previousSession,
  notes,
  onNotesChange,
}: WorkoutCompleteProps) => {
  const summary = sessionSummary(session);
  const comparison = compareToPrevious(session, previousSession);

  return (
    <div className="complete">
      <h1 className="complete__title">Workout complete</h1>
      <p className="complete__subtitle">
        {workout.name} &middot;{' '}
        {session.status === 'completed'
          ? 'Every set done'
          : session.status === 'missed'
            ? 'Nothing logged'
            : 'Partly done'}
      </p>

      <section className="complete__section" aria-labelledby="summary-heading">
        <h2 className="complete__heading" id="summary-heading">
          Summary
        </h2>
        <dl className="complete__stats">
          <div>
            <dt>Duration</dt>
            <dd>{summary.durationSeconds === null ? '—' : clock(summary.durationSeconds)}</dd>
          </div>
          <div>
            <dt>Exercises</dt>
            <dd>
              {summary.exercisesCompleted} of {summary.exercisesPlanned}
            </dd>
          </div>
          <div>
            <dt>Sets</dt>
            <dd>
              {summary.setsCompleted} of {summary.setsPlanned}
            </dd>
          </div>
          <div>
            <dt>Total reps</dt>
            <dd>{summary.totalReps}</dd>
          </div>
          <div>
            <dt>Time held</dt>
            <dd>{summary.totalSeconds}s</dd>
          </div>
          <div>
            <dt>Difficulty</dt>
            <dd>{summary.difficulty === null ? '—' : LABELS[summary.difficulty]}</dd>
          </div>
        </dl>
      </section>

      <section className="complete__section" aria-labelledby="comparison-heading">
        <h2 className="complete__heading" id="comparison-heading">
          Compared with last time
        </h2>
        {comparison.length === 0 ? (
          <p className="complete__none">
            First time through this session. Next time there will be something to compare against.
          </p>
        ) : (
          <ul className="complete__comparison">
            {comparison.map((row) => (
              <li key={row.exerciseId}>
                <span className="complete__compare-name">
                  {exerciseById(row.exerciseId)?.name ?? row.exerciseId}
                </span>
                <span className="complete__compare-numbers">
                  {row.total} vs {row.previousTotal} {row.measuredIn}
                </span>
                <span
                  className={`complete__delta${
                    row.totalDelta >= 0 ? ' complete__delta--up' : ' complete__delta--down'
                  }`}
                >
                  {row.totalDelta > 0 ? '+' : ''}
                  {row.totalDelta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="complete__section" aria-labelledby="notes-heading">
        <h2 className="complete__heading" id="notes-heading">
          Notes
        </h2>
        <label className="visually-hidden" htmlFor="session-notes">
          Session notes
        </label>
        <textarea
          id="session-notes"
          className="complete__notes"
          rows={3}
          placeholder="Anything worth remembering"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </section>

      <Link className="button button--primary" to="/">
        Done
      </Link>
    </div>
  );
};
