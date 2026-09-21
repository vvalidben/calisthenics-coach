import { Link } from 'react-router-dom';
import { localIsoDate, weekdayOf } from '../../domain/calendar';
import { estimateWorkoutMinutes } from '../../domain/duration';
import { WEEKDAYS } from '../../domain/primitives';
import { needsRecovery } from '../../domain/coach';
import { assessPhase } from '../../domain/phase';
import type { ProgressionState } from '../../domain/progression';
import type { UserProfile } from '../../domain/profile';
import type { Reminder } from '../../domain/reminders';
import { ReminderBanner } from '../reminders/ReminderBanner';
import type { WorkoutSession } from '../../domain/session';
import { LABELS, mobilitySessionsInLastWeek } from '../../domain/session-log';
import {
  currentStreak,
  recentPerformance,
  totalWorkouts,
  weekStart,
  weeklyProgress,
} from '../../domain/stats';
import type { Workout } from '../../domain/workout';
import { exerciseById } from '../../content/catalog';
import { requirePhaseSpec } from '../../content/phases';

interface DashboardScreenProps {
  profile: UserProfile;
  /** ISO date; injected so the screen is deterministic in tests. */
  today: string;
  workouts: Workout[];
  sessions: WorkoutSession[];
  progression: ProgressionState[];
  /** Today's reminder, once it is due. Null the rest of the time. */
  reminder: Reminder | null;
}

const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const formatDate = (iso: string) => LONG_DATE.format(new Date(`${iso}T12:00:00`));

const titleCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const LEVEL_LABELS: Record<string, string> = {
  'complete-beginner': 'Beginner',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

/**
 * One statistic. A plain definition rather than its own landmark region: three
 * numbers do not need three sections, and a screen reader should not have to
 * step through them as separate parts of the page.
 */
const Stat = ({
  id,
  label,
  value,
  detail,
}: {
  id: string;
  label: string;
  value: string;
  detail?: string;
}) => (
  <div className="tile" data-testid={`stat-${id}`}>
    <dt className="tile__label">{label}</dt>
    <dd className="tile__value">
      {value}
      {detail && <span className="tile__detail">{detail}</span>}
    </dd>
  </div>
);

/**
 * The first screen, and the one that has to answer "what do I do today" before
 * anything else loads.
 *
 * Everything below the fold is context: how the week is going, what is next,
 * how the last few sessions went. None of it is analysis, and none of it needs
 * interpreting — if a number here does not change what the athlete does next,
 * it does not belong.
 */
export const DashboardScreen = ({
  profile,
  today,
  workouts,
  sessions,
  progression,
  reminder,
}: DashboardScreenProps) => {
  const weekday = weekdayOf(today);
  const scheduled = workouts.filter((w) => w.kind === 'training');
  const routines = workouts.filter((w) => w.kind === 'mobility');
  const workout = scheduled.find((w) => w.day === weekday);

  const week = weeklyProgress(sessions, profile, today);
  const streak = currentStreak(sessions, profile, today);
  const total = totalWorkouts(sessions);
  // Phases are earned, not waited out, so the tile counts criteria rather than
  // weeks, and takes its name from the phase content rather than the enum.
  const spec = requirePhaseSpec(profile.currentPhase.name);
  const assessment = assessPhase({ spec, profile, sessions, progression, today });
  const recent = recentPerformance(sessions, 3);
  const mobility = mobilitySessionsInLastWeek(sessions, today);

  // The coach's one word before a session rather than after it. Read from the
  // sessions alone, so it does not depend on a progression decision that was
  // only ever held in memory.
  const recovering = needsRecovery(sessions);

  const startIndex = WEEKDAYS.indexOf(weekday);
  const next = WEEKDAYS.map((_, offset) => WEEKDAYS[(startIndex + offset + 1) % 7]!)
    .map((day) => scheduled.find((w) => w.day === day))
    .find((w): w is Workout => w !== undefined);

  const start = weekStart(today);
  const trainedDates = new Set(
    sessions
      .filter((s) => s.kind === 'training' && (s.status === 'completed' || s.status === 'partial'))
      .map((s) => s.date),
  );
  const nameOf = (id: string | null) =>
    workouts.find((w) => w.id === id)?.name ?? 'Session';

  return (
    <div className="dash">
      {reminder !== null && <ReminderBanner reminder={reminder} />}

      <p className="dash__date">
        {formatDate(today)}
        <Link className="dash__settings" to="/settings">
          Schedule and reminders
        </Link>
      </p>

      <section className="hero" aria-labelledby="today-heading">
        <h2 className="hero__eyebrow" id="today-heading">
          Today
        </h2>

        {workout ? (
          <>
            <h1 className="hero__title">{workout.name}</h1>
            <p className="hero__meta">
              <span>{estimateWorkoutMinutes(workout, exerciseById)} minutes</span>
              <span>{LEVEL_LABELS[profile.fitnessLevel] ?? profile.fitnessLevel}</span>
            </p>
            {workout.notes && <p className="hero__note">{workout.notes}</p>}
            <Link className="button button--primary hero__start" to={`/workout/${workout.id}`}>
              Start workout
            </Link>
          </>
        ) : (
          <>
            <h1 className="hero__title">Rest day</h1>
            <p className="hero__meta">
              <span>Nothing scheduled</span>
            </p>
            <p className="hero__note">
              Recovery is when the training you already did turns into muscle.
            </p>
          </>
        )}
      </section>

      <section className="tiles-section" aria-labelledby="glance-heading">
        <h2 className="visually-hidden" id="glance-heading">
          At a glance
        </h2>
        <dl className="tiles">
          <Stat
            id="streak"
            label="Streak"
            value={String(streak)}
            detail={streak === 1 ? 'session' : 'sessions'}
          />
          <Stat id="total" label="Total" value={String(total)} detail="workouts" />
          <Stat
            id="phase"
            label="Phase"
            value={spec.title}
            detail={`${assessment.metCount} of ${assessment.requirements.length} met`}
          />
        </dl>
      </section>

      <section className="week" aria-labelledby="week-heading">
        <div className="week__head">
          <h2 className="week__heading" id="week-heading">
            This week
          </h2>
          <span className="week__count">
            {week.completed} of {week.planned}
          </span>
        </div>
        <ol className="week__days">
          {WEEKDAYS.map((day, index) => {
            const date = (() => {
              const d = new Date(`${start}T12:00:00`);
              d.setDate(d.getDate() + index);
              // localIsoDate, not toISOString: the latter reports the UTC day.
              return localIsoDate(d);
            })();
            const planned = scheduled.find((w) => w.day === day);
            const done = trainedDates.has(date);
            return (
              <li
                key={day}
                className={`week__day${planned ? ' week__day--training' : ''}${done ? ' week__day--done' : ''}`}
                aria-current={day === weekday ? 'date' : undefined}
                {...(done ? { 'data-testid': 'week-done' } : {})}
              >
                <span className="week__name">{titleCase(day).slice(0, 3)}</span>
                <span className="week__label">
                  {done ? 'Done' : planned ? planned.focus.replace(/-/g, ' ') : 'Rest'}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {next && (
        <section className="next" aria-labelledby="next-heading">
          <h2 className="next__heading" id="next-heading">
            Next up
          </h2>
          <p className="next__body">
            <strong>{next.day === null ? 'Whenever you like' : titleCase(next.day)}</strong>
            {next.name}, about {next.estimatedMinutes} minutes
          </p>
        </section>
      )}

      <p className="dash__phase">
        <strong>{spec.title}.</strong> {spec.focus}{' '}
        <Link to="/progress">What it takes to move on</Link>
      </p>

      {recovering && (
        <p className="coach-note" data-testid="coach-note">
          Your last two sessions were hard. Take this one steady: full rest between sets, and stop
          each set with something left.
        </p>
      )}

      <section className="recent" aria-labelledby="recent-heading">
        <h2 className="recent__heading" id="recent-heading">
          Recent sessions
        </h2>
        {recent.length === 0 ? (
          <p className="recent__none">
            Nothing logged yet. Your first finished session will show up here.
          </p>
        ) : (
          <ol className="recent__list">
            {recent.map((session) => (
              <li className="recent__item" key={session.id}>
                <span className="recent__name">{nameOf(session.workoutId)}</span>
                <span className="recent__stats">
                  {session.setsCompleted} {session.setsCompleted === 1 ? 'set' : 'sets'}
                  {session.totalReps > 0 ? `, ${session.totalReps} reps` : ''}
                  {session.difficulty ? ` · ${LABELS[session.difficulty]}` : ''}
                </span>
                {session.status === 'partial' && (
                  <span className="recent__partial">Partly done</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mobility" aria-labelledby="mobility-heading">
        <div className="mobility__head">
          <h2 className="mobility__heading" id="mobility-heading">
            Mobility
          </h2>
          <span className="mobility__count">
            {mobility === 0
              ? 'None this week'
              : `${mobility} in the last seven days`}
          </span>
        </div>
        <p className="mobility__lede">
          Short and restorative. None of it counts toward your program, and skipping it costs you
          nothing.
        </p>
        <ul className="mobility__list">
          {routines.map((routine) => (
            <li key={routine.id}>
              <Link className="mobility__item" to={`/workout/${routine.id}`}>
                <span>{routine.name}</span>
                <span className="mobility__time">{routine.estimatedMinutes} min</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
