// The phone's contacts, turned into Krypu people: name, best phone number, and any video links saved on the card.
// Links live on the contact as URL entries labelled with the platform ("FaceTime", "Zoom", …) - see README.
// The web preview has no contacts, so it uses the sample people.
import { addContactsChangeListener, Contact, ContactField, getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { detectPlatform, PLATFORMS } from './platforms';
import { SAMPLE_CONTACTS } from './sampleContacts';

const FIELDS = [ContactField.FULL_NAME, ContactField.PHONES, ContactField.URL_ADDRESSES];
const WEB = Platform.OS === 'web';

// "+1 303 555 0101" style, so time zones and WhatsApp work. Numbers without a country code are assumed to be
// North American when they have 10 digits (Ken's contacts are mostly US).
export function normalizePhone(number) {
  if (!number) return null;
  const n = number.replace(/[^\d+]/g, '');
  if (n.startsWith('+')) return n;
  if (n.startsWith('00')) return `+${n.slice(2)}`;
  if (n.length === 10) return `+1${n}`;
  if (n.length === 11 && n.startsWith('1')) return `+${n}`;
  return n;
}

function bestPhone(phones = []) {
  const pick = phones.find((p) => /mobile|cell|iphone/i.test(p.label ?? '')) ?? phones.find((p) => p.isPrimary) ?? phones[0];
  return pick?.number ? normalizePhone(pick.number) : null;
}

function toPerson(row) {
  const links = {};
  for (const u of row.urlAddresses ?? []) {
    const platform = u.url && detectPlatform(u.url.trim());
    if (platform && !links[platform]) links[platform] = u.url.trim();
  }
  // Apple devices label numbers "iPhone" when contacts sync - the best hint Android has that someone can FaceTime
  const iphoneHint = (row.phones ?? []).some((p) => /iphone/i.test(p.label ?? ''));
  return { id: row.id, name: row.fullName?.trim() || 'No name', phone: bestPhone(row.phones), links, platforms: Object.keys(links), iphoneHint };
}

// status: 'loading' | 'ask' (not asked yet) | 'denied' | 'ready'
export function useContacts() {
  const [state, setState] = useState({ status: WEB ? 'ready' : 'loading', people: WEB ? SAMPLE_CONTACTS : [] });

  const load = useCallback(async () => {
    if (WEB) return;
    const rows = await Contact.getAllDetails(FIELDS);
    const people = rows.map(toPerson).filter((p) => p.phone || p.platforms.length)
      .sort((a, b) => a.name.localeCompare(b.name));
    setState({ status: 'ready', people });
  }, []);

  const check = useCallback(async () => {
    if (WEB) return;
    const perm = await getPermissionsAsync();
    if (perm.granted) return load();
    setState({ status: perm.canAskAgain ? 'ask' : 'denied', people: [] });
  }, [load]);

  const ask = useCallback(async () => {
    const perm = await requestPermissionsAsync();
    if (perm.granted) return load();
    setState({ status: 'denied', people: [] });
  }, [load]);

  useEffect(() => {
    check();
    if (WEB) return;
    // refresh when contacts change or when you come back from the Contacts app
    const changes = addContactsChangeListener(() => { load().catch(() => {}); });
    const app = AppState.addEventListener('change', (s) => { if (s === 'active') check(); });
    return () => { changes.remove(); app.remove(); };
  }, [check, load]);

  return { ...state, ask, reload: load };
}

// Save a video link onto the person's contact card, labelled with the platform name.
export async function saveLink(person, url) {
  const platform = detectPlatform(url);
  if (!platform) throw new Error("That isn't a link Krypu knows (FaceTime, WhatsApp, Zoom, Meet, Teams, Slack or Jitsi).");
  if (WEB) return platform;
  await new Contact(person.id).addUrlAddress({ label: PLATFORMS[platform].label, url });
  return platform;
}

// Permanently remove the contact from the phone (and the Google account it syncs to). Callers confirm first.
export async function deleteContact(person) {
  if (WEB) return;
  await new Contact(person.id).delete();
}
