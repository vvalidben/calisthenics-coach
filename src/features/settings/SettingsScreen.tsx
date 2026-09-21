import { useState } from 'react';
import { localIsoDate } from '../../domain/calendar';
import { WEEKDAYS, type Weekday } from '../../domain/primitives';
import type { ReminderSettings, UserProfile } from '../../domain/profile';
import { nextReminder } from '../../domain/reminders';
import type { Workout } from '../../domain/workout';
import type { Notifier } from '../../notifications/notifier';

interface SettingsScreenProps {
  profile: UserProfile;
  workouts: Workout[];
  notifier: Notifier;
  /** Injected so the "next reminder" line is deterministic in tests. */
  now: Date;
  onSave: (profile: UserProfile) => void;
}

/** The lead times worth offering. More choices here would not help anyone. */
const LEAD_TIMES = [
  { minutes: 0, label: 'At my training time' },
  { minutes: 15, label: '15 minutes before' },
  { minutes: 30, label: '30 minutes before' },
  { minutes: 60, label: '1 hour before' },
];

const titleCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const WEEKDAY_LABEL = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });

const LIST = new Intl.ListFormat('en-GB', { style: 'long', type: 'conjunction' });

/**
 * Everything the athlete can change about when they train and when they hear
 * from the app.
 *
 * Saves on every change rather than behind a Save button: there is no server
 * to round-trip to, and a settings screen that can be left in an unsaved state
 * is a settings screen that silently loses changes.
 */
export const SettingsScreen = ({
  profile,
  workouts,
  notifier,
  now,
  onSave,
}: SettingsScreenProps) => {
  const [access, setAccess] = useState(notifier.permission());
  const [problem, setProblem] = useState<string | null>(null);

  const save = (changes: Partial<UserProfile>) => {
    setProblem(null);
    onSave({ ...profile, ...changes, updatedAt: localIsoDate(now) });
  };

  const toggleDay = (day: Weekday) => {
    const on = profile.trainingDays.includes(day);
    const days = on
      ? profile.trainingDays.filter((d) => d !== day)
      : WEEKDAYS.filter((d) => d === day || profile.trainingDays.includes(d));

    if (days.length === 0) {
      setProblem('Keep at least one training day. A program with no days is not a program.');
      return;
    }

    save({ trainingDays: days });
  };

  const setReminders = (changes: Partial<ReminderSettings>) =>
    save({ reminders: { ...profile.reminders, ...changes } });

  const next = nextReminder({ profile, workouts, now });

  // The program is written for particular weekdays. Choosing a day it does not
  // cover is allowed — it is the athlete's schedule — but it must not look like
  // a workout has been promised.
  const covered = WEEKDAYS.filter((day) =>
    workouts.some((w) => w.kind === 'training' && w.day === day),
  );
  const uncovered = profile.trainingDays.filter((day) => !covered.includes(day));

  const askForPermission = async () => {
    setAccess(await notifier.request());
  };

  return (
    <div className="settings">
      <h1 className="page__title">Settings</h1>
      <p className="page__lede">
        When you train, and when the app should say something about it.
      </p>

      <section className="setting" aria-labelledby="days-heading">
        <h2 className="setting__heading" id="days-heading">
          Training days
        </h2>
        <p className="setting__detail">
          {profile.trainingDays.length} days a week. Changing these changes the calendar and the
          reminders; nothing already logged is touched.
        </p>
        <div className="days" role="group" aria-labelledby="days-heading">
          {WEEKDAYS.map((day) => (
            <label className="days__day" key={day}>
              <input
                type="checkbox"
                checked={profile.trainingDays.includes(day)}
                onChange={() => toggleDay(day)}
              />
              <span>{titleCase(day)}</span>
            </label>
          ))}
        </div>
        {problem !== null && (
          <p className="setting__problem" role="alert">
            {problem}
          </p>
        )}
        {uncovered.length > 0 && (
          <p className="setting__problem">
            Your program has no session written for {LIST.format(uncovered.map(titleCase))}, so
            nothing is scheduled then and no reminder is sent. It covers{' '}
            {LIST.format(covered.map(titleCase))}.
          </p>
        )}
      </section>

      <section className="setting" aria-labelledby="time-heading">
        <h2 className="setting__heading" id="time-heading">
          Training time
        </h2>
        <p className="setting__detail">
          18:00 to begin with: late enough to be warm and fed, early enough that a hard session is
          not the last thing before sleep.
        </p>
        <label className="field">
          <span className="field__label">Start at</span>
          <input
            className="field__input"
            type="time"
            value={profile.preferredTrainingTime}
            onChange={(event) => {
              // A time input reports an empty string mid-edit. Saving that
              // would write a profile the schema rightly refuses.
              if (event.target.value === '') return;
              save({ preferredTrainingTime: event.target.value });
            }}
          />
        </label>
      </section>

      <section className="setting" aria-labelledby="reminders-heading">
        <h2 className="setting__heading" id="reminders-heading">
          Reminders
        </h2>

        <label className="switch">
          <input
            type="checkbox"
            checked={profile.reminders.enabled}
            onChange={(event) => setReminders({ enabled: event.target.checked })}
          />
          <span>Remind me on training days</span>
        </label>

        <label className="field">
          <span className="field__label">When to remind me</span>
          <select
            className="field__input"
            value={`${profile.reminders.minutesBefore}`}
            disabled={!profile.reminders.enabled}
            onChange={(event) => setReminders({ minutesBefore: Number(event.target.value) })}
          >
            {LEAD_TIMES.map((lead) => (
              <option key={lead.minutes} value={lead.minutes}>
                {lead.label}
              </option>
            ))}
          </select>
        </label>

        <label className="switch">
          <input
            type="checkbox"
            checked={profile.reminders.mobilityOnRestDays}
            disabled={!profile.reminders.enabled}
            onChange={(event) => setReminders({ mobilityOnRestDays: event.target.checked })}
          />
          <span>Also mention mobility on rest days</span>
        </label>

        <p className="setting__next" data-testid="next-reminder">
          {next === null
            ? 'Reminders are off. Nothing is scheduled.'
            : `Next reminder: ${WEEKDAY_LABEL.format(new Date(`${next.date}T12:00:00`))} at ${next.at}.`}
        </p>
      </section>

      <section className="setting" aria-labelledby="delivery-heading">
        <h2 className="setting__heading" id="delivery-heading">
          How reminders reach you
        </h2>

        <p className="setting__detail">
          These are <strong>not push notifications</strong>. The app has no server behind it, so a
          reminder can appear <strong>only while the app is open</strong> in a tab or as an
          installed app. If it is closed at your training time, nothing arrives.
        </p>
        <p className="setting__detail">
          Either way the reminder is waiting for you on the Today screen the next time you open the
          app, so nothing is lost by refusing this.
        </p>

        {!notifier.supported && (
          <p className="setting__status">This browser does not support notifications at all.</p>
        )}

        {notifier.supported && access === 'default' && (
          <button className="button" type="button" onClick={() => void askForPermission()}>
            Allow notifications
          </button>
        )}

        {notifier.supported && access === 'granted' && (
          <p className="setting__status">
            Notifications are allowed. One will appear at your reminder time if the app is open.
          </p>
        )}

        {notifier.supported && access === 'denied' && (
          <p className="setting__status">
            You have blocked notifications for this app. That is a browser setting and the app
            cannot undo it; the in-app reminder keeps working regardless.
          </p>
        )}
      </section>
    </div>
  );
};
