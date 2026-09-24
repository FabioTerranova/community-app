import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AttendanceRecord, CommunityEvent } from '../types';
import { radius, shadow, spacing, type Palette } from '../theme';
import { useTheme } from '../ThemeContext';
import { eventCategory, formatDate, WEEK_BUCKET_LABELS, weekBucket } from '../logic/format';
import { Button, Card, CategoryChip, Pill, SectionTitle } from '../components/ui';
import { CheckIcon, MapPinIcon, UsersIcon } from '../components/icons';
import { FadeSlide } from '../components/motion';
import { EventDuties } from '../components/EventDuties';
import type { ScreenData } from './HomeScreen';

function statusFor(records: AttendanceRecord[], memberId: string, eventId: string) {
  return records.find((r) => r.memberId === memberId && r.eventId === eventId)?.status;
}

function signupCount(records: AttendanceRecord[], eventId: string) {
  return records.filter(
    (r) => r.eventId === eventId && (r.status === 'yes' || r.status === 'attended'),
  ).length;
}

/** Ortschaft aus dem Ort-String ("Bozen · CGS Hauptsaal" -> "Bozen"). */
function townOf(location?: string): string {
  return location ? location.split('·')[0].trim() : '';
}

export function EventsScreen({
  events,
  records,
  currentMemberId,
  today,
  onToggleSignup,
}: ScreenData) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [filter, setFilter] = useState<string>('all');
  const [region, setRegion] = useState<string>('all');

  const matches = (e: CommunityEvent) =>
    (filter === 'all' || eventCategory(e.title).key === filter) &&
    (region === 'all' || townOf(e.location) === region);
  const allUpcoming = useMemo(
    () => events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    [events, today],
  );

  // Filter-Kategorien mit Zaehler (nur kommende Termine = handlungsrelevant).
  const categories = useMemo(() => {
    const seen = new Map<string, { key: string; label: string; count: number }>();
    for (const e of allUpcoming) {
      const c = eventCategory(e.title);
      const prev = seen.get(c.key);
      if (prev) prev.count += 1;
      else seen.set(c.key, { key: c.key, label: c.label, count: 1 });
    }
    return [...seen.values()];
  }, [allUpcoming]);

  // Orte mit Zaehler (nur kommende Termine).
  const regions = useMemo(() => {
    const seen = new Map<string, number>();
    for (const e of allUpcoming) {
      const t = townOf(e.location);
      if (t) seen.set(t, (seen.get(t) ?? 0) + 1);
    }
    return [...seen.entries()].map(([name, count]) => ({ name, count }));
  }, [allUpcoming]);

  const upcoming = allUpcoming.filter(matches);
  const past = events
    .filter((e) => e.date < today && matches(e))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Kommende nach "Diese Woche / Nächste Woche / Später" gruppieren.
  const grouped = useMemo(() => {
    const buckets: CommunityEvent[][] = [[], [], []];
    for (const e of upcoming) buckets[weekBucket(e.date, today)].push(e);
    return buckets;
  }, [upcoming, today]);

  const renderCard = (event: CommunityEvent, idx: number) => {
    const mine = statusFor(records, currentMemberId, event.id);
    const signedUp = mine === 'yes' || mine === 'attended';
    const cat = eventCategory(event.title);
    const count = signupCount(records, event.id);
    return (
      <FadeSlide key={event.id} delay={idx * 55}>
        <Card style={s.card}>
          <View style={s.cardRow}>
            <DateBlock iso={event.date} />
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={s.title} numberOfLines={1}>
                {event.title}
              </Text>
              {event.location ? (
                <View style={s.metaRow}>
                  <MapPinIcon size={14} color={colors.mutedForeground} />
                  <Text style={s.meta}>{event.location}</Text>
                </View>
              ) : null}
              {event.notes ? (
                <View style={s.metaRow}>
                  <Text style={s.meta}>🕒 {event.notes}</Text>
                </View>
              ) : null}
              <View style={s.chipsRow}>
                <CategoryChip label={cat.label} />
                <Pill
                  label={`${count} dabei`}
                  tone={signedUp ? 'accent' : 'neutral'}
                  icon={<UsersIcon size={12} color={signedUp ? colors.accent : colors.secondary} />}
                />
              </View>
              <EventDuties duties={event.duties} />
            </View>
          </View>
          <Button
            label={signedUp ? 'Abmelden' : 'Anmelden'}
            variant={signedUp ? 'ghost' : 'primary'}
            tone={signedUp ? 'danger' : 'accent'}
            icon={signedUp ? undefined : <CheckIcon size={16} color={colors.accentForeground} />}
            onPress={() => onToggleSignup(currentMemberId, event.id)}
          />
        </Card>
      </FadeSlide>
    );
  };

  return (
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.h1}>Termine</Text>
      <Text style={s.sub}>Melde dich an — und sei dabei. Du bist willkommen, so wie du bist.</Text>

      {/* Filter nach Art (umbricht statt zu klippen) */}
      <Text style={s.filterGroupLabel}>Art</Text>
      <View style={s.filterRow}>
        <FilterChip
          label="Alle"
          count={allUpcoming.length}
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        {categories.map((c) => (
          <FilterChip
            key={c.key}
            label={c.label}
            count={c.count}
            active={filter === c.key}
            onPress={() => setFilter(c.key)}
          />
        ))}
      </View>

      {/* Filter nach Ort — nur wenn es ueberhaupt mehrere Orte gibt */}
      {regions.length > 1 ? (
        <>
          <Text style={s.filterGroupLabel}>Ort</Text>
          <View style={s.filterRow}>
            <FilterChip
              label="Alle Orte"
              count={allUpcoming.length}
              active={region === 'all'}
              onPress={() => setRegion('all')}
            />
            {regions.map((r) => (
              <FilterChip
                key={r.name}
                label={r.name}
                count={r.count}
                active={region === r.name}
                onPress={() => setRegion(r.name)}
              />
            ))}
          </View>
        </>
      ) : null}

      {upcoming.length === 0 ? (
        <EmptyState
          title="Keine kommenden Termine"
          body={
            filter === 'all' && region === 'all'
              ? 'Aktuell ist nichts geplant. Schau bald wieder vorbei.'
              : 'In dieser Auswahl ist gerade nichts geplant.'
          }
        />
      ) : (
        grouped.map((list, b) =>
          list.length === 0 ? null : (
            <View key={b} style={{ gap: spacing.sm }}>
              <SectionTitle>{`${WEEK_BUCKET_LABELS[b]} · ${list.length}`}</SectionTitle>
              {list.map((event, i) => renderCard(event, i))}
            </View>
          ),
        )
      )}

      {past.length > 0 ? (
        <>
          <View style={{ height: spacing.sm }} />
          <SectionTitle>Vergangene Termine</SectionTitle>
          <View style={{ gap: spacing.sm }}>
            {past.map((event) => {
              const mine = statusFor(records, currentMemberId, event.id);
              const cat = eventCategory(event.title);
              return (
                <Card key={event.id} style={[s.cardRow, s.pastCard]} elevated={false}>
                  <DateBlock iso={event.date} muted />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.title} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <CategoryChip label={cat.label} />
                  </View>
                  <ResultPill status={mine} />
                </Card>
              );
            })}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[s.filterChip, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}
    >
      <Text style={[s.filterChipText, active && s.filterChipTextActive]} numberOfLines={1}>
        {label}
      </Text>
      {typeof count === 'number' ? (
        <View style={[s.filterCount, active && s.filterCountActive]}>
          <Text style={[s.filterCountText, active && { color: colors.accent }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function DateBlock({ iso, muted }: { iso: string; muted?: boolean }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [, , d] = iso.split('-');
  const monthName = formatDate(iso).split(' ').pop();
  const weekday = formatDate(iso).split(',')[0];
  return (
    <View style={[s.dateBlock, muted && { backgroundColor: colors.surfaceAlt }]}>
      <Text style={[s.dateWeekday, muted && { color: colors.mutedForeground }]}>{weekday}</Text>
      <Text style={[s.dateDay, muted && { color: colors.secondary }]}>{Number(d)}</Text>
      <Text style={[s.dateMonth, muted && { color: colors.mutedForeground }]}>{monthName}</Text>
    </View>
  );
}

function ResultPill({ status }: { status?: string }) {
  if (status === 'attended') return <Pill label="+1 Punkt" tone="success" />;
  if (status === 'no') return <Pill label="Nicht da" tone="danger" />;
  if (status === 'yes') return <Pill label="Offen" tone="warning" />;
  return <Pill label="—" tone="neutral" />;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyBody}>{body}</Text>
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
    h1: { fontSize: 28, fontWeight: '800', color: colors.foreground },
    sub: { fontSize: 14, color: colors.secondary, marginBottom: spacing.sm, lineHeight: 20 },
    filterGroupLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mutedForeground,
      marginTop: spacing.xs,
      marginBottom: 6,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs + 2,
      paddingBottom: spacing.xs,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterChipText: { fontSize: 13, fontWeight: '700', color: colors.secondary },
    filterChipTextActive: { color: '#FFFFFF' },
    filterCount: {
      minWidth: 20,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
    },
    filterCountActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
    filterCountText: { fontSize: 11, fontWeight: '800', color: colors.mutedForeground },

    card: { gap: spacing.md },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    pastCard: { opacity: 0.9 },
    title: { fontSize: 16, fontWeight: '700', color: colors.foreground },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    meta: { fontSize: 13, color: colors.mutedForeground, fontWeight: '600' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },

    dateBlock: {
      width: 54,
      height: 60,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentSoft,
    },
    dateWeekday: {
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      color: colors.accent,
    },
    dateDay: { fontSize: 20, fontWeight: '800', lineHeight: 24, color: colors.accent },
    dateMonth: {
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      color: colors.accent,
    },

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
