import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HistoryScreen } from './HistoryScreen';
import type { WorkoutSession } from '../../domain/session';
import type { Workout } from '../../domain/workout';
import { aProfile, aSession, aWorkout } from '../../test/factories';

const profile = aProfile({ trainingDays: ['monday', 'tuesday', 'thursday', 'saturday'] });

const MON = '2026-09-21';
const TUE = '2026-09-22';
const WED = '2026-09-23';
const THU = '2026-09-24';
const SAT = '2026-09-26';

const workouts: Workout[] = [
  aWorkout({ id: 'w-mon', name: 'Push and Core', day: 'monday' }),
  aWorkout({ id: 'w-tue', name: 'Legs and Mobility', day: 'tuesday' }),
  aWorkout({ id: 'w-thu', name: 'Upper Body and Core', day: 'thursday' }),
  aWorkout({ id: 'w-sat', name: 'Full Body', day: 'saturday' }),
  aWorkout({ id: 'mobility-hips', name: 'Hips', day: null, kind: 'mobility', warmUp: [] }),
];

const trained = (date: string, overrides: Partial<WorkoutSession> = {}): WorkoutSession =>
  aSession({ id: `${date}-t`, date, kind: 'training', status: 'completed', ...overrides });

const stretched = (date: string): WorkoutSession =>
  aSession({
    id: `${date}-m`,
    date,
    kind: 'mobility',
    status: 'completed',
    workoutId: 'mobility-hips',
  });

const show = (sessions: WorkoutSession[], today = SAT, weeks = 1) =>
  render(
    <MemoryRouter>
      <HistoryScreen
        profile={profile}
        today={today}
        workouts={workouts}
        sessions={sessions}
        weeks={weeks}
      />
    </MemoryRouter>,
  );

/** The most recent week on the page. */
const thisWeek = () => within(screen.getByRole('region', { name: /week of 21 sep/i }));

/** One row from the week's list of training days. */
const row = (name: RegExp) => thisWeek().getByRole('listitem', { name });

describe('the week', () => {
  it('is labelled by the Monday it starts on', () => {
    show([]);
    expect(screen.getByRole('region', { name: /week of 21 sep/i })).toBeInTheDocument();
  });

  it('shows every day of the week, rest days included', () => {
    show([]);
    expect(thisWeek().getAllByTestId('day-cell')).toHaveLength(7);
  });

  it('shows how many of the planned sessions were done', () => {
    show([trained(MON, { workoutId: 'w-mon' }), trained(TUE, { workoutId: 'w-tue' })]);
    expect(thisWeek().getByText('2 of 4')).toBeInTheDocument();
  });

  it('shows more than one week when asked', () => {
    show([], SAT, 2);
    expect(screen.getByRole('region', { name: /week of 14 sep/i })).toBeInTheDocument();
  });
});

describe('completed workouts', () => {
  it('names the workout that was done', () => {
    show([trained(MON, { workoutId: 'w-mon' })]);
    expect(row(/push and core/i)).toHaveTextContent('Push and Core');
  });

  it('says it was done', () => {
    show([trained(MON, { workoutId: 'w-mon' })]);
    expect(row(/push and core/i)).toHaveTextContent(/done/i);
  });

  it('opens the session when clicked', () => {
    show([trained(MON, { workoutId: 'w-mon' })]);
    expect(within(row(/push and core/i)).getByRole('link')).toHaveAttribute(
      'href',
      `/history/${MON}-t`,
    );
  });

  it('marks a partly finished session as partly done', () => {
    show([trained(MON, { workoutId: 'w-mon', status: 'partial' })]);
    expect(row(/push and core/i)).toHaveTextContent(/partly done/i);
  });
});

describe('missed workouts', () => {
  it('names the workout that was missed', () => {
    show([]);
    expect(row(/legs and mobility/i)).toHaveTextContent(/missed/i);
  });

  it('offers nothing to open when the day never happened', () => {
    show([]);
    expect(within(row(/legs and mobility/i)).queryByRole('link')).not.toBeInTheDocument();
  });

  it('leaves the missed day where it fell, rather than moving the work', () => {
    show([trained(TUE, { workoutId: 'w-tue' })]);
    expect(row(/push and core/i)).toHaveTextContent(/missed/i);
    expect(row(/legs and mobility/i)).toHaveTextContent(/done/i);
  });

  it('says plainly that a missed session stays missed', () => {
    show([]);
    expect(screen.getByText(/never moved to another day/i)).toBeInTheDocument();
  });

  it('counts the missed sessions', () => {
    show([]);
    // Monday, Tuesday and Thursday have passed untrained; Saturday is today.
    expect(screen.getByTestId('history-missed')).toHaveTextContent('3');
  });
});

describe('rest days', () => {
  it('shows a rest day as rest', () => {
    show([]);
    expect(thisWeek().getByRole('listitem', { name: /wednesday.*rest/i })).toBeInTheDocument();
  });

  it('does not list a rest day among the training days', () => {
    show([]);
    expect(thisWeek().queryByRole('listitem', { name: /wednesday.*missed/i })).not.toBeInTheDocument();
  });
});

describe('today and what is still to come', () => {
  it('marks today', () => {
    show([], THU);
    expect(thisWeek().getByRole('listitem', { name: /thursday/i })).toHaveAttribute(
      'aria-current',
      'date',
    );
  });

  it('shows a day still to come as planned rather than missed', () => {
    show([], THU);
    expect(row(/full body/i)).toHaveTextContent(/planned/i);
  });
});

describe('mobility sessions', () => {
  it('counts a routine done on a rest day', () => {
    show([stretched(WED)]);
    expect(thisWeek().getByRole('listitem', { name: /wednesday.*1 mobility/i })).toBeInTheDocument();
  });

  it('does not let a routine stand in for a missed workout', () => {
    show([stretched(MON)]);
    expect(row(/push and core/i)).toHaveTextContent(/missed/i);
  });

  it('totals the routines over the period shown', () => {
    show([stretched(MON), stretched(WED)]);
    expect(screen.getByTestId('history-mobility')).toHaveTextContent('2');
  });
});

describe('the summary', () => {
  it('shows the current streak', () => {
    show([trained(MON, { workoutId: 'w-mon' }), trained(TUE, { workoutId: 'w-tue' })], TUE);
    expect(screen.getByTestId('history-streak')).toHaveTextContent('2');
  });

  it('shows how many sessions were trained', () => {
    show([trained(MON, { workoutId: 'w-mon' }), trained(TUE, { workoutId: 'w-tue' })]);
    expect(screen.getByTestId('history-trained')).toHaveTextContent('2');
  });

  it('starts empty before anything has been done', () => {
    show([], MON);
    expect(screen.getByTestId('history-trained')).toHaveTextContent('0');
    expect(screen.getByTestId('history-streak')).toHaveTextContent('0');
  });
});
