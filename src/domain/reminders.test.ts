import { describe, expect, it } from 'vitest';
import { dueReminder, nextReminder, reminderFor, reminderTime } from './reminders';
import { DEFAULT_REMINDERS, type ReminderSettings, type UserProfile } from './profile';
import type { WorkoutSession } from './session';
import type { Workout } from './workout';
import { aProfile, aSession, aWorkout } from '../test/factories';

const MON = '2026-09-21';
const TUE = '2026-09-22';
const WED = '2026-09-23';
const SAT = '2026-09-26';

const workouts: Workout[] = [
  aWorkout({ id: 'w-mon', name: 'Push and Core', day: 'monday' }),
  aWorkout({ id: 'w-tue', name: 'Legs and Mobility', day: 'tuesday' }),
  aWorkout({ id: 'w-thu', name: 'Upper Body and Core', day: 'thursday' }),
  aWorkout({ id: 'w-sat', name: 'Full Body', day: 'saturday' }),
  aWorkout({ id: 'mobility-hips', name: 'Hips', day: null, kind: 'mobility', warmUp: [] }),
];

const profileWith = (reminders: Partial<ReminderSettings> = {}, time = '18:00'): UserProfile =>
  aProfile({
    trainingDays: ['monday', 'tuesday', 'thursday', 'saturday'],
    preferredTrainingTime: time,
    reminders: { ...DEFAULT_REMINDERS, ...reminders },
  });

/** A local wall-clock instant, in whatever timezone the suite is pinned to. */
const at = (date: string, time: string) => new Date(`${date}T${time}:00`);

const trained = (date: string, overrides: Partial<WorkoutSession> = {}): WorkoutSession =>
  aSession({ id: `${date}-t`, date, kind: 'training', status: 'completed', ...overrides });

describe('reminderTime', () => {
  it('is the training time when there is no lead time', () => {
    expect(reminderTime(profileWith())).toBe('18:00');
  });

  it('is earlier by the lead time', () => {
    expect(reminderTime(profileWith({ minutesBefore: 30 }))).toBe('17:30');
  });

  it('crosses the hour correctly', () => {
    expect(reminderTime(profileWith({ minutesBefore: 45 }, '18:15'))).toBe('17:30');
  });

  it('never runs back into the day before', () => {
    expect(reminderTime(profileWith({ minutesBefore: 60 }, '00:30'))).toBe('00:00');
  });
});

describe('the reminder for a day', () => {
  it('is the workout scheduled that day', () => {
    const reminder = reminderFor(MON, profileWith(), workouts);
    expect(reminder?.workoutId).toBe('w-mon');
  });

  it('reads the way a reminder should', () => {
    const reminder = reminderFor(MON, profileWith(), workouts);
    expect(`${reminder?.title} — ${reminder?.body}`).toBe(
      "Today's workout is ready — 25 minutes of Push and Core. Start when you're ready.",
    );
  });

  it('is due at the reminder time', () => {
    expect(reminderFor(MON, profileWith({ minutesBefore: 30 }), workouts)?.at).toBe('17:30');
  });

  it('has an id that is stable for the day, so it can only be delivered once', () => {
    expect(reminderFor(MON, profileWith(), workouts)?.id).toBe(
      reminderFor(MON, profileWith(), workouts)?.id,
    );
  });

  it('has a different id on a different day', () => {
    expect(reminderFor(MON, profileWith(), workouts)?.id).not.toBe(
      reminderFor(TUE, profileWith(), workouts)?.id,
    );
  });

  it('is nothing on a rest day', () => {
    expect(reminderFor(WED, profileWith(), workouts)).toBeNull();
  });

  it('is nothing at all when reminders are switched off', () => {
    expect(reminderFor(MON, profileWith({ enabled: false }), workouts)).toBeNull();
  });

  it('is nothing on a training day with no workout written for it', () => {
    const friday = aProfile({ trainingDays: ['friday'], reminders: DEFAULT_REMINDERS });
    expect(reminderFor('2026-09-25', friday, workouts)).toBeNull();
  });
});

