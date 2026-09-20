import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AttendanceRecord, CommunityEvent, DailyVerse, Member } from '../types';
import { radius, spacing, type Palette } from '../theme';
import { useTheme } from '../ThemeContext';
import { upcomingEvents } from '../logic/attendance';
import { attendanceTrend, currentStreak, leaderboard, memberPoints } from '../logic/points';
import { eventCategory, formatDate, formatLongDate } from '../logic/format';
import { Avatar, Button, Card, CategoryChip, Pill, SectionTitle } from '../components/ui';
import { BookIcon, MapPinIcon } from '../components/icons';
import { FadeSlide, useCountUp } from '../components/motion';
import { EventDuties } from '../components/EventDuties';

export interface ScreenData {
  members: Member[];
  events: CommunityEvent[];
  records: AttendanceRecord[];
  currentMemberId: string;
  today: string;
  onToggleSignup: (memberId: string, eventId: string) => void;
  onSetStatus: (memberId: string, eventId: string, status: AttendanceRecord['status']) => void;
  /** Emoji-Avatar je Mitglied (memberId -> Emoji). */
  avatars: Record<string, string>;
  onSetAvatar: (emoji: string) => void;
  /** Vers des Tages (live aus api/verse, sonst Platzhalter). */
  verse: DailyVerse;
}

function statusFor(records: AttendanceRecord[], memberId: string, eventId: string) {
  return records.find((r) => r.memberId === memberId && r.eventId === eventId)?.status;
}

function signupCount(records: AttendanceRecord[], eventId: string) {
  return records.filter(
    (r) => r.eventId === eventId && (r.status === 'yes' || r.status === 'attended'),
  ).length;
}

/** Mini-Verlauf der letzten Teilnahmen (Balken) — Info statt Spiel. */
function TrendBars({ data }: { data: boolean[] }) {
  const { colors } = useTheme();
  if (data.length === 0) return null;
  return (
    <View style={trendStyles.row}>
      {data.map((attended, i) => (
        <View
          key={i}
          style={[
            trendStyles.bar,
            {
              height: attended ? 34 : 14,
              backgroundColor: attended ? colors.accent : colors.muted,
            },
          ]}
        />
      ))}
    </View>
  );
}

const trendStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 34 },
  bar: { width: 6, borderRadius: 3 },
});

