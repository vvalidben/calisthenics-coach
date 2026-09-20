import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { missingEquipmentFor } from '../../domain/availability';
import type { Exercise } from '../../domain/exercise';
import type { Equipment } from '../../domain/primitives';
import type { UserProfile } from '../../domain/profile';
import { exerciseById } from '../../content/catalog';
import { familyInfo } from '../../content/families';
import { FigureDemo } from '../demo/FigureDemo';

interface ExerciseDetailProps {
  exercise: Exercise;
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

const Section = ({
  id,
  title,
  children,
  lead,
}: {
  id: string;
  title: string;
  children: ReactNode;
  lead?: string;
}) => (
  <section className="detail__section" aria-labelledby={`${id}-heading`}>
    <h2 className="detail__heading" id={`${id}-heading`}>
      {title}
    </h2>
    {lead && <p className="detail__lead">{lead}</p>}
    {children}
  </section>
);

const NeighbourLink = ({ id, kind }: { id: string | null; kind: 'easier' | 'harder' }) => {
  const neighbour = id === null ? undefined : exerciseById(id);
  if (!neighbour) {
    return (
      <p className="detail__none">
        {kind === 'easier'
          ? 'This is the easiest step in its family. Nothing below it.'
          : 'This is the hardest step in its family. Nothing above it yet.'}
      </p>
    );
  }
  return (
    <Link className="detail__neighbour" to={`/library/${neighbour.id}`}>
      <span className="detail__neighbour-name">{neighbour.name}</span>
      <span className="detail__neighbour-why">{neighbour.summary}</span>
    </Link>
  );
};

/**
 * The instruction experience: everything you need to perform one exercise
 * correctly, on one page.
 *
 * The written instructions are always rendered. The visual sequence sits at the
 * top because it orients you fastest, but nothing is hidden behind it and
 * nothing requires interaction to read.
 */
export const ExerciseDetail = ({ exercise, profile }: ExerciseDetailProps) => {
  const missing = missingEquipmentFor(exercise, profile);
  const family = familyInfo(exercise.family);
  const position = exercise.startingPosition;

  const POSITION_SLOTS: { label: string; value: string }[] = [
    { label: 'Hands', value: position.hands },
    { label: 'Feet', value: position.feet },
    { label: 'Body', value: position.body },
    { label: 'Spine', value: position.spine },
    { label: 'Head', value: position.head },
    { label: 'Shoulders', value: position.shoulders },
    { label: 'Hips', value: position.hips },
  ];

  return (
    <article className="detail">
      <header className="detail__header">
        <p className="detail__family">{family?.name ?? exercise.family}</p>
        <h1 className="detail__title">{exercise.name}</h1>
        <p className="detail__summary">{exercise.summary}</p>
      </header>

      {missing.length > 0 && (
        <p className="detail__blocked" role="alert">
          You need {missing.map((item) => EQUIPMENT_NAMES[item]).join(' and ')} for this. It is
          here so it is ready when you have it.
        </p>
      )}

      {family?.caveat && <p className="detail__caveat">{family.caveat}</p>}

      <FigureDemo exerciseName={exercise.name} demo={exercise.demo} />

      <a className="detail__how" href="#starting-position-heading">
        How to do it
      </a>

      <Section
        id="starting-position"
        title="Starting position"
        lead="Set every one of these before the first rep."
      >
        <dl className="detail__position">
          {POSITION_SLOTS.map((slot) => (
            <div className="detail__position-row" key={slot.label}>
              <dt>{slot.label}</dt>
              <dd>{slot.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="steps" title="Movement steps">
        <ol className="detail__steps">
          {exercise.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Section>

      <Section id="breathing" title="Breathing">
        <dl className="detail__pairs">
          <div className="detail__pair">
            <dt>Inhale</dt>
            <dd>{exercise.breathing.inhale}</dd>
          </div>
          <div className="detail__pair">
            <dt>Exhale</dt>
            <dd>{exercise.breathing.exhale}</dd>
          </div>
        </dl>
        {exercise.breathing.note && <p className="detail__note">{exercise.breathing.note}</p>}
      </Section>

      {exercise.tempo && (
        <Section id="tempo" title="Tempo">
          <ol className="detail__tempo">
            {exercise.tempo.phases.map((phase) => (
              <li key={phase.label}>
                <span className="detail__tempo-time">{phase.seconds}s</span>
                <span className="detail__tempo-label">{phase.label}</span>
              </li>
            ))}
          </ol>
          {exercise.tempo.note && <p className="detail__note">{exercise.tempo.note}</p>}
        </Section>
      )}

      <Section id="feel" title="What you should feel">
        <p className="detail__feel-working">{exercise.sensation.working}</p>
        <h3 className="detail__subheading">Also normal</h3>
        <ul className="detail__list">
          {exercise.sensation.alsoNormal.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3 className="detail__subheading detail__subheading--warn">Stop if you feel</h3>
        <ul className="detail__list detail__list--warn">
          {exercise.sensation.notNormal.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section id="mistakes" title="Common mistakes">
        <ul className="detail__mistakes">
          {exercise.commonMistakes.map((item) => (
            <li key={item.mistake}>
              <p className="detail__mistake">{item.mistake}</p>
              <p className="detail__fix">{item.fix}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="cues" title="Coaching cues" lead="Short enough to say to yourself mid-set.">
        <ul className="detail__cues">
          {exercise.cues.map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ul>
      </Section>

      <Section id="safety" title="Safety">
        <dl className="detail__pairs">
          <div className="detail__pair">
            <dt>Normal effort</dt>
            <dd>{exercise.safety.normalEffort}</dd>
          </div>
          <div className="detail__pair">
            <dt>Normal fatigue</dt>
            <dd>{exercise.safety.normalFatigue}</dd>
          </div>
        </dl>
        <h3 className="detail__subheading detail__subheading--warn">Concerning pain</h3>
        <ul className="detail__list detail__list--warn">
          {exercise.safety.concerningPain.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3 className="detail__subheading detail__subheading--warn">Stop if</h3>
        <ul className="detail__list detail__list--warn">
          {exercise.safety.stopIf.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3 className="detail__subheading">Modify if</h3>
        <ul className="detail__list">
          {exercise.safety.modifyIf.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section id="easier" title="Easier version">
        <NeighbourLink id={exercise.regression} kind="easier" />
      </Section>

      <Section id="harder" title="Harder version">
        <NeighbourLink id={exercise.progression} kind="harder" />
      </Section>
    </article>
  );
};
