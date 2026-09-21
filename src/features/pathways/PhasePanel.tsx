import type { PhaseAssessment, PhaseDimension, Requirement } from '../../domain/phase';
import { PHASES } from '../../content/phases';

/** What each dimension is called, in the athlete's terms. */
const DIMENSION_LABELS: Record<PhaseDimension, string> = {
  consistency: 'Consistency',
  technique: 'Technique',
  strength: 'Strength',
  performance: 'Exercise performance',
  recovery: 'Recovery',
};

const ORDER: PhaseDimension[] = [
  'consistency',
  'technique',
  'strength',
  'performance',
  'recovery',
];

const titleOf = (name: string) => PHASES.find((p) => p.name === name)?.title ?? name;

const Group = ({
  dimension,
  requirements,
}: {
  dimension: PhaseDimension;
  requirements: Requirement[];
}) => (
  <div className="phase__group">
    <h3 className="phase__dimension">{DIMENSION_LABELS[dimension]}</h3>
    <ul className="phase__requirements">
      {requirements.map((requirement) => (
        <li
          className={`phase__requirement${requirement.met ? ' phase__requirement--met' : ''}`}
          key={requirement.id}
          aria-label={`${requirement.label}, ${requirement.progress}, ${
            requirement.met ? 'met' : 'not met'
          }`}
          data-met={requirement.met}
        >
          <span className="phase__mark" aria-hidden="true">
            {requirement.met ? '\u2713' : '\u00b7'}
          </span>
          <span className="phase__label">{requirement.label}</span>
          <span className="phase__progress">{requirement.progress}</span>
        </li>
      ))}
    </ul>
  </div>
);

/**
 * Where the athlete is in the long game, and exactly what moves them on.
 *
 * Every criterion is shown with its own number rather than a single percentage.
 * "Four more sessions and three more push-ups" is something an athlete can act
 * on this week; "62% of the way through Foundation" is not.
 */
export const PhasePanel = ({ assessment }: { assessment: PhaseAssessment }) => {
  const { spec, requirements, metCount, next } = assessment;
  const groups = ORDER.map(
    (dimension) => [dimension, requirements.filter((r) => r.dimension === dimension)] as const,
  ).filter(([, items]) => items.length > 0);

  return (
    <section className="phase" aria-label="Training phase">
      <p className="phase__ordinal">
        Phase {spec.ordinal} of {PHASES.length}
      </p>
      <h2 className="phase__name">{spec.title}</h2>
      <p className="phase__focus">{spec.focus}</p>
      <p className="phase__summary">{spec.summary}</p>

      {next === null ? (
        <p className="phase__note">
          This is as far as the ladder goes. The skills themselves keep going for years.
        </p>
      ) : (
        <>
          <p className="phase__note">
            You move to <strong>{titleOf(next)}</strong> by what you can do, not by how long you
            have been here. Every criterion below has to be true at once.
          </p>
          <p className="phase__count" data-testid="phase-progress">
            {metCount} of {requirements.length} met
          </p>
          {groups.map(([dimension, items]) => (
            <Group key={dimension} dimension={dimension} requirements={items} />
          ))}
        </>
      )}
    </section>
  );
};
