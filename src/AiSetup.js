// "Which AI do you use?" - shown in first-run setup and in Settings.
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { AI_PROVIDERS } from './ai';
import { getAiKey, setAiKey } from './secret';
import { useSettings } from './settings';
import { useTheme } from './theme';
import { ui } from './ui';

export default function AiSetup() {
  const t = useTheme();
  const { settings, update } = useSettings();
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { getAiKey().then((k) => { setKey(k ?? ''); setSaved(!!k); }); }, []);

  const pick = (p) => p.ready && update({ aiProvider: p.key });
  const saveKey = async () => {
    const k = key.trim();
    await setAiKey(k || null);
    setSaved(!!k);
  };
  const claude = AI_PROVIDERS.find((p) => p.key === 'claude');

  return (
    <View style={[ui.row, { backgroundColor: t.card, borderColor: t.line, flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
      <Text style={[ui.rowNote, { color: t.muted, marginTop: 0 }]}>
        After a call, Krypu can turn your quick note ("Mom wants help with her printer Saturday") into tasks.
        Pick the AI you use. You can change this later.
      </Text>
      <View style={ui.chips}>
        {AI_PROVIDERS.map((p) => {
          const on = settings.aiProvider === p.key;
          return (
            <Pressable key={p.key} onPress={() => pick(p)} disabled={!p.ready}
              style={[ui.chip, { paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1,
                                 borderColor: on ? t.clay : t.line, backgroundColor: on ? t.claySoft : t.card, opacity: p.ready ? 1 : 0.55 }]}>
              <Text style={[ui.chipText, { color: on ? t.clay : t.muted }]}>{p.label}{p.ready ? '' : ' · later'}</Text>
            </Pressable>
          );
        })}
      </View>
      {settings.aiProvider === 'claude' && (
        <>
          <TextInput value={key} onChangeText={(v) => { setKey(v); setSaved(false); }} onBlur={saveKey}
            placeholder="Claude API key" placeholderTextColor={t.muted} secureTextEntry autoCapitalize="none"
            style={{ borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 10, color: t.ink, fontSize: 15 }} />
          <Text style={[ui.rowNote, { color: saved ? t.sage : t.muted, marginTop: 0 }]}>
            {saved ? '✓ Key saved securely on this phone.' : claude.keyHint}
          </Text>
        </>
      )}
      {settings.aiProvider === 'none' && (
        <Text style={[ui.rowNote, { color: t.muted, marginTop: 0 }]}>
          Without AI, Krypu picks out sentences like "can you…" or "remember to…" as tasks.
        </Text>
      )}
    </View>
  );
}
