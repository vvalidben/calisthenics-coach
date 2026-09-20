import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SEED_PROFILE } from '../../content/seed-profile';
import { TodayScreen } from './TodayScreen';

const renderScreen = (profile = SEED_PROFILE) =>
  render(<TodayScreen profile={profile} today="2026-09-20" />);

describe('TodayScreen', () => {
  it('says plainly that the program has not been built yet', () => {
    renderScreen();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/no workout scheduled/i);
  });

  it('shows the current training phase', () => {
    renderScreen();
    expect(screen.getByText(/foundation phase/i)).toBeInTheDocument();
  });

  it('shows the training schedule in the athlete’s own terms', () => {
    renderScreen();
    expect(screen.getByText(/4 days a week/i)).toBeInTheDocument();
    expect(screen.getByText(/20–30 minutes/i)).toBeInTheDocument();
  });

  it('lists each measured baseline with its number', () => {
    renderScreen();
    const pushUps = screen.getByRole('listitem', { name: /push-up/i });
    expect(pushUps).toHaveTextContent('10');
  });

  it('shows a tested zero as zero', () => {
    renderScreen();
    expect(screen.getByRole('listitem', { name: /parallel bar dip/i })).toHaveTextContent('0');
  });

  it('marks an untested baseline as untested rather than showing a number', () => {
    renderScreen();
    const plank = screen.getByRole('listitem', { name: /front plank/i });
    expect(plank).toHaveTextContent(/not tested yet/i);
    expect(plank).not.toHaveTextContent(/\d/);
  });

  it('shows a seconds unit for a timed baseline and reps for a counted one', () => {
    const profile = {
      ...SEED_PROFILE,
      currentAbilities: [
        { exerciseId: 'front-plank', measurement: 'time' as const, value: 45, assessedAt: '2026-09-20' },
        { exerciseId: 'push-up', measurement: 'reps' as const, value: 10, assessedAt: '2026-09-20' },
      ],
    };
    render(<TodayScreen profile={profile} today="2026-09-20" />);
    expect(screen.getByRole('listitem', { name: /front plank/i })).toHaveTextContent(/seconds/i);
    expect(screen.getByRole('listitem', { name: /push-up/i })).toHaveTextContent(/reps/i);
  });

  it('names the sprint that will fill this screen, so the gap is explained', () => {
    renderScreen();
    expect(screen.getByText(/sprint 2/i)).toBeInTheDocument();
  });
});
