// Home: your contacts, filtered to people you can video-call on the apps you use.
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Modal, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { HOSTABLE } from '../myRooms';
import { PLATFORMS } from '../platforms';
import { SAMPLE_CONTACTS } from '../sampleContacts';
import { useSettings } from '../settings';
import { useTheme } from '../theme';
import { Chip, Screen, ui, UpdateBanner } from '../ui';

function Person({ person, t, onPress, picking, picked, broken }) {
  const none = person.platforms.length === 0;
  return (
    <Pressable onPress={onPress}
      style={[styles.card, { backgroundColor: t.card, borderColor: picked ? t.moss : t.line }, picked && styles.picked]}>
      <View style={[styles.avatar, { backgroundColor: t.claySoft }]}>
        <Text style={[styles.avatarText, { color: t.clay }]}>{person.name[0]}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.name, { color: t.ink }]}>{person.name}</Text>
        <View style={ui.chips}>
          {none
            ? <Text style={[styles.sub, { color: t.muted }]}>No video links yet</Text>
            : person.platforms.map((p) => <Chip key={p} platform={p} t={t} broken={broken.has(`${person.id}:${p}`)} />)}
        </View>
      </View>
      {picking
        ? <View style={[styles.check, { borderColor: picked ? t.moss : t.line, backgroundColor: picked ? t.moss : 'transparent' }]}>
            {picked && <Text style={[styles.checkMark, { color: t.paper }]}>✓</Text>}
          </View>
        : <Text style={[styles.chev, { color: t.muted }]}>›</Text>}
    </Pressable>
  );
}

