import { Link } from 'react-router-dom';
import { isExerciseAvailable, missingEquipmentFor } from '../../domain/availability';
import type { Equipment } from '../../domain/primitives';
import type { ProgressionState } from '../../domain/progression';
import type { UserProfile } from '../../domain/profile';
import { EXERCISES, exerciseById, familyChain } from '../../content/catalog';
import { requireFamilyInfo } from '../../content/families';

interface FoundationScreenProps {
  progression: ProgressionState[];
  profile: UserProfile;
  schemaVersion: number;
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

const listEquipment = (items: Equipment[]): string =>
  items.map((item) => EQUIPMENT_NAMES[item]).join(' and ');

/**
 * One family as a strip of rungs: cleared behind you, amber where you stand,
 * empty ahead. The whole app is a ladder, so the ladder is what it shows.
 *
 * A family the athlete has no equipment for is shown greyed with what it needs,
 * not hidden. Hiding it would make the library look complete when it is not.
 */
const Family = ({ state, profile }: { state: ProgressionState; profile: UserProfile }) => {
  const info = requireFamilyInfo(state.family);
  const chain = familyChain(state.family);
  const current = exerciseById(state.currentExerciseId);
  const position = chain.findIndex((e) => e.id === state.currentExerciseId) + 1;
  const step = `Step ${position} of ${chain.length}`;

  const missing = current ? missingEquipmentFor(current, profile) : [];
  const locked = missing.length > 0;

  return (
    <li
      className={`family${locked ? ' family--locked' : ''}`}
      aria-label={`${info.name} progression`}
    >
      <div className="family__head">
        <h2 className="family__name">{info.name}</h2>
        <span className="family__step">{step}</span>
      </div>
      <p className="family__current">
        {current ? (
          <Link to={`/library/${current.id}`} className="family__link">
            {current.name}
          </Link>
        ) : (
          state.currentExerciseId
        )}
      </p>

      <div className="rungs" role="img" aria-label={`${info.name}: ${step}`}>
        {chain.map((exercise, index) => {
          const state_ =
            index + 1 < position ? ' rung--cleared' : index + 1 === position ? ' rung--current' : '';
          const unavailable = isExerciseAvailable(exercise, profile) ? '' : ' rung--unavailable';
          return (
            <span
              key={exercise.id}
              className={`rung${state_}${unavailable}`}
              style={{ animationDelay: `${index * 45}ms` }}
            />
          );
        })}
      </div>

      {locked && <p className="family__locked">Needs {listEquipment(missing)}</p>}
      {info.caveat && <p className="family__caveat">{info.caveat}</p>}
    </li>
  );
};

/**
 * A working view of the library: where every progression family starts, what is
 * locked behind equipment, and what the store currently holds.
 */
export const FoundationScreen = ({
  progression,
  profile,
  schemaVersion,
}: FoundationScreenProps) => {
  const usable = EXERCISES.filter((e) => isExerciseAvailable(e, profile)).length;

  return (
    <div>
      <h1 className="page__title">Progressions</h1>
      <p className="page__lede">
        Every movement sits on a ladder running from something you can already do to something
        you cannot yet. The coach moves you one rung at a time.
      </p>

      <ul className="families">
        {progression.map((state) => (
          <Family key={state.family} state={state} profile={profile} />
        ))}
      </ul>

      <dl className="store">
        <div>
          <dt>Library</dt>
          <dd>
            {EXERCISES.length} exercises across {progression.length} families, {usable} usable
            without equipment
          </dd>
        </div>
        <div>
          <dt>Storage</dt>
          <dd>On this device, schema version {schemaVersion}</dd>
        </div>
      </dl>
    </div>
  );
};
