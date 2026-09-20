import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { requireExercise } from '../../content/catalog';
import { SEED_PROFILE } from '../../content/seed-profile';
import { ExerciseDetail } from './ExerciseDetail';

const renderDetail = (id = 'push-up', profile = SEED_PROFILE) =>
  render(
    <MemoryRouter>
      <ExerciseDetail exercise={requireExercise(id)} profile={profile} />
    </MemoryRouter>,
  );

const section = (name: RegExp) => screen.getByRole('region', { name });

describe('ExerciseDetail', () => {
  it('names the exercise as the page heading', () => {
    renderDetail();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Push-Up');
  });

  it('offers a prominent "How to do it" control', () => {
    renderDetail();
    expect(screen.getByRole('link', { name: /how to do it/i })).toBeInTheDocument();
  });

  it('shows the visual sequence', () => {
    renderDetail();
    expect(screen.getByRole('img', { name: /push-up/i })).toBeInTheDocument();
  });
});

describe('the ten sections', () => {
  it('shows the starting position broken into named body parts', () => {
    renderDetail();
    const start = section(/starting position/i);
    for (const part of ['Hands', 'Feet', 'Body', 'Spine', 'Head', 'Shoulders', 'Hips']) {
      expect(within(start).getByText(part)).toBeInTheDocument();
    }
  });

  it('numbers the movement steps', () => {
    renderDetail();
    const steps = within(section(/movement steps/i)).getAllByRole('listitem');
    expect(steps).toHaveLength(requireExercise('push-up').steps.length);
    expect(steps[0]).toHaveTextContent(requireExercise('push-up').steps[0]!);
  });

  it('separates when to inhale from when to exhale', () => {
    renderDetail();
    const breathing = section(/breathing/i);
    expect(within(breathing).getByText(/inhale/i)).toBeInTheDocument();
    expect(within(breathing).getByText(/exhale/i)).toBeInTheDocument();
  });

  it('shows the tempo as phases with durations', () => {
    renderDetail();
    expect(section(/tempo/i)).toHaveTextContent(/2s.*lower/i);
  });

  it('omits the tempo section entirely when an exercise has none', () => {
    renderDetail('dead-hang');
    expect(screen.queryByRole('region', { name: /tempo/i })).not.toBeInTheDocument();
  });

  it('says what should be working and what means stop', () => {
    renderDetail();
    const feel = section(/what you should feel/i);
    expect(feel).toHaveTextContent(requireExercise('push-up').sensation.working);
    expect(within(feel).getByText(/stop if you feel/i)).toBeInTheDocument();
  });

  it('pairs every common mistake with its fix', () => {
    renderDetail();
    const mistakes = within(section(/common mistakes/i)).getAllByRole('listitem');
    expect(mistakes).toHaveLength(requireExercise('push-up').commonMistakes.length);
    expect(mistakes[0]).toHaveTextContent(requireExercise('push-up').commonMistakes[0]!.fix);
  });

  it('lists the coaching cues', () => {
    renderDetail();
    const cues = within(section(/coaching cues/i)).getAllByRole('listitem');
    expect(cues).toHaveLength(requireExercise('push-up').cues.length);
  });

  it('separates normal effort from concerning pain', () => {
    renderDetail();
    const safety = section(/safety/i);
    expect(within(safety).getByText(/normal effort/i)).toBeInTheDocument();
    expect(within(safety).getByText(/normal fatigue/i)).toBeInTheDocument();
    expect(within(safety).getByText(/concerning pain/i)).toBeInTheDocument();
    expect(within(safety).getByText(/stop if/i)).toBeInTheDocument();
    expect(within(safety).getByText(/modify if/i)).toBeInTheDocument();
  });

  it('links to the easier version', () => {
    renderDetail();
    const easier = section(/easier|regression/i);
    expect(within(easier).getByRole('link', { name: /knee push-up/i })).toBeInTheDocument();
  });

  it('links to the harder version', () => {
    renderDetail();
    const harder = section(/harder|progression/i);
    expect(within(harder).getByRole('link', { name: /tempo push-up/i })).toBeInTheDocument();
  });

  it('says plainly when there is no easier version', () => {
    renderDetail('wall-push-up');
    expect(section(/easier/i)).toHaveTextContent(/easiest/i);
  });

  it('says plainly when there is no harder version', () => {
    renderDetail('archer-push-up');
    expect(section(/harder/i)).toHaveTextContent(/hardest/i);
  });
});

describe('equipment awareness', () => {
  it('warns when the athlete cannot currently do the exercise', () => {
    renderDetail('pull-up');
    expect(screen.getByRole('alert')).toHaveTextContent(/pull-up bar/i);
  });

  it('shows no warning for an exercise the athlete can do today', () => {
    renderDetail();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('repeats the family caveat on floor-based pulling', () => {
    renderDetail('prone-y-raise');
    expect(screen.getByText(/not pulling exercises/i)).toBeInTheDocument();
  });
});

describe('written instructions are never optional', () => {
  it('shows the full instructions without needing to press anything', () => {
    renderDetail();
    expect(section(/movement steps/i)).toBeVisible();
    expect(section(/starting position/i)).toBeVisible();
  });

  it('keeps them visible after using the visual controls', async () => {
    renderDetail();
    await userEvent.click(screen.getByRole('button', { name: /play|pause/i }));
    expect(section(/movement steps/i)).toBeVisible();
  });
});
