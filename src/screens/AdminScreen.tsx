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
import type { AttendanceRecord, Member } from '../types';
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
  onMergeMembers,
  avatars,
  photos,
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
      {onMergeMembers ? (
        <MergeTool members={members} avatars={avatars} photos={photos} onMerge={onMergeMembers} />
      ) : null}
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
                    <Avatar name={member.name} emoji={avatars[member.id]} photo={photos[member.id]} size={38} />
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
  onCreate: (input: {
    title: string;
    date: string;
    location?: string;
    vorbereitung?: string;
    snacks?: string;
  }) => Promise<void>;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [vorbereitung, setVorbereitung] = useState('');
  const [snacks, setSnacks] = useState('');
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
      await onCreate({
        title: t,
        date: d,
        location: location.trim() || undefined,
        vorbereitung: vorbereitung.trim() || undefined,
        snacks: snacks.trim() || undefined,
      });
      setTitle('');
      setDate('');
      setLocation('');
      setVorbereitung('');
      setSnacks('');
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
        <TextInput
          value={vorbereitung}
          onChangeText={setVorbereitung}
          placeholder="Vorbereitung – wer? (optional)"
          placeholderTextColor={colors.mutedForeground}
          editable={!saving}
          style={s.input}
        />
        <TextInput
          value={snacks}
          onChangeText={setSnacks}
          placeholder="Snacks – wer? (optional, mehrere mit Komma)"
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

/** Normalisierter Namensschluessel zum Aufspueren doppelter Mitglieder. */
function nameKey(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '');
}

/**
 * Admin-Werkzeug: zwei Mitglieder zusammenfuehren. Man waehlt das Konto zum
 * BEHALTEN (mit Foto/Punkten) und das DUPLIKAT; Anwesenheiten/Avatar wandern
 * aufs behaltene, das Duplikat wird archiviert. Verdaechtige Namensdubletten
 * werden oben als Schnellauswahl vorgeschlagen.
 */
