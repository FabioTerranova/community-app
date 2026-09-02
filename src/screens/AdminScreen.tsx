import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AttendanceRecord } from '../types';
import { radius, spacing, type Palette } from '../theme';
import { useTheme } from '../ThemeContext';
import { formatDate } from '../logic/format';
import { Avatar, Card } from '../components/ui';
import { CheckIcon, CloseIcon } from '../components/icons';
import type { ScreenData } from './HomeScreen';

/**
 * Admin-Ansicht: vergangene Termine bestaetigen.
 * Fuer jeden angemeldeten Teilnehmer: "War da" (+1 Punkt) oder "Nicht da" (kein Punkt).
 * UX: offene Eintraege sind klar hervorgehoben, Erledigtes tritt zurueck.
 */
export function AdminScreen({ members, events, records, today, onSetStatus, avatars }: ScreenData) {
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
