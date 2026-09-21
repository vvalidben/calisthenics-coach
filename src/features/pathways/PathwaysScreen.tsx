import { Link } from 'react-router-dom';
import { isExerciseAvailable, missingEquipmentFor } from '../../domain/availability';
import type { FamilyInfo } from '../../domain/family';
import type { Equipment } from '../../domain/primitives';
import type { UserProfile } from '../../domain/profile';
import { assessPhase } from '../../domain/phase';
import type { ProgressionState } from '../../domain/progression';
import type { WorkoutSession } from '../../domain/session';
import { EXERCISES, familyChain } from '../../content/catalog';
import { familiesByPathway } from '../../content/families';
import { requirePhaseSpec } from '../../content/phases';
import { PhasePanel } from './PhasePanel';

interface PathwaysScreenProps {
  progression: ProgressionState[];
  profile: UserProfile;
  sessions: WorkoutSession[];
  /** ISO date; injected so the screen renders deterministically in tests. */
  today: string;
}

const EQUIPMENT_NAMES: Record<Equipment, string> = {
  none: 'nothing',
  floor: 'floor space',
  wall: 'a wall',
  chair: 'a chair',
  towel: 'a towel',
  'pullup-bar': 'a pull-up bar',
  'parallel-bars': 'parallel bars',
};

/**
 * One ladder, drawn as a vertical list of steps.
 *
 * Every step is a link, so the map doubles as a way into the instructions.
 * Locked steps are shown rather than hidden — the library should look as
 * incomplete as it actually is until the equipment exists.
 */
const Ladder = ({
  family,
  profile,
  current,
}: {
  family: FamilyInfo;
  profile: UserProfile;
  current: string | undefined;
}) => {
  const chain = familyChain(family.id);
  const position = chain.findIndex((exercise) => exercise.id === current);

  return (
    <section className="ladder">
      <h3 className="ladder__name">{family.name}</h3>
      <p className="ladder__goal">{family.goal}</p>
      {family.caveat && <p className="ladder__caveat">{family.caveat}</p>}

      <ol className="ladder__steps" aria-label={`${family.name} ladder`}>
        {chain.map((exercise, index) => {
          const missing = missingEquipmentFor(exercise, profile);
          const locked = missing.length > 0;
          const isCurrent = index === position;
          const cleared = position >= 0 && index < position;

          const status = locked
            ? `Needs ${missing.map((item) => EQUIPMENT_NAMES[item]).join(' and ')}`
            : isCurrent
              ? 'You are here'
              : cleared
                ? 'Cleared'
                : 'Ahead';

          return (
            <li
              key={exercise.id}
              className={`step${isCurrent ? ' step--current' : ''}${cleared ? ' step--cleared' : ''}${locked ? ' step--locked' : ''}`}
              aria-label={exercise.name}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="step__level">{exercise.progressionLevel}</span>
              <Link className="step__name" to={`/library/${exercise.id}`}>
                {exercise.name}
              </Link>
              <span className="step__status">{status}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

/**
 * The map of every progression in the app, grouped by movement pattern.
 *
 * A pathway is a group of ladders, not one chain. Core holds three because
 * resisting extension, resisting sideways collapse and flexing under a hang are
 * different qualities — merging them would mean abandoning the front plank the
 * day you start side planks.
 */
export const PathwaysScreen = ({
  progression,
  profile,
  sessions,
  today,
}: PathwaysScreenProps) => {
  const currentByFamily = new Map(progression.map((s) => [s.family, s.currentExerciseId]));
  const usable = EXERCISES.filter((e) => isExerciseAvailable(e, profile)).length;

  return (
    <div className="pathways">
      <h1 className="page__title">Progress</h1>
      <p className="page__lede">
        Every movement in the app, from where you are to where it goes. {EXERCISES.length}{' '}
        exercises, {usable} of them usable with what you have today.
      </p>

      <PhasePanel
        assessment={assessPhase({
          spec: requirePhaseSpec(profile.currentPhase.name),
          profile,
          sessions,
          progression,
          today,
        })}
      />

      {familiesByPathway().map(({ pathway, families }) => (
        <section
          className="pathway"
          key={pathway.id}
          aria-labelledby={`pathway-${pathway.id}-heading`}
        >
          <h2 className="pathway__name" id={`pathway-${pathway.id}-heading`}>
            {pathway.name}
          </h2>
          <p className="pathway__summary">{pathway.summary}</p>
          {pathway.note && <p className="pathway__note">{pathway.note}</p>}

          {families.map((family) => (
            <Ladder
              key={family.id}
              family={family}
              profile={profile}
              current={currentByFamily.get(family.id)}
            />
          ))}
        </section>
      ))}
    </div>
  );
};
