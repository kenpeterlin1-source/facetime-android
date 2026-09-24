// Where after-call tasks can be saved. The last one used becomes the default (settings.taskTarget).
// Everything goes through standard links/intents, so no Google sign-in is needed:
//   Google Tasks → Android share sheet (pick Tasks) · Email → mailto: · Text → sms: · Calendar → Google Calendar event link
import { Linking, Share } from 'react-native';

export const TASK_TARGETS = [
  { key: 'google', label: 'Google Tasks' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'email', label: 'Email' },
  { key: 'text', label: 'Text' },
];

const when = (t) => [t.due_date, t.due_time].filter(Boolean).join(' ');
const asText = (tasks) => tasks.map((t) => `• ${t.title}${when(t) ? ` (${when(t)})` : ''}`).join('\n');

// Google Calendar "add event" link for one task; all-day when there's no time.
export function calendarUrl(task) {
  const d = (task.due_date ?? new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  let dates;
  if (task.due_time) {
    const [h, m] = task.due_time.split(':').map(Number);
    const end = `${String(h + 1).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
    dates = `${d}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00/${d}T${end}`;
  } else {
    const next = new Date(Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8) + 1)).toISOString().slice(0, 10).replace(/-/g, '');
    dates = `${d}/${next}`;
  }
  const q = new URLSearchParams({ action: 'TEMPLATE', text: task.title, dates, details: task.details ?? '' });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export async function saveTasks(target, tasks, { personName, myEmail }) {
  const subject = `To do after call with ${personName}`;
  switch (target) {
    case 'google':
      return Share.share({ title: subject, message: asText(tasks) });
    case 'email':
      return Linking.openURL(`mailto:${myEmail ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(asText(tasks))}`);
    case 'text':
      return Linking.openURL(`sms:?body=${encodeURIComponent(`${subject}\n${asText(tasks)}`)}`);
    case 'calendar':
      // one event per task; Calendar opens each in turn
      for (const t of tasks) await Linking.openURL(calendarUrl(t));
      return;
    default:
      throw new Error(`Unknown task target: ${target}`);
  }
}
