// Video-call links found in your texts, matched to contacts and saved onto their cards automatically.
// Old texts: one-time SMS scan (READ_SMS). New messages: the native LinkListener reads message notifications
// (Notification access), which also covers RCS chats. See modules/krypu-messages.
import { PermissionsAndroid, Platform } from 'react-native';
import { saveLink } from './contacts';
import { detectPlatform } from './platforms';

const Native = Platform.OS === 'android' ? require('../modules/krypu-messages/src/KrypuMessagesModule').default : null;
export const available = !!Native;

const last10 = (n) => (n ?? '').replace(/\D/g, '').slice(-10);

// Save each link onto its person's card unless they already have one for that platform. Returns what was saved.
async function saveAll(matches) {
  const saved = [];
  const seen = new Set();
  for (const m of matches) {
    const key = `${m.person.id}:${m.platform}`;
    if (seen.has(key) || m.person.links?.[m.platform]) continue;   // newest first: keep only the latest per person
    seen.add(key);
    try { await saveLink(m.person, m.url); saved.push(m); } catch {}
  }
  return saved;
}

// One-time scan of received texts. Asks for the SMS permission first. Returns [{person, platform, url}] saved.
export async function scanOldTexts(people) {
  if (!Native) return [];
  const ok = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
  if (ok !== PermissionsAndroid.RESULTS.GRANTED) throw new Error("Krypu needs permission to read texts to find old links.");
  const byNumber = new Map(people.filter((p) => p.phone).map((p) => [last10(p.phone), p]));
  const found = (await Native.scanSms())
    .map((x) => ({ person: byNumber.get(last10(x.address)), url: x.url, platform: detectPlatform(x.url), at: x.at }))
    .filter((x) => x.person && x.platform);
  return saveAll(found);
}

export function isWatching() {
  return !!Native?.isWatching();
}

export function openWatchSettings() {
  Native?.openWatchSettings();
}

// Links the listener saw in message notifications since last time, matched by the sender's name as Messages shows
// it (your contact name). Unmatched links are returned too so the app can offer them. Returns {saved, unmatched}.
export async function collectNewLinks(people) {
  if (!Native) return { saved: [], unmatched: [] };
  const byName = new Map(people.map((p) => [p.name.toLowerCase(), p]));
  const found = Native.takeFound().reverse()   // newest first
    .map((x) => ({ person: byName.get((x.sender ?? '').trim().toLowerCase()), url: x.url, platform: detectPlatform(x.url), sender: x.sender }))
    .filter((x) => x.platform);
  const saved = await saveAll(found.filter((x) => x.person));
  return { saved, unmatched: found.filter((x) => !x.person) };
}
