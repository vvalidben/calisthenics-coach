import { exerciseById } from '../../content/catalog';
import type { Ability, UserProfile } from '../../domain/profile';

interface TodayScreenProps {
  profile: UserProfile;
  /** ISO date; injected so the screen is deterministic in tests. */
  today: string;
}

const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const formatDate = (iso: string) => LONG_DATE.format(new Date(`${iso}T00:00:00`));

const unitFor = (ability: Ability): string => {
  switch (ability.measurement) {
    case 'reps':
      return 'reps';
    case 'reps-per-side':
      return 'reps per side';
    case 'time':
      return 'seconds';
    case 'time-per-side':
      return 'seconds per side';
  }
};

const Baseline = ({ ability }: { ability: Ability }) => {
  const exercise = exerciseById(ability.exerciseId);
  const name = exercise?.name ?? ability.exerciseId;
  const untested = ability.value === null;

  return (
    <li className={`baseline${untested ? ' baseline--untested' : ''}`} aria-label={name}>
      <span className="baseline__value" aria-hidden={untested}>
        {untested ? '—' : ability.value}
      </span>
      <span>
        <span className="baseline__name">{name}</span>
        <br />
        <span className="baseline__unit">{untested ? 'Not tested yet' : unitFor(ability)}</span>
      </span>
    </li>
  );
};

/**
 * The first thing the athlete sees. Until the program engine exists there is
 * genuinely nothing scheduled, so the screen says that outright rather than
 * showing an invented workout.
 */
export const TodayScreen = ({ profile, today }: TodayScreenProps) => {
  const phaseName = profile.currentPhase.name.replace(/-/g, ' ');

  return (
    <div className="today">
      <p className="today__date">{formatDate(today)}</p>
      <h1 className="today__headline">No workout scheduled</h1>
      <p className="today__lede">
        Your program gets built in Sprint 2. Until then this screen has nothing honest to put
        here, so it stays empty.
      </p>

      <p className="today__phase">
        <strong>{phaseName} phase</strong>
        {profile.trainingDays.length} days a week, {profile.sessionDuration.min}&ndash;
        {profile.sessionDuration.max} minutes a session
      </p>

      <section className="baselines">
        <h2 className="baselines__title">Where you&rsquo;re starting</h2>
        <p className="baselines__note">
          Measured {formatDate(profile.currentAbilities[0]?.assessedAt ?? today)}. Everything
          the coach prescribes will be built from these.
        </p>
        <ul className="baselines__list">
          {profile.currentAbilities.map((ability) => (
            <Baseline key={ability.exerciseId} ability={ability} />
          ))}
        </ul>
      </section>
    </div>
  );
};
