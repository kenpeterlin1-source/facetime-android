// Shared building blocks: the topo screen, platform chips, toggles and update banner.
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopoBackground from './TopoBackground';
import { PLATFORMS } from './platforms';
import { useTheme } from './theme';
import * as U from './update';

export function Screen({ children, footer }) {
  const t = useTheme();
  return (
    <View style={[ui.root, { backgroundColor: t.paper }]}>
      <TopoBackground color={t.topo} />
      <SafeAreaView style={ui.flex}>
        <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </SafeAreaView>
      {footer}
    </View>
  );
}

// Platform chip; `broken` = the link was reported as not working and needs fixing
export function Chip({ platform, t, broken }) {
  const { label, tone } = PLATFORMS[platform];
  return (
    <View style={[ui.chip, { backgroundColor: t[`${tone}Soft`] }, broken && { borderWidth: 1, borderColor: t.clay }]}>
      <Text style={[ui.chipText, { color: broken ? t.clay : t[tone] }]}>{broken ? `⚠ ${label}` : label}</Text>
    </View>
  );
}

export function PlatformToggle({ platform, value, onChange, note }) {
  const t = useTheme();
  const { label, tone } = PLATFORMS[platform];
  return (
    <View style={[ui.row, { backgroundColor: t.card, borderColor: t.line }]}>
      <View style={[ui.dot, { backgroundColor: t[tone] }]} />
      <View style={ui.flex}>
        <Text style={[ui.rowTitle, { color: t.ink }]}>{label}</Text>
        {!!note && <Text style={[ui.rowNote, { color: t.muted }]}>{note}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: t.line, true: t[tone] }} />
    </View>
  );
}

// "Update available" banner: checks GitHub Releases once on mount (quietly ignores network errors).
export function UpdateBanner() {
  const t = useTheme();
  const [update, setUpdate] = useState(null);
  // skipped in the web preview: GitHub release downloads don't allow browser (CORS) requests
  useEffect(() => { if (Platform.OS !== 'web') U.checkUpdate().then(setUpdate).catch(() => {}); }, []);
  if (!update) return null;
  return (
    <Pressable onPress={() => U.install(update)} style={[ui.banner, { backgroundColor: t.clay }]}>
      <Text style={[ui.bannerTitle, { color: t.onClay }]}>Update available · {update.version}</Text>
      {!!update.notes && <Text style={[ui.rowNote, { color: t.onClay }]} numberOfLines={2}>{update.notes}</Text>}
    </Pressable>
  );
}

export const ui = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, paddingTop: 28, paddingBottom: 110, gap: 10, maxWidth: 560, width: '100%', alignSelf: 'center' },
  title: { fontSize: 30, fontWeight: '700', fontFamily: 'Georgia', letterSpacing: -0.5, marginBottom: 4 },
  lede: { fontSize: 16, lineHeight: 23 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 12 },
  chip: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  rowTitle: { fontSize: 17, fontWeight: '600' },
  rowNote: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  primary: { padding: 15, borderRadius: 14, alignItems: 'center' },
  primaryText: { fontSize: 16, fontWeight: '600' },
  banner: { padding: 14, borderRadius: 16 },
  bannerTitle: { fontSize: 16, fontWeight: '700' },
});
