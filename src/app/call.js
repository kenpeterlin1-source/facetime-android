// In a FaceTime call: the call runs in a Chrome partial tab docked over the bottom two-thirds of the screen, and
// this screen fills the top third - who you're calling, their local time, your notes about them, and a notes box
// for this call. When the call panel closes: rejoin, done (→ tasks from your call notes) or "link didn't work".
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useContacts } from '../contacts';
import { onTabEvent, openCallTab } from '../callTab';
import { PLATFORMS } from '../platforms';
import { useSettings } from '../settings';
import { useTheme } from '../theme';
import { guessZone, localTime, useNow, zoneName } from '../timezones';
import { ui } from '../ui';

export default function Call() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id, platform = 'facetime', testUrl } = useLocalSearchParams();
  const { settings, update } = useSettings();
  const contacts = useContacts();
  const now = useNow();
  const person = contacts.people.find((p) => p.id === id);
  const [state, setState] = useState('opening'); // opening | open | closed | error
  const [error, setError] = useState('');
  const [callNote, setCallNote] = useState('');
  const opened = useRef(false);

  // dev builds only: ?testUrl= opens any page in the call panel, to test the layout without calling anyone
  const url = (__DEV__ && testUrl) || person?.links?.[platform];
  const open = () => {
    setState('opening');
    openCallTab(url, 0.66, t.clay).then(() => setState('open')).catch((e) => { setError(e.message); setState('error'); });
  };
  useEffect(() => onTabEvent((e) => setState(e.event === 'hidden' ? 'closed' : 'open')), []);
  useEffect(() => { if (url && !opened.current) { opened.current = true; open(); } }, [url]);

  if (!settings || !person) return <View style={[styles.root, { backgroundColor: t.paper }]} />;
  const zone = settings.tz[person.id] ?? guessZone(person.phone);
  const label = PLATFORMS[platform].label;
  const first = person.name.split(' ')[0];
  const done = (failed) => router.replace({ pathname: '/', params: { after: person.id, platform, note: callNote, failed: failed ? '1' : '' } });

  return (
    <View style={[styles.root, { backgroundColor: t.paper, paddingTop: insets.top + 12 }]}>
      <View style={styles.top}>
        <Text style={[styles.title, { color: t.ink }]} numberOfLines={1}>{label} with {person.name}</Text>
        {!!zone && <Text style={[styles.sub, { color: t.muted }]}>{localTime(zone, now).time} in {zoneName(zone)}</Text>}
        <Text style={[styles.status, { color: state === 'closed' ? t.clay : t.sage }]}>
          {state === 'opening' ? 'Opening the call…'
            : state === 'open' ? `Waiting for ${first} to let you in - they'll see a notification on their iPhone.`
            : state === 'closed' ? 'Call panel closed.'
            : error}
        </Text>
        <TextInput value={callNote} onChangeText={setCallNote} multiline placeholder={`Notes from this call with ${first}…`}
          placeholderTextColor={t.muted} style={[styles.note, { backgroundColor: t.card, borderColor: t.line, color: t.ink }]} />
        {!!settings.notes[person.id] && (
          <Text style={[styles.sub, { color: t.muted }]} numberOfLines={3}>Your notes: {settings.notes[person.id]}</Text>
        )}
      </View>
      {(state === 'closed' || state === 'error') && (
        <View style={[styles.after, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={open} style={[ui.primary, { backgroundColor: t.clay }]}>
            <Text style={[ui.primaryText, { color: t.onClay }]}>Rejoin the call</Text>
          </Pressable>
          <View style={styles.row}>
            <Pressable onPress={() => done(false)} style={[styles.half, { backgroundColor: t.sageSoft }]}>
              <Text style={[ui.primaryText, { color: t.sage }]}>Done</Text>
            </Pressable>
            <Pressable onPress={() => done(true)} style={[styles.half, { backgroundColor: t.claySoft }]}>
              <Text style={[ui.primaryText, { color: t.clay }]}>Link didn't work</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { paddingHorizontal: 20, gap: 8 },
  title: { fontSize: 22, fontWeight: '700', fontFamily: 'Georgia' },
  sub: { fontSize: 13, lineHeight: 18 },
  status: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  note: { minHeight: 80, maxHeight: 140, borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 15, textAlignVertical: 'top' },
  after: { marginTop: 'auto', paddingHorizontal: 20, gap: 10 },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
});
