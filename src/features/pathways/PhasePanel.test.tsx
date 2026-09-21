import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PhasePanel } from './PhasePanel';
import { assessPhase } from '../../domain/phase';
import type { PhaseName } from '../../domain/profile';
import type { SessionExercise, SessionSet, WorkoutSession } from '../../domain/session';
import { requirePhaseSpec } from '../../content/phases';
import { SEED_PROGRESSION } from '../../content/seed-progression';
import { aProfile, aSession } from '../../test/factories';

const profile = aProfile({
  trainingDays: ['monday', 'tuesday', 'thursday', 'saturday'],
  currentPhase: { name: 'foundation', startedAt: '2026-09-01', plannedWeeks: 4 },
});

const TODAY = '2026-09-28';

const set = (setNumber: number, reps: number): SessionSet => ({
  setNumber,
  reps,
  seconds: null,
  rpe: 6,
  completed: true,
});

const pushUps = (reps: number): SessionExercise => ({
  exerciseId: 'push-up',
  block: 'main',
  prescribed: { sets: 3, measurement: 'reps', target: { min: 6, max: 10 } },
  sets: [set(1, reps), set(2, reps), set(3, reps)],
  rpe: null,
});

const trained = (date: string, reps = 10): WorkoutSession =>
  aSession({ id: date, date, kind: 'training', status: 'completed', exercises: [pushUps(reps)] });

const show = (sessions: WorkoutSession[] = [], phase: PhaseName = 'foundation') => {
  const spec = requirePhaseSpec(phase);
  const assessment = assessPhase({
    spec,
    profile: { ...profile, currentPhase: { ...profile.currentPhase, name: phase } },
    sessions,
    progression: SEED_PROGRESSION,
    today: TODAY,
  });
  return render(<PhasePanel assessment={assessment} />);
};

const panel = () => within(screen.getByRole('region', { name: /training phase/i }));

describe('where the athlete is', () => {
  it('names the phase', () => {
    show();
    expect(panel().getByRole('heading', { level: 2 })).toHaveTextContent(/foundation/i);
  });

  it('says which of the four it is', () => {
    show();
    expect(panel().getByText(/phase 1 of 4/i)).toBeInTheDocument();
  });

  it('says what the phase is for', () => {
    show();
    expect(panel().getByText(/technique and consistency/i)).toBeInTheDocument();
  });

  it('explains it in more than a slogan', () => {
    show();
    expect(panel().getByText(/turn up four times a week/i)).toBeInTheDocument();
  });
});

describe('what it takes to move on', () => {
  it('lists every requirement', () => {
    show();
    expect(panel().getAllByRole('listitem')).toHaveLength(7);
  });

  it('shows how far along each one is', () => {
    show([trained('2026-09-21')]);
    expect(panel().getByRole('listitem', { name: /12 sessions/i })).toHaveTextContent('1 of 12');
  });

  it('marks the ones already met', () => {
    show([trained('2026-09-21')]);
    const benchmark = panel().getByRole('listitem', { name: /3 sets of 10 push-ups/i });
    expect(benchmark).toHaveAttribute('data-met', 'true');
  });

  it('marks the ones still outstanding', () => {
    show([trained('2026-09-21', 6)]);
    const benchmark = panel().getByRole('listitem', { name: /3 sets of 10 push-ups/i });
    expect(benchmark).toHaveAttribute('data-met', 'false');
  });

  it('counts them up', () => {
    show();
    expect(panel().getByTestId('phase-progress')).toHaveTextContent(/1 of 7/);
  });

  it('groups them by what they measure', () => {
    show();
    for (const dimension of ['Consistency', 'Technique', 'Strength', 'Recovery']) {
      expect(panel().getByText(dimension)).toBeInTheDocument();
    }
  });

  it('says plainly that time alone will not do it', () => {
    show();
    expect(panel().getByText(/not by how long/i)).toBeInTheDocument();
  });

  it('names the phase being worked toward', () => {
    show();
    expect(panel().getByText(/strength development/i)).toBeInTheDocument();
  });
});

describe('the last phase', () => {
  it('does not dangle a next one that does not exist', () => {
    show([], 'skill-development');
    expect(panel().queryByTestId('phase-progress')).not.toBeInTheDocument();
  });

  it('says this is where the ladder ends', () => {
    show([], 'skill-development');
    expect(panel().getByText(/as far as the ladder goes/i)).toBeInTheDocument();
  });
});
