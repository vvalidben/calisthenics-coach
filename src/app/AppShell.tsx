import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useParams } from 'react-router-dom';
import { exerciseById } from '../content/catalog';
import { PathwaysScreen } from '../features/pathways/PathwaysScreen';
import { ExerciseDetail } from '../features/library/ExerciseDetail';
import { ExerciseList } from '../features/library/ExerciseList';
import { WorkoutRoute } from '../features/player/WorkoutRoute';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { useReminders } from '../features/reminders/useReminders';
import { HistoryScreen } from '../features/history/HistoryScreen';
import { SessionDetail } from '../features/history/SessionDetail';
import type { UserProfile } from '../domain/profile';
import type { Workout } from '../domain/workout';
import type { StorageAdapter } from '../storage/adapter';
import type { Notifier } from '../notifications/notifier';
import { BrowserNotifier } from '../notifications/browser-notifier';
import type { WorkoutSession } from '../domain/session';
import { bootstrap, type BootstrapResult } from './bootstrap';
import { localIsoDate } from '../domain/calendar';

interface AppShellProps {
  /** Injected in tests; defaults to IndexedDB in the browser. */
  adapter?: StorageAdapter;
  /** Injected in tests so screens render deterministically. */
  today?: string;
  /** Injected in tests; the wall clock reminders are measured against. */
  now?: () => Date;
  /** Injected in tests; defaults to the browser's own notifications. */
  notifier?: Notifier;
}

/** One instance, so a re-render cannot restart the reminder watch. */
const defaultNotifier = new BrowserNotifier();

