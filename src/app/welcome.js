// First run: which video apps do you use? Everything here can be changed later in Settings.
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { PLATFORM_ORDER } from '../platforms';
import { useSettings } from '../settings';
import { useTheme } from '../theme';
import { PlatformToggle, Screen, ui } from '../ui';

const NOTES = {
  facetime: 'Call your iPhone people. They send you their link once.',
  whatsapp: 'Video-call anyone who has WhatsApp.',
  zoom: 'Their Zoom links, and your own Zoom room.',
  meet: 'Their Meet links, and your own Meet link.',
  teams: 'Their Teams links, and your own Teams link.',
  slack: 'Huddles with people in your Slack workspaces.',
  jitsi: 'Free rooms for anyone, nothing to install. Great for groups.',
};

export default function Welcome() {
  const t = useTheme();
  const { settings, update } = useSettings();
  if (!settings) return null;
  const toggle = (k) => (v) => update((s) => ({ ...s, enabled: { ...s.enabled, [k]: v } }));
  const done = () => { update({ onboarded: true }); router.replace('/'); };
  const count = PLATFORM_ORDER.filter((k) => settings.enabled[k]).length;

  return (
    <Screen footer={
      <Pressable onPress={done} style={[ui.primary, { backgroundColor: count ? t.clay : t.line, margin: 20, marginBottom: 32 }]}>
        <Text style={[ui.primaryText, { color: count ? t.onClay : t.muted }]}>{count ? 'Continue' : 'Pick at least one'}</Text>
      </Pressable>
    }>
      <Text style={[ui.section, { color: t.clay, marginTop: 0 }]}>Welcome to Krypu</Text>
      <Text style={[ui.title, { color: t.ink }]}>Which video apps do you use?</Text>
      <Text style={[ui.lede, { color: t.muted }]}>Krypu only shows the ones you pick. You can turn more on later in Settings.</Text>
      {PLATFORM_ORDER.map((k) => (
        <PlatformToggle key={k} platform={k} value={settings.enabled[k]} onChange={toggle(k)} note={NOTES[k]} />
      ))}
    </Screen>
  );
}
