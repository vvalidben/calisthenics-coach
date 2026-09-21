import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useReminders } from './useReminders';
import { DEFAULT_REMINDERS, type UserProfile } from '../../domain/profile';
import type { WorkoutSession } from '../../domain/session';
import type { Workout } from '../../domain/workout';
import { MemoryNotifier } from '../../notifications/memory-notifier';
import type { NotificationAccess } from '../../notifications/notifier';
import { aProfile, aSession, aWorkout } from '../../test/factories';

const MON = '2026-09-21';

const workouts: Workout[] = [
  aWorkout({ id: 'w-mon', name: 'Push and Core', day: 'monday' }),
  aWorkout({ id: 'w-tue', name: 'Legs and Mobility', day: 'tuesday' }),
];

const profile: UserProfile = aProfile({
  trainingDays: ['monday', 'tuesday'],
  preferredTrainingTime: '18:00',
  reminders: DEFAULT_REMINDERS,
});

const MINUTE = 60_000;

interface Options {
  at?: string;
  sessions?: WorkoutSession[];
  hidden?: boolean;
  access?: NotificationAccess;
  profile?: UserProfile;
}

const watch = ({
  at = '17:59',
  sessions = [],
  hidden = true,
  access = 'granted',
  profile: athlete = profile,
}: Options = {}) => {
  vi.setSystemTime(new Date(`${MON}T${at}:00`));
  const notifier = new MemoryNotifier(access);

  const view = renderHook(() =>
    useReminders({
      profile: athlete,
      workouts,
      sessions,
      notifier,
      clock: () => new Date(),
      hidden: () => hidden,
      intervalMs: MINUTE,
    }),
  );

  return { notifier, view };
};

/** Lets the clock run on, the way it would while the app sits open. */
const passMinutes = async (count: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(count * MINUTE);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the reminder the app is showing', () => {
  it('is nothing before its time', () => {
    expect(watch().view.result.current).toBeNull();
  });

  it('appears when the time arrives, without the page being reloaded', async () => {
    const { view } = watch({ at: '17:59' });
    await passMinutes(1);
    expect(view.result.current?.workoutId).toBe('w-mon');
  });

  it('is already there when the app is opened late', () => {
    expect(watch({ at: '20:00' }).view.result.current?.workoutId).toBe('w-mon');
  });

  it('is nothing once the workout has been done', () => {
    const done = aSession({ id: 'x', date: MON, kind: 'training', status: 'completed' });
    expect(watch({ at: '20:00', sessions: [done] }).view.result.current).toBeNull();
  });

  it('is nothing when reminders are switched off', () => {
    const off = aProfile({
      trainingDays: ['monday'],
      preferredTrainingTime: '18:00',
      reminders: { ...DEFAULT_REMINDERS, enabled: false },
    });
    expect(watch({ at: '20:00', profile: off }).view.result.current).toBeNull();
  });
});

describe('notifying', () => {
  it('sends one when the time arrives and the app is in the background', async () => {
    const { notifier } = watch({ at: '17:59', hidden: true });
    await passMinutes(1);
    expect(notifier.shown.map((r) => r.workoutId)).toEqual(['w-mon']);
  });

  it('sends only one, however long the app is left open', async () => {
    const { notifier } = watch({ at: '17:59', hidden: true });
    await passMinutes(30);
    expect(notifier.shown).toHaveLength(1);
  });

  it('stays quiet while the athlete is looking at the app', async () => {
    const { notifier, view } = watch({ at: '17:59', hidden: false });
    await passMinutes(1);
    expect(notifier.shown).toHaveLength(0);
    // The reminder is still delivered — on the screen they are already reading.
    expect(view.result.current?.workoutId).toBe('w-mon');
  });

  it('sends nothing when permission was refused', async () => {
    const { notifier } = watch({ at: '17:59', access: 'denied' });
    await passMinutes(1);
    expect(notifier.shown).toHaveLength(0);
  });

  it('sends nothing on a day with no reminder', async () => {
    const wednesdayOnly = aProfile({
      trainingDays: ['wednesday'],
      preferredTrainingTime: '18:00',
      reminders: DEFAULT_REMINDERS,
    });
    const { notifier } = watch({ at: '17:59', profile: wednesdayOnly });
    await passMinutes(5);
    expect(notifier.shown).toHaveLength(0);
  });

  it('sends the next day too, because each day is its own reminder', async () => {
    const { notifier } = watch({ at: '23:58' });
    // Past midnight into Tuesday, then on to Tuesday evening.
    await passMinutes(60 * 18 + 5);
    expect(notifier.shown.map((r) => r.date)).toEqual([MON, '2026-09-22']);
  });

  it('stops checking once the app closes the screen', async () => {
    const { notifier, view } = watch({ at: '17:59' });
    view.unmount();
    await passMinutes(5);
    expect(notifier.shown).toHaveLength(0);
  });
});
