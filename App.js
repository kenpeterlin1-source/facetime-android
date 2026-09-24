import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopoBackground from './src/TopoBackground';
import { useTheme } from './src/theme';

// Placeholder people until the Contacts integration is built.
const SAMPLE = [
  { id: '1', name: 'Mom', phone: 'iPhone' },
  { id: '2', name: 'Ken', phone: 'iPhone' },
  { id: '3', name: 'Kitchen', phone: 'iPad' },
];

function Person({ person, t }) {
  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.line }]}>
      <View style={[styles.avatar, { backgroundColor: t.claySoft }]}>
        <Text style={[styles.avatarText, { color: t.clay }]}>{person.name[0]}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.name, { color: t.ink }]}>{person.name}</Text>
        <Text style={[styles.sub, { color: t.muted }]}>FaceTime link saved · {person.phone}</Text>
      </View>
      <View style={styles.cardActions}>
        <Pressable style={[styles.btn, styles.ghost, { borderColor: t.line }]}>
          <Text style={[styles.btnText, { color: t.ink }]}>Text</Text>
        </Pressable>
        <Pressable style={[styles.btn, { backgroundColor: t.clay }]}>
          <Text style={[styles.btnText, { color: t.onClay }]}>Join</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Home() {
  const t = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: t.paper }]}>
      <TopoBackground color={t.topo} />
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.eyebrow, { color: t.clay }]}>FaceTime Links</Text>
          <Text style={[styles.title, { color: t.ink }]}>Who do you want to see?</Text>
          <Text style={[styles.lede, { color: t.muted }]}>
            Tap Join to open their FaceTime. Tap Text to let them know you're waiting.
          </Text>
          {SAMPLE.map((p) => <Person key={p.id} person={p} t={t} />)}
          <Pressable style={[styles.ask, { borderColor: t.clay, backgroundColor: t.card }]}>
            <Text style={[styles.askText, { color: t.clay }]}>+  Ask someone for their link</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
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
  content: { padding: 20, paddingTop: 28, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 30, fontWeight: '700', fontFamily: 'Georgia', letterSpacing: -0.5 },
  lede: { fontSize: 16, lineHeight: 23, marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '700', fontFamily: 'Georgia' },
  cardBody: { flex: 1 },
  name: { fontSize: 18, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  ghost: { borderWidth: 1 },
  btnText: { fontSize: 15, fontWeight: '600' },
  ask: { marginTop: 8, padding: 16, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center' },
  askText: { fontSize: 16, fontWeight: '600' },
});
