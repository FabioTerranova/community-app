/**
 * Kompakte Anzeige der Dienste/Einteilungen eines Termins (z.B. Einstieg, Snacks).
 * Bewusst klein & dezent, damit die Termin-Karte informiert ohne zu ueberladen.
 * Zeigt nichts, wenn keine Dienste hinterlegt sind.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { EventDuty } from '../types';
import { radius, spacing, type Palette } from '../theme';
import { useTheme } from '../ThemeContext';

export function EventDuties({ duties }: { duties?: EventDuty[] }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  if (!duties || duties.length === 0) return null;
  return (
    <View style={s.wrap}>
      {duties.map((d) => (
        <Text key={d.role} style={s.line}>
          <Text style={s.role}>{d.role}: </Text>
          <Text style={s.people}>{d.people.join(', ')}</Text>
        </Text>
      ))}
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    wrap: {
      gap: 2,
      marginTop: 2,
      paddingLeft: spacing.sm,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
      borderRadius: radius.sm,
    },
    line: { fontSize: 12, lineHeight: 17 },
    role: { fontWeight: '800', color: colors.secondary },
    people: { color: colors.mutedForeground },
  });
}
