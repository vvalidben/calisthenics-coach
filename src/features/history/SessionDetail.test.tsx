import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionDetail } from './SessionDetail';
import type { SessionExercise, WorkoutSession } from '../../domain/session';
import { aSession, aWorkout } from '../../test/factories';

const workout = aWorkout({ id: 'w-mon', name: 'Push and Core', day: 'monday' });

const anExerciseLog = (overrides: Partial<SessionExercise> = {}): SessionExercise => ({
  exerciseId: 'push-up',
  block: 'main',
  prescribed: { sets: 3, measurement: 'reps', target: { min: 6, max: 10 } },
  sets: [
    { setNumber: 1, reps: 10, seconds: null, rpe: 6, completed: true },
    { setNumber: 2, reps: 9, seconds: null, rpe: 8, completed: true },
    { setNumber: 3, reps: 7, seconds: null, rpe: 9, completed: true },
  ],
  rpe: 8,
  ...overrides,
});

const aFullSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession =>
  aSession({
    id: '2026-09-21-w-mon',
    workoutId: 'w-mon',
    date: '2026-09-21',
    status: 'completed',
    durationSeconds: 1500,
    exercises: [anExerciseLog()],
    overallRpe: 8,
    ...overrides,
  });

const show = (session: WorkoutSession) =>
  render(
    <MemoryRouter>
      <SessionDetail session={session} workout={workout} />
    </MemoryRouter>,
  );

const exerciseRow = (name: RegExp) => screen.getByRole('listitem', { name });

describe('what the session was', () => {
  it('names the workout', () => {
    show(aFullSession());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Push and Core');
  });

  it('says which day it was', () => {
    show(aFullSession());
    expect(screen.getByText(/monday, 21 september/i)).toBeInTheDocument();
  });

  it('falls back to a plain title when the workout is no longer in the program', () => {
    render(
      <MemoryRouter>
        <SessionDetail session={aFullSession()} workout={undefined} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/workout/i);
  });
});

describe('the summary', () => {
  it('shows how long it took', () => {
    show(aFullSession());
    expect(screen.getByTestId('detail-duration')).toHaveTextContent('25 min');
  });

  it('shows a dash when the duration was never recorded', () => {
    show(aFullSession({ durationSeconds: null }));
    expect(screen.getByTestId('detail-duration')).toHaveTextContent('\u2014');
  });

  it('counts the exercises', () => {
    show(aFullSession());
    expect(screen.getByTestId('detail-exercises')).toHaveTextContent('1');
  });

  it('counts the sets against what was planned', () => {
    show(aFullSession());
    expect(screen.getByTestId('detail-sets')).toHaveTextContent('3 of 3');
  });

  it('totals the reps', () => {
    show(aFullSession());
    expect(screen.getByTestId('detail-reps')).toHaveTextContent('26');
  });

  it('reports the difficulty as a word', () => {
    show(aFullSession());
    expect(screen.getByTestId('detail-difficulty')).toHaveTextContent('Hard');
  });
});

describe('the exercises', () => {
  it('names each one', () => {
    show(aFullSession());
    expect(exerciseRow(/push-up/i)).toBeInTheDocument();
  });

  it('shows what was asked for', () => {
    show(aFullSession());
    expect(exerciseRow(/push-up/i)).toHaveTextContent(/3 sets of 6\u201310 reps/i);
  });

  it('shows every set that was performed', () => {
    show(aFullSession());
    const sets = within(exerciseRow(/push-up/i)).getAllByTestId('set-row');
    expect(sets).toHaveLength(3);
  });

  it('shows the reps and the difficulty for a set', () => {
    show(aFullSession());
    const sets = within(exerciseRow(/push-up/i)).getAllByTestId('set-row');
    expect(sets[0]).toHaveTextContent('10 reps');
    expect(sets[0]).toHaveTextContent('Moderate');
  });

  it('shows seconds for a timed exercise', () => {
    const plank = anExerciseLog({
      exerciseId: 'front-plank',
      prescribed: { sets: 1, measurement: 'time', target: { min: 20, max: 45 } },
      sets: [{ setNumber: 1, reps: null, seconds: 30, rpe: 8, completed: true }],
    });
    show(aFullSession({ exercises: [plank] }));
    expect(within(exerciseRow(/plank/i)).getByTestId('set-row')).toHaveTextContent('30s');
  });

  it('shows a set that was skipped rather than hiding it', () => {
    const skipped = anExerciseLog({
      sets: [
        { setNumber: 1, reps: 10, seconds: null, rpe: 6, completed: true },
        { setNumber: 2, reps: null, seconds: null, rpe: null, completed: false },
      ],
    });
    show(aFullSession({ exercises: [skipped] }));
    const sets = within(exerciseRow(/push-up/i)).getAllByTestId('set-row');
    expect(sets[1]).toHaveTextContent(/skipped/i);
  });

  it('separates the warm-up from the main work', () => {
    const session = aFullSession({
      exercises: [anExerciseLog({ exerciseId: 'cat-cow', block: 'warm-up' }), anExerciseLog()],
    });
    show(session);
    expect(screen.getByRole('heading', { name: /warm-up/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /main work/i })).toBeInTheDocument();
  });
});

describe('notes', () => {
  it('shows what was written', () => {
    show(aFullSession({ notes: 'Wrists sore on the last set.' }));
    expect(screen.getByText('Wrists sore on the last set.')).toBeInTheDocument();
  });

  it('says so when nothing was written', () => {
    show(aFullSession());
    expect(screen.getByText(/nothing written down/i)).toBeInTheDocument();
  });
});

describe('a missed session', () => {
  const missed = aFullSession({
    status: 'missed',
    exercises: [],
    durationSeconds: null,
    completedAt: null,
    overallRpe: null,
  });

  it('says plainly that nothing was logged', () => {
    show(missed);
    expect(screen.getByText(/nothing was logged/i)).toBeInTheDocument();
  });

  it('does not pretend there were exercises', () => {
    show(missed);
    expect(screen.queryAllByTestId('set-row')).toHaveLength(0);
  });
});

describe('getting back', () => {
  it('links back to the calendar', () => {
    show(aFullSession());
    expect(screen.getByRole('link', { name: /history/i })).toHaveAttribute('href', '/history');
  });
});
