import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isExerciseAvailable, missingEquipmentFor } from '../../domain/availability';
import type { Exercise } from '../../domain/exercise';
import type { Equipment } from '../../domain/primitives';
import type { UserProfile } from '../../domain/profile';
import { EXERCISES, familyChain } from '../../content/catalog';
import { FAMILY_INFO } from '../../content/families';

interface ExerciseListProps {
  profile: UserProfile;
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

const matches = (exercise: Exercise, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return (
    exercise.name.toLowerCase().includes(q) ||
    exercise.id.includes(q) ||
    exercise.tags.some((tag) => tag.toLowerCase().includes(q)) ||
    exercise.summary.toLowerCase().includes(q)
  );
};

/**
 * The way into an exercise. Ordered by family and by difficulty within it, so
 * the list reads as a set of ladders rather than an alphabetical pile.
 */
export const ExerciseList = ({ profile }: ExerciseListProps) => {
  const [query, setQuery] = useState('');

  const groups = useMemo(
    () =>
      FAMILY_INFO.map((info) => ({
        info,
        exercises: familyChain(info.id).filter((e) => matches(e, query)),
      })).filter((group) => group.exercises.length > 0),
    [query],
  );

  const usable = EXERCISES.filter((e) => isExerciseAvailable(e, profile)).length;

  return (
    <div className="library">
      <h1 className="page__title">Exercises</h1>
      <p className="page__lede">
        Every movement, with full instructions. {usable} of {EXERCISES.length} need nothing you do
        not already have.
      </p>

      <input
        type="search"
        className="library__search"
        placeholder="Search by name or tag"
        aria-label="Search exercises"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {groups.length === 0 ? (
        <p className="library__empty">
          No exercise matches &ldquo;{query}&rdquo;. Try a movement name like plank, or a tag like
          mobility.
        </p>
      ) : (
        groups.map(({ info, exercises }) => (
          <section className="library__group" key={info.id}>
            <h2 className="library__family">{info.name}</h2>
            <p className="library__goal">{info.goal}</p>
            <ol className="library__items">
              {exercises.map((exercise) => {
                const missing = missingEquipmentFor(exercise, profile);
                const needs =
                  missing.length > 0
                    ? `Needs ${missing.map((item) => EQUIPMENT_NAMES[item]).join(' and ')}`
                    : undefined;
                return (
                  <li key={exercise.id}>
                    <Link
                      to={`/library/${exercise.id}`}
                      // The level number is useful to see and noise to hear.
                      aria-label={needs ? `${exercise.name}. ${needs}` : exercise.name}
                      className={`library__item${missing.length > 0 ? ' library__item--locked' : ''}`}
                    >
                      <span className="library__level">{exercise.progressionLevel}</span>
                      <span className="library__name">{exercise.name}</span>
                      {needs && <span className="library__needs">{needs}</span>}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      )}
    </div>
  );
};
