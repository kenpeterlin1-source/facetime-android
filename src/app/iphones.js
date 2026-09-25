// "Who has an iPhone?" - mark your iPhone people once, then ask them all for a FaceTime link.
// Android can't tell who has an iPhone; numbers labelled "iPhone" in Contacts are pre-ticked as a hint.
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useContacts } from '../contacts';
import { askText, text } from '../launch';
import { useSettings } from '../settings';
import { useTheme } from '../theme';
import { Screen, ui } from '../ui';

const WEEK = 7 * 24 * 3600 * 1000;

export default function IPhones() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  const contacts = useContacts();
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(null); // {done, total} while texts go out one by one
  const queue = useRef([]);

  // your ticks win; otherwise fall back to the "iPhone" label hint
  const isIphone = (p) => settings?.iphone[p.id] ?? (p.iphoneHint || settings?.asked[p.id]?.platform === 'facetime');
  const people = useMemo(() => contacts.people.filter((p) => p.phone), [contacts.people]);
  const shown = people.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(isIphone(b)) - Number(isIphone(a)) || a.name.localeCompare(b.name));
  // who a "send" would go to: iPhone people with no FaceTime link, not asked in the last week
  const toAsk = people.filter((p) => isIphone(p) && !p.links.facetime &&
    !(settings?.asked[p.id]?.platform === 'facetime' && Date.now() - Date.parse(settings.asked[p.id].at) < WEEK));

  // send the next text each time you come back from Messages
  const next = () => {
    const p = queue.current.shift();
    if (!p) { setSending(null); return; }
    setSending((s) => s && { ...s, done: s.done + 1 });
    update((s) => ({ ...s, asked: { ...s.asked, [p.id]: { platform: 'facetime', at: new Date().toISOString() } } }));
    text(p.phone, askText('facetime')).catch(() => {});
  };
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active' && queue.current.length) next(); else if (s === 'active') setSending(null); });
    return () => sub.remove();
  }, []);
  const askAll = () => { queue.current = [...toAsk]; setSending({ done: 0, total: toAsk.length }); next(); };

  if (!settings) return null;
  const footer = (
    <View style={[styles.bar, { backgroundColor: t.paper, borderColor: t.line, paddingBottom: 16 + insets.bottom }]}>
      {sending ? (
        <Text style={[ui.primaryText, { color: t.ink, textAlign: 'center', flex: 1 }]}>
          Text {sending.done} of {sending.total} - press Send, then come back to Krypu for the next one.
        </Text>
      ) : (
        <Pressable onPress={askAll} disabled={!toAsk.length} style={[ui.primary, { flex: 1, backgroundColor: toAsk.length ? t.clay : t.line }]}>
          <Text style={[ui.primaryText, { color: toAsk.length ? t.onClay : t.muted }]}>
            {toAsk.length ? `Ask ${toAsk.length} ${toAsk.length === 1 ? 'person' : 'people'} for a FaceTime link` : 'Tick your iPhone people'}
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <Screen footer={footer}>
      <Pressable onPress={() => router.back()} hitSlop={10}><Text style={{ color: t.clay, fontWeight: '600', fontSize: 16 }}>‹ Back</Text></Pressable>
      <Text style={[ui.title, { color: t.ink }]}>Who has an iPhone?</Text>
      <Text style={[ui.lede, { color: t.muted }]}>
        Tick the people with iPhones. Krypu texts each of them short steps to send you a FaceTime link, and tells them
        they'll need to let you in when you call. Numbers saved as "iPhone" are already ticked.
      </Text>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search contacts" placeholderTextColor={t.muted}
        style={[styles.search, { backgroundColor: t.card, borderColor: t.line, color: t.ink }]} />
      {shown.map((p) => {
        const on = !!isIphone(p);
        const asked = settings.asked[p.id]?.platform === 'facetime';
        return (
          <Pressable key={p.id} onPress={() => update((s) => ({ ...s, iphone: { ...s.iphone, [p.id]: !on } }))}
            style={[styles.row, { backgroundColor: on ? t.skySoft : t.card, borderColor: on ? t.sky : t.line }]}>
            <View style={ui.shrink}>
              <Text style={[styles.name, { color: t.ink }]}>{p.name}</Text>
              <Text style={[styles.sub, { color: t.muted }]}>
                {p.links.facetime ? 'FaceTime link saved ✓' : asked ? 'Asked - waiting for their link' : p.iphoneHint ? 'Number saved as iPhone' : p.phone}
              </Text>
            </View>
            <View style={[styles.check, { borderColor: on ? t.sky : t.line, backgroundColor: on ? t.sky : 'transparent' }]}>
              {on && <Text style={{ color: t.paper, fontWeight: '800' }}>✓</Text>}
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  name: { fontSize: 17, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  check: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bar: { flexDirection: 'row', padding: 16, borderTopWidth: 1 },
});
