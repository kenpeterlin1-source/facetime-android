import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopoBackground from './src/TopoBackground';
import { PLATFORMS } from './src/platforms';
import { SAMPLE_CONTACTS } from './src/sampleContacts';
import { useTheme } from './src/theme';

function Chip({ platform, t }) {
  const { label, tone } = PLATFORMS[platform];
  return (
    <View style={[styles.chip, { backgroundColor: t[`${tone}Soft`] }]}>
      <Text style={[styles.chipText, { color: t[tone] }]}>{label}</Text>
    </View>
  );
}

function Person({ person, t, onPress }) {
  const none = person.platforms.length === 0;
  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: t.card, borderColor: t.line }]}>
      <View style={[styles.avatar, { backgroundColor: t.claySoft }]}>
        <Text style={[styles.avatarText, { color: t.clay }]}>{person.name[0]}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.name, { color: t.ink }]}>{person.name}</Text>
        <View style={styles.chips}>
          {none
            ? <Text style={[styles.sub, { color: t.muted }]}>No video links yet</Text>
            : person.platforms.map((p) => <Chip key={p} platform={p} t={t} />)}
        </View>
      </View>
      <Text style={[styles.chev, { color: t.muted }]}>›</Text>
    </Pressable>
  );
}

function PlatformSheet({ person, t, onClose }) {
  if (!person) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: t.scrim }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: t.paper, borderColor: t.line }]}>
          <Text style={[styles.sheetTitle, { color: t.ink }]}>Call {person.name}</Text>
          {person.platforms.length === 0 ? (
            <>
              <Text style={[styles.lede, { color: t.muted }]}>
                {person.name} has no video links saved yet. Ask them for one and it will be saved to their contact.
              </Text>
              <Pressable style={[styles.primary, { backgroundColor: t.clay }]}>
                <Text style={[styles.primaryText, { color: t.onClay }]}>Ask for a link</Text>
              </Pressable>
            </>
          ) : person.platforms.map((p) => {
            const { label, tone, how } = PLATFORMS[p];
            return (
              <Pressable key={p} style={[styles.option, { backgroundColor: t.card, borderColor: t.line }]}>
                <View style={[styles.dot, { backgroundColor: t[tone] }]} />
                <View style={styles.cardBody}>
                  <Text style={[styles.name, { color: t.ink }]}>{label}</Text>
                  <Text style={[styles.sub, { color: t.muted }]}>{how}</Text>
                </View>
              </Pressable>
            );
          })}
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={[styles.cancelText, { color: t.muted }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Home() {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState(null);

  const people = useMemo(() => SAMPLE_CONTACTS.filter((c) =>
    (showAll || c.platforms.length > 0) && c.name.toLowerCase().includes(query.trim().toLowerCase())), [query, showAll]);

  return (
    <View style={[styles.root, { backgroundColor: t.paper }]}>
      <TopoBackground color={t.topo} />
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: t.ink }]}>Who do you want to see?</Text>
          <TextInput
            value={query} onChangeText={setQuery} placeholder="Search contacts" placeholderTextColor={t.muted}
            style={[styles.search, { backgroundColor: t.card, borderColor: t.line, color: t.ink }]}
          />
          <View style={styles.toggleRow}>
            <Text style={[styles.sub, { color: t.muted }]}>Show everyone, including people without video links</Text>
            <Switch value={showAll} onValueChange={setShowAll} trackColor={{ false: t.line, true: t.clay }} />
          </View>
          {people.map((p) => <Person key={p.id} person={p} t={t} onPress={() => setSelected(p)} />)}
          {people.length === 0 && <Text style={[styles.lede, { color: t.muted }]}>No one matches “{query}”.</Text>}
        </ScrollView>
      </SafeAreaView>
      <PlatformSheet person={selected} t={t} onClose={() => setSelected(null)} />
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Home />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, paddingTop: 28, gap: 10, maxWidth: 560, width: '100%', alignSelf: 'center' },
  title: { fontSize: 30, fontWeight: '700', fontFamily: 'Georgia', letterSpacing: -0.5, marginBottom: 4 },
  lede: { fontSize: 16, lineHeight: 23 },
  search: { height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between', marginBottom: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '700', fontFamily: 'Georgia' },
  cardBody: { flex: 1, gap: 6 },
  name: { fontSize: 18, fontWeight: '600' },
  sub: { fontSize: 13, lineHeight: 18, flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '700' },
  chev: { fontSize: 28, marginLeft: 4 },
  scrim: { flex: 1, justifyContent: 'flex-end' },
  sheet: { padding: 20, paddingBottom: 32, gap: 10, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1,
           maxWidth: 560, width: '100%', alignSelf: 'center' },
  sheetTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'Georgia', marginBottom: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  primary: { padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 6 },
  primaryText: { fontSize: 16, fontWeight: '600' },
  cancel: { padding: 12, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600' },
});
