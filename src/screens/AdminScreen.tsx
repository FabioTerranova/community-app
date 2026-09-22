import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { AttendanceRecord } from '../types';
import { radius, spacing, type Palette } from '../theme';
import { useTheme } from '../ThemeContext';
import { formatDate } from '../logic/format';
import { Avatar, Button, Card } from '../components/ui';
import { CheckIcon, CloseIcon } from '../components/icons';
import type { ScreenData } from './HomeScreen';

/**
 * Admin-Ansicht: vergangene Termine bestaetigen.
 * Fuer jeden angemeldeten Teilnehmer: "War da" (+1 Punkt) oder "Nicht da" (kein Punkt).
 * UX: offene Eintraege sind klar hervorgehoben, Erledigtes tritt zurueck.
 */
export function AdminScreen({
  members,
  events,
  records,
  today,
  onSetStatus,
  onCreateEvent,
  avatars,
}: ScreenData) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const past = events
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const pendingCount = records.filter(
    (r) => r.status === 'yes' && events.find((e) => e.id === r.eventId && e.date < today),
  ).length;

  const eventsWithSignups = past
    .map((event) => ({
      event,
      signups: records.filter(
        (r) =>
          r.eventId === event.id &&
          (r.status === 'yes' || r.status === 'attended' || r.status === 'no'),
      ),
    }))
    .filter((x) => x.signups.length > 0);

  return (
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {onCreateEvent ? <NewEventForm onCreate={onCreateEvent} /> : null}
      <Text style={s.h1}>Anwesenheit</Text>
      <View style={s.statusRow}>
        {pendingCount > 0 ? (
          <View style={[s.statusPill, { backgroundColor: colors.accentSoft }]}>
            <Text style={[s.statusPillText, { color: colors.accent }]}>
              {pendingCount} offen
            </Text>
          </View>
        ) : (
          <View style={[s.statusPill, { backgroundColor: colors.muted }]}>
            <CheckIcon size={13} color={colors.secondary} />
            <Text style={[s.statusPillText, { color: colors.secondary }]}>Alles bestätigt</Text>
          </View>
        )}
        <Text style={s.sub}>Tippe je Person, ob sie da war.</Text>
      </View>

      {eventsWithSignups.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Nichts zu bestätigen</Text>
          <Text style={s.emptyBody}>
            Sobald vergangene Termine Anmeldungen haben, erscheinen sie hier.
          </Text>
        </View>
      ) : null}

      {eventsWithSignups.map(({ event, signups }) => {
        const openHere = signups.filter((r) => r.status === 'yes').length;
        return (
          <View key={event.id} style={{ marginTop: spacing.md }}>
            <View style={s.eventHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.eventTitle}>{event.title}</Text>
                <Text style={s.eventDate}>{formatDate(event.date)}</Text>
              </View>
              {openHere > 0 ? (
                <View style={[s.openBadge, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[s.openBadgeText, { color: colors.accent }]}>{openHere} offen</Text>
                </View>
              ) : (
                <View style={[s.openBadge, { backgroundColor: colors.muted }]}>
                  <CheckIcon size={12} color={colors.secondary} />
                </View>
              )}
            </View>
            <Card style={{ gap: 0 }}>
              {signups.map((rec, i) => {
                const member = members.find((m) => m.id === rec.memberId)!;
                return (
                  <View key={rec.memberId} style={[s.personRow, i > 0 && s.divider]}>
                    <Avatar name={member.name} emoji={avatars[member.id]} size={38} />
                    <Text style={s.personName}>{member.name}</Text>
                    <StatusToggle
                      status={rec.status}
                      onAttended={() => onSetStatus(rec.memberId, event.id, 'attended')}
                      onAbsent={() => onSetStatus(rec.memberId, event.id, 'no')}
                    />
                  </View>
                );
              })}
            </Card>
          </View>
        );
      })}
    </ScrollView>
  );
}

