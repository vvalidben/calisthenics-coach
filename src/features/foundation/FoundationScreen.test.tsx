import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { SEED_PROGRESSION } from '../../content/seed-progression';
import { SEED_PROFILE } from '../../content/seed-profile';
import { FoundationScreen } from './FoundationScreen';

const renderScreen = (progression = SEED_PROGRESSION, profile = SEED_PROFILE) =>
  render(<FoundationScreen progression={progression} profile={profile} schemaVersion={1} />);

describe('FoundationScreen', () => {
  it('shows a rung strip for every progression family', () => {
    renderScreen();
    expect(screen.getAllByRole('listitem')).toHaveLength(SEED_PROGRESSION.length);
  });

  it('names the variation the athlete is currently on', () => {
    renderScreen();
    const push = screen.getByRole('listitem', { name: /^push progression/i });
    expect(within(push).getByText('Push-Up')).toBeInTheDocument();
  });

  it('shows the position within the family as a step out of a total', () => {
    renderScreen();
    const push = screen.getByRole('listitem', { name: /^push progression/i });
    expect(push).toHaveTextContent(/step 4 of 7/i);
  });

  it('describes the rung strip for screen readers rather than leaving bare dots', () => {
    renderScreen();
    expect(screen.getByRole('img', { name: /push.*step 4 of 7/i })).toBeInTheDocument();
  });

  it('takes family names from the registry rather than hardcoding them', () => {
    renderScreen();
    expect(screen.getByRole('listitem', { name: /thoracic spine/i })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /ankles/i })).toBeInTheDocument();
  });

  it('marks a family the athlete cannot train as locked', () => {
    renderScreen();
    const pull = screen.getByRole('listitem', { name: /^pull progression/i });
    expect(pull).toHaveTextContent(/needs a pull-up bar/i);
  });

  it('does not mark an available family as locked', () => {
    renderScreen();
    const squat = screen.getByRole('listitem', { name: /squat progression/i });
    expect(squat).not.toHaveTextContent(/needs a/i);
  });

  it('shows the caveat explaining why floor pulling is not pulling', () => {
    renderScreen();
    const prep = screen.getByRole('listitem', { name: /floor-based/i });
    expect(prep).toHaveTextContent(/not pulling exercises/i);
  });

  it('warns against improvising a pull-up bar', () => {
    renderScreen();
    const pull = screen.getByRole('listitem', { name: /^pull progression/i });
    expect(pull).toHaveTextContent(/two chairs|door handle/i);
  });

  it('unlocks the pull family when the profile gains a bar', () => {
    renderScreen(SEED_PROGRESSION, {
      ...SEED_PROFILE,
      availableEquipment: [...SEED_PROFILE.availableEquipment, 'pullup-bar'],
    });
    const pull = screen.getByRole('listitem', { name: /^pull progression/i });
    expect(pull).not.toHaveTextContent(/needs a pull-up bar/i);
  });

  it('shows the storage schema version', () => {
    renderScreen();
    expect(screen.getByText(/schema version 1/i)).toBeInTheDocument();
  });

  it('shows how many exercises the catalog holds and how many are usable today', () => {
    renderScreen();
    expect(screen.getByText(/60 exercises/i)).toBeInTheDocument();
    expect(screen.getByText(/51 usable without equipment/i)).toBeInTheDocument();
  });
});
