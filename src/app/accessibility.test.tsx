import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MemoryAdapter } from '../storage/memory-adapter';
import { AppShell } from './AppShell';

const MONDAY = '2026-09-21';

let adapter: MemoryAdapter;
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  adapter = new MemoryAdapter();
  user = userEvent.setup();
});

const openAt = async (path: string) => {
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell adapter={adapter} today={MONDAY} />
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { level: 1 });
  return view;
};

/** Every screen the sprint names, by the route that reaches it. */
const SCREENS: [name: string, path: string][] = [
  ['Dashboard', '/'],
  ['Exercise library', '/library'],
  ['Exercise instructions', '/library/push-up'],
  ['Workout player', '/workout/foundation-w1-d1'],
  ['Progress', '/progress'],
  ['Calendar', '/history'],
  ['Settings', '/settings'],
];

describe.each(SCREENS)('%s', (_name, path) => {
  it('has exactly one first-level heading', async () => {
    await openAt(path);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('puts its content in a main landmark', async () => {
    await openAt(path);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('gives every control an accessible name', async () => {
    await openAt(path);
    const controls = [...screen.queryAllByRole('button'), ...screen.queryAllByRole('link')];

    for (const control of controls) {
      expect(control).toHaveAccessibleName();
    }
  });

  it('labels every form control', async () => {
    await openAt(path);
    const fields = [
      ...screen.queryAllByRole('textbox'),
      ...screen.queryAllByRole('checkbox'),
      ...screen.queryAllByRole('combobox'),
      ...screen.queryAllByRole('spinbutton'),
    ];

    for (const field of fields) {
      expect(field).toHaveAccessibleName();
    }
  });

  it('leaves the tab order to the document', async () => {
    const view = await openAt(path);
    const positive = view.container.querySelectorAll('[tabindex]:not([tabindex="-1"])');
    expect(positive).toHaveLength(0);
  });

  it('never nests a heading level without the one above it', async () => {
    const view = await openAt(path);
    const levels = [...view.container.querySelectorAll('h1,h2,h3,h4')].map((h) =>
      Number(h.tagName[1]),
    );

    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });
});

describe('getting past the navigation', () => {
  it('offers a skip link as the first thing a keyboard reaches', async () => {
    await openAt('/');
    await user.tab();
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveFocus();
  });

  it('points the skip link at the main content', async () => {
    await openAt('/');
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });
});

describe('the navigation itself', () => {
  it('names the section it is', async () => {
    await openAt('/');
    expect(screen.getByRole('navigation', { name: /sections/i })).toBeInTheDocument();
  });

  it('reaches every tabbed screen', async () => {
    await openAt('/');
    const tabs = within(screen.getByRole('navigation', { name: /sections/i }));

    for (const name of [/^today$/i, /^exercises$/i, /^progress$/i, /^history$/i, /^settings$/i]) {
      expect(tabs.getByRole('link', { name })).toBeInTheDocument();
    }
  });

  it('says which tab you are on', async () => {
    await openAt('/history');
    const tabs = within(screen.getByRole('navigation', { name: /sections/i }));
    expect(tabs.getByRole('link', { name: /^history$/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('moves focus to the new screen when a tab is used', async () => {
    await openAt('/');
    const tabs = within(screen.getByRole('navigation', { name: /sections/i }));
    await user.click(tabs.getByRole('link', { name: /^history$/i }));

    await screen.findByRole('heading', { level: 1, name: /history/i });
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('keeps the player clear of the tab bar, so a set cannot be ended by accident', async () => {
    await openAt('/workout/foundation-w1-d1');
    expect(screen.queryByRole('navigation', { name: /sections/i })).not.toBeInTheDocument();
  });
});
