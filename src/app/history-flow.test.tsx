import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MemoryAdapter } from '../storage/memory-adapter';
import { createRepositories } from '../storage/repositories';
import { AppShell } from './AppShell';
import { aSession } from '../test/factories';

const MONDAY = '2026-09-21';
const SATURDAY = '2026-09-26';

let adapter: MemoryAdapter;
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  adapter = new MemoryAdapter();
  user = userEvent.setup();
});

/** A finished Monday session, saved as if the player had written it. */
const saveMondaySession = async () => {
  await createRepositories(adapter).sessions.save(
    aSession({
      id: `${MONDAY}-foundation-w1-d1`,
      workoutId: 'foundation-w1-d1',
      date: MONDAY,
      status: 'completed',
      notes: 'Felt strong.',
    }),
  );
};

const openApp = (today = SATURDAY) =>
  render(
    <MemoryRouter>
      <AppShell adapter={adapter} today={today} />
    </MemoryRouter>,
  );

const goToHistory = async () => {
  openApp();
  await screen.findByRole('heading', { level: 1 });
  await user.click(screen.getByRole('link', { name: /history/i }));
};

describe('reaching the calendar', () => {
  it('has its own tab', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    const tabs = within(screen.getByRole('navigation', { name: /sections/i }));
    expect(tabs.getByRole('link', { name: /history/i })).toBeInTheDocument();
  });

  it('opens the calendar', async () => {
    await goToHistory();
    expect(screen.getByRole('heading', { level: 1, name: /history/i })).toBeInTheDocument();
  });

  it('shows the weeks of the real program', async () => {
    await saveMondaySession();
    await goToHistory();
    expect(screen.getByRole('region', { name: /week of 21 sep/i })).toBeInTheDocument();
  });
});

describe('opening a completed workout', () => {
  it('shows what was done', async () => {
    await saveMondaySession();
    await goToHistory();

    const week = within(screen.getByRole('region', { name: /week of 21 sep/i }));
    await user.click(within(week.getByRole('listitem', { name: /monday/i })).getByRole('link'));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/push/i);
    expect(screen.getByTestId('detail-sets')).toBeInTheDocument();
    expect(screen.getByText('Felt strong.')).toBeInTheDocument();
  });

  it('comes back to the calendar', async () => {
    await saveMondaySession();
    await goToHistory();

    const week = within(screen.getByRole('region', { name: /week of 21 sep/i }));
    await user.click(within(week.getByRole('listitem', { name: /monday/i })).getByRole('link'));
    await user.click(screen.getByRole('link', { name: /^← history$/i }));

    expect(screen.getByRole('heading', { level: 1, name: /history/i })).toBeInTheDocument();
  });
});

describe('a session that is not there', () => {
  it('says so rather than rendering an empty page', async () => {
    render(
      <MemoryRouter initialEntries={['/history/no-such-session']}>
        <AppShell adapter={adapter} today={SATURDAY} />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/no such session/i)).toBeInTheDocument();
  });
});

describe('missed workouts are left alone', () => {
  it('shows an untrained past day as missed and offers nothing to open', async () => {
    await goToHistory();

    const week = within(screen.getByRole('region', { name: /week of 21 sep/i }));
    const monday = week.getByRole('listitem', { name: /monday/i });
    expect(monday).toHaveTextContent(/missed/i);
    expect(within(monday).queryByRole('link')).not.toBeInTheDocument();
  });

  it('does not add the missed workout to another day', async () => {
    await goToHistory();
    const week = within(screen.getByRole('region', { name: /week of 21 sep/i }));
    expect(week.getByRole('listitem', { name: /wednesday/i })).toHaveTextContent(/rest/i);
  });
});
