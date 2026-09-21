import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MemoryAdapter } from '../storage/memory-adapter';
import { createRepositories } from '../storage/repositories';
import { MemoryNotifier } from '../notifications/memory-notifier';
import { AppShell } from './AppShell';

const MONDAY = '2026-09-21';
const WEDNESDAY = '2026-09-23';

let adapter: MemoryAdapter;
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  adapter = new MemoryAdapter();
  user = userEvent.setup();
});

/** Opens the app at a fixed wall-clock instant. */
const openApp = (date: string, time: string) =>
  render(
    <MemoryRouter>
      <AppShell
        adapter={adapter}
        today={date}
        now={() => new Date(`${date}T${time}:00`)}
        notifier={new MemoryNotifier('denied')}
      />
    </MemoryRouter>,
  );

const waitForApp = () => screen.findByRole('heading', { level: 1 });

/** The tab, not the "Reminder settings" link inside the banner. */
const goToSettings = async () => {
  await user.click(screen.getByRole('link', { name: /^settings$/i }));
  return screen.findByRole('heading', { level: 1, name: /settings/i });
};

describe('the reminder on the Today screen', () => {
  it('is not there before the training time', async () => {
    openApp(MONDAY, '09:00');
    await waitForApp();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('is there once the time has passed', async () => {
    openApp(MONDAY, '18:30');
    await waitForApp();
    expect(await screen.findByRole('status')).toHaveTextContent(/today's workout is ready/i);
  });

  it('names the session and how long it takes', async () => {
    openApp(MONDAY, '18:30');
    await waitForApp();
    expect(await screen.findByRole('status')).toHaveTextContent(
      /minutes of .+\. Start when you're ready\./i,
    );
  });

  it('sits above the session it is about, which is what starts it', async () => {
    openApp(MONDAY, '18:30');
    await waitForApp();
    await screen.findByRole('status');

    await user.click(screen.getByRole('link', { name: /start workout/i }));
    expect(await screen.findByTestId('player-set-count')).toBeInTheDocument();
  });

  it('says nothing on a rest day', async () => {
    openApp(WEDNESDAY, '18:30');
    await waitForApp();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('changing the training days', () => {
  it('saves them', async () => {
    openApp(WEDNESDAY, '09:00');
    await waitForApp();
    await goToSettings();

    const days = within(screen.getByRole('group', { name: /training days/i }));
    await user.click(days.getByRole('checkbox', { name: /wednesday/i }));

    const stored = await createRepositories(adapter).profile.load();
    expect(stored?.trainingDays).toContain('wednesday');
  });

  it('reaches the calendar straight away', async () => {
    openApp(WEDNESDAY, '09:00');
    await waitForApp();
    await goToSettings();

    const days = within(screen.getByRole('group', { name: /training days/i }));
    await user.click(days.getByRole('checkbox', { name: /wednesday/i }));
    await user.click(screen.getByRole('link', { name: /^history$/i }));

    const week = within(await screen.findByRole('region', { name: /week of 21 sep/i }));
    expect(week.getByRole('listitem', { name: /wednesday/i })).toHaveTextContent(/planned/i);
  });

  it('says so when the program has no session for the day that was added', async () => {
    openApp(WEDNESDAY, '09:00');
    await waitForApp();
    await goToSettings();

    const days = within(screen.getByRole('group', { name: /training days/i }));
    await user.click(days.getByRole('checkbox', { name: /wednesday/i }));

    // The program is written for four particular days. Adding a fifth must not
    // look like a workout has appeared on it.
    expect(await screen.findByText(/no session written for Wednesday/i)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('survives closing the app', async () => {
    const view = openApp(WEDNESDAY, '09:00');
    await waitForApp();
    await goToSettings();

    const days = within(screen.getByRole('group', { name: /training days/i }));
    await user.click(days.getByRole('checkbox', { name: /friday/i }));

    view.unmount();
    openApp(WEDNESDAY, '09:00');
    await waitForApp();
    await goToSettings();

    const reopened = within(screen.getByRole('group', { name: /training days/i }));
    expect(reopened.getByRole('checkbox', { name: /friday/i })).toBeChecked();
  });
});

describe('changing the training time', () => {
  it('saves it', async () => {
    openApp(MONDAY, '09:00');
    await waitForApp();
    await goToSettings();

    fireEvent.change(screen.getByLabelText(/start at/i), { target: { value: '07:30' } });

    const stored = await createRepositories(adapter).profile.load();
    expect(stored?.preferredTrainingTime).toBe('07:30');
  });

  it('moves the reminder with it', async () => {
    openApp(MONDAY, '09:00');
    await waitForApp();
    await goToSettings();

    expect(screen.getByTestId('next-reminder')).toHaveTextContent(/18:00/);

    fireEvent.change(screen.getByLabelText(/start at/i), { target: { value: '07:30' } });

    // 07:30 on Monday has already gone, so the next one is Tuesday's.
    expect(screen.getByTestId('next-reminder')).toHaveTextContent(/tuesday at 07:30/i);
  });

  it('brings the reminder forward on the Today screen', async () => {
    openApp(MONDAY, '09:00');
    await waitForApp();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await goToSettings();
    fireEvent.change(screen.getByLabelText(/start at/i), { target: { value: '07:30' } });
    await user.click(screen.getByRole('link', { name: /^today$/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/today's workout is ready/i);
  });
});

describe('changing reminder preferences', () => {
  it('turns the reminder off', async () => {
    openApp(MONDAY, '18:30');
    await waitForApp();
    expect(await screen.findByRole('status')).toBeInTheDocument();

    await goToSettings();
    await user.click(screen.getByRole('checkbox', { name: /remind me/i }));
    await user.click(screen.getByRole('link', { name: /^today$/i }));

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('offers the rest-day nudge once it is asked for', async () => {
    openApp(WEDNESDAY, '18:30');
    await waitForApp();
    await goToSettings();

    await user.click(screen.getByRole('checkbox', { name: /rest days/i }));
    await user.click(screen.getByRole('link', { name: /^today$/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/costs you nothing/i);
  });
});
