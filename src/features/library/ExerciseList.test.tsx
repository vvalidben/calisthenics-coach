import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EXERCISES } from '../../content/catalog';
import { SEED_PROFILE } from '../../content/seed-profile';
import { ExerciseList } from './ExerciseList';

const renderList = (profile = SEED_PROFILE) =>
  render(
    <MemoryRouter>
      <ExerciseList profile={profile} />
    </MemoryRouter>,
  );

describe('ExerciseList', () => {
  it('lists every exercise in the library', () => {
    renderList();
    expect(screen.getAllByRole('link')).toHaveLength(EXERCISES.length);
  });

  it('links each exercise to its own page', () => {
    renderList();
    expect(screen.getByRole('link', { name: 'Push-Up' })).toHaveAttribute(
      'href',
      '/library/push-up',
    );
  });

  it('groups exercises under their family', () => {
    renderList();
    expect(screen.getByRole('heading', { name: /^push$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /thoracic spine/i })).toBeInTheDocument();
  });

  it('narrows the list as you search', async () => {
    renderList();
    await userEvent.type(screen.getByRole('searchbox'), 'plank');
    const names = screen.getAllByRole('link').map((a) => a.textContent ?? '');
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => /plank/i.test(n))).toBe(true);
  });

  it('searches tags as well as names', async () => {
    renderList();
    await userEvent.type(screen.getByRole('searchbox'), 'handstand-prep');
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
  });

  it('says so when nothing matches, rather than showing an empty page', async () => {
    renderList();
    await userEvent.type(screen.getByRole('searchbox'), 'trampoline');
    expect(screen.getByText(/no exercise matches/i)).toBeInTheDocument();
  });

  it('marks exercises the athlete has no equipment for', () => {
    renderList();
    const pullUp = screen.getByRole('link', { name: 'Pull-Up. Needs a pull-up bar' });
    expect(pullUp).toHaveTextContent(/needs a pull-up bar/i);
  });

  it('does not mark exercises the athlete can do today', () => {
    renderList();
    expect(screen.getByRole('link', { name: 'Push-Up' })).not.toHaveTextContent(/needs/i);
  });

  it('counts what is usable so the gap is visible', () => {
    renderList();
    expect(screen.getByText(/55 of 64/i)).toBeInTheDocument();
  });
});
