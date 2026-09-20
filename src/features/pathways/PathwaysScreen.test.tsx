import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { familyChain } from '../../content/catalog';
import { SEED_PROFILE } from '../../content/seed-profile';
import { SEED_PROGRESSION } from '../../content/seed-progression';
import { PathwaysScreen } from './PathwaysScreen';

const renderScreen = (progression = SEED_PROGRESSION, profile = SEED_PROFILE) =>
  render(
    <MemoryRouter>
      <PathwaysScreen progression={progression} profile={profile} />
    </MemoryRouter>,
  );

const pathway = (name: RegExp) => within(screen.getByRole('region', { name }));

describe('the pathways view', () => {
  it('groups the ladders under movement patterns', () => {
    renderScreen();
    for (const name of [/^push$/i, /^legs$/i, /^core$/i, /^pull$/i, /^skill$/i, /^mobility$/i]) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
  });

  it('puts the push and dip ladders under Push', () => {
    renderScreen();
    const push = pathway(/^push$/i);
    expect(push.getByRole('heading', { name: /^push$/i, level: 3 })).toBeInTheDocument();
    expect(push.getByRole('heading', { name: /^dip$/i, level: 3 })).toBeInTheDocument();
  });

  it('keeps the three core ladders separate rather than merging them', () => {
    renderScreen();
    const core = pathway(/^core$/i);
    expect(core.getByRole('heading', { name: /^core$/i, level: 3 })).toBeInTheDocument();
    expect(core.getByRole('heading', { name: /side core/i, level: 3 })).toBeInTheDocument();
    expect(core.getByRole('heading', { name: /hanging core/i, level: 3 })).toBeInTheDocument();
  });

  it('explains why the core ladders are parallel', () => {
    renderScreen();
    expect(pathway(/^core$/i).getByText(/parallel ladders, not one chain/i)).toBeInTheDocument();
  });
});

describe('each ladder', () => {
  it('lists every step in order', () => {
    renderScreen();
    const chain = familyChain('push');
    const steps = within(screen.getByRole('list', { name: /push ladder/i })).getAllByRole(
      'listitem',
    );
    expect(steps.map((s) => s.getAttribute('aria-label'))).toEqual(chain.map((e) => e.name));
  });

  it('includes the tempo push-up between the standard and the harder work', () => {
    renderScreen();
    const names = familyChain('push').map((e) => e.id);
    expect(names.indexOf('tempo-push-up')).toBeGreaterThan(names.indexOf('push-up'));
    expect(names.indexOf('tempo-push-up')).toBeLessThan(names.indexOf('diamond-push-up'));
  });

  it('links every step to its instructions', () => {
    renderScreen();
    const push = within(screen.getByRole('list', { name: /push ladder/i }));
    expect(push.getByRole('link', { name: 'Push-Up' })).toHaveAttribute(
      'href',
      '/library/push-up',
    );
  });

  it('marks where the athlete currently is', () => {
    renderScreen();
    const current = within(screen.getByRole('list', { name: /push ladder/i })).getByRole(
      'listitem',
      { current: 'step' },
    );
    expect(current).toHaveAttribute('aria-label', 'Push-Up');
  });

  it('marks the steps already behind you as cleared', () => {
    renderScreen();
    const push = within(screen.getByRole('list', { name: /push ladder/i }));
    expect(push.getByRole('listitem', { name: 'Wall Push-Up' })).toHaveTextContent(/cleared/i);
  });

  it('marks steps needing equipment you do not have', () => {
    renderScreen();
    const pull = within(screen.getByRole('list', { name: /^pull ladder/i }));
    expect(pull.getByRole('listitem', { name: 'Pull-Up' })).toHaveTextContent(/pull-up bar/i);
  });
});

describe('the handstand pathway', () => {
  it('runs through the four stages', () => {
    renderScreen();
    const steps = within(screen.getByRole('list', { name: /handstand ladder/i })).getAllByRole(
      'listitem',
    );
    expect(steps.map((s) => s.getAttribute('aria-label'))).toEqual([
      'Wrist Preparation',
      'Plank to Pike Hold',
      'Handstand, Back to Wall',
      'Handstand, Chest to Wall',
      'Wall Handstand Shoulder Tap',
    ]);
  });

  it('says plainly that it is not part of the current program', () => {
    renderScreen();
    expect(pathway(/^skill$/i).getByText(/deliberately not in your programme/i)).toBeInTheDocument();
  });
});

describe('the pulling pathway', () => {
  it('explains that vertical pulling needs a safe setup', () => {
    renderScreen();
    expect(pathway(/^pull$/i).getByText(/needs something safe to hang from/i)).toBeInTheDocument();
  });

  it('warns against improvising one', () => {
    renderScreen();
    expect(pathway(/^pull$/i).getByText(/across two chairs|door handle/i)).toBeInTheDocument();
  });

  it('says the whole ladder unlocks once a bar exists', () => {
    renderScreen();
    expect(pathway(/^pull$/i).getByText(/unlocks at once/i)).toBeInTheDocument();
  });

  it('still shows the floor-based work, labelled as not being a pull', () => {
    renderScreen();
    const pull = pathway(/^pull$/i);
    expect(pull.getByRole('heading', { name: /floor-based/i, level: 3 })).toBeInTheDocument();
    expect(pull.getByText(/not pulling exercises/i)).toBeInTheDocument();
  });

  it('unlocks the bar ladder when the profile gains a bar', () => {
    renderScreen(SEED_PROGRESSION, {
      ...SEED_PROFILE,
      availableEquipment: [...SEED_PROFILE.availableEquipment, 'pullup-bar'],
    });
    const pull = within(screen.getByRole('list', { name: /^pull ladder/i }));
    expect(pull.getByRole('listitem', { name: 'Pull-Up' })).not.toHaveTextContent(/needs/i);
  });
});

describe('navigating a pathway', () => {
  it('lets you reach any step from the map', async () => {
    renderScreen();
    const link = screen.getByRole('link', { name: 'Tempo Push-Up' });
    expect(link).toHaveAttribute('href', '/library/tempo-push-up');
    await userEvent.click(link);
  });

  it('shows how many exercises the library holds', () => {
    renderScreen();
    expect(screen.getByText(/64 exercises/i)).toBeInTheDocument();
  });
});
