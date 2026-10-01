import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AttendanceRecord, Member } from '../types';
import { radius, spacing, type Palette } from '../theme';
import { useTheme } from '../ThemeContext';
import { Avatar } from './ui';

/**
 * Admin-Einblick: WER hat sich fuer einen Termin angemeldet (Name + Avatar).
 * Rein darstellend — das Auf-/Zuklappen steuert der jeweilige Screen.
 * Zeigt alle mit Status 'yes' (angemeldet) oder 'attended' (war da), nach Name sortiert.
 */
export function AttendeesList({
  records,
  members,
  eventId,
  avatars,
  photos,
}: {
  records: AttendanceRecord[];
  members: Member[];
  eventId: string;
  avatars: Record<string, string>;
  photos: Record<string, string>;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const attendees = useMemo(() => {
    const ids = new Set(
      records
        .filter((r) => r.eventId === eventId && (r.status === 'yes' || r.status === 'attended'))
        .map((r) => r.memberId),
    );
    return members
      .filter((m) => ids.has(m.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [records, members, eventId]);

  if (attendees.length === 0) {
    return (
      <View style={s.box}>
        <Text style={s.empty}>Noch niemand angemeldet.</Text>
      </View>
    );
  }

  return (
    <View style={s.box}>
      {attendees.map((m) => (
        <View key={m.id} style={s.row}>
          <Avatar name={m.name} emoji={avatars[m.id]} photo={photos[m.id]} size={28} />
          <Text style={s.name} numberOfLines={1}>
            {m.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    box: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      gap: 2,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 5 },
    name: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.foreground },
    empty: { fontSize: 13, color: colors.mutedForeground, paddingVertical: 6 },
  });
}
