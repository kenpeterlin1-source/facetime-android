// FaceTime in a Chrome partial tab under Krypu (modules/krypu-call-tab). Falls back to Chrome itself (full screen)
// when partial tabs aren't available - e.g. no Chrome, or the web preview.
import { Platform } from 'react-native';
import { openTheirs } from './launch';

const Native = Platform.OS === 'android' ? require('../modules/krypu-call-tab/src/KrypuCallTabModule').default : null;

export function canSplit() {
  try { return !!Native?.isAvailable(); } catch { return false; }
}

export async function openCallTab(url, heightFraction, toolbarColor) {
  if (!canSplit()) return openTheirs({ links: { facetime: url } }, 'facetime');
  return Native.open(url, heightFraction, toolbarColor);
}

// Subscribe to "shown" / "hidden" events of the call panel. Returns an unsubscribe function.
export function onTabEvent(listener) {
  if (!Native) return () => {};
  const sub = Native.addListener('onTabEvent', listener);
  return () => sub.remove();
}
