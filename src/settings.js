// App settings, saved on the phone (AsyncStorage): which video apps you use and your own room links.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { newJitsiRoom, PLATFORM_ORDER } from './platforms';

const KEY = 'krypu.settings.v1';

export const DEFAULTS = {
  onboarded: false,
  // which platforms show up in Krypu at all (chosen on first run, changeable in Settings)
  enabled: Object.fromEntries(PLATFORM_ORDER.map((k) => [k, ['facetime', 'whatsapp', 'jitsi'].includes(k)])),
  // your own permanent rooms, used to invite people (null = not set up)
  myRooms: { zoom: null, meet: null, teams: null, jitsi: null },
  // your private notes per person, keyed by contact id (kept in Krypu, not written to the contact)
  notes: {},
  // time-zone overrides per contact id, when the guess from the phone number is wrong
  tz: {},
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null); // null while loading

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const saved = raw ? JSON.parse(raw) : {};
        setSettings({ ...DEFAULTS, ...saved, enabled: { ...DEFAULTS.enabled, ...saved.enabled },
                      myRooms: { ...DEFAULTS.myRooms, ...saved.myRooms }, notes: { ...saved.notes }, tz: { ...saved.tz } });
      })
      .catch(() => setSettings(DEFAULTS));
  }, []);

  const update = useCallback((change) => {
    setSettings((prev) => {
      const next = typeof change === 'function' ? change(prev) : { ...prev, ...change };
      // your Jitsi room is created the first time Jitsi is switched on, then kept
      if (next.enabled.jitsi && !next.myRooms.jitsi) next.myRooms = { ...next.myRooms, jitsi: newJitsiRoom() };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
