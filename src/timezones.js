// Guess a person's time zone from their phone number, so Krypu can show their local time and warn before
// calling at night. Country code → zone for single-zone countries; North American area codes → zone.
// Anything unknown returns null (no time shown). The user can override per person (settings.tz).
import { useEffect, useState } from 'react';

const COUNTRY = {
  '39': 'Europe/Rome', '44': 'Europe/London', '33': 'Europe/Paris', '49': 'Europe/Berlin', '34': 'Europe/Madrid',
  '353': 'Europe/Dublin', '31': 'Europe/Amsterdam', '41': 'Europe/Zurich', '43': 'Europe/Vienna', '48': 'Europe/Warsaw',
  '30': 'Europe/Athens', '351': 'Europe/Lisbon', '46': 'Europe/Stockholm', '47': 'Europe/Oslo', '45': 'Europe/Copenhagen',
  '972': 'Asia/Jerusalem', '971': 'Asia/Dubai', '91': 'Asia/Kolkata', '63': 'Asia/Manila', '81': 'Asia/Tokyo',
  '82': 'Asia/Seoul', '86': 'Asia/Shanghai', '852': 'Asia/Hong_Kong', '65': 'Asia/Singapore', '64': 'Pacific/Auckland',
  '27': 'Africa/Johannesburg', '234': 'Africa/Lagos', '254': 'Africa/Nairobi',
  // multi-zone countries: most populous zone as a starting guess
  '61': 'Australia/Sydney', '52': 'America/Mexico_City', '55': 'America/Sao_Paulo', '7': 'Europe/Moscow',
};

// North America (+1): area code → zone. Not exhaustive; unknown area codes fall back to null.
const AREA = {
  'America/Denver': ['303', '720', '719', '970', '983', '801', '385', '435', '505', '575', '406', '307'],
  'America/Phoenix': ['480', '520', '602', '623', '928'],
  'America/Los_Angeles': ['206', '253', '360', '425', '503', '971', '213', '310', '323', '415', '510', '619', '626', '650', '702', '707', '714', '818', '858', '916', '949'],
  'America/Chicago': ['312', '773', '872', '214', '469', '972', '281', '713', '832', '512', '210', '612', '651', '314', '414', '504', '615', '816', '913'],
  'America/New_York': ['212', '646', '718', '917', '347', '201', '973', '617', '857', '215', '267', '202', '305', '786', '404', '470', '678', '704', '919', '313', '216', '412', '614'],
  'America/Toronto': ['416', '647', '437', '905', '613', '514', '438'],
  'America/Vancouver': ['604', '778', '236', '250'],
};
const AREA_ZONE = Object.fromEntries(Object.entries(AREA).flatMap(([zone, codes]) => codes.map((c) => [c, zone])));

export const ZONE_CHOICES = ['America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'Europe/London', 'Europe/Rome', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Manila', 'Australia/Sydney'];

export function guessZone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  if (!digits.startsWith('+')) return null;
  const d = digits.slice(1);
  if (d.startsWith('1')) return AREA_ZONE[d.slice(1, 4)] ?? null;
  for (const len of [3, 2, 1]) if (COUNTRY[d.slice(0, len)]) return COUNTRY[d.slice(0, len)];
  return null;
}

// "11:40 PM" in that zone, plus whether it's late (10 pm - 7 am there).
export function localTime(zone, now = new Date()) {
  const time = new Intl.DateTimeFormat(undefined, { timeZone: zone, hour: 'numeric', minute: '2-digit' }).format(now);
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', hourCycle: 'h23' }).format(now));
  return { time, night: hour >= 22 || hour < 7 };
}

export function zoneName(zone) {
  return zone.split('/').pop().replace(/_/g, ' ');
}

// Re-render once a minute so displayed times stay current.
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60 * 1000); return () => clearInterval(id); }, []);
  return now;
}
