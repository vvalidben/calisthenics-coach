import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MemoryAdapter } from '../storage/memory-adapter';
import { AppShell } from './AppShell';

/**
 * The one path the app exists to serve:
 *
 *   Dashboard → Start workout → demonstration → perform → record → rest →
 *   next exercise → finish → progress
 *
 * Every step here is asserted to be reachable by a single obvious action, with
 * no hunting. If a step ever needs two taps or a decision, this fails.
 */

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

const start = async () => {
  openApp();
  await screen.findByRole('heading', { level: 1 });
};

const primaryActions = () =>
  [...document.querySelectorAll('.button--primary')].map((el) => el.textContent?.trim());

describe('step 1: the dashboard', () => {
  it('leads with the session, not with statistics', async () => {
    await start();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Push and Core');
  });

  it('offers exactly one primary action', async () => {
    await start();
    expect(primaryActions()).toEqual(['Start workout']);
  });

  it('says how long it will take before asking for a commitment', async () => {
    await start();
    expect(within(screen.getByRole('region', { name: /today/i })).getByText(/minutes/)).toBeInTheDocument();
  });
});

describe('step 2: starting the workout', () => {
  it('takes one tap', async () => {
    await start();
    await user.click(screen.getByRole('link', { name: /start workout/i }));
    expect(screen.getByTestId('player-set-count')).toBeInTheDocument();
  });

  it('says where you are in the session', async () => {
    await start();
    await user.click(screen.getByRole('link', { name: /start workout/i }));
    expect(screen.getByText(/exercise 1 of \d+/i)).toBeInTheDocument();
  });

  it('gets the navigation out of the way', async () => {
    await start();
    await user.click(screen.getByRole('link', { name: /start workout/i }));
    expect(screen.queryByRole('navigation', { name: /sections/i })).not.toBeInTheDocument();
  });
});

describe('step 3: the demonstration', () => {
  const openPlayer = async () => {
    await start();
    await user.click(screen.getByRole('link', { name: /start workout/i }));
  };

  it('is shown before anything is asked of you', async () => {
    await openPlayer();
    const frames = screen.getAllByRole('img');
    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) expect(frame).toHaveAccessibleName();
  });

  it('comes with the words too, never the picture alone', async () => {
    await openPlayer();
    expect(screen.getByText(/how to do it/i)).toBeInTheDocument();
  });

  it('keeps the instructions on this screen', async () => {
    await openPlayer();
    await user.click(screen.getByText(/how to do it/i));
    expect(screen.getByTestId('player-set-count')).toBeInTheDocument();
  });
});

describe('step 4: performing the set', () => {
  const readyToWork = async () => {
    await start();
    await user.click(screen.getByRole('link', { name: /start workout/i }));
  };

  it('offers one thing to do', async () => {
    await readyToWork();
    expect(primaryActions()).toEqual(['Start set']);
  });

  it('turns into one thing to do next', async () => {
    await readyToWork();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    expect(primaryActions()).toEqual(['Finish set']);
  });

  it('counts the time without demanding attention', async () => {
    await readyToWork();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    expect(screen.getByText(/^\d+:\d\d$/)).toBeInTheDocument();
  });
});

describe('step 5: recording the result', () => {
  const finishASet = async () => {
    await start();
    await user.click(screen.getByRole('link', { name: /start workout/i }));
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await user.click(screen.getByRole('button', { name: /^finish set$/i }));
  };

  it('asks the two questions and no others', async () => {
    await finishASet();
    expect(screen.getByLabelText(/how many reps did you complete/i)).toBeInTheDocument();
    expect(screen.getByText(/how difficult was it/i)).toBeInTheDocument();
  });

  it('fills the number in already, so the usual answer is one tap', async () => {
    await finishASet();
    expect(screen.getByLabelText(/how many reps did you complete/i)).toHaveValue(10);
  });

  it('offers the difficulties in the athlete’s own words', async () => {
    await finishASet();
    for (const word of ['Easy', 'Moderate', 'Hard', 'Very hard', 'Failed']) {
      expect(screen.getByRole('button', { name: word })).toBeInTheDocument();
    }
  });
});

describe('step 6: resting', () => {
  /** Warm-ups prescribe no rest, so this walks on to the first main-work set. */
  const logASetWithRest = async () => {
    await start();
    await user.click(screen.getByRole('link', { name: /start workout/i }));

    for (let guard = 0; guard < 12; guard += 1) {
      await user.click(screen.getByRole('button', { name: /start set/i }));
      await user.click(screen.getByRole('button', { name: /^finish set$/i }));
      await user.click(screen.getByRole('button', { name: 'Moderate' }));
      if (screen.queryByRole('button', { name: /skip rest/i })) return;
    }
  };

  it('starts on its own once the work begins, without being asked', async () => {
    await logASetWithRest();
    expect(screen.getByRole('button', { name: /skip rest/i })).toBeInTheDocument();
  });

  it('can be cut short', async () => {
    await logASetWithRest();
    await user.click(screen.getByRole('button', { name: /skip rest/i }));
    expect(screen.getByRole('button', { name: /start set/i })).toBeInTheDocument();
  });
});

describe('step 7 and 8: the rest of the session, and the end of it', () => {
  const playEverything = async () => {
    for (let exercise = 0; exercise < 9; exercise += 1) {
      if (/workout complete/i.test(screen.getByRole('heading', { level: 1 }).textContent ?? '')) {
        return;
      }
      const setsText = screen.getByTestId('player-set-count').textContent ?? '';
      const total = Number(/of (\d+)/.exec(setsText)?.[1] ?? '1');
      for (let s = 0; s < total; s += 1) {
        await user.click(screen.getByRole('button', { name: /start set/i }));
        await user.click(screen.getByRole('button', { name: /^finish set$/i }));
        await user.click(screen.getByRole('button', { name: 'Moderate' }));
        const skip = screen.queryByRole('button', { name: /skip rest/i });
        if (skip) await user.click(skip);
      }
    }
  };

  it('moves on by itself and ends with a summary', async () => {
    await start();
    await user.click(screen.getByRole('link', { name: /start workout/i }));
    await playEverything();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/workout complete/i);
    expect(screen.getByRole('region', { name: /summary/i })).toBeInTheDocument();
  });

  it('says what it means for next time', async () => {
    await start();
    await user.click(screen.getByRole('link', { name: /start workout/i }));
    await playEverything();
    expect(screen.getByTestId('coach-headline')).toBeInTheDocument();
  });

  it('ends at progress, which is the last step of the loop', async () => {
    await start();
    await user.click(screen.getByRole('link', { name: /start workout/i }));
    await playEverything();

    await user.click(screen.getByRole('link', { name: /see your progress/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /progress/i })).toBeInTheDocument();
  });

  it('or back to today, which is where it started', async () => {
    await start();
    await user.click(screen.getByRole('link', { name: /start workout/i }));
    await playEverything();

    await user.click(screen.getByRole('link', { name: /^done$/i }));
    expect(await screen.findByRole('navigation', { name: /sections/i })).toBeInTheDocument();
  });
});