function PlatformSheet({ person, rooms, t, onClose, onLaunch }) {
  if (!person) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: t.scrim }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: t.paper, borderColor: t.line }]}>
          <Text style={[styles.sheetTitle, { color: t.ink }]}>Call {person.name}</Text>
          {person.platforms.length === 0 ? (
            <>
              <Text style={[ui.lede, { color: t.muted }]}>
                {person.name} has no video links saved yet. Ask them for one and it will be saved to their contact.
              </Text>
              <Pressable style={[ui.primary, { backgroundColor: t.clay }]}>
                <Text style={[ui.primaryText, { color: t.onClay }]}>Ask for a link</Text>
              </Pressable>
            </>
          ) : person.platforms.map((p) => {
            const { label, tone, how } = PLATFORMS[p];
            return (
              <Pressable key={p} onPress={() => onLaunch(p, false)} style={[styles.option, { backgroundColor: t.card, borderColor: t.line }]}>
                <View style={[ui.dot, { backgroundColor: t[tone] }]} />
                <View style={styles.cardBody}>
                  <Text style={[styles.name, { color: t.ink }]}>{label}</Text>
                  <Text style={[styles.sub, { color: t.muted }]}>{how}</Text>
                </View>
              </Pressable>
            );
          })}
          {rooms.length > 0 && <Text style={[ui.section, { color: t.muted }]}>Or invite {person.name} to your room</Text>}
          {rooms.map((k) => {
            const { label, tone } = PLATFORMS[k];
            return (
              <Pressable key={`mine-${k}`} onPress={() => onLaunch(k, true)} style={[styles.option, styles.mine, { borderColor: t[tone] }]}>
                <View style={[ui.dot, { backgroundColor: t[tone] }]} />
                <View style={styles.cardBody}>
                  <Text style={[styles.name, { color: t.ink }]}>Your {label} room</Text>
                  <Text style={[styles.sub, { color: t.muted }]}>
                    Texts {person.name} your link, then opens your room.{k === 'jitsi' ? ' Nothing to install for them.' : ''}
                  </Text>
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

// Shown when you come back to Krypu after starting a call: did the link work?
function CallCheck({ call, t, onWorked, onFailed }) {
  const { label } = PLATFORMS[call.platform];
  return (
    <View style={[styles.rooms, { backgroundColor: t.card, borderColor: t.clay }]}>
      <Text style={[styles.name, { color: t.ink }]}>
        Did your {label} call with {call.person.name} work?
      </Text>
      <View style={styles.rowGap}>
        <Pressable onPress={onWorked} style={[styles.half, { backgroundColor: t.sageSoft }]}>
          <Text style={[ui.primaryText, { color: t.sage }]}>Yes, it worked</Text>
        </Pressable>
        <Pressable onPress={onFailed} style={[styles.half, { backgroundColor: t.claySoft }]}>
          <Text style={[ui.primaryText, { color: t.clay }]}>Link didn't work</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Their link failed: ask them for a new one, or paste one you already have.
function FixTheirLink({ fix, t, onClose, onFixed }) {
  const [draft, setDraft] = useState('');
  if (!fix) return null;
  const { label } = PLATFORMS[fix.platform];
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: t.scrim }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: t.paper, borderColor: t.line }]}>
          <Text style={[styles.sheetTitle, { color: t.ink }]}>Fix {fix.person.name}'s {label} link</Text>
          <Text style={[ui.lede, { color: t.muted }]}>
            Links can stop working if they're deleted or expire. Ask {fix.person.name} for a new one, or paste one you already have.
          </Text>
          <Pressable onPress={onFixed} style={[ui.primary, { backgroundColor: t.clay }]}>
            <Text style={[ui.primaryText, { color: t.onClay }]}>Ask for a new link</Text>
          </Pressable>
          <TextInput value={draft} onChangeText={setDraft} placeholder={`Paste a new ${label} link`} placeholderTextColor={t.muted}
            autoCapitalize="none" style={[styles.search, { backgroundColor: t.card, borderColor: t.line, color: t.ink }]} />
          {!!draft.trim() && (
            <Pressable onPress={onFixed} style={[ui.primary, { backgroundColor: t.card, borderWidth: 1, borderColor: t.clay }]}>
              <Text style={[ui.primaryText, { color: t.clay }]}>Save to {fix.person.name}'s contact</Text>
            </Pressable>
          )}
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={[styles.cancelText, { color: t.muted }]}>Not now</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function Home() {
  const t = useTheme();
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState(null);
  const [picking, setPicking] = useState(false);
  const [group, setGroup] = useState(new Set());
  const [call, setCall] = useState(null);        // the last call Krypu started: {person, platform, mine, back}
  const [fix, setFix] = useState(null);          // their link that failed, being fixed
  const [broken, setBroken] = useState(new Set()); // "<contactId>:<platform>" links reported as not working

  // Ask "did it work?" once you come back to Krypu from the call app (right away on web, where nothing is launched)
  useEffect(() => {
    if (!call || call.back) return;
    if (Platform.OS === 'web') { setCall({ ...call, back: true }); return; }
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') setCall((c) => c && { ...c, back: true }); });
    return () => sub.remove();
  }, [call]);

  const launch = (platform, mine) => { setCall({ person: selected, platform, mine, back: false }); setSelected(null); };
  const failed = () => {
    const c = call; setCall(null);
    if (c.mine) router.push({ pathname: '/settings', params: { fix: c.platform } });
    else { setBroken((b) => new Set(b).add(`${c.person.id}:${c.platform}`)); setFix(c); }
  };
  const fixed = () => {
    setBroken((b) => { const n = new Set(b); n.delete(`${fix.person.id}:${fix.platform}`); return n; });
    setFix(null);
  };

  const enabled = settings?.enabled ?? {};
  const rooms = HOSTABLE.filter((k) => enabled[k] && settings?.myRooms[k]);
  // only show platforms you've switched on
  const people = useMemo(() => SAMPLE_CONTACTS
    .map((c) => ({ ...c, platforms: c.platforms.filter((p) => enabled[p]) }))
    .filter((c) => (showAll || picking || c.platforms.length > 0) && c.name.toLowerCase().includes(query.trim().toLowerCase())),
  [query, showAll, picking, enabled]);

  if (!settings) return null;
  if (!settings.onboarded) return <Redirect href="/welcome" />;

  const toggle = (id) => setGroup((g) => { const n = new Set(g); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const stopPicking = () => { setPicking(false); setGroup(new Set()); };

  const footer = picking && (
    <View style={[styles.bar, { backgroundColor: t.paper, borderColor: t.line }]}>
      <Pressable onPress={stopPicking} style={styles.barCancel}>
        <Text style={[styles.cancelText, { color: t.muted }]}>Cancel</Text>
      </Pressable>
      <View style={styles.barRooms}>
        {group.size === 0 || rooms.length === 0
          ? <View style={[styles.barGo, { backgroundColor: t.line }]}>
              <Text style={[ui.primaryText, { color: t.muted }]}>{rooms.length ? 'Pick people' : 'Set up a room in Settings'}</Text>
            </View>
          : rooms.map((k) => (
              <Pressable key={k} style={[styles.barGo, { backgroundColor: t[PLATFORMS[k].tone] }]}>
                <Text style={[ui.primaryText, { color: t.paper }]}>{PLATFORMS[k].label} · {group.size}</Text>
              </Pressable>
            ))}
      </View>
    </View>
  );

  return (
    <Screen footer={footer}>
      <View style={styles.titleRow}>
        <Text style={[ui.title, styles.flex, { color: t.ink }]}>{picking ? 'Who should join?' : 'Who do you want to see?'}</Text>
        {!picking && (
          <Pressable onPress={() => router.push('/settings')} hitSlop={10} accessibilityLabel="Settings"
            style={[styles.gear, { borderColor: t.line, backgroundColor: t.card }]}>
            <Text style={{ color: t.muted, fontSize: 20 }}>⚙︎</Text>
          </Pressable>
        )}
      </View>
      {!picking && <UpdateBanner />}
      {!picking && call?.back && <CallCheck call={call} t={t} onWorked={() => setCall(null)} onFailed={failed} />}
      {picking
        ? <Text style={[ui.lede, { color: t.muted }]}>Pick people, then choose which of your rooms to use. Each of them gets the link by text or WhatsApp.</Text>
        : <View style={[styles.rooms, { backgroundColor: t.card, borderColor: t.line }]}>
            <Text style={[ui.section, { color: t.muted, marginTop: 0 }]}>Your rooms, ready to send</Text>
            <View style={ui.chips}>
              {HOSTABLE.filter((k) => enabled[k]).map((k) => {
                const { label, tone } = PLATFORMS[k];
                const ready = !!settings.myRooms[k];
                return (
                  <Pressable key={k} onPress={() => router.push('/settings')}
                    style={[ui.chip, ready ? { backgroundColor: t[`${tone}Soft`] } : { borderWidth: 1, borderColor: t.line, borderStyle: 'dashed' }]}>
                    <Text style={[ui.chipText, { color: ready ? t[tone] : t.muted }]}>{ready ? `✓ ${label}` : `+ ${label}`}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={() => setPicking(true)} style={[styles.groupBtn, { borderColor: t.moss }]}>
              <Text style={[styles.groupText, { color: t.moss }]}>Start a group call</Text>
            </Pressable>
          </View>}
      <TextInput
        value={query} onChangeText={setQuery} placeholder="Search contacts" placeholderTextColor={t.muted}
        style={[styles.search, { backgroundColor: t.card, borderColor: t.line, color: t.ink }]}
      />
      {!picking && (
        <View style={styles.toggleRow}>
          <Text style={[styles.sub, { color: t.muted }]}>Show everyone, including people without video links</Text>
          <Switch value={showAll} onValueChange={setShowAll} trackColor={{ false: t.line, true: t.clay }} />
        </View>
      )}
      {people.map((p) => (
        <Person key={p.id} person={p} t={t} picking={picking} picked={group.has(p.id)}
          broken={broken} onPress={() => (picking ? toggle(p.id) : setSelected(p))} />
      ))}
      {people.length === 0 && <Text style={[ui.lede, { color: t.muted }]}>No one matches “{query}”.</Text>}
      <PlatformSheet person={selected} rooms={rooms} t={t} onClose={() => setSelected(null)} onLaunch={launch} />
      <FixTheirLink fix={fix} t={t} onClose={() => setFix(null)} onFixed={fixed} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  gear: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  search: { height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between', marginBottom: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  picked: { borderWidth: 2 },
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '700', fontFamily: 'Georgia' },
  cardBody: { flex: 1, gap: 6 },
  name: { fontSize: 18, fontWeight: '600' },
  sub: { fontSize: 13, lineHeight: 18, flexShrink: 1 },
  chev: { fontSize: 28, marginLeft: 4 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 15, fontWeight: '800' },
  rooms: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  groupBtn: { padding: 11, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center' },
  groupText: { fontSize: 15, fontWeight: '600' },
  rowGap: { flexDirection: 'row', gap: 8 },
  half: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  scrim: { flex: 1, justifyContent: 'flex-end' },
  sheet: { padding: 20, paddingBottom: 32, gap: 10, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1,
           maxWidth: 560, width: '100%', alignSelf: 'center' },
  sheetTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'Georgia', marginBottom: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  mine: { borderStyle: 'dashed', borderWidth: 1.5 },
  cancel: { padding: 12, alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 28, borderTopWidth: 1 },
  barCancel: { paddingHorizontal: 16, justifyContent: 'center' },
  barRooms: { flex: 1, flexDirection: 'row', gap: 8 },
  barGo: { flex: 1, paddingVertical: 14, paddingHorizontal: 6, borderRadius: 14, alignItems: 'center' },
});
