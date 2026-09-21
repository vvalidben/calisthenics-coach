import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PROGRAM } from '../../content/program';
import { ROUTINES } from '../../content/routines';
import { SEED_PROFILE } from '../../content/seed-profile';
import type { Reminder } from '../../domain/reminders';
import type { WorkoutSession } from '../../domain/session';
import { aSession } from '../../test/factories';
import { DashboardScreen } from './DashboardScreen';

const MON = '2026-09-21';
const TUE = '2026-09-22';
const WED = '2026-09-23';
const THU = '2026-09-24';
const SUN = '2026-09-27';

const profile = { ...SEED_PROFILE, trainingDays: ['monday', 'tuesday', 'thursday', 'saturday'] as const };

const trained = (date: string, overrides: Partial<WorkoutSession> = {}): WorkoutSession =>
  aSession({ id: `${date}-w`, date, status: 'completed', kind: 'training', ...overrides });

const stretched = (date: string): WorkoutSession =>
  aSession({ id: `${date}-m`, date, status: 'completed', kind: 'mobility', workoutId: 'mobility-hips' });

const renderDashboard = (
  today = MON,
  sessions: WorkoutSession[] = [],
  reminder: Reminder | null = null,
) =>
  render(
    <MemoryRouter>
      <DashboardScreen
        profile={{ ...profile, trainingDays: [...profile.trainingDays] }}
        today={today}
        workouts={[...PROGRAM, ...ROUTINES]}
        sessions={sessions}
        reminder={reminder}
      />
    </MemoryRouter>,
  );

const aReminder: Reminder = {
  id: `training:${MON}`,
  date: MON,
  kind: 'training',
  at: '18:00',
  workoutId: 'foundation-w1-d1',
  title: "Today's workout is ready",
  body: "25 minutes of Push and Core. Start when you're ready.",
};

const region = (name: RegExp) => within(screen.getByRole('region', { name }));
const stat = (id: string) => screen.getByTestId(`stat-${id}`);

describe('the reminder', () => {
  it('is not shown before it is due', () => {
    renderDashboard();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('is shown once it is due', () => {
    renderDashboard(MON, [], aReminder);
    expect(screen.getByRole('status')).toHaveTextContent(/today's workout is ready/i);
  });

  it('comes before the rest of the page, because it is the reason to open the app', () => {
    renderDashboard(MON, [], aReminder);
    const banner = screen.getByRole('status');
    const today = screen.getByRole('region', { name: /today/i });
    expect(banner.compareDocumentPosition(today) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('does not replace the session, which is still the point of the screen', () => {
    renderDashboard(MON, [], aReminder);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Push and Core');
  });
});

describe('getting to settings', () => {
  it('offers a way to change the schedule', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: /schedule and reminders/i })).toHaveAttribute(
      'href',
      '/settings',
    );
  });
});

describe('what do I do today', () => {
  it('leads with the session name', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Push and Core');
  });

  it('says how long it takes', () => {
    renderDashboard();
    expect(region(/today/i).getByText(/2[0-9] minutes/)).toBeInTheDocument();
  });

  it('says what level it is pitched at', () => {
    renderDashboard();
    expect(region(/today/i).getByText(/beginner/i)).toBeInTheDocument();
  });

  it('offers START WORKOUT as the primary action', () => {
    renderDashboard();
    const start = screen.getByRole('link', { name: /start workout/i });
    expect(start).toHaveAttribute('href', '/workout/foundation-w1-d1');
  });

  it('changes with the day', () => {
    renderDashboard(THU);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Upper Body and Core');
  });
});

describe('on a rest day', () => {
  it('says so rather than showing an empty workout', () => {
    renderDashboard(WED);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/rest day/i);
  });

  it('offers no start button', () => {
    renderDashboard(WED);
    expect(screen.queryByRole('link', { name: /start workout/i })).not.toBeInTheDocument();
  });

  it('names the next session instead', () => {
    renderDashboard(WED);
    const next = region(/next/i);
    expect(next.getByText(/thursday/i)).toBeInTheDocument();
    expect(next.getByText(/upper body and core/i)).toBeInTheDocument();
  });

  it('wraps to Monday from a Sunday', () => {
    renderDashboard(SUN);
    const next = region(/next/i);
    expect(next.getByText(/monday/i)).toBeInTheDocument();
    expect(next.getByText(/push and core/i)).toBeInTheDocument();
  });

  it('still shows the week and the stats', () => {
    renderDashboard(WED, [trained(MON), trained(TUE)]);
    expect(region(/this week/i).getByText('2 of 4')).toBeInTheDocument();
  });
});

