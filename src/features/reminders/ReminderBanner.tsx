import { Link } from 'react-router-dom';
import type { Reminder } from '../../domain/reminders';

/**
 * The reminder, on the screen.
 *
 * This is the fallback that always works: no permission, no notification API,
 * no server. Whatever happened at the reminder time, the message is here the
 * next time the app is opened — which is why refusing notifications costs the
 * athlete nothing.
 *
 * Deliberately without a button of its own. It sits directly above the day's
 * session, which already carries START WORKOUT, and two identical primary
 * actions a thumb apart is one more than a screen should have.
 */
export const ReminderBanner = ({ reminder }: { reminder: Reminder }) => (
  <aside className="nudge" role="status">
    <p className="nudge__title">{reminder.title}</p>
    <p className="nudge__body">{reminder.body}</p>
    <Link className="nudge__settings" to="/settings">
      Reminder settings
    </Link>
  </aside>
);
