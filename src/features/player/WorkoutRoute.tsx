import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { WorkoutSession } from '../../domain/session';
import type { Workout } from '../../domain/workout';
import type { Repositories } from '../../storage/repositories';
import { WorkoutPlayer } from './WorkoutPlayer';

interface WorkoutRouteProps {
  workouts: Workout[];
  date: string;
  repositories: Repositories;
}

/**
 * Resolves the workout in the URL, finds the last time it was performed, then
 * hands both to the player and persists whatever comes back.
 *
 * Every change is written immediately rather than on finish, so a closed tab,
 * a dead battery or an accidental back gesture costs at most the set in
 * progress.
 */
export const WorkoutRoute = ({ workouts, date, repositories }: WorkoutRouteProps) => {
  const { id } = useParams();
  const workout = workouts.find((w) => w.id === id);

  const [previous, setPrevious] = useState<WorkoutSession | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    repositories.sessions
      .list()
      .then((sessions) => {
        if (cancelled) return;
        const earlier = sessions
          .filter((s) => s.workoutId === id && s.date !== date && s.status !== 'missed')
          .at(-1);
        setPrevious(earlier);
        setReady(true);
      })
      .catch(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [id, date, repositories]);

  if (!workout) {
    return (
      <div className="state">
        <h1 className="state__title">No such workout</h1>
        <p className="state__body">
          Nothing in your program has the id &ldquo;{id}&rdquo;.{' '}
          <Link to="/">Back to today</Link>.
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="state">
        <p className="state__body">Loading your last session&hellip;</p>
      </div>
    );
  }

  return (
    <WorkoutPlayer
      workout={workout}
      date={date}
      previousSession={previous}
      onSessionChange={(session) => {
        void repositories.sessions.save(session);
      }}
    />
  );
};
