import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MemoryAdapter } from '../storage/memory-adapter';
import { AppShell } from './AppShell';

const MONDAY = '2026-09-21';
const NEXT_MONDAY = '2026-09-28';

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

const openApp = (today = MONDAY) =>
  render(
    <MemoryRouter>
      <AppShell adapter={adapter} today={today} />
    </MemoryRouter>,
  );

const logSet = async (difficulty: string) => {
  await user.click(screen.getByRole('button', { name: /^finish set$/i }));
  await user.click(screen.getByRole('button', { name: difficulty }));
  const skip = screen.queryByRole('button', { name: /skip rest/i });
  if (skip) await user.click(skip);
};

const heading = () => screen.getByRole('heading', { level: 1 }).textContent ?? '';

/** Play the whole session, answering every set the same way. */
const play = async ({
  difficulty = 'Moderate',
  failFirstSetOf,
}: { difficulty?: string; failFirstSetOf?: RegExp } = {}) => {
  for (let exercise = 0; exercise < 9; exercise += 1) {
    if (/workout complete/i.test(heading())) return;

    const failing = failFirstSetOf?.test(heading()) ?? false;
    const setsText = screen.getByTestId('player-set-count').textContent ?? '';
    const total = Number(/of (\d+)/.exec(setsText)?.[1] ?? '1');

    for (let s = 0; s < total; s += 1) {
      await user.click(screen.getByRole('button', { name: /start set/i }));
      if (failing && s === 0) {
        await user.click(screen.getByRole('button', { name: /skip this set/i }));
        // A skipped set still earns its rest, so the timer comes up either way.
        const rest = screen.queryByRole('button', { name: /skip rest/i });
        if (rest) await user.click(rest);
      } else {
        await logSet(difficulty);
      }
    }
  }
};

const runSession = async (today: string, options?: Parameters<typeof play>[0]) => {
  const view = openApp(today);
  await screen.findByRole('heading', { level: 1 });
  await user.click(screen.getByRole('link', { name: /start workout/i }));
  await play(options);
  return view;
};

const coach = () => within(screen.getByRole('region', { name: /next time/i }));

describe('a session that went well', () => {
  it('reads it back and says it will progress', async () => {
    const first = await runSession(MONDAY);
    first.unmount();
    await runSession(NEXT_MONDAY);

    expect(coach().getByTestId('coach-focus')).toHaveTextContent(/progressing/i);
    expect(coach().getByTestId('coach-headline')).toHaveTextContent(
      /top of the range.*progress slightly next time/i,
    );
  });

  it('changes one thing at a time', async () => {
    const first = await runSession(MONDAY);
    first.unmount();
    await runSession(NEXT_MONDAY);

    expect(coach().getByTestId('coach-advice')).toHaveTextContent(/one thing at a time/i);
  });

  it('holds after a single good session, rather than moving on the first one', async () => {
    await runSession(MONDAY);
    expect(coach().getByTestId('coach-focus')).toHaveTextContent(/holding steady/i);
  });
});

describe('a session that was very hard', () => {
  it('keeps the variation and asks for control', async () => {
    await runSession(MONDAY, { difficulty: 'Very hard' });

    expect(coach().getByTestId('coach-focus')).toHaveTextContent(/holding steady/i);
    expect(coach().getByTestId('coach-headline')).toHaveTextContent(/controlled reps/i);
  });

  it('leaves the targets alone', async () => {
    await runSession(MONDAY, { difficulty: 'Very hard' });
    expect(coach().getAllByText(/unchanged/i).length).toBeGreaterThan(0);
  });
});

describe('a session with a set that did not happen', () => {
  it('says what was missed without making a drama of it', async () => {
    await runSession(MONDAY, { failFirstSetOf: /push-up/i });

    expect(coach().getByTestId('coach-headline')).toHaveTextContent(/came up short/i);
    expect(coach().getByTestId('coach-advice')).toHaveTextContent(/not a trend/i);
  });

  it('changes nothing yet', async () => {
    await runSession(MONDAY, { failFirstSetOf: /push-up/i });
    expect(coach().getByTestId('coach-focus')).toHaveTextContent(/holding steady/i);
  });
});

describe('two very hard sessions in a row', () => {
  it('asks for recovery', async () => {
    const first = await runSession(MONDAY, { difficulty: 'Very hard' });
    first.unmount();
    await runSession(NEXT_MONDAY, { difficulty: 'Very hard' });

    expect(coach().getByTestId('coach-focus')).toHaveTextContent(/recovery/i);
    expect(coach().getByTestId('coach-headline')).toHaveTextContent(/second hard session/i);
  });

  it('still does not reduce anything, because recovery is advice not a cut', async () => {
    const first = await runSession(MONDAY, { difficulty: 'Very hard' });
    first.unmount();
    await runSession(NEXT_MONDAY, { difficulty: 'Very hard' });

    expect(coach().getAllByText(/unchanged/i).length).toBeGreaterThan(0);
  });

  it('warns on the Today screen before the next session', async () => {
    const first = await runSession(MONDAY, { difficulty: 'Very hard' });
    first.unmount();
    const second = await runSession(NEXT_MONDAY, { difficulty: 'Very hard' });
    second.unmount();

    openApp('2026-09-29');
    await screen.findByRole('heading', { level: 1 });

    expect(await screen.findByTestId('coach-note')).toHaveTextContent(
      /last two sessions were hard/i,
    );
  });

  it('says nothing on the Today screen when training is going normally', async () => {
    const first = await runSession(MONDAY);
    first.unmount();

    openApp('2026-09-22');
    await screen.findByRole('heading', { level: 1 });

    expect(screen.queryByTestId('coach-note')).not.toBeInTheDocument();
  });
});
