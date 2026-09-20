import { describe, expect, it } from 'vitest';
import { historyWeeks, type CalendarDay } from './history';
import type { WorkoutSession } from './session';
import type { Workout } from './workout';
import { aProfile, aSession, aWorkout } from '../test/factories';

const profile = aProfile({ trainingDays: ['monday', 'tuesday', 'thursday', 'saturday'] });

const MON = '2026-09-21';
const TUE = '2026-09-22';
const WED = '2026-09-23';
const THU = '2026-09-24';
const FRI = '2026-09-25';
const SAT = '2026-09-26';

const workouts: Workout[] = [
  aWorkout({ id: 'w-mon', name: 'Push and Core', day: 'monday' }),
  aWorkout({ id: 'w-tue', name: 'Legs and Mobility', day: 'tuesday' }),
  aWorkout({ id: 'w-thu', name: 'Upper Body and Core', day: 'thursday' }),
  aWorkout({ id: 'w-sat', name: 'Full Body', day: 'saturday' }),
  aWorkout({
    id: 'mobility-hips',
    name: 'Hips',
    day: null,
    kind: 'mobility',
    focus: 'mobility',
    warmUp: [],
  }),
];

const trained = (date: string, overrides: Partial<WorkoutSession> = {}): WorkoutSession =>
  aSession({
    id: `${date}-t`,
    date,
    kind: 'training',
    status: 'completed',
    workoutId: 'w-mon',
    ...overrides,
  });

const stretched = (date: string): WorkoutSession =>
  aSession({
    id: `${date}-m`,
    date,
    kind: 'mobility',
    status: 'completed',
    workoutId: 'mobility-hips',
  });

const build = (sessions: WorkoutSession[], today = SAT, weeks = 1) =>
  historyWeeks({ sessions, profile, workouts, today, weeks });

const dayOn = (sessions: WorkoutSession[], date: string, today = SAT): CalendarDay =>
  build(sessions, today).flatMap((w) => w.days).find((d) => d.date === date)!;

describe('the shape of a week', () => {
  it('starts on a Monday', () => {
    expect(build([])[0]!.start).toBe(MON);
  });

  it('has seven days', () => {
    expect(build([])[0]!.days).toHaveLength(7);
  });

  it('returns as many weeks as asked, most recent first', () => {
    const weeks = build([], SAT, 3);
    expect(weeks.map((w) => w.start)).toEqual([MON, '2026-09-14', '2026-09-07']);
  });

  it('reports weekly completion against the schedule', () => {
    const week = build([trained(MON), trained(TUE)])[0]!;
    expect(week.completed).toBe(2);
    expect(week.planned).toBe(4);
  });
});

describe('completed workouts', () => {
  it('shows as completed', () => {
    expect(dayOn([trained(MON)], MON).status).toBe('completed');
  });

  it('names the workout', () => {
    expect(dayOn([trained(MON)], MON).workoutName).toBe('Push and Core');
  });

  it('carries the session id, so it can be opened', () => {
    expect(dayOn([trained(MON)], MON).sessionId).toBe(`${MON}-t`);
  });

  it('shows a partly finished session as partial rather than complete', () => {
    expect(dayOn([trained(MON, { status: 'partial' })], MON).status).toBe('partial');
  });

  it('counts a partial session toward the week', () => {
    expect(build([trained(MON, { status: 'partial' })])[0]!.completed).toBe(1);
  });
});

describe('missed workouts', () => {
  it('marks a past training day with nothing on it as missed', () => {
    expect(dayOn([], MON).status).toBe('missed');
  });

  it('names the workout that was skipped', () => {
    expect(dayOn([], TUE).workoutName).toBe('Legs and Mobility');
  });

  it('marks an abandoned session as missed too', () => {
    const abandoned = trained(MON, { status: 'missed', exercises: [] });
    expect(dayOn([abandoned], MON).status).toBe('missed');
  });

  it('still offers the abandoned session to open', () => {
    const abandoned = trained(MON, { status: 'missed', exercises: [] });
    expect(dayOn([abandoned], MON).sessionId).toBe(`${MON}-t`);
  });

  it('has nothing to open when the day simply never happened', () => {
    expect(dayOn([], MON).sessionId).toBeNull();
  });

  it('does not count toward weekly completion', () => {
    expect(build([])[0]!.completed).toBe(0);
  });

  it('never moves the work to another day', () => {
    // Monday missed, Tuesday trained. Tuesday stays one session, not two.
    const week = build([trained(TUE, { workoutId: 'w-tue' })])[0]!;
    const tuesday = week.days.find((d) => d.date === TUE)!;
    expect(tuesday.workoutName).toBe('Legs and Mobility');
    expect(week.completed).toBe(1);
  });

  it('leaves a missed day missed however long ago it was', () => {
    const weeks = build([], SAT, 4);
    const old = weeks[3]!.days.find((d) => d.weekday === 'monday')!;
    expect(old.status).toBe('missed');
  });
});

describe('today and the future', () => {
  it('shows today as planned rather than missed, because the day is not over', () => {
    expect(dayOn([], THU, THU).status).toBe('planned');
  });

  it('shows a training day still to come as planned', () => {
    expect(dayOn([], SAT, THU).status).toBe('planned');
  });

  it('marks which day is today', () => {
    expect(dayOn([], THU, THU).isToday).toBe(true);
    expect(dayOn([], MON, THU).isToday).toBe(false);
  });

  it('marks days that have not happened yet', () => {
    expect(dayOn([], SAT, THU).isFuture).toBe(true);
    expect(dayOn([], MON, THU).isFuture).toBe(false);
  });

  it('shows today as completed once it has been done', () => {
    expect(dayOn([trained(THU, { workoutId: 'w-thu' })], THU, THU).status).toBe('completed');
  });
});

describe('rest days', () => {
  it('shows an unscheduled day as rest', () => {
    expect(dayOn([], WED).status).toBe('rest');
  });

  it('has no workout to name', () => {
    expect(dayOn([], FRI).workoutName).toBeNull();
  });

  it('is never counted as missed', () => {
    const week = build([]) [0]!;
    const rests = week.days.filter((d) => d.status === 'rest');
    expect(rests.map((d) => d.weekday)).toEqual(['wednesday', 'friday', 'sunday']);
  });
});

describe('mobility sessions', () => {
  it('counts restorative work on a rest day', () => {
    expect(dayOn([stretched(WED)], WED).mobilityCount).toBe(1);
  });

  it('leaves the day a rest day rather than calling it training', () => {
    expect(dayOn([stretched(WED)], WED).status).toBe('rest');
  });

  it('counts more than one in a day', () => {
    const two = [stretched(WED), aSession({ ...stretched(WED), id: 'second' })];
    expect(dayOn(two, WED).mobilityCount).toBe(2);
  });

  it('never fills in for a missed workout', () => {
    expect(dayOn([stretched(MON)], MON).status).toBe('missed');
  });

  it('does not count toward weekly completion', () => {
    expect(build([stretched(MON), stretched(WED)])[0]!.completed).toBe(0);
  });

  it('still shows alongside a completed workout', () => {
    const day = dayOn([trained(MON), stretched(MON)], MON);
    expect(day.status).toBe('completed');
    expect(day.mobilityCount).toBe(1);
  });
});