describe('the numbers', () => {
  it('shows weekly progress', () => {
    renderDashboard(WED, [trained(MON), trained(TUE)]);
    expect(region(/this week/i).getByText('2 of 4')).toBeInTheDocument();
  });

  it('shows the current streak', () => {
    renderDashboard(WED, [trained(MON), trained(TUE)]);
    expect(stat('streak')).toHaveTextContent(/streak\s*2/i);
  });

  it('shows total workouts', () => {
    renderDashboard(WED, [trained('2026-09-14'), trained(MON), trained(TUE)]);
    expect(stat('total')).toHaveTextContent(/total\s*3/i);
  });

  it('shows the training phase and how far into it you are', () => {
    renderDashboard(WED);
    expect(stat('phase')).toHaveTextContent(/foundation/i);
    expect(stat('phase')).toHaveTextContent(/week 1 of 4/i);
  });

  it('starts everything at zero before the first session', () => {
    renderDashboard(MON);
    expect(region(/this week/i).getByText('0 of 4')).toBeInTheDocument();
    expect(stat('streak')).toHaveTextContent(/streak\s*0/i);
    expect(stat('total')).toHaveTextContent(/total\s*0/i);
  });
});

describe('recent performance', () => {
  it('lists the last few sessions', () => {
    renderDashboard(WED, [trained(MON), trained(TUE)]);
    expect(region(/recent/i).getAllByRole('listitem')).toHaveLength(2);
  });

  it('names each session and how hard it felt', () => {
    renderDashboard(WED, [trained(MON, { overallRpe: 8 })]);
    const recent = region(/recent/i);
    expect(recent.getByText(/push and core/i)).toBeInTheDocument();
    expect(recent.getByText(/hard/i)).toBeInTheDocument();
  });

  it('counts sets in words that read correctly', () => {
    renderDashboard(WED, [trained(MON)]);
    const recent = region(/recent/i);
    expect(recent.getByText(/1 set,/i)).toBeInTheDocument();
    expect(recent.queryByText(/1 sets/i)).not.toBeInTheDocument();
  });

  it('marks a session that was only partly done', () => {
    renderDashboard(WED, [trained(MON, { status: 'partial' })]);
    expect(region(/recent/i).getByText(/partly done/i)).toBeInTheDocument();
  });

  it('says so plainly when there is no history yet', () => {
    renderDashboard(MON);
    expect(region(/recent/i).getByText(/nothing logged yet/i)).toBeInTheDocument();
  });

  it('leaves mobility routines out of it', () => {
    renderDashboard(WED, [stretched(TUE)]);
    expect(region(/recent/i).getByText(/nothing logged yet/i)).toBeInTheDocument();
  });
});

describe('mobility progress', () => {
  it('counts restorative sessions from the last week', () => {
    renderDashboard(WED, [stretched(MON), stretched(TUE)]);
    expect(region(/mobility/i).getByText(/2 in the last seven days/i)).toBeInTheDocument();
  });

  it('encourages rather than scolds when there are none', () => {
    renderDashboard(WED);
    expect(region(/mobility/i).getByText(/none this week/i)).toBeInTheDocument();
  });

  it('offers the routines', () => {
    renderDashboard(WED);
    expect(region(/mobility/i).getByRole('link', { name: /hips/i })).toHaveAttribute(
      'href',
      '/workout/mobility-hips',
    );
  });
});

describe('the week at a glance', () => {
  it('shows all seven days', () => {
    renderDashboard();
    expect(region(/this week/i).getAllByRole('listitem')).toHaveLength(7);
  });

  it('marks today', () => {
    renderDashboard(THU);
    expect(region(/this week/i).getByRole('listitem', { current: 'date' })).toHaveTextContent(
      /thu/i,
    );
  });

  it('marks the days already trained', () => {
    renderDashboard(WED, [trained(MON), trained(TUE)]);
    const done = region(/this week/i).getAllByTestId('week-done');
    expect(done).toHaveLength(2);
  });
});

describe('it stays a dashboard', () => {
  it('keeps the whole thing to a handful of sections', () => {
    renderDashboard(WED, [trained(MON)]);
    expect(screen.getAllByRole('region').length).toBeLessThanOrEqual(6);
  });
});