export function HomeScreen(props: ScreenData) {
  const {
    members,
    events,
    records,
    currentMemberId,
    today,
    onToggleSignup,
    avatars,
    verse,
  } = props;
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const me = members.find((m) => m.id === currentMemberId)!;
  const points = memberPoints(records, currentMemberId);
  const board = leaderboard(members, records);
  const myRank = board.find((r) => r.member.id === currentMemberId)?.rank ?? '–';
  const streak = currentStreak(records, events, currentMemberId, today);
  const trend = attendanceTrend(records, events, currentMemberId, today, 9);
  const upcoming = upcomingEvents(events, today).slice(0, 3);
  const myEmoji = avatars[currentMemberId];
  const shownPoints = useCountUp(points);

  return (
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Begruessung */}
      <FadeSlide>
        <View style={s.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.date}>{formatLongDate(today)}</Text>
            <Text style={s.greeting}>Hallo {me.name.split(' ')[0]}</Text>
          </View>
          <Avatar name={me.name} emoji={myEmoji} highlight size={52} />
        </View>
      </FadeSlide>

      {/* Stat-Karte: Teilnahmen + Mini-Verlauf */}
      <FadeSlide delay={70}>
        <Card style={s.hero}>
          <View style={s.heroLeft}>
            <Text style={s.heroLabel}>DEINE TEILNAHMEN</Text>
            <Text style={s.heroNumber}>{shownPoints}</Text>
            <View style={s.heroMetaRow}>
              <Text style={s.heroMeta}>Rang #{myRank}</Text>
              {streak > 0 ? (
                <>
                  <View style={s.metaDot} />
                  <Text style={s.heroMeta}>{streak} in Folge</Text>
                </>
              ) : null}
            </View>
          </View>
          <TrendBars data={trend} />
        </Card>
      </FadeSlide>

      {/* Vers des Tages — zwei getrennte Boxen: Losung (AT) + Lehrtext (NT) */}
      <FadeSlide delay={140}>
        <Card style={[s.verseCard, s.verseCardAt]}>
          <View style={s.verseHead}>
            <BookIcon size={16} color={colors.accent} />
            <Text style={s.verseLabel}>LOSUNG · ALTES TESTAMENT</Text>
          </View>
          <Text style={s.verseText}>„{verse.text}"</Text>
          <Text style={s.verseRef}>
            {verse.reference}
            {verse.translation ? ` · ${verse.translation}` : ''}
          </Text>
        </Card>
      </FadeSlide>

      {verse.lehrtext ? (
        <FadeSlide delay={175}>
          <Card style={[s.verseCard, s.verseCardNt]}>
            <View style={s.verseHead}>
              <BookIcon size={16} color={colors.accent} />
              <Text style={s.verseLabel}>LEHRTEXT · NEUES TESTAMENT</Text>
            </View>
            <Text style={s.verseText}>„{verse.lehrtext}"</Text>
            {verse.lehrtextReference ? (
              <Text style={s.verseRef}>{verse.lehrtextReference}</Text>
            ) : null}
          </Card>
        </FadeSlide>
      ) : null}

      {/* Kommende Termine */}
      <FadeSlide delay={210}>
        <SectionTitle>Deine nächsten Termine</SectionTitle>
      </FadeSlide>
      <View style={{ gap: spacing.sm }}>
        {upcoming.map((event, idx) => {
          const mine = statusFor(records, currentMemberId, event.id);
          const signedUp = mine === 'yes' || mine === 'attended';
          const cat = eventCategory(event.title);
          const p = formatDate(event.date);
          return (
            <FadeSlide key={event.id} delay={250 + idx * 60}>
              <Card style={s.eventCard}>
                <View style={s.eventTop}>
                  <View style={s.dateChip}>
                    <Text style={s.dateChipDay}>{Number(event.date.split('-')[2])}</Text>
                    <Text style={s.dateChipMonth}>{p.split(' ').pop()}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text style={s.eventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    {event.location ? (
                      <View style={s.metaRow}>
                        <MapPinIcon size={14} color={colors.mutedForeground} />
                        <Text style={s.meta} numberOfLines={1}>
                          {event.location}
                        </Text>
                      </View>
                    ) : null}
                    <View style={s.eventChips}>
                      <CategoryChip label={cat.label} />
                      <Pill
                        label={`${signupCount(records, event.id)} dabei`}
                        tone={signedUp ? 'accent' : 'neutral'}
                      />
                    </View>
                    <EventDuties duties={event.duties} />
                  </View>
                </View>
                <View style={s.eventActions}>
                  <Button
                    label={signedUp ? 'Abmelden' : 'Anmelden'}
                    variant={signedUp ? 'ghost' : 'primary'}
                    tone={signedUp ? 'danger' : 'accent'}
                    small
                    onPress={() => onToggleSignup(currentMemberId, event.id)}
                  />
                  {signedUp ? (
                    <Text style={s.reminderHint}>🔔 Erinnerung ~2 Std. vorher aktiv</Text>
                  ) : null}
                </View>
              </Card>
            </FadeSlide>
          );
        })}
        {upcoming.length === 0 ? (
          <Card>
            <Text style={s.emptyTitle}>Aktuell keine Termine</Text>
            <Text style={s.emptyBody}>
              Sobald neue Termine geplant sind, erscheinen sie hier — und du kannst dich mit einem
              Tipp anmelden.
            </Text>
          </Card>
        ) : null}
      </View>

      <View style={s.infoBox}>
        <Text style={s.infoText}>
          <Text style={s.infoBold}>1 Teilnahme</Text> zählt, wenn du dich anmeldest und zum Termin
          kommst. Anmelden ohne Erscheinen zählt nicht.
        </Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },

    topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    date: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.mutedForeground,
      textTransform: 'capitalize',
    },
    greeting: { fontSize: 28, fontWeight: '800', color: colors.foreground, marginTop: 2 },

    hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heroLeft: { gap: 2 },
    heroLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      color: colors.mutedForeground,
    },
    heroNumber: { fontSize: 44, fontWeight: '800', color: colors.accent, lineHeight: 50 },
    heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
    heroMeta: { fontSize: 13, fontWeight: '700', color: colors.secondary },
    metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.mutedForeground },

    verseCard: { gap: spacing.sm },
    verseCardAt: { backgroundColor: colors.verseTintAt },
    verseCardNt: { backgroundColor: colors.verseTintNt },
    verseHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    verseLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.accent },
    verseText: { fontSize: 16, fontStyle: 'italic', color: colors.foreground, lineHeight: 24 },
    verseRef: { fontSize: 13, fontWeight: '700', color: colors.mutedForeground },

    eventCard: { gap: spacing.md },
    eventTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    dateChip: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentSoft,
    },
    dateChipDay: { fontSize: 20, fontWeight: '800', color: colors.accent },
    dateChipMonth: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      color: colors.accent,
    },
    eventTitle: { fontSize: 17, fontWeight: '700', color: colors.foreground },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    meta: { fontSize: 13, color: colors.mutedForeground, fontWeight: '600', flexShrink: 1 },
    eventChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
    eventActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    reminderHint: { fontSize: 12, color: colors.mutedForeground, fontWeight: '600', flexShrink: 1 },

    infoBox: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.xs,
    },
    infoText: { fontSize: 13, color: colors.secondary, lineHeight: 20 },
    infoBold: { fontWeight: '800', color: colors.foreground },

    emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.secondary },
    emptyBody: { fontSize: 13, color: colors.mutedForeground, lineHeight: 19, marginTop: 4 },
  });
}
