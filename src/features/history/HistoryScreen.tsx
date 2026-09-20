import { Link } from 'react-router-dom';
import { historyWeeks, type CalendarDay, type DayStatus } from '../../domain/history';
import type { UserProfile } from '../../domain/profile';
import type { WorkoutSession } from '../../domain/session';
import { currentStreak } from '../../domain/stats';
import type { Workout } from '../../domain/workout';

interface HistoryScreenProps {
  profile: UserProfile;
  /** ISO date; injected so the screen is deterministic in tests. */
  today: string;
  workouts: Workout[];
  sessions: WorkoutSession[];
  weeks?: number;
}

const WEEK_LABEL = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const DAY_LABEL = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
const FULL_DAY_LABEL = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const format = (iso: string, formatter: Intl.DateTimeFormat) =>
  formatter.format(new Date(`${iso}T12:00:00`));

/** What each state is called, in the athlete's words rather than the code's. */
const STATUS_LABELS: Record<DayStatus, string> = {
  completed: 'Done',
  partial: 'Partly done',
  missed: 'Missed',
  planned: 'Planned',
  rest: 'Rest',
};

const mobilityLabel = (count: number) => `${count} mobility`;

/**
 * One day.
 *
 * A row rather than a square in a grid: the name of the workout is the thing
 * worth reading, and a seven-across month grid has no room for it.
 */
const Day = ({ day }: { day: CalendarDay }) => {
  const status = STATUS_LABELS[day.status];
  const label = [
    format(day.date, FULL_DAY_LABEL),
    day.workoutName,
    status,
    day.mobilityCount > 0 ? mobilityLabel(day.mobilityCount) : null,
  ]
    .filter(Boolean)
    .join(', ');

  const body = (
    <>
      <span className="day__when">
        <span className="day__weekday">{format(day.date, DAY_LABEL)}</span>
        <span className="day__date">{day.date.slice(8)}</span>
      </span>
      <span className="day__what">
        {day.workoutName ?? status}
        {day.mobilityCount > 0 && (
          <span className="day__mobility">
            {day.mobilityCount === 1 ? 'Mobility' : `Mobility \u00d7 ${day.mobilityCount}`}
          </span>
        )}
      </span>
      {day.workoutName !== null && <span className="day__status">{status}</span>}
    </>
  );

  return (
    <li
      className={`day day--${day.status}${day.isToday ? ' day--today' : ''}`}
      aria-label={label}
      aria-current={day.isToday ? 'date' : undefined}
      data-testid="day-cell"
      data-status={day.status}
    >
      {day.sessionId === null ? (
        body
      ) : (
        <Link className="day__link" to={`/history/${day.sessionId}`}>
          {body}
        </Link>
      )}
    </li>
  );
};

/**
 * The training calendar.
 *
 * Weeks rather than a month grid: a month boundary means nothing to a training
 * programme, and "3 of 4" is the number that actually says how the week went.
 *
 * Nothing here writes anything back. A missed day is worked out from the
 * schedule each time the screen is drawn, so it stays missed for good.
 */
export const HistoryScreen = ({
  profile,
  today,
  workouts,
  sessions,
  weeks = 8,
}: HistoryScreenProps) => {
  const history = historyWeeks({ sessions, profile, workouts, today, weeks });
  const days = history.flatMap((week) => week.days);

  const streak = currentStreak(sessions, profile, today);
  const trained = history.reduce((total, week) => total + week.completed, 0);
  const missed = days.filter((day) => day.status === 'missed').length;
  const mobility = days.reduce((total, day) => total + day.mobilityCount, 0);

  return (
    <div className="history">
      <h1 className="page__title">History</h1>
      <p className="page__lede">
        Every day of the last {weeks} weeks. A missed session stays missed and is never moved to
        another day &mdash; the next one is the one that counts.
      </p>

      <dl className="tiles tiles--pairs">
        <div className="tile" data-testid="history-streak">
          <dt className="tile__label">Streak</dt>
          <dd className="tile__value">
            {streak}
            <span className="tile__detail">{streak === 1 ? 'session' : 'sessions'}</span>
          </dd>
        </div>
        <div className="tile" data-testid="history-trained">
          <dt className="tile__label">Trained</dt>
          <dd className="tile__value">
            {trained}
            <span className="tile__detail">sessions</span>
          </dd>
        </div>
        <div className="tile" data-testid="history-missed">
          <dt className="tile__label">Missed</dt>
          <dd className="tile__value">
            {missed}
            <span className="tile__detail">sessions</span>
          </dd>
        </div>
        <div className="tile" data-testid="history-mobility">
          <dt className="tile__label">Mobility</dt>
          <dd className="tile__value">
            {mobility}
            <span className="tile__detail">routines</span>
          </dd>
        </div>
      </dl>

      {history.map((week) => (
        <section
          className="week"
          key={week.start}
          aria-label={`Week of ${format(week.start, WEEK_LABEL)}`}
        >
          <div className="week__head">
            <h2 className="week__title">Week of {format(week.start, WEEK_LABEL)}</h2>
            <span className="week__count">
              {week.completed} of {week.planned}
            </span>
          </div>
          <ol className="week__days">
            {week.days.map((day) => (
              <Day key={day.date} day={day} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
};
