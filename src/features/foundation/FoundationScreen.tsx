import { EXERCISES, exerciseById, familyChain } from '../../content/catalog';
import type { ProgressionState } from '../../domain/progression';

interface FoundationScreenProps {
  progression: ProgressionState[];
  schemaVersion: number;
}

const FAMILY_NAMES: Record<string, string> = {
  push: 'Push',
  dip: 'Dip',
  pull: 'Pull',
  squat: 'Squat',
  core: 'Core',
  handstand: 'Handstand',
  'shoulder-mobility': 'Shoulder mobility',
  'hip-mobility': 'Hip mobility',
  'spine-hamstring-mobility': 'Spine and hamstrings',
};

/**
 * One family as a strip of rungs: cleared behind you, amber where you stand,
 * empty ahead. The whole app is a ladder, so the ladder is what it shows.
 */
const Family = ({ state }: { state: ProgressionState }) => {
  const chain = familyChain(state.family);
  const current = exerciseById(state.currentExerciseId);
  const position = chain.findIndex((e) => e.id === state.currentExerciseId) + 1;
  const name = FAMILY_NAMES[state.family] ?? state.family;
  const step = `Step ${position} of ${chain.length}`;

  return (
    <li className="family" aria-label={`${name} progression`}>
      <div className="family__head">
        <h2 className="family__name">{name}</h2>
        <span className="family__step">{step}</span>
      </div>
      <p className="family__current">{current?.name ?? state.currentExerciseId}</p>
      <div className="rungs" role="img" aria-label={`${name}: ${step}`}>
        {chain.map((exercise, index) => {
          const modifier =
            index + 1 < position ? ' rung--cleared' : index + 1 === position ? ' rung--current' : '';
          return (
            <span
              key={exercise.id}
              className={`rung${modifier}`}
              style={{ animationDelay: `${index * 45}ms` }}
            />
          );
        })}
      </div>
    </li>
  );
};

/**
 * A working view of the foundation: where every progression family starts, and
 * what the store currently holds. It stays useful once real sprints land — this
 * is the screen that answers "did that actually save?".
 */
export const FoundationScreen = ({ progression, schemaVersion }: FoundationScreenProps) => (
  <div>
    <h1 className="page__title">Progressions</h1>
    <p className="page__lede">
      Nine ladders, each running from something you can already do to something you cannot yet.
      The coach moves you one rung at a time.
    </p>

    <ul className="families">
      {progression.map((state) => (
        <Family key={state.family} state={state} />
      ))}
    </ul>

    <dl className="store">
      <div>
        <dt>Catalog</dt>
        <dd>{EXERCISES.length} exercises across {progression.length} families</dd>
      </div>
      <div>
        <dt>Storage</dt>
        <dd>On this device, schema version {schemaVersion}</dd>
      </div>
    </dl>
  </div>
);
