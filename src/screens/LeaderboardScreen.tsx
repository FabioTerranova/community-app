import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radius, shadow, spacing, type Palette } from '../theme';
import { useTheme } from '../ThemeContext';
import { leaderboard, memberPoints, milestoneProgress, milestonesFor } from '../logic/points';
import { Avatar, Card, Divider, ProgressBar, SectionTitle } from '../components/ui';
import {
  CalendarIcon,
  ShieldIcon,
  TrophyIcon,
  UsersIcon,
  type IconProps,
} from '../components/icons';
import { FadeSlide } from '../components/motion';
import { EMOJI_CHOICES } from '../data/mock';
import type { ScreenData } from './HomeScreen';

const MILESTONE_ICONS: Record<string, (p: IconProps) => React.JSX.Element> = {
  welcome: UsersIcon,
  regular: CalendarIcon,
  reliable: ShieldIcon,
  pillar: TrophyIcon,
};

export function LeaderboardScreen({
  members,
  records,
  currentMemberId,
  avatars,
  onSetAvatar,
}: ScreenData) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const board = leaderboard(members, records);

  const me = members.find((m) => m.id === currentMemberId)!;
  const myPoints = memberPoints(records, currentMemberId);
  const myRank = board.find((r) => r.member.id === currentMemberId)?.rank ?? '–';
  const progress = milestoneProgress(myPoints);
  const milestones = milestonesFor(myPoints);
  const myEmoji = avatars[currentMemberId];

  return (
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.h1}>Gemeinschaft</Text>
      <Text style={s.sub}>Schön, wenn wir zusammenkommen — jede Teilnahme zählt.</Text>

      {/* Deine Karte: Stand + Fortschritt + Avatar */}
      <FadeSlide delay={40}>
        <Card style={{ gap: spacing.md }}>
          <View style={s.meRow}>
            <Avatar name={me.name} emoji={myEmoji} highlight size={54} />
            <View style={{ flex: 1 }}>
              <Text style={s.meName}>{me.name}</Text>
              <Text style={s.meMeta}>
                Rang #{myRank} · {myPoints} {myPoints === 1 ? 'Teilnahme' : 'Teilnahmen'}
              </Text>
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <View style={s.progressHead}>
              <Text style={s.progressLabel}>
                {progress.next
                  ? `Noch ${progress.toNext} bis „${progress.next.label}"`
                  : 'Alle Meilensteine erreicht'}
              </Text>
              <Text style={s.progressCount}>
                {progress.reachedCount}/{progress.total}
              </Text>
            </View>
            <ProgressBar ratio={progress.ratio} />
            <View style={s.milestoneRow}>
              {milestones.map((m) => {
                const Icon = MILESTONE_ICONS[m.key];
                return (
                  <View key={m.key} style={s.milestone}>
                    <View style={[s.milestoneIcon, m.reached && s.milestoneIconOn]}>
                      <Icon
                        size={18}
                        color={m.reached ? colors.accent : colors.mutedForeground}
                        strokeWidth={2}
                      />
                    </View>
                    <Text style={[s.milestoneLabel, m.reached && s.milestoneLabelOn]}>
                      {m.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Divider />
          <View>
            <Text style={s.pickHint}>Dein Symbol</Text>
            <View style={s.emojiRow}>
              {EMOJI_CHOICES.map((emoji) => {
                const active = emoji === myEmoji;
                return (
                  <Pressable
                    key={emoji}
                    onPress={() => onSetAvatar(emoji)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Avatar ${emoji}`}
                    style={[s.emojiBtn, active && s.emojiBtnActive]}
                  >
                    <Text style={s.emojiText}>{emoji}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>
      </FadeSlide>

      <SectionTitle>Rangliste</SectionTitle>
      <View style={s.list}>
        {board.map((row, idx) => {
          const isMe = row.member.id === currentMemberId;
          const isTop = row.rank === 1;
          return (
            <FadeSlide key={row.member.id} delay={80 + idx * 45}>
              <View style={[s.row, isMe && s.rowMe]}>
                <View style={[s.rankBadge, isTop && s.rankBadgeTop]}>
                  <Text style={[s.rankText, isTop && s.rankTextTop]}>{row.rank}</Text>
                </View>
                <Avatar name={row.member.name} emoji={avatars[row.member.id]} highlight={isMe} />
                <Text style={[s.name, isMe && s.nameMe]} numberOfLines={1}>
                  {row.member.name}
                  {isMe ? '  (du)' : ''}
                </Text>
                <View style={s.pointsWrap}>
                  <Text style={s.points}>{row.points}</Text>
                  <Text style={s.pointsLabel}>Teiln.</Text>
                </View>
              </View>
            </FadeSlide>
          );
        })}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
    h1: { fontSize: 28, fontWeight: '800', color: colors.foreground },
    sub: { fontSize: 15, color: colors.secondary, marginBottom: spacing.sm, lineHeight: 21 },

    meRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    meName: { fontSize: 18, fontWeight: '800', color: colors.foreground },
    meMeta: { fontSize: 13, fontWeight: '700', color: colors.mutedForeground, marginTop: 2 },

    progressHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    progressLabel: { fontSize: 13, fontWeight: '700', color: colors.foreground, flex: 1 },
    progressCount: { fontSize: 12, fontWeight: '800', color: colors.mutedForeground },
    milestoneRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
    milestone: { alignItems: 'center', gap: 5, flex: 1 },
    milestoneIcon: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    milestoneIconOn: { backgroundColor: colors.accentSoft },
    milestoneLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    milestoneLabelOn: { color: colors.secondary },

    pickHint: { fontSize: 13, fontWeight: '700', color: colors.secondary, marginBottom: spacing.sm },
    emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    emojiBtn: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
    emojiText: { fontSize: 20 },

    list: { gap: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      ...shadow(colors.shadowColor, 'sm'),
    },
    rowMe: { borderWidth: 1.5, borderColor: colors.accent },
    rankBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankBadgeTop: { backgroundColor: colors.accent },
    rankText: { fontSize: 14, fontWeight: '800', color: colors.secondary },
    rankTextTop: { color: colors.accentForeground },
    name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.foreground },
    nameMe: { color: colors.accent },
    pointsWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
    points: { fontSize: 20, fontWeight: '800', color: colors.points },
    pointsLabel: { fontSize: 12, color: colors.mutedForeground, fontWeight: '600' },
  });
}
