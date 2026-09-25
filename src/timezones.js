// Guess a person's time zone from their phone number, so Krypu can show their local time and warn before
// calling at night. Uses Google's libphonenumber prefix table (src/phoneZones.js). Unknown numbers return null
// (no time shown). The user can override per person (settings.tz).
import { useEffect, useState } from 'react';
import { PHONE_ZONES } from './phoneZones';

export const ZONE_CHOICES = ['America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'Europe/London', 'Europe/Rome', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Manila', 'Australia/Sydney'];

export function guessZone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  if (!digits.startsWith('+')) return null;
  const d = digits.slice(1);
  // longest matching prefix wins: +1 484… → America/New_York, +39… → Europe/Rome
  for (let n = Math.min(d.length, 7); n > 0; n--) if (PHONE_ZONES[d.slice(0, n)]) return PHONE_ZONES[d.slice(0, n)];
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
