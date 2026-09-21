/**
 * Login-Screen: Name + E-Mail eingeben -> 6-stelligen Code per E-Mail anfordern,
 * dann den Code hier in der App eingeben. Kein Link (funktioniert so auch in der
 * installierten iPhone-PWA, die einen eigenen Speicher getrennt von Safari hat).
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_MAX_WIDTH, radius, spacing, type Palette } from '../theme';
import { useTheme } from '../ThemeContext';
import { Button, Card } from '../components/ui';
import { DoveMark } from '../components/icons';
import { requestLogin, verifyCode, type AuthMember } from '../logic/auth';

export function LoginScreen({
  initialError,
  onAuthenticated,
}: {
  initialError?: string | null;
  onAuthenticated: (m: AuthMember) => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying'>('idle');
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function submit() {
    const value = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError('Bitte eine gueltige E-Mail-Adresse eingeben.');
      return;
    }
    setError(null);
    setStatus('sending');
    try {
      await requestLogin(value, name.trim());
      setStatus('sent');
    } catch (e: any) {
      setStatus('idle');
      setError(e?.message || 'Konnte den Code nicht senden.');
    }
  }

  async function submitCode() {
    const c = code.replace(/\D/g, '');
    if (c.length !== 6) {
      setError('Bitte den 6-stelligen Code eingeben.');
      return;
    }
    setError(null);
    setStatus('verifying');
    try {
      const member = await verifyCode(email.trim(), c);
      onAuthenticated(member);
    } catch (e: any) {
      setStatus('sent');
      setError(e?.message || 'Code ungueltig oder abgelaufen.');
    }
  }

  return (
    <View style={s.backdrop}>
      <LinearGradient
        colors={colors.bgGradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.center}
      >
        <View style={s.col}>
          <View style={s.brandRow}>
            <View style={s.brandMark}>
              <DoveMark size={26} color={colors.accent} />
            </View>
            <View>
              <Text style={s.brand}>JUHA</Text>
              <Text style={s.brandSub}>Jugendgruppe</Text>
            </View>
          </View>

          <Card style={s.card}>
            {status === 'sent' || status === 'verifying' ? (
              <>
                <Text style={s.title}>Code eingeben 🔑</Text>
                <Text style={s.body}>
                  Wir haben dir einen 6-stelligen Code an{'\n'}
                  <Text style={s.bold}>{email.trim()}</Text> geschickt. Gib ihn hier ein.
                </Text>
                <TextInput
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  editable={status !== 'verifying'}
                  onSubmitEditing={submitCode}
                  style={s.codeInput}
                />
                {error ? <Text style={s.error}>{error}</Text> : null}
                {status === 'verifying' ? (
                  <View style={s.sending}>
                    <ActivityIndicator color={colors.accent} />
                    <Text style={s.sendingText}>Wird geprüft…</Text>
                  </View>
                ) : (
                  <Button label="Anmelden" onPress={submitCode} />
                )}
                <Button
                  label="Andere E-Mail verwenden"
                  variant="ghost"
                  onPress={() => {
                    setStatus('idle');
                    setCode('');
                    setError(null);
                  }}
                />
              </>
            ) : (
              <>
                <Text style={s.title}>Anmelden</Text>
                <Text style={s.body}>
                  Gib deinen Namen und deine E-Mail ein — du bekommst einen 6-stelligen Code zum
                  Anmelden. Kein Passwort nötig.
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Dein Name (z. B. Max Mustermann)"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={status !== 'sending'}
                  style={s.input}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="deine@email.de"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  inputMode="email"
                  editable={status !== 'sending'}
                  onSubmitEditing={submit}
                  style={s.input}
                />
                {error ? <Text style={s.error}>{error}</Text> : null}
                {status === 'sending' ? (
                  <View style={s.sending}>
                    <ActivityIndicator color={colors.accent} />
                    <Text style={s.sendingText}>Link wird gesendet…</Text>
                  </View>
                ) : (
                  <Button label="Code senden" onPress={submit} />
                )}
              </>
            )}
          </Card>

          <Text style={s.hint}>
            Du bist willkommen, so wie du bist. 🕊️
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    col: { width: '100%', maxWidth: APP_MAX_WIDTH - 40, gap: spacing.lg },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center' },
    brandMark: {
      width: 46,
      height: 46,
      borderRadius: radius.md,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: { fontSize: 22, fontWeight: '800', color: colors.foreground, letterSpacing: 0.2 },
    brandSub: { fontSize: 12, fontWeight: '600', color: colors.mutedForeground, marginTop: 1 },

    card: { gap: spacing.md },
    title: { fontSize: 20, fontWeight: '800', color: colors.foreground },
    body: { fontSize: 14, color: colors.secondary, lineHeight: 21 },
    bold: { fontWeight: '800', color: colors.foreground },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.foreground,
      backgroundColor: colors.surfaceAlt,
    },
    codeInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: 10,
      textAlign: 'center',
      color: colors.foreground,
      backgroundColor: colors.surfaceAlt,
    },
    error: { fontSize: 13, color: '#E5484D', fontWeight: '600' },
    sending: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
    sendingText: { fontSize: 14, color: colors.secondary, fontWeight: '600' },
    hint: { fontSize: 13, color: colors.mutedForeground, textAlign: 'center' },
  });
}
