// In-app update check (required in every app - see _templates/expo-app/CLAUDE.md).
// Builds are published as GitHub Releases; every release carries a latest.json asset:
//   {"version":"1.0.1","versionCode":2,"url":"https://github.com/<owner>/<repo>/releases/download/v1.0.1/<App>-1.0.1.apk","notes":"..."}
// `releases/latest/download/<asset>` always resolves to the newest release, so the URL never changes.
// The repo comes from app.json -> expo.extra.releasesRepo ("owner/repo"); the installed version from
// expo.version + expo.android.versionCode (bundled at build time - bump both for every release).
import { Linking } from 'react-native';
import app from '../app.json';

export const INSTALLED = { version: app.expo.version, versionCode: app.expo.android.versionCode };
export const RELEASES = `https://github.com/${app.expo.extra.releasesRepo}/releases`;
const LATEST = RELEASES + '/latest/download/latest.json';

let cached = null, checkedAt = 0;
// Returns {version, versionCode, url, notes} when a newer build is published, null when up to date. Throws on network errors.
export async function checkUpdate(force) {
  if (!force && cached !== null && Date.now() - checkedAt < 30 * 60 * 1000) return cached.versionCode > INSTALLED.versionCode ? cached : null;
  const r = await fetch(LATEST + '?t=' + Date.now(), { headers: { 'cache-control': 'no-cache' } });
  if (!r.ok) throw new Error('GitHub said ' + r.status);
  const j = await r.json();
  if (!j || typeof j.versionCode !== 'number' || !/^https:/.test(j.url || '')) throw new Error('bad latest.json');
  cached = j; checkedAt = Date.now();
  return j.versionCode > INSTALLED.versionCode ? j : null;
}

// Opens the APK in the browser; Android downloads it and offers to install over the current version.
export function install(u) { return Linking.openURL(u.url); }
