import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsScreen } from './SettingsScreen';
import { DEFAULT_REMINDERS, type UserProfile } from '../../domain/profile';
import type { Workout } from '../../domain/workout';
import { MemoryNotifier } from '../../notifications/memory-notifier';
import type { NotificationAccess } from '../../notifications/notifier';
import { aProfile, aWorkout } from '../../test/factories';

const workouts: Workout[] = [
  aWorkout({ id: 'w-mon', name: 'Push and Core', day: 'monday' }),
  aWorkout({ id: 'w-tue', name: 'Legs and Mobility', day: 'tuesday' }),
  aWorkout({ id: 'w-thu', name: 'Upper Body and Core', day: 'thursday' }),
  aWorkout({ id: 'w-sat', name: 'Full Body', day: 'saturday' }),
];

const profile = aProfile({
  trainingDays: ['monday', 'tuesday', 'thursday', 'saturday'],
  preferredTrainingTime: '18:00',
  reminders: DEFAULT_REMINDERS,
});

/** Monday morning, well before the 18:00 reminder. */
const NOW = new Date('2026-09-21T09:00:00');

const show = (overrides: Partial<UserProfile> = {}, access: NotificationAccess = 'granted') => {
  const onSave = vi.fn();
  const notifier = new MemoryNotifier(access);
  const view = render(
    <MemoryRouter>
      <SettingsScreen
        profile={{ ...profile, ...overrides }}
        workouts={workouts}
        notifier={notifier}
        now={NOW}
        onSave={onSave}
      />
    </MemoryRouter>,
  );
  return { onSave, notifier, view, user: userEvent.setup() };
};

/** The profile as it was last handed to the app to persist. */
const saved = (onSave: ReturnType<typeof vi.fn>): UserProfile =>
  onSave.mock.calls.at(-1)?.[0] as UserProfile;

const days = () => within(screen.getByRole('group', { name: /training days/i }));