describe('the optional rest-day nudge', () => {
  const restful = profileWith({ mobilityOnRestDays: true });

  it('is offered on a rest day when it has been asked for', () => {
    expect(reminderFor(WED, restful, workouts)?.kind).toBe('mobility');
  });

  it('says plainly that it can be ignored', () => {
    expect(reminderFor(WED, restful, workouts)?.body).toMatch(/costs you nothing/i);
  });

  it('never replaces the training reminder on a training day', () => {
    expect(reminderFor(MON, restful, workouts)?.kind).toBe('training');
  });

  it('is off unless asked for', () => {
    expect(reminderFor(WED, profileWith(), workouts)).toBeNull();
  });
});

describe('the next reminder', () => {
  const args = (now: Date, profile = profileWith()) => ({ profile, workouts, now });

  it('is today, when today is a training day and the time has not passed', () => {
    expect(nextReminder(args(at(MON, '09:00')))?.date).toBe(MON);
  });

  it('is tomorrow, once today has gone by', () => {
    expect(nextReminder(args(at(MON, '19:00')))?.date).toBe(TUE);
  });

  it('skips the rest days in between', () => {
    expect(nextReminder(args(at(TUE, '19:00')))?.date).toBe('2026-09-24');
  });

  it('carries into the following week', () => {
    expect(nextReminder(args(at(SAT, '19:00')))?.date).toBe('2026-09-28');
  });

  it('knows exactly when it is due', () => {
    const next = nextReminder(args(at(MON, '19:00'), profileWith({ minutesBefore: 15 })));
    expect(next?.at).toBe('17:45');
  });

  it('moves with the training time', () => {
    const early = profileWith({}, '07:00');
    expect(nextReminder(args(at(MON, '09:00'), early))?.date).toBe(TUE);
  });

  it('moves with the training days', () => {
    const weekend = aProfile({
      trainingDays: ['saturday'],
      preferredTrainingTime: '18:00',
      reminders: DEFAULT_REMINDERS,
    });
    expect(nextReminder(args(at(MON, '09:00'), weekend))?.date).toBe(SAT);
  });

  it('is nothing when reminders are switched off', () => {
    expect(nextReminder(args(at(MON, '09:00'), profileWith({ enabled: false })))).toBeNull();
  });
});

describe('whether a reminder is due now', () => {
  const args = (now: Date, sessions: WorkoutSession[] = [], profile = profileWith()) => ({
    profile,
    workouts,
    sessions,
    now,
  });

  it('is not due before its time', () => {
    expect(dueReminder(args(at(MON, '17:59')))).toBeNull();
  });

  it('is due on the minute', () => {
    expect(dueReminder(args(at(MON, '18:00')))?.workoutId).toBe('w-mon');
  });

  it('is still due later in the evening, because a late start beats none', () => {
    expect(dueReminder(args(at(MON, '21:30')))?.workoutId).toBe('w-mon');
  });

  it('is due earlier when a lead time is set', () => {
    const early = profileWith({ minutesBefore: 30 });
    expect(dueReminder(args(at(MON, '17:30'), [], early))?.workoutId).toBe('w-mon');
  });

  it('stops once the workout has been done', () => {
    expect(dueReminder(args(at(MON, '18:30'), [trained(MON, { workoutId: 'w-mon' })]))).toBeNull();
  });

  it('stops once some of it has been done', () => {
    const partial = trained(MON, { workoutId: 'w-mon', status: 'partial' });
    expect(dueReminder(args(at(MON, '18:30'), [partial]))).toBeNull();
  });

  it('never nags about a day that has already gone', () => {
    // Monday was missed. Tuesday morning is not the time to bring it up.
    expect(dueReminder(args(at(TUE, '09:00')))).toBeNull();
  });

  it('is nothing on a rest day', () => {
    expect(dueReminder(args(at(WED, '20:00')))).toBeNull();
  });

  it('is nothing when reminders are switched off', () => {
    expect(dueReminder(args(at(MON, '18:30'), [], profileWith({ enabled: false })))).toBeNull();
  });

  it('offers the rest-day nudge when that was asked for', () => {
    const restful = profileWith({ mobilityOnRestDays: true });
    expect(dueReminder(args(at(WED, '18:00'), [], restful))?.kind).toBe('mobility');
  });

  it('drops the nudge once a routine has been done', () => {
    const restful = profileWith({ mobilityOnRestDays: true });
    const stretched = aSession({ id: 'm', date: WED, kind: 'mobility', status: 'completed' });
    expect(dueReminder(args(at(WED, '18:00'), [stretched], restful))).toBeNull();
  });
});