const CalendarGlyph = () => (
  <svg className="tabbar__glyph" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <rect x="2.5" y="4.5" width="15" height="13" rx="2" fill="none" stroke="currentColor" />
    <path d="M2.5 8.5h15M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

const BookGlyph = () => (
  <svg className="tabbar__glyph" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <path
      d="M3.5 3.5h5a2 2 0 0 1 2 2v11a2 2 0 0 0-2-2h-5zM16.5 3.5h-5a2 2 0 0 0-2 2v11a2 2 0 0 1 2-2h5z"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
    />
  </svg>
);

const LadderGlyph = () => (
  <svg className="tabbar__glyph" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <path
      d="M5.5 2.5v15M14.5 2.5v15M5.5 6.5h9M5.5 10h9M5.5 13.5h9"
      stroke="currentColor"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const ClockGlyph = () => (
  <svg className="tabbar__glyph" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" />
    <path d="M10 5.5V10l3 2" stroke="currentColor" strokeLinecap="round" fill="none" />
  </svg>
);

const GearGlyph = () => (
  <svg className="tabbar__glyph" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="2.75" fill="none" stroke="currentColor" />
    <path
      d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"
      stroke="currentColor"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const TabBar = () => (
  <nav className="tabbar" aria-label="Sections">
    <NavLink to="/" end className="tabbar__link">
      <CalendarGlyph />
      Today
    </NavLink>
    <NavLink to="/library" className="tabbar__link">
      <BookGlyph />
      Exercises
    </NavLink>
    <NavLink to="/pathways" className="tabbar__link">
      <LadderGlyph />
      Pathways
    </NavLink>
    <NavLink to="/history" className="tabbar__link">
      <ClockGlyph />
      History
    </NavLink>
    <NavLink to="/settings" className="tabbar__link">
      <GearGlyph />
      Settings
    </NavLink>
  </nav>
);

/** Resolves the :id in the URL to an exercise, or says it does not exist. */
const ExerciseRoute = ({ profile }: { profile: UserProfile }) => {
  const { id } = useParams();
  const exercise = id === undefined ? undefined : exerciseById(id);

  if (!exercise) {
    return (
      <div className="state">
        <h1 className="state__title">No such exercise</h1>
        <p className="state__body">
          Nothing in the library has the id &ldquo;{id}&rdquo;. Go back to Exercises and pick one
          from the list.
        </p>
      </div>
    );
  }

  return <ExerciseDetail exercise={exercise} profile={profile} />;
};

/** Resolves the :sessionId in the URL to a saved session, or says it does not exist. */
const SessionRoute = ({
  sessions,
  workouts,
}: {
  sessions: WorkoutSession[];
  workouts: Workout[];
}) => {
  const { sessionId } = useParams();
  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <div className="state">
        <h1 className="state__title">No such session</h1>
        <p className="state__body">
          Nothing saved has the id &ldquo;{sessionId}&rdquo;. Go back to History and pick a day
          from the calendar.
        </p>
      </div>
    );
  }

  return (
    <SessionDetail
      session={session}
      workout={workouts.find((w) => w.id === session.workoutId)}
    />
  );
};

interface ReadyAppProps {
  data: BootstrapResult;
  today: string;
  now: (() => Date) | undefined;
  notifier: Notifier;
}

/**
 * The app once the store is open.
 *
 * Its own component so the reminder watch can be a hook: `AppShell` returns
 * early while loading, and a hook cannot live behind an early return.
 */
const ReadyApp = ({ data, today, now, notifier }: ReadyAppProps) => {
  const [profile, setProfile] = useState(data.profile);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    let cancelled = false;
    void data.repositories.sessions.list().then((stored) => {
      if (!cancelled) setSessions(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  const reminder = useReminders({
    profile,
    workouts: data.workouts,
    sessions,
    notifier,
    ...(now === undefined ? {} : { clock: now }),
  });

  /** Optimistic: the screen updates now, the store catches up. */
  const saveProfile = (next: UserProfile) => {
    setProfile(next);
    void data.repositories.profile.save(next);
  };

  return (
    <div className="shell">
      <main className="shell__main">
        <Routes>
          <Route
            path="/"
            element={
              <DashboardScreen
                profile={profile}
                today={today}
                workouts={data.workouts}
                sessions={sessions}
                reminder={reminder}
              />
            }
          />
          <Route
            path="/workout/:id"
            element={
              <WorkoutRoute
                workouts={data.workouts}
                progression={data.progression}
                date={today}
                repositories={data.repositories}
              />
            }
          />
          <Route path="/library" element={<ExerciseList profile={profile} />} />
          <Route path="/library/:id" element={<ExerciseRoute profile={profile} />} />
          <Route
            path="/history"
            element={
              <HistoryScreen
                profile={profile}
                today={today}
                workouts={data.workouts}
                sessions={sessions}
              />
            }
          />
          <Route
            path="/history/:sessionId"
            element={<SessionRoute sessions={sessions} workouts={data.workouts} />}
          />
          <Route
            path="/pathways"
            element={<PathwaysScreen progression={data.progression} profile={profile} />}
          />
          <Route
            path="/settings"
            element={
              <SettingsScreen
                profile={profile}
                workouts={data.workouts}
                notifier={notifier}
                now={now?.() ?? new Date()}
                onSave={saveProfile}
              />
            }
          />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
};

/**
 * Loads the store, then renders the app. Three states only: loading, failed,
 * ready — no half-rendered screens reading from an empty store.
 */
export const AppShell = ({
  adapter,
  today = localIsoDate(),
  now,
  notifier = defaultNotifier,
}: AppShellProps) => {
  const [data, setData] = useState<BootstrapResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    bootstrap(adapter)
      .then((result) => !cancelled && setData(result))
      .catch((cause: unknown) => !cancelled && setError(cause as Error));
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  if (error) {
    return (
      <div className="state state--error" role="alert">
        <h1 className="state__title">Your saved data could not be opened</h1>
        <p className="state__body">{error.message}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="state">
        <p className="state__body">Opening your training data&hellip;</p>
      </div>
    );
  }

  return <ReadyApp data={data} today={today} now={now} notifier={notifier} />;
};