/** Admin-Formular: neuen Termin anlegen (schreibt via onCreate nach Notion). */
function NewEventForm({
  onCreate,
}: {
  onCreate: (input: { title: string; date: string; location?: string }) => Promise<void>;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    const t = title.trim();
    const d = date.trim();
    if (!t) {
      setMsg('Bitte einen Titel eingeben.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      setMsg('Datum im Format JJJJ-MM-TT (z. B. 2026-10-02).');
      return;
    }
    setMsg(null);
    setSaving(true);
    try {
      await onCreate({ title: t, date: d, location: location.trim() || undefined });
      setTitle('');
      setDate('');
      setLocation('');
      setMsg('Termin angelegt ✓');
    } catch (e: any) {
      setMsg(e?.message || 'Konnte den Termin nicht anlegen.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={s.h1}>Neuer Termin</Text>
      <Card style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Titel (z. B. Jugendgruppe)"
          placeholderTextColor={colors.mutedForeground}
          editable={!saving}
          style={s.input}
        />
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="Datum JJJJ-MM-TT"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!saving}
          style={s.input}
        />
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Ort (optional)"
          placeholderTextColor={colors.mutedForeground}
          editable={!saving}
          style={s.input}
        />
        {msg ? <Text style={s.formMsg}>{msg}</Text> : null}
        {saving ? (
          <View style={s.savingRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={s.sub}>Wird gespeichert…</Text>
          </View>
        ) : (
          <Button label="Termin anlegen" onPress={submit} />
        )}
      </Card>
    </View>
  );
}

function StatusToggle({
  status,
  onAttended,
  onAbsent,
}: {
  status: AttendanceRecord['status'];
  onAttended: () => void;
  onAbsent: () => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  // Offen -> zwei klare Aktionen.
  if (status === 'yes') {
    return (
      <View style={s.toggleGroup}>
        <Pressable
          style={[s.toggleBtn, { backgroundColor: colors.success }]}
          onPress={onAttended}
          accessibilityRole="button"
          accessibilityLabel="War da, plus einen Punkt"
        >
          <CheckIcon size={15} color="#FFFFFF" />
          <Text style={s.toggleTextLight}>War da</Text>
        </Pressable>
        <Pressable
          style={[s.iconBtn, { backgroundColor: colors.dangerSoft }]}
          onPress={onAbsent}
          accessibilityRole="button"
          accessibilityLabel="Nicht da"
        >
          <CloseIcon size={16} color={colors.danger} />
        </Pressable>
      </View>
    );
  }

  // Entschieden -> Ergebnis, antippen kehrt um.
  const attended = status === 'attended';
  return (
    <Pressable
      onPress={attended ? onAbsent : onAttended}
      accessibilityRole="button"
      accessibilityLabel={attended ? 'War da, tippen zum Ändern' : 'Nicht da, tippen zum Ändern'}
      style={[
        s.resultPill,
        { backgroundColor: attended ? colors.successSoft : colors.dangerSoft },
      ]}
    >
      {attended ? (
        <CheckIcon size={14} color={colors.success} />
      ) : (
        <CloseIcon size={14} color={colors.danger} />
      )}
      <Text style={[s.resultText, { color: attended ? colors.success : colors.danger }]}>
        {attended ? 'War da · +1' : 'Nicht da'}
      </Text>
    </Pressable>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    h1: { fontSize: 28, fontWeight: '800', color: colors.foreground },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 5,
      borderRadius: radius.full,
    },
    statusPillText: { fontSize: 12, fontWeight: '800' },
    sub: { fontSize: 13, color: colors.mutedForeground, flex: 1 },

    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
      backgroundColor: colors.surfaceAlt,
    },
    formMsg: { fontSize: 13, fontWeight: '600', color: colors.secondary },
    savingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },

    eventHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
      paddingHorizontal: 2,
    },
    eventTitle: { fontSize: 16, fontWeight: '800', color: colors.foreground },
    eventDate: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, marginTop: 1 },
    openBadge: {
      minWidth: 26,
      height: 26,
      paddingHorizontal: 9,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    openBadgeText: { fontSize: 12, fontWeight: '800' },

    personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
    divider: { borderTopWidth: 1, borderTopColor: colors.border },
    personName: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.foreground },

    toggleGroup: { flexDirection: 'row', gap: spacing.xs + 2, alignItems: 'center' },
    toggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.md,
      height: 38,
      borderRadius: radius.full,
    },
    toggleTextLight: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.md,
      height: 34,
      borderRadius: radius.full,
    },
    resultText: { fontSize: 13, fontWeight: '800' },

    empty: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      gap: 4,
    },
    emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.secondary },
    emptyBody: { fontSize: 13, color: colors.mutedForeground, textAlign: 'center', lineHeight: 19 },
  });
}
