import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WorkoutComplete } from './WorkoutComplete';
import type { Decision } from '../../domain/progression-engine';
import type { SessionExercise, SessionSet, WorkoutSession } from '../../domain/session';
import { aSession, aWorkout } from '../../test/factories';

const workout = aWorkout({ id: 'w-mon', name: 'Push and Core' });

const set = (setNumber: number, reps: number, rpe: number): SessionSet => ({
  setNumber,
  reps,
  seconds: null,
  rpe: rpe as SessionSet['rpe'],
  completed: true,
});

const logged = (sets: SessionSet[], exerciseId = 'push-up'): SessionExercise => ({
  exerciseId,
  block: 'main',
  prescribed: { sets: 3, measurement: 'reps', target: { min: 6, max: 10 } },
  sets,
  rpe: null,
});

const clean = [set(1, 10, 6), set(2, 10, 6), set(3, 10, 6)];
const hard = [set(1, 10, 9), set(2, 9, 9), set(3, 8, 9)];

const session = (exercises: SessionExercise[], overrides: Partial<WorkoutSession> = {}) =>
  aSession({ id: 'now', date: '2026-09-21', status: 'completed', exercises, ...overrides });

const decision = (action: Decision['action']): Decision =>
  ({
    exerciseId: 'push-up',
    action,
    verdict: 'cleared',
    reason: 'You cleared the top of the range.',
  }) as Decision;

const show = (
  exercises: SessionExercise[],
  decisions: Decision[] = [],
  history: WorkoutSession[] = [],
) =>
  render(
    <MemoryRouter>
      <WorkoutComplete
        workout={workout}
        session={session(exercises)}
        previousSession={undefined}
        notes=""
        onNotesChange={() => {}}
        decisions={decisions}
        history={history}
      />
    </MemoryRouter>,
  );

const coach = () => within(screen.getByRole('region', { name: /next time/i }));

describe('the coach on a good session', () => {
  it('reads the session back', () => {
    show([logged(clean)], [decision('add-reps')]);
    expect(coach().getByTestId('coach-headline')).toHaveTextContent(
      /all 3 sets at the top of the range/i,
    );
  });

  it('says what happens next', () => {
    show([logged(clean)], [decision('add-reps')]);
    expect(coach().getByTestId('coach-headline')).toHaveTextContent(/progress slightly next time/i);
  });

  it('says what to do about it', () => {
    show([logged(clean)], [decision('add-reps')]);
    expect(coach().getByTestId('coach-advice')).toHaveTextContent(/one thing at a time/i);
  });

  it('still explains each exercise on its own', () => {
    show([logged(clean)], [decision('add-reps')]);
    expect(coach().getByText(/you cleared the top of the range/i)).toBeInTheDocument();
  });
});

describe('the coach on a hard session', () => {
  it('keeps the variation and asks for control', () => {
    show([logged(hard)], [decision('hold')]);
    expect(coach().getByTestId('coach-headline')).toHaveTextContent(/controlled reps/i);
  });
});

describe('the coach after two hard sessions', () => {
  const earlier = session([logged(hard)], { id: 'earlier', date: '2026-09-19' });

  it('calls for recovery', () => {
    show([logged(hard)], [decision('hold')], [earlier]);
    expect(coach().getByTestId('coach-headline')).toHaveTextContent(/second hard session/i);
  });

  it('marks it as recovery rather than burying it in prose', () => {
    show([logged(hard)], [decision('hold')], [earlier]);
    expect(coach().getByTestId('coach-focus')).toHaveTextContent(/recovery/i);
  });

  it('does not call an ordinary session recovery', () => {
    show([logged(clean)], [decision('add-reps')]);
    expect(coach().getByTestId('coach-focus')).not.toHaveTextContent(/recovery/i);
  });
});

describe('the coach with nothing to go on', () => {
  it('says so rather than inventing a verdict', () => {
    show([], []);
    expect(coach().getByTestId('coach-headline')).toHaveTextContent(/nothing logged/i);
  });
});
