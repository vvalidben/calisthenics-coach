import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useParams } from 'react-router-dom';
import { exerciseById } from '../content/catalog';
import { FoundationScreen } from '../features/foundation/FoundationScreen';
import { ExerciseDetail } from '../features/library/ExerciseDetail';
import { ExerciseList } from '../features/library/ExerciseList';
import { TodayScreen } from '../features/today/TodayScreen';
import type { UserProfile } from '../domain/profile';
import type { StorageAdapter } from '../storage/adapter';
import { CURRENT_SCHEMA_VERSION } from '../storage/migrations';
import { bootstrap, type BootstrapResult } from './bootstrap';
import { localIsoDate } from './today';

interface AppShellProps {
  /** Injected in tests; defaults to IndexedDB in the browser. */
  adapter?: StorageAdapter;
  /** Injected in tests so screens render deterministically. */
  today?: string;
}

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
    <NavLink to="/progressions" className="tabbar__link">
      <LadderGlyph />
      Progressions
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

/**
 * Loads the store, then renders the app. Three states only: loading, failed,
 * ready — no half-rendered screens reading from an empty store.
 */
export const AppShell = ({ adapter, today = localIsoDate() }: AppShellProps) => {
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

  return (
    <div className="shell">
      <main className="shell__main">
        <Routes>
          <Route path="/" element={<TodayScreen profile={data.profile} today={today} />} />
          <Route path="/library" element={<ExerciseList profile={data.profile} />} />
          <Route path="/library/:id" element={<ExerciseRoute profile={data.profile} />} />
          <Route
            path="/progressions"
            element={
              <FoundationScreen
                progression={data.progression}
                profile={data.profile}
                schemaVersion={CURRENT_SCHEMA_VERSION}
              />
            }
          />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
};
