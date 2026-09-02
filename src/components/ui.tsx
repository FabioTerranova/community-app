/**
 * UI-Bausteine im "Soft Premium"-Stil: weiche Schatten, mehr Rundung, klare Typo.
 * Farben kommen aus `useTheme()` -> Hell/Dunkel wirkt sofort.
 */
import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { radius, shadow, spacing, type Palette } from '../theme';
import { useTheme } from '../ThemeContext';

/** Weiche Karte mit Schatten (statt hartem Rand). */
export function Card({
  children,
  style,
  elevated = true,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  onPress?: () => void;
}) {
  const { colors, mode } = useTheme();
  const s = useMemo(() => makeStyles(colors, mode), [colors, mode]);
  const content = (
    <View style={[s.card, elevated && shadow(colors.shadowColor, 'md'), style]}>{children}</View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? s.pressed : null)}>
      {content}
    </Pressable>
  );
}

/** Kleine Grossbuchstaben-Ueberschrift ueber einer Sektion. */
export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const { colors, mode } = useTheme();
  const s = useMemo(() => makeStyles(colors, mode), [colors, mode]);
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

export function Divider() {
  const { colors, mode } = useTheme();
  const s = useMemo(() => makeStyles(colors, mode), [colors, mode]);
  return <View style={s.divider} />;
}

/** Schlanker Fortschrittsbalken (0..1) im Akzent auf neutraler Spur. */
export function ProgressBar({ ratio, height = 8 }: { ratio: number; height?: number }) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.muted, overflow: 'hidden' }}>
      <View
        style={{
          height,
          borderRadius: height,
          width: `${clamped * 100}%`,
          backgroundColor: colors.accent,
        }}
      />
    </View>
  );
}

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'points' | 'accent';

export function Pill({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const map: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: colors.muted, fg: colors.secondary },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    points: { bg: colors.pointsSoft, fg: colors.points },
    accent: { bg: colors.accentSoft, fg: colors.accent },
  };
  const t = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {icon}
      <Text style={[styles.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  tone = 'accent',
  disabled,
  small,
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost';
  tone?: 'accent' | 'success' | 'danger';
  disabled?: boolean;
  small?: boolean;
  icon?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const base =
    tone === 'success' ? colors.success : tone === 'danger' ? colors.danger : colors.accent;
  const isPrimary = variant === 'primary';
  const primaryText = tone === 'accent' ? colors.accentForeground : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.btn,
        small ? styles.btnSmall : null,
        isPrimary
          ? [{ backgroundColor: base }, !disabled && shadow(base, 'sm')]
          : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: base },
        pressed && !disabled ? styles.btnPressed : null,
        disabled ? { opacity: 0.4 } : null,
      ]}
    >
      {icon}
      <Text style={[small ? styles.btnTextSmall : styles.btnText, { color: isPrimary ? primaryText : base }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Kreis mit Emoji (falls gewaehlt) oder Initialen; Farbe deterministisch aus dem Namen. */
export function Avatar({
  name,
  emoji,
  highlight,
  size = 40,
}: {
  name: string;
  emoji?: string;
  highlight?: boolean;
  size?: number;
}) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: highlight ? colors.accentSoft : colors.surfaceAlt,
          borderWidth: highlight ? 1.5 : 0,
          borderColor: colors.accent,
        },
      ]}
    >
      {emoji ? (
        <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
      ) : (
        <Text
          style={[
            styles.avatarText,
            { fontSize: size * 0.36, color: highlight ? colors.accent : colors.secondary },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

/** Monochromer Kategorie-Tag (neutral) — Unterscheidung ueber Text, nicht Farbe. */
export function CategoryChip({ label }: { label: string; color?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.catChip, { backgroundColor: colors.muted }]}>
      <Text style={[styles.catText, { color: colors.secondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    height: 46,
    borderRadius: radius.full,
  },
  btnSmall: { height: 38, paddingHorizontal: spacing.md, borderRadius: radius.full },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  btnText: { fontSize: 15, fontWeight: '700' },
  btnTextSmall: { fontSize: 13, fontWeight: '700' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', color: '#FFFFFF' },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  catDot: { width: 7, height: 7, borderRadius: 4 },
  catText: { fontSize: 11, fontWeight: '700' },
});

function makeStyles(colors: Palette, mode: string) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      // Im Dunkelmodus zusaetzlich eine feine Kante, damit Karten sich vom Grund abheben.
      borderWidth: mode === 'dark' ? 1 : 0,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mutedForeground,
    },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  });
}
