import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReminderBanner } from './ReminderBanner';
import type { Reminder } from '../../domain/reminders';

const training: Reminder = {
  id: 'training:2026-09-21',
  date: '2026-09-21',
  kind: 'training',
  at: '18:00',
  workoutId: 'w-mon',
  title: "Today's workout is ready",
  body: "25 minutes of Push and Core. Start when you're ready.",
};

const mobility: Reminder = {
  id: 'mobility:2026-09-23',
  date: '2026-09-23',
  kind: 'mobility',
  at: '18:00',
  workoutId: null,
  title: 'Rest day',
  body: 'A few minutes of mobility is there if you want it. Skipping it costs you nothing.',
};

const show = (reminder: Reminder) =>
  render(
    <MemoryRouter>
      <ReminderBanner reminder={reminder} />
    </MemoryRouter>,
  );

describe('a training reminder', () => {
  it('says exactly what the reminder says', () => {
    show(training);
    expect(screen.getByText("Today's workout is ready")).toBeInTheDocument();
    expect(
      screen.getByText("25 minutes of Push and Core. Start when you're ready."),
    ).toBeInTheDocument();
  });

  it('leaves starting the workout to the session below it, rather than repeating the button', () => {
    show(training);
    expect(screen.queryByRole('link', { name: /start workout/i })).not.toBeInTheDocument();
  });

  it('announces itself to a screen reader when it appears', () => {
    show(training);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('offers a way to change when this happens', () => {
    show(training);
    expect(screen.getByRole('link', { name: /reminder settings/i })).toHaveAttribute(
      'href',
      '/settings',
    );
  });
});

describe('a rest-day nudge', () => {
  it('says its piece', () => {
    show(mobility);
    expect(screen.getByText(/costs you nothing/i)).toBeInTheDocument();
  });

  it('reads as an offer rather than an instruction', () => {
    show(mobility);
    expect(screen.getByText('Rest day')).toBeInTheDocument();
  });
});
