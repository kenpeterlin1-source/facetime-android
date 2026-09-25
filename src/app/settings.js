// Settings: video apps on/off, your own rooms, and app version + update check.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import AiSetup from '../AiSetup';
import { HOSTABLE, SETUP_HELP } from '../myRooms';
import { TASK_TARGETS } from '../saveTasks';
import { detectPlatform, newJitsiRoom, PLATFORMS, PLATFORM_ORDER } from '../platforms';
import { useSettings } from '../settings';
import { useTheme } from '../theme';
import * as U from '../update';
import { PlatformToggle, Screen, ui } from '../ui';

function RoomField({ platform, needsFix }) {
  const t = useTheme();
  const { settings, update } = useSettings();
  const saved = settings.myRooms[platform];
  const [draft, setDraft] = useState(saved ?? '');
  const [error, setError] = useState('');
  const [fixing, setFixing] = useState(needsFix);
  const { label, tone } = PLATFORMS[platform];

  const save = () => {
    const url = draft.trim();
    if (url && detectPlatform(url) !== platform) { setError(`That doesn't look like a ${label} link.`); return; }
    setError('');
    if (url && url !== saved) setFixing(false);
    update((s) => ({ ...s, myRooms: { ...s.myRooms, [platform]: url || null } }));
  };

  return (
    <View style={[ui.row, { backgroundColor: t.card, borderColor: fixing ? t.clay : t.line, borderWidth: fixing ? 2 : 1,
                            flexDirection: 'column', alignItems: 'stretch', gap: 6 }]}>
      <Text style={[ui.rowTitle, { color: fixing ? t.clay : t[tone] }]}>Your {label} room {fixing ? '⚠' : saved ? '✓' : ''}</Text>
      {fixing && <Text style={[ui.rowNote, { color: t.clay }]}>This link didn't work last time. Paste a new one below.</Text>}
      {platform === 'jitsi'
        ? <>
            <Text style={[ui.rowNote, { color: t.muted }]} selectable>{saved}</Text>
            {fixing && (
              <Pressable onPress={() => { update((s) => ({ ...s, myRooms: { ...s.myRooms, jitsi: newJitsiRoom() } })); setFixing(false); }}>
                <Text style={{ color: t.clay, fontWeight: '700' }}>Make a new Jitsi room</Text>
              </Pressable>
            )}
          </>
        : <>
            <TextInput value={draft} onChangeText={(v) => { setDraft(v); setError(''); }} onBlur={save} autoCapitalize="none"
              placeholder={`Paste your ${label} link`} placeholderTextColor={t.muted}
              style={{ borderWidth: 1, borderColor: error ? t.clay : t.line, borderRadius: 12, padding: 10, color: t.ink, fontSize: 15 }} />
            <Text style={[ui.rowNote, { color: error ? t.clay : t.muted }]}>{error || SETUP_HELP[platform]}</Text>
          </>}
    </View>
  );
}

function Updates() {
  const t = useTheme();
  const [state, setState] = useState('idle'); // idle | checking | current | error | found
  const [found, setFound] = useState(null);
  const check = async () => {
    setState('checking');
    try { const u = await U.checkUpdate(true); setFound(u); setState(u ? 'found' : 'current'); }
    catch { setState('error'); }
  };
  const msg = { idle: '', checking: 'Checking…', current: "You're up to date.", error: "Couldn't reach GitHub. Try again later." }[state];
  return (
    <View style={[ui.row, { backgroundColor: t.card, borderColor: t.line }]}>
      <View style={ui.flex}>
        <Text style={[ui.rowTitle, { color: t.ink }]}>Krypu {U.INSTALLED.version}</Text>
        {!!msg && <Text style={[ui.rowNote, { color: t.muted }]}>{msg}</Text>}
      </View>
      <Pressable onPress={found ? () => U.install(found) : check} hitSlop={8}>
        <Text style={{ color: t.clay, fontWeight: '700' }}>{found ? `Install ${found.version}` : 'Check for updates'}</Text>
      </Pressable>
    </View>
  );
}

export default function Settings() {
  const t = useTheme();
  const { settings, update } = useSettings();
  const { fix } = useLocalSearchParams();
  if (!settings) return null;
  const toggle = (k) => (v) => update((s) => ({ ...s, enabled: { ...s.enabled, [k]: v } }));

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={10}><Text style={{ color: t.clay, fontWeight: '600', fontSize: 16 }}>‹ Back</Text></Pressable>
      <Text style={[ui.title, { color: t.ink }]}>Settings</Text>

      <Text style={[ui.section, { color: t.muted }]}>Video apps you use</Text>
      {PLATFORM_ORDER.map((k) => <PlatformToggle key={k} platform={k} value={settings.enabled[k]} onChange={toggle(k)} />)}

      <Text style={[ui.section, { color: t.muted }]}>Your rooms, ready to send</Text>
      {HOSTABLE.filter((k) => settings.enabled[k]).map((k) => <RoomField key={k} platform={k} needsFix={fix === k} />)}
      {!HOSTABLE.some((k) => settings.enabled[k]) &&
        <Text style={[ui.rowNote, { color: t.muted }]}>Turn on Zoom, Meet, Teams or Jitsi to host calls from your own room.</Text>}

      <Text style={[ui.section, { color: t.muted }]}>After-call notes</Text>
      <AiSetup />
      <View style={[ui.row, { backgroundColor: t.card, borderColor: t.line, flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
        <Text style={[ui.rowTitle, { color: t.ink }]}>Save tasks to</Text>
        <Text style={[ui.rowNote, { color: t.muted, marginTop: 0 }]}>Krypu remembers the last one you used. You can also set it here.</Text>
        <View style={ui.chips}>
          {TASK_TARGETS.map((x) => {
            const on = settings.taskTarget === x.key;
            return (
              <Pressable key={x.key} onPress={() => update({ taskTarget: x.key })}
                style={[ui.chip, { paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: on ? t.clay : t.line,
                                   backgroundColor: on ? t.claySoft : t.card }]}>
                <Text style={[ui.chipText, { color: on ? t.clay : t.muted }]}>{x.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput value={settings.myEmail} onChangeText={(v) => update({ myEmail: v.trim() })} autoCapitalize="none"
          keyboardType="email-address" placeholder="Your email, for Email" placeholderTextColor={t.muted}
          style={{ borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 10, color: t.ink, fontSize: 15 }} />
      </View>

      {Object.keys(settings.hidden).length > 0 && (
        <>
          <Text style={[ui.section, { color: t.muted }]}>Hidden people</Text>
          <View style={[ui.row, { backgroundColor: t.card, borderColor: t.line, flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
            <Text style={[ui.rowNote, { color: t.muted, marginTop: 0 }]}>Still in your phone's contacts. Tap someone to show them in Krypu again.</Text>
            <View style={ui.chips}>
              {Object.entries(settings.hidden).map(([id, name]) => (
                <Pressable key={id} onPress={() => update((s) => { const h = { ...s.hidden }; delete h[id]; return { ...s, hidden: h }; })}
                  style={[ui.chip, { paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: t.line }]}>
                  <Text style={[ui.chipText, { color: t.muted }]}>{name} ↺</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}

      {settings.skipDeleteConfirm && (
        <Pressable onPress={() => update({ skipDeleteConfirm: false })}
          style={[ui.row, { backgroundColor: t.card, borderColor: t.line }]}>
          <View style={ui.shrink}>
            <Text style={[ui.rowTitle, { color: t.ink }]}>Deleting contacts</Text>
            <Text style={[ui.rowNote, { color: t.muted }]}>Currently deletes without asking. Tap to ask again every time.</Text>
          </View>
          <Text style={{ color: t.clay, fontWeight: '700' }}>Ask again</Text>
        </Pressable>
      )}

      <Text style={[ui.section, { color: t.muted }]}>About</Text>
      <Updates />
    </Screen>
  );
}
