import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MemoryAdapter } from '../storage/memory-adapter';
import { createRepositories } from '../storage/repositories';
import { AppShell } from './AppShell';

const MONDAY = '2026-09-21';
let adapter: MemoryAdapter;
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-09-21T18:30:00.000Z'));
  adapter = new MemoryAdapter();
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
});

afterEach(() => {
  vi.useRealTimers();
});

const openApp = () =>
  render(
    <MemoryRouter>
      <AppShell adapter={adapter} today={MONDAY} />
    </MemoryRouter>,
  );

const logSet = async () => {
  await user.click(screen.getByRole('button', { name: /^finish set$/i }));
  await user.click(screen.getByRole('button', { name: 'Moderate' }));
  const skip = screen.queryByRole('button', { name: /skip rest/i });
  if (skip) await user.click(skip);
};

describe('a whole workout, through the real app', () => {
  it('starts from the Today screen', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });

    await user.click(screen.getByRole('link', { name: /start workout/i }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cat-Cow');
  });

  it('runs from the first exercise to the completion screen and saves it', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('link', { name: /start workout/i }));

    for (let exercise = 0; exercise < 9; exercise += 1) {
      if (/workout complete/i.test(screen.getByRole('heading', { level: 1 }).textContent ?? '')) {
        break;
      }
      const setsText = screen.getByTestId('player-set-count').textContent ?? '';
      const total = Number(/of (\d+)/.exec(setsText)?.[1] ?? '1');
      for (let s = 0; s < total; s += 1) {
        await user.click(screen.getByRole('button', { name: /start set/i }));
        await logSet();
      }
    }

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/workout complete/i);

    const sessions = await createRepositories(adapter).sessions.list();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      workoutId: 'foundation-w1-d1',
      date: MONDAY,
      status: 'completed',
    });
  });

  it('writes the session to storage after the very first set', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('link', { name: /start workout/i }));
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await logSet();

    const sessions = await createRepositories(adapter).sessions.list();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.status).toBe('in-progress');
  });

  it('keeps the logged work when the workout is ended early', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('link', { name: /start workout/i }));
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await logSet();
    await user.click(screen.getByRole('button', { name: /end workout/i }));

    const sessions = await createRepositories(adapter).sessions.list();
    expect(sessions[0]!.status).toBe('partial');
    expect(sessions[0]!.exercises.some((e) => e.sets.some((set) => set.completed))).toBe(true);
  });

  it('stores a session the storage layer will validate on the way back out', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('link', { name: /start workout/i }));
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await logSet();
    await user.click(screen.getByRole('button', { name: /end workout/i }));

    // The repository re-parses on read, so this throws if the player ever
    // wrote something the schema does not accept.
    await expect(createRepositories(adapter).sessions.list()).resolves.toHaveLength(1);
  });

  it('shows no start button on a rest day', async () => {
    render(
      <MemoryRouter>
        <AppShell adapter={adapter} today="2026-09-23" />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('link', { name: /start workout/i })).not.toBeInTheDocument();
  });
});
