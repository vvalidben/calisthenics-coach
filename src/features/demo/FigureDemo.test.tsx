import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { requireExercise } from '../../content/catalog';
import { setReducedMotion } from '../../test/setup';
import { FigureDemo } from './FigureDemo';

const pushUp = requireExercise('push-up');

const renderDemo = (exercise = pushUp) =>
  render(<FigureDemo exerciseName={exercise.name} demo={exercise.demo} />);

describe('FigureDemo', () => {
  it('draws the figure as an image with a description, not a bare graphic', () => {
    renderDemo();
    expect(screen.getByRole('img', { name: /push-up.*start/i })).toBeInTheDocument();
  });

  it('starts on the first keyframe', () => {
    renderDemo();
    expect(screen.getByTestId('demo-caption')).toHaveTextContent(pushUp.demo.keyframes[0]!.caption);
  });

  it('offers a button for every keyframe in the sequence', () => {
    renderDemo();
    const steps = within(screen.getByRole('list', { name: /sequence/i })).getAllByRole('button');
    expect(steps.map((b) => b.textContent)).toEqual(pushUp.demo.keyframes.map((k) => k.label));
  });

  it('moves to a keyframe when its button is pressed', async () => {
    renderDemo();
    const bottom = pushUp.demo.keyframes[1]!;

    await userEvent.click(screen.getByRole('button', { name: bottom.label }));

    expect(screen.getByTestId('demo-caption')).toHaveTextContent(bottom.caption);
  });

  it('marks the current keyframe for assistive technology', async () => {
    renderDemo();
    const bottom = pushUp.demo.keyframes[1]!;

    await userEvent.click(screen.getByRole('button', { name: bottom.label }));

    expect(screen.getByRole('button', { name: bottom.label })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('always shows the caption, so the picture is never the only explanation', () => {
    renderDemo();
    expect(screen.getByTestId('demo-caption')).toBeVisible();
  });

  it('offers a play control when motion is allowed', () => {
    renderDemo();
    expect(screen.getByRole('button', { name: /play|pause/i })).toBeInTheDocument();
  });

  it('draws the scene the exercise is performed against', () => {
    renderDemo();
    expect(screen.getByTestId('demo-scene')).toHaveAttribute('data-scene', 'floor');
  });

  it('draws an alignment guide when the exercise declares one', () => {
    renderDemo();
    expect(screen.getByTestId('demo-alignment')).toBeInTheDocument();
  });

  it('omits the alignment guide when there is none to draw', () => {
    const noGuide = { ...pushUp.demo, alignment: undefined };
    render(<FigureDemo exerciseName="Test" demo={noGuide} />);
    expect(screen.queryByTestId('demo-alignment')).not.toBeInTheDocument();
  });
});

describe('FigureDemo under reduced motion', () => {
  it('shows every keyframe at once instead of animating', () => {
    setReducedMotion(true);
    renderDemo();
    expect(screen.getAllByRole('img')).toHaveLength(pushUp.demo.keyframes.length);
  });

  it('shows every caption, not just the current one', () => {
    setReducedMotion(true);
    renderDemo();
    for (const keyframe of pushUp.demo.keyframes) {
      expect(screen.getByText(keyframe.caption)).toBeVisible();
    }
  });

  it('offers no play control, because nothing moves', () => {
    setReducedMotion(true);
    renderDemo();
    expect(screen.queryByRole('button', { name: /play|pause/i })).not.toBeInTheDocument();
  });
});
