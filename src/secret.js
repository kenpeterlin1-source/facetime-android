// The AI API key lives in the phone's secure storage (Android Keystore), not in the regular settings.
// expo-secure-store has no web version, so the browser preview falls back to localStorage.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'krypu.aiKey';

export async function getAiKey() {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null;
  return SecureStore.getItemAsync(KEY);
}

export async function setAiKey(value) {
  if (Platform.OS === 'web') { value ? localStorage.setItem(KEY, value) : localStorage.removeItem(KEY); return; }
  return value ? SecureStore.setItemAsync(KEY, value) : SecureStore.deleteItemAsync(KEY);
}
