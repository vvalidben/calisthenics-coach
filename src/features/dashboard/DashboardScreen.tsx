import { Fragment } from 'react';
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
import { completedSetCount, type WorkoutSession } from '../../domain/session';
import { LABELS, mobilitySessionsInLastWeek } from '../../domain/session-log';
import {
  currentStreak,
  recentPerformance,
  totalWorkouts,
  weekStart,
  weeklyProgress,
} from '../../domain/stats';
import type { Workout, WorkoutItem } from '../../domain/workout';
import { exerciseById } from '../../content/catalog';
import { requirePhaseSpec } from '../../content/phases';
import { describeTarget, workoutBlocks } from '../../domain/workout';
import { blockSeconds } from '../../domain/duration';
import { SessionDial } from './SessionDial';
import { ThemeToggle } from '../settings/ThemeToggle';
import type { ThemeControl } from '../settings/useTheme';

interface DashboardScreenProps {
  profile: UserProfile;
  /** ISO date; injected so the screen is deterministic in tests. */
  today: string;
  workouts: Workout[];
  sessions: WorkoutSession[];
  progression: ProgressionState[];
  /** Today's reminder, once it is due. Null the rest of the time. */
  reminder: Reminder | null;
  theme: ThemeControl;
}

const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const formatDate = (iso: string) => LONG_DATE.format(new Date(`${iso}T12:00:00`));

const titleCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

/**
 * A headline, one word at a time.
 *
 * Each word rises on its own delay, so the title reads as it arrives rather
 * than appearing all at once. The spaces between them are real text rather
 * than a flex gap: a gap looks identical and leaves the heading reading
 * "PushandCore" to a screen reader.
 */
const words = (text: string) =>
  text.split(' ').map((word, index) => (
    <Fragment key={`${word}-${index}`}>
      {index > 0 ? ' ' : ''}
      <span style={{ animationDelay: `${(0.1 + index * 0.1).toFixed(2)}s` }}>{word}</span>
    </Fragment>
  ));

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
  theme,
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

  // Today's session, if it has already been trained. One session per workout
  // per day is what the store can hold — the id is the date and the workout —
  // so offering START again would overwrite what was logged rather than add
  // to it.
  const doneToday = sessions.find(
    (s) =>
      s.date === today &&
      s.kind === 'training' &&
      s.workoutId === workout?.id &&
      (s.status === 'completed' || s.status === 'partial'),
  );

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

  // The session split into its three blocks, each with its own share of the
  // minutes — the numbers behind the dial and the contents list.
  const named: [string, WorkoutItem[]][] = workout
    ? [
        ['Warm-up', workout.warmUp],
        ['Main work', workout.mainWork],
        ['Mobility', workout.mobility],
      ]
    : [];

  let seen = 0;
  const blockMinutes = named
    .filter(([, items]) => items.length > 0)
    .map(([name, items]) => {
      const offset = seen;
      seen += items.length;
      return {
        name,
        items,
        offset,
        minutes: Math.max(1, Math.round(blockSeconds(items, exerciseById) / 60)),
      };
    });

  const totalMinutes = workout ? estimateWorkoutMinutes(workout, exerciseById) : 0;

  return (
    <div className="dash">
      {reminder !== null && <ReminderBanner reminder={reminder} />}

      <section className="hero" aria-labelledby="today-heading">
        <h2 className="visually-hidden" id="today-heading">
          Today
        </h2>

        <span className="ghost" aria-hidden="true">
          {today.slice(8).replace(/^0/, '')}
        </span>

        <div className="dash__head">
        <div className="dash__headline">
          <p className="dash__kicker">
            {formatDate(today)}
            <ThemeToggle control={theme} />
          </p>

          {workout && doneToday ? (
            <h1 className="display">
              {words(doneToday.status === 'completed' ? 'Done for today.' : 'Partly done.')}
            </h1>
          ) : workout ? (
            <h1 className="display">{words(workout.name)}</h1>
          ) : (
            <h1 className="display">{words('Rest day.')}</h1>
          )}

          <p className="dash__sub">
            {workout && doneToday
              ? `${workout.name} · ${completedSetCount(doneToday)} sets logged`
              : workout
                ? `${titleCase(spec.title)} · ${workoutBlocks(workout).length} exercises`
                : 'Nothing scheduled · the next session is the one that counts'}
          </p>
        </div>

          {workout && !doneToday && (
            <div className="dial-wrap" role="img" aria-label={`${totalMinutes} minutes`}>
              <SessionDial blocks={blockMinutes} total={totalMinutes} />
              <span className="dial__value" aria-hidden="true">
                <span className="dial__num">{totalMinutes}</span>
                <span className="dial__unit">min</span>
              </span>
            </div>
          )}
        </div>

        {workout && doneToday ? (
          <>
            <p className="hero__note">
              That is today handled. Anything else is optional &mdash; the next session is the
              one that counts.
            </p>
            <Link className="button button--primary hero__start" to={`/history/${doneToday.id}`}>
              See what you did
            </Link>
          </>
        ) : workout ? (
          <>
            {workout.notes && <p className="hero__note dropcap">{workout.notes}</p>}

            <div className="blocks">
              {blockMinutes.map((block, blockIndex) => (
                <div className="block" key={block.name}>
                  <p className="block__head">
                    <span className="block__roman">{ROMAN[blockIndex]}</span>
                    <span className="block__name">{block.name}</span>
                    <span className="block__mins">{block.minutes} min</span>
                  </p>
                  {block.items.map((item, itemIndex) => (
                    <p className="entry" key={`${item.exerciseId}-${itemIndex}`}>
                      <span className="entry__n">
                        {String(block.offset + itemIndex + 1).padStart(2, '0')}
                      </span>
                      <span className="entry__name">
                        {exerciseById(item.exerciseId)?.name ?? item.exerciseId}
                      </span>
                      <span className="entry__leader" />
                      <span className="entry__target">
                        {item.sets} &times; {describeTarget(item)}
                      </span>
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <Link className="button button--primary hero__start" to={`/workout/${workout.id}`}>
              Begin the session
            </Link>
          </>
        ) : (
          <p className="hero__note dropcap">
            Nothing is scheduled. Recovery is when the training you already did turns into
            muscle. If you want to move, a mobility routine takes five to nine minutes and is
            not counted toward progression.
          </p>
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