describe('training days', () => {
  it('shows the days currently trained', () => {
    show();
    expect(days().getByRole('checkbox', { name: /monday/i })).toBeChecked();
    expect(days().getByRole('checkbox', { name: /wednesday/i })).not.toBeChecked();
  });

  it('adds a day', async () => {
    const { onSave, user } = show();
    await user.click(days().getByRole('checkbox', { name: /friday/i }));
    expect(saved(onSave).trainingDays).toContain('friday');
  });

  it('keeps the days in the order of the week, not the order they were clicked', async () => {
    const { onSave, user } = show();
    await user.click(days().getByRole('checkbox', { name: /wednesday/i }));
    expect(saved(onSave).trainingDays).toEqual([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'saturday',
    ]);
  });

  it('removes a day', async () => {
    const { onSave, user } = show();
    await user.click(days().getByRole('checkbox', { name: /tuesday/i }));
    expect(saved(onSave).trainingDays).not.toContain('tuesday');
  });

  it('refuses to remove the last one, because a program with no days is not a program', async () => {
    const { onSave, user } = show({ trainingDays: ['monday'] });
    await user.click(days().getByRole('checkbox', { name: /monday/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/at least one training day/i)).toBeInTheDocument();
  });

  it('says how many days a week that is', () => {
    show();
    expect(screen.getByText(/4 days a week/i)).toBeInTheDocument();
  });

  it('says nothing awkward while every day has a session', () => {
    show();
    expect(screen.queryByText(/no session written for/i)).not.toBeInTheDocument();
  });

  it('warns when a chosen day has no session in the program', () => {
    show({ trainingDays: ['monday', 'wednesday'] });
    expect(screen.getByText(/no session written for Wednesday/i)).toBeInTheDocument();
  });

  it('names the days the program does cover', () => {
    show({ trainingDays: ['monday', 'wednesday'] });
    expect(screen.getByText(/monday, tuesday, thursday and saturday/i)).toBeInTheDocument();
  });

  it('does not promise a reminder for a day with no session', () => {
    show({ trainingDays: ['wednesday'] });
    expect(screen.getByTestId('next-reminder')).toHaveTextContent(/nothing is scheduled/i);
  });
});

describe('training time', () => {
  it('shows the current time', () => {
    show();
    expect(screen.getByLabelText(/start at/i)).toHaveValue('18:00');
  });

  it('saves a new one', () => {
    const { onSave } = show();
    fireEvent.change(screen.getByLabelText(/start at/i), { target: { value: '07:30' } });
    expect(saved(onSave).preferredTrainingTime).toBe('07:30');
  });

  it('ignores a half-typed time rather than saving nonsense', () => {
    const { onSave } = show();
    fireEvent.change(screen.getByLabelText(/start at/i), { target: { value: '' } });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('stamps the profile as changed', async () => {
    const { onSave, user } = show();
    await user.click(days().getByRole('checkbox', { name: /friday/i }));
    expect(saved(onSave).updatedAt).toBe('2026-09-21');
  });
});

describe('reminder preferences', () => {
  it('can be switched off', async () => {
    const { onSave, user } = show();
    await user.click(screen.getByRole('checkbox', { name: /remind me/i }));
    expect(saved(onSave).reminders.enabled).toBe(false);
  });

  it('can be given a lead time', async () => {
    const { onSave, user } = show();
    await user.selectOptions(screen.getByLabelText(/when to remind/i), '30');
    expect(saved(onSave).reminders.minutesBefore).toBe(30);
  });

  it('can offer mobility on rest days', async () => {
    const { onSave, user } = show();
    await user.click(screen.getByRole('checkbox', { name: /rest days/i }));
    expect(saved(onSave).reminders.mobilityOnRestDays).toBe(true);
  });
});

describe('what happens next', () => {
  it('says when the next reminder is due', () => {
    show();
    expect(screen.getByTestId('next-reminder')).toHaveTextContent(/monday.*18:00/i);
  });

  it('moves with a changed time', () => {
    show({ preferredTrainingTime: '07:00' });
    // 07:00 on Monday has already gone by at 09:00, so Tuesday is next.
    expect(screen.getByTestId('next-reminder')).toHaveTextContent(/tuesday.*07:00/i);
  });

  it('moves with changed training days', () => {
    show({ trainingDays: ['saturday'] });
    expect(screen.getByTestId('next-reminder')).toHaveTextContent(/saturday/i);
  });

  it('accounts for the lead time', () => {
    show({ reminders: { ...DEFAULT_REMINDERS, minutesBefore: 30 } });
    expect(screen.getByTestId('next-reminder')).toHaveTextContent(/17:30/i);
  });

  it('says nothing is scheduled when reminders are off', () => {
    show({ reminders: { ...DEFAULT_REMINDERS, enabled: false } });
    expect(screen.getByTestId('next-reminder')).toHaveTextContent(/off/i);
  });
});

describe('how reminders are delivered', () => {
  it('is honest that they only arrive while the app is open', () => {
    show();
    expect(screen.getByText(/only while the app is open/i)).toBeInTheDocument();
  });

  it('says plainly that these are not push notifications', () => {
    show();
    expect(screen.getByText(/not push notifications/i)).toBeInTheDocument();
  });

  it('offers to ask for permission when nothing has been decided', async () => {
    const { notifier, user } = show({}, 'default');
    await user.click(screen.getByRole('button', { name: /allow notifications/i }));
    expect(notifier.permission()).toBe('granted');
  });

  it('does not ask again once permission is granted', () => {
    show({}, 'granted');
    expect(screen.queryByRole('button', { name: /allow notifications/i })).not.toBeInTheDocument();
  });

  it('explains what a refusal means rather than nagging', () => {
    show({}, 'denied');
    expect(screen.getByText(/blocked notifications/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /allow notifications/i })).not.toBeInTheDocument();
  });

  it('explains when the browser has no notifications at all', () => {
    const notifier = new MemoryNotifier('unsupported');
    notifier.supported = false;
    render(
      <MemoryRouter>
        <SettingsScreen
          profile={profile}
          workouts={workouts}
          notifier={notifier}
          now={NOW}
          onSave={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/does not support notifications/i)).toBeInTheDocument();
  });

  it('still shows the reminder in the app when notifications are unavailable', () => {
    show({}, 'denied');
    expect(screen.getByText(/on the Today screen/i)).toBeInTheDocument();
  });
});
