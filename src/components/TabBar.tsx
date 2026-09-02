/** Untere Navigation — schwebende Leiste mit SVG-Icons und aktivem Indikator. */
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, shadow, spacing, type Palette } from '../theme';
import { useTheme } from '../ThemeContext';
import {
  CalendarIcon,
  HomeIcon,
  ShieldIcon,
  TrophyIcon,
  type IconProps,
} from './icons';

export type TabKey = 'home' | 'events' | 'leaderboard' | 'admin';

export interface TabDef {
  key: TabKey;
  label: string;
}

const ICONS: Record<TabKey, (p: IconProps) => React.JSX.Element> = {
  home: HomeIcon,
  events: CalendarIcon,
  leaderboard: TrophyIcon,
  admin: ShieldIcon,
};

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: TabKey;
  onChange: (key: TabKey) => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.wrap}>
      <View style={[s.bar, shadow(colors.shadowColor, 'lg')]}>
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          const Icon = ICONS[tab.key];
          return (
            <Pressable
              key={tab.key}
              style={s.tab}
              onPress={() => onChange(tab.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View style={[s.iconWrap, isActive && s.iconWrapActive]}>
                <Icon
                  size={23}
                  color={isActive ? colors.accent : colors.mutedForeground}
                  filled={isActive}
                  strokeWidth={2}
                />
              </View>
              <Text style={[s.label, isActive && s.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      paddingTop: spacing.xs,
      backgroundColor: 'transparent',
    },
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
    iconWrap: {
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      borderRadius: radius.full,
    },
    iconWrapActive: { backgroundColor: colors.accentSoft },
    label: { fontSize: 11, fontWeight: '700', color: colors.mutedForeground },
    labelActive: { color: colors.accent },
  });
}
