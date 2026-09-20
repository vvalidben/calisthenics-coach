import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PROGRAM } from '../../content/program';
import { SEED_PROFILE } from '../../content/seed-profile';
import { TodayScreen } from './TodayScreen';

const MONDAY = '2026-09-21';
const WEDNESDAY = '2026-09-23';
const SUNDAY = '2026-09-20';

const renderScreen = (today = MONDAY, profile = SEED_PROFILE) =>
  render(
    <MemoryRouter>
      <TodayScreen profile={profile} today={today} workouts={PROGRAM} />
    </MemoryRouter>,
  );

describe('on a training day', () => {
  it('names the workout as the heading', () => {
    renderScreen();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Push and Core');
  });

  it('shows how long it will take', () => {
    renderScreen();
    expect(screen.getByText(/2[0-9] minutes/)).toBeInTheDocument();
  });

  it('shows the warm-up, the main work and the mobility block', () => {
    renderScreen();
    expect(screen.getByRole('region', { name: /warm-up/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /main workout/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /mobility/i })).toBeInTheDocument();
  });

  it('lists every prescribed exercise', () => {
    renderScreen();
    const monday = PROGRAM[0]!;
    const counted = (name: RegExp) =>
      within(screen.getByRole('region', { name })).getAllByRole('listitem').length;

    expect(counted(/warm-up/i)).toBe(monday.warmUp.length);
    expect(counted(/main workout/i)).toBe(monday.mainWork.length);
    expect(counted(/^mobility$/i)).toBe(monday.mobility.length);
  });

  it('gives each exercise its sets, target and rest', () => {
    renderScreen();
    const pushUp = screen.getByRole('listitem', { name: /push-up/i });
    expect(pushUp).toHaveTextContent(/3 sets/i);
    expect(pushUp).toHaveTextContent(/6.10 reps/i);
    expect(pushUp).toHaveTextContent(/75s rest/i);
  });

  it('shows each exercise difficulty', () => {
    renderScreen();
    const pushUp = screen.getByRole('listitem', { name: /push-up/i });
    expect(pushUp).toHaveTextContent(/difficulty 2/i);
  });

  it('shows the technique cue for the day', () => {
    renderScreen();
    const pushUp = screen.getByRole('listitem', { name: /push-up/i });
    expect(pushUp).toHaveTextContent('Squeeze your glutes.');
  });

  it('links every exercise to its instructions', () => {
    renderScreen();
    const monday = PROGRAM[0]!;
    const total = monday.warmUp.length + monday.mainWork.length + monday.mobility.length;
    const links = screen.getAllByRole('link', { name: /how to do it/i });
    expect(links).toHaveLength(total);
    expect(links[0]).toHaveAttribute('href', `/library/${monday.warmUp[0]!.exerciseId}`);
  });

  it('shows a timed exercise in seconds rather than reps', () => {
    renderScreen();
    const plank = screen.getByRole('listitem', { name: /front plank/i });
    expect(plank).toHaveTextContent(/20.45 seconds/i);
    expect(plank).not.toHaveTextContent(/reps/i);
  });

  it('says per side where the exercise is done per side', () => {
    renderScreen();
    const sidePlank = screen.getByRole('listitem', { name: /knee side plank/i });
    expect(sidePlank).toHaveTextContent(/per side/i);
  });

  it('shows the note explaining why the dose is what it is', () => {
    renderScreen();
    const pushUp = screen.getByRole('listitem', { name: /push-up/i });
    expect(pushUp).toHaveTextContent(/rep or two in reserve/i);
  });

  it('shows the session note', () => {
    renderScreen();
    expect(screen.getByText(/two reps short/i)).toBeInTheDocument();
  });
});

describe('on a rest day', () => {
  it('says it is a rest day', () => {
    renderScreen(WEDNESDAY);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/rest day/i);
  });

  it('names the next session so the week is legible', () => {
    renderScreen(WEDNESDAY);
    expect(screen.getByText(/thursday/i)).toBeInTheDocument();
    expect(screen.getByText(/upper body and core/i)).toBeInTheDocument();
  });

  it('wraps around the week rather than running out of days', () => {
    renderScreen(SUNDAY);
    expect(screen.getByText(/monday/i)).toBeInTheDocument();
    expect(screen.getByText(/push and core/i)).toBeInTheDocument();
  });

  it('prescribes nothing', () => {
    renderScreen(WEDNESDAY);
    expect(screen.queryByRole('region', { name: /main workout/i })).not.toBeInTheDocument();
  });
});

describe('the week at a glance', () => {
  it('shows all seven days', () => {
    renderScreen();
    const week = within(screen.getByRole('region', { name: /this week/i }));
    expect(week.getAllByRole('listitem')).toHaveLength(7);
  });

  it('marks today', () => {
    renderScreen();
    const week = within(screen.getByRole('region', { name: /this week/i }));
    expect(week.getByRole('listitem', { current: 'date' })).toHaveTextContent(/mon/i);
  });

  it('distinguishes training days from rest days', () => {
    renderScreen();
    const week = within(screen.getByRole('region', { name: /this week/i }));
    expect(week.getAllByText(/rest/i)).toHaveLength(3);
  });
});
