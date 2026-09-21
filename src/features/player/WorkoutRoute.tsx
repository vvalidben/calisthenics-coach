import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { exerciseById } from '../../content/catalog';
import { assessPhase, advanceTo } from '../../domain/phase';
import { requirePhaseSpec } from '../../content/phases';
import type { UserProfile } from '../../domain/profile';
import { progressWorkout, type Decision } from '../../domain/progression-engine';
import type { ProgressionState } from '../../domain/progression';
import type { WorkoutSession } from '../../domain/session';
import type { Workout } from '../../domain/workout';
import type { Repositories } from '../../storage/repositories';
import { WorkoutPlayer } from './WorkoutPlayer';

interface WorkoutRouteProps {
  workouts: Workout[];
  progression: ProgressionState[];
  profile: UserProfile;
  /** Saves and re-renders with the new profile, e.g. after a phase is earned. */
  onProfileChange: (profile: UserProfile) => void;
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
export const WorkoutRoute = ({
  workouts,
  progression,
  profile,
  onProfileChange,
  date,
  repositories,
}: WorkoutRouteProps) => {
  const { id } = useParams();
  const workout = workouts.find((w) => w.id === id);

  const [previous, setPrevious] = useState<WorkoutSession | undefined>();
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [resume, setResume] = useState<WorkoutSession | undefined>();
  const [alreadyDone, setAlreadyDone] = useState<WorkoutSession | undefined>();
  const [decisions, setDecisions] = useState<Decision[]>([]);
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

        // Today's session for this workout, if one was started and never
        // finished. Without this, reopening the workout would write a fresh
        // session over the top of it and the logged sets would be gone.
        const today = sessions.filter((s) => s.date === date && s.workoutId === id);
        setResume(today.find((s) => s.status === 'in-progress'));

        // One session per workout per day is all the store can hold, because
        // the id is the date and the workout. Opening the player again would
        // write over what was logged rather than add to it.
        setAlreadyDone(
          today.find((s) => s.status === 'completed' || s.status === 'partial'),
        );
        // Everything before today, so the coach can see two hard sessions in a
        // row even when they were different workouts.
        setHistory(sessions.filter((s) => s.date !== date));
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

  if (alreadyDone) {
    return (
      <div className="state">
        <h1 className="state__title">Already done today</h1>
        <p className="state__body">
          {workout.name} is logged for today. Starting it again would write over what you did
          rather than add to it, so it stays as it is &mdash; the next session is the one that
          counts.
        </p>
        <Link className="button button--primary" to={`/history/${alreadyDone.id}`}>
          See what you did
        </Link>
        <Link className="state__back" to="/">
          Back to today
        </Link>
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
      decisions={decisions}
      history={history}
      resume={resume}
      onFinish={(session) => {
        const result = progressWorkout(
          session,
          workout,
          progression,
          exerciseById,
          date,
        );
        setDecisions(result.decisions);
        void repositories.workouts.save(result.workout);
        for (const state of result.states) void repositories.progression.save(state);

        // A phase is earned by performance, and performance only changes when
        // a session is logged — so this is the one moment worth asking.
        const assessment = assessPhase({
          spec: requirePhaseSpec(profile.currentPhase.name),
          profile,
          sessions: [...history, session],
          progression: result.states,
          today: date,
        });
        if (assessment.ready && assessment.next !== null) {
          onProfileChange(advanceTo(profile, assessment.next, date));
        }
      }}
    />
  );
};