function MergeTool({
  members,
  avatars,
  photos,
  onMerge,
}: {
  members: Member[];
  avatars: Record<string, string>;
  photos: Record<string, string>;
  onMerge: (keepId: string, mergeId: string) => Promise<void>;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [keepId, setKeepId] = useState<string | null>(null);
  const [mergeId, setMergeId] = useState<string | null>(null);
  const [open, setOpen] = useState<null | 'keep' | 'merge'>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...members].sort((a, b) => a.name.localeCompare(b.name)),
    [members],
  );

  // Verdaechtige Duplikate: gleiche (normalisierte) Namen -> als Vorschlag anbieten.
  const suspects = useMemo(() => {
    const byKey = new Map<string, Member[]>();
    for (const m of members) {
      const k = nameKey(m.name);
      if (!k) continue;
      byKey.set(k, [...(byKey.get(k) || []), m]);
    }
    return [...byKey.values()].filter((g) => g.length > 1);
  }, [members]);

  const keep = members.find((m) => m.id === keepId) || null;
  const dupe = members.find((m) => m.id === mergeId) || null;
  const canMerge = !!keepId && !!mergeId && keepId !== mergeId && !busy;

  async function doMerge() {
    if (!canMerge || !keep || !dupe) return;
    const ok =
      typeof window === 'undefined' ||
      window.confirm(
        `„${dupe.name}" (${dupe.email || 'ohne E-Mail'}) wird mit „${keep.name}" ` +
          `zusammengeführt. Punkte/Anwesenheiten wandern zu „${keep.name}", das Duplikat ` +
          `wird archiviert (in Notion wiederherstellbar). Fortfahren?`,
      );
    if (!ok) return;
    setBusy(true);
    setMsg(null);
    try {
      await onMerge(keepId!, mergeId!);
      setMsg(`✓ Zusammengeführt – „${dupe.name}" archiviert.`);
      setKeepId(null);
      setMergeId(null);
    } catch (e: any) {
      setMsg(e?.message || 'Zusammenführen fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }

  function pick(id: string) {
    if (open === 'keep') setKeepId(id);
    else if (open === 'merge') setMergeId(id);
    setOpen(null);
  }

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={s.h1}>Doppelte zusammenführen</Text>
      <Card style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <Text style={s.mergeHint}>
          Wähle das Konto zum <Text style={{ fontWeight: '800' }}>Behalten</Text> (mit Foto/Punkten)
          und das <Text style={{ fontWeight: '800' }}>Duplikat</Text>. Punkte & Anwesenheiten
          wandern mit; das Duplikat wird archiviert.
        </Text>

        {suspects.length > 0 ? (
          <View style={{ gap: 6 }}>
            <Text style={s.mergeLabel}>Mögliche Duplikate</Text>
            {suspects.map((g) => (
              <Pressable
                key={nameKey(g[0].name)}
                style={s.suspectRow}
                onPress={() => {
                  // Vorschlag: das mit Foto/Emoji behalten, das andere als Duplikat.
                  const withAvatar = g.find((m) => photos[m.id] || avatars[m.id]);
                  const keepM = withAvatar || g[0];
                  const dupeM = g.find((m) => m.id !== keepM.id) || g[1];
                  setKeepId(keepM.id);
                  setMergeId(dupeM.id);
                  setOpen(null);
                }}
              >
                <Text style={s.suspectName}>{g[0].name}</Text>
                <Text style={s.suspectCount}>{g.length}× · antippen</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <PickerField
          label="Behalten"
          member={keep}
          onPress={() => setOpen(open === 'keep' ? null : 'keep')}
        />
        {open === 'keep' ? <MemberList members={sorted} onPick={pick} /> : null}

        <PickerField
          label="Duplikat (wird archiviert)"
          member={dupe}
          onPress={() => setOpen(open === 'merge' ? null : 'merge')}
        />
        {open === 'merge' ? <MemberList members={sorted} onPick={pick} /> : null}

        {msg ? <Text style={s.formMsg}>{msg}</Text> : null}
        {busy ? (
          <View style={s.savingRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={s.sub}>Wird zusammengeführt…</Text>
          </View>
        ) : (
          <Button label="Zusammenführen" onPress={doMerge} disabled={!canMerge} />
        )}
      </Card>
    </View>
  );
}

function PickerField({
  label,
  member,
  onPress,
}: {
  label: string;
  member: Member | null;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={s.pickerField}>
      <Text style={s.mergeLabel}>{label}</Text>
      <Text style={[s.pickerValue, !member && { color: colors.mutedForeground }]}>
        {member ? `${member.name}  ·  ${member.email || 'ohne E-Mail'}` : 'Auswählen…'}
      </Text>
    </Pressable>
  );
}

function MemberList({
  members,
  onPick,
}: {
  members: Member[];
  onPick: (id: string) => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScrollView style={s.memberList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
      {members.map((m) => (
        <Pressable key={m.id} style={s.memberItem} onPress={() => onPick(m.id)}>
          <Text style={s.memberItemName}>{m.name}</Text>
          <Text style={s.memberItemMail}>{m.email || 'ohne E-Mail'}</Text>
        </Pressable>
      ))}
    </ScrollView>
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

    mergeHint: { fontSize: 13, color: colors.secondary, lineHeight: 19 },
    mergeLabel: { fontSize: 11, fontWeight: '800', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.3 },
    suspectRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.accentSoft,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
    },
    suspectName: { fontSize: 14, fontWeight: '800', color: colors.accent },
    suspectCount: { fontSize: 12, fontWeight: '700', color: colors.accent },
    pickerField: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      gap: 3,
      backgroundColor: colors.surfaceAlt,
    },
    pickerValue: { fontSize: 15, fontWeight: '700', color: colors.foreground },
    memberList: {
      maxHeight: 220,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    memberItem: {
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    memberItemName: { fontSize: 15, fontWeight: '700', color: colors.foreground },
    memberItemMail: { fontSize: 12, color: colors.mutedForeground, marginTop: 1 },

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
