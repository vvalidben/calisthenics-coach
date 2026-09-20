import { Link } from 'react-router-dom';
import { estimateWorkoutMinutes } from '../../domain/duration';
import { WEEKDAYS, type Weekday } from '../../domain/primitives';
import type { UserProfile } from '../../domain/profile';
import { describeTarget, type Workout, type WorkoutItem } from '../../domain/workout';
import { exerciseById } from '../../content/catalog';
import { weekdayOf } from '../../domain/calendar';

interface TodayScreenProps {
  profile: UserProfile;
  /** ISO date; injected so the screen is deterministic in tests. */
  today: string;
  workouts: Workout[];
}

const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const formatDate = (iso: string) => LONG_DATE.format(new Date(`${iso}T12:00:00`));

const titleCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const PrescribedExercise = ({ item }: { item: WorkoutItem }) => {
  const exercise = exerciseById(item.exerciseId);
  const name = exercise?.name ?? item.exerciseId;

  return (
    <li className="prescribed" aria-label={name}>
      <div className="prescribed__head">
        <h3 className="prescribed__name">{name}</h3>
        {exercise && (
          <span className="prescribed__difficulty">Difficulty {exercise.difficulty}</span>
        )}
      </div>

      <p className="prescribed__dose">
        <span>
          {item.sets} {item.sets === 1 ? 'set' : 'sets'}
        </span>
        <span>{describeTarget(item)}</span>
        <span>{item.restSeconds}s rest</span>
      </p>

      <p className="prescribed__cue">{item.cue}</p>
      {item.note && <p className="prescribed__note">{item.note}</p>}

      <Link className="prescribed__link" to={`/library/${item.exerciseId}`}>
        How to do it
      </Link>
    </li>
  );
};

const Block = ({ id, title, items }: { id: string; title: string; items: WorkoutItem[] }) =>
  items.length === 0 ? null : (
    <section className="block" aria-labelledby={`${id}-heading`}>
      <h2 className="block__heading" id={`${id}-heading`}>
        {title}
      </h2>
      <ol className="block__items">
        {items.map((item) => (
          <PrescribedExercise key={item.exerciseId} item={item} />
        ))}
      </ol>
    </section>
  );

/** The seven-day strip, so the shape of the week is visible at a glance. */
const Week = ({ workouts, today }: { workouts: Workout[]; today: Weekday }) => (
  <section className="week" aria-labelledby="week-heading">
    <h2 className="week__heading" id="week-heading">
      This week
    </h2>
    <ol className="week__days">
      {WEEKDAYS.map((day) => {
        const workout = workouts.find((w) => w.day === day);
        return (
          <li
            key={day}
            className={`week__day${workout ? ' week__day--training' : ''}`}
            aria-current={day === today ? 'date' : undefined}
          >
            <span className="week__name">{titleCase(day).slice(0, 3)}</span>
            <span className="week__label">{workout ? workout.focus.replace(/-/g, ' ') : 'Rest'}</span>
          </li>
        );
      })}
    </ol>
  </section>
);

/**
 * What to do today. On a training day that is the whole session; on a rest day
 * it says so and names what is next, so the week never feels like a gap.
 */
export const TodayScreen = ({ profile, today, workouts }: TodayScreenProps) => {
  const weekday = weekdayOf(today);
  const workout = workouts.find((w) => w.day === weekday);

  if (!workout) {
    // Walk forward through the week, wrapping, to find the next session.
    const startIndex = WEEKDAYS.indexOf(weekday);
    const next = WEEKDAYS.map((_, offset) => WEEKDAYS[(startIndex + offset + 1) % 7]!)
      .map((day) => workouts.find((w) => w.day === day))
      .find((w): w is Workout => w !== undefined);

    return (
      <div className="today">
        <p className="today__date">{formatDate(today)}</p>
        <h1 className="today__headline">Rest day</h1>
        <p className="today__lede">
          Nothing scheduled. Recovery is when the training you already did turns into muscle.
        </p>

        {next && (
          <p className="today__next">
            <strong>Next: {titleCase(next.day)}</strong>
            {next.name}, about {next.estimatedMinutes} minutes
          </p>
        )}

        <Week workouts={workouts} today={weekday} />
      </div>
    );
  }

  const minutes = estimateWorkoutMinutes(workout, exerciseById);

  return (
    <div className="today">
      <p className="today__date">{formatDate(today)}</p>
      <h1 className="today__headline">{workout.name}</h1>
      <p className="today__meta">
        {workout.focus.replace(/-/g, ' ')} &middot; about {minutes} minutes &middot;{' '}
        {titleCase(profile.currentPhase.name.replace(/-/g, ' '))} phase
      </p>
      {workout.notes && <p className="today__lede">{workout.notes}</p>}

      <Link className="today__start" to={`/workout/${workout.id}`}>
        Start workout
      </Link>

      <Block id="warm-up" title="Warm-up" items={workout.warmUp} />
      <Block id="main" title="Main workout" items={workout.mainWork} />
      <Block id="mobility" title="Mobility" items={workout.mobility} />

      <Week workouts={workouts} today={weekday} />
    </div>
  );
};
