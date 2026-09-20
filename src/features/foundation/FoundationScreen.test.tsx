import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { SEED_PROGRESSION } from '../../content/seed-progression';
import { FoundationScreen } from './FoundationScreen';

const renderScreen = (progression = SEED_PROGRESSION) =>
  render(<FoundationScreen progression={progression} schemaVersion={1} />);

describe('FoundationScreen', () => {
  it('shows a rung strip for every progression family', () => {
    renderScreen();
    expect(screen.getAllByRole('listitem')).toHaveLength(SEED_PROGRESSION.length);
  });

  it('names the variation the athlete is currently on', () => {
    renderScreen();
    const push = screen.getByRole('listitem', { name: /push/i });
    expect(within(push).getByText('Push-Up')).toBeInTheDocument();
  });

  it('shows the position within the family as a step out of a total', () => {
    renderScreen();
    const push = screen.getByRole('listitem', { name: /^push/i });
    expect(push).toHaveTextContent(/step 3 of 4/i);
  });

  it('describes the rung strip for screen readers rather than leaving bare dots', () => {
    renderScreen();
    const strip = screen.getByRole('img', { name: /push.*step 3 of 4/i });
    expect(strip).toBeInTheDocument();
  });

  it('shows the storage schema version', () => {
    renderScreen();
    expect(screen.getByText(/schema version 1/i)).toBeInTheDocument();
  });

  it('shows how many exercises the catalog holds', () => {
    renderScreen();
    expect(screen.getByText(/26 exercises/i)).toBeInTheDocument();
  });
});
