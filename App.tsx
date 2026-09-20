import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_MAX_WIDTH, radius, spacing, type Palette } from './src/theme';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import type { AttendanceRecord, DailyVerse } from './src/types';
import {
  attendance as initialAttendance,
  CURRENT_IS_ADMIN,
  CURRENT_MEMBER_ID,
  events,
  members,
  TODAY,
  verseOfDay,
} from './src/data/mock';
import { getDailyVerse } from './src/logic/api';
import { disablePushForEvent, enablePushForEvent, isPushSupported } from './src/logic/push';
import { useWebFont } from './src/useWebFont';
import { TabBar, type TabDef, type TabKey } from './src/components/TabBar';
import { AmbientBackground } from './src/components/AmbientBackground';
import { Intro } from './src/components/Intro';
import { DoveMark, MoonIcon, SunIcon } from './src/components/icons';
import { HomeScreen, type ScreenData } from './src/screens/HomeScreen';
import { EventsScreen } from './src/screens/EventsScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { AdminScreen } from './src/screens/AdminScreen';

/**
 * App-Einstieg — Punkte-/Anwesenheits-System (Mockup mit Beispieldaten).
 *
 * Kleine State-Machine (kein Router): `tab` steuert den Screen. Beim Start laeuft
 * ein kurzes Intro (Wortmarke). Hell/Dunkel via ThemeProvider. Der Anwesenheits-
 * Zustand lebt zentral, damit Aktionen sich sofort ueberall auswirken.
 */
export default function App() {
  return (
    <ThemeProvider initial="light">
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner() {
  const { colors, mode, toggle } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const fontReady = useWebFont();

  const [showIntro, setShowIntro] = useState(true);
  const [tab, setTab] = useState<TabKey>('home');
  const [records, setRecords] = useState<AttendanceRecord[]>(initialAttendance);

  // Emoji-Avatare (memberId -> Emoji), Start aus den Mitglieds-Daten.
  const [avatars, setAvatars] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const m of members) if (m.emoji) map[m.id] = m.emoji;
    return map;
  });
  function setAvatar(emoji: string) {
    setAvatars((prev) => ({ ...prev, [CURRENT_MEMBER_ID]: emoji }));
  }

  // Vers des Tages: Platzhalter -> live aus api/verse. Nur uebernehmen, wenn ein
  // echter Vers zurueckkam (in der reinen Web-Vorschau ohne Backend bleibt der Platzhalter).
  const [verse, setVerse] = useState<DailyVerse>(verseOfDay);
  useEffect(() => {
    let alive = true;
    getDailyVerse()
      .then((v) => {
        if (alive && v && v.text) setVerse(v);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Termine mit aktiver Erinnerung (nur aktueller Nutzer). Beim Einschalten wird ein
  // Web-Push-Abo angelegt; der Server schickt dann ~2h vor Beginn ein Popup aufs Handy.
  const [reminders, setReminders] = useState<string[]>([]);
  function toggleReminder(eventId: string) {
    const turningOn = !reminders.includes(eventId);
    // UI sofort umschalten (optimistisch).
    setReminders((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId],
    );

    if (!isPushSupported()) return; // native App / Browser ohne Push-Unterstuetzung

    const ev = events.find((e) => e.id === eventId);
    const me = members.find((m) => m.id === CURRENT_MEMBER_ID);
    const info = {
      memberId: CURRENT_MEMBER_ID,
      memberName: me?.name,
      eventId,
      eventTitle: ev?.title,
      eventDate: ev?.date,
    };

    if (turningOn) {
      enablePushForEvent(info).catch((err) => {
        // Erlaubnis verweigert / Backend nicht erreichbar -> Schalter zuruecksetzen.
        setReminders((prev) => prev.filter((e) => e !== eventId));
        if (typeof window !== 'undefined') {
          window.alert?.(`Erinnerung nicht aktiviert: ${err?.message ?? err}`);
        }
      });
    } else {
      disablePushForEvent(info);
    }
  }

  // Mitglied meldet sich selbst an/ab (nur bei kommenden Terminen sinnvoll).
  function toggleSignup(memberId: string, eventId: string) {
    setRecords((prev) => {
      const existing = prev.find((r) => r.memberId === memberId && r.eventId === eventId);
      if (existing && (existing.status === 'yes' || existing.status === 'attended')) {
        return prev.filter((r) => r !== existing); // abmelden
      }
      if (existing) {
        return prev.map((r) => (r === existing ? { ...r, status: 'yes' } : r));
      }
      return [...prev, { id: `${memberId}__${eventId}`, memberId, eventId, status: 'yes' }];
    });
  }

  // Admin setzt fuer einen (vergangenen) Termin, ob jemand da war -> vergibt/entzieht Punkt.
  function setStatus(memberId: string, eventId: string, status: AttendanceRecord['status']) {
    setRecords((prev) => {
      const existing = prev.find((r) => r.memberId === memberId && r.eventId === eventId);
      if (existing) return prev.map((r) => (r === existing ? { ...r, status } : r));
      return [...prev, { id: `${memberId}__${eventId}`, memberId, eventId, status }];
    });
  }

  const data: ScreenData = {
    members,
    events,
    records,
    currentMemberId: CURRENT_MEMBER_ID,
    today: TODAY,
    onToggleSignup: toggleSignup,
    onSetStatus: setStatus,
    avatars,
    onSetAvatar: setAvatar,
    reminders,
    onToggleReminder: toggleReminder,
    verse,
  };

  const tabs: TabDef[] = [
    { key: 'home', label: 'Start' },
    { key: 'events', label: 'Termine' },
    { key: 'leaderboard', label: 'Rangliste' },
    ...(CURRENT_IS_ADMIN ? [{ key: 'admin' as TabKey, label: 'Admin' }] : []),
  ];

  // Warten bis die Web-Schrift bereit ist -> kein Flackern von System- zu App-Schrift.
  if (!fontReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    // Backdrop fuellt am PC den Rest; die App selbst bleibt eine zentrierte, schmale Spalte.
    <SafeAreaView style={s.backdrop}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <View style={s.frame}>
        {/* Sanfter Verlauf-Hintergrund (statt Vollton). */}
        <LinearGradient
          colors={colors.bgGradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Dezente, langsam driftende Formen fuer Tiefe. */}
        <AmbientBackground />

        {/* Kopfzeile: Marke links, Hell/Dunkel-Umschalter rechts. */}
        <View style={s.header}>
          <View style={s.brandRow}>
            <View style={s.brandMark}>
              <DoveMark size={22} color={colors.accent} />
            </View>
            <View>
              <Text style={s.brand}>JUHA</Text>
              <Text style={s.brandSub}>Jugendgruppe</Text>
            </View>
          </View>
          <Pressable onPress={toggle} style={s.themeToggle}>
            {mode === 'dark' ? (
              <SunIcon size={20} color={colors.foreground} />
            ) : (
              <MoonIcon size={20} color={colors.foreground} />
            )}
          </Pressable>
        </View>

        <View style={s.body}>
          {tab === 'home' && <HomeScreen {...data} />}
          {tab === 'events' && <EventsScreen {...data} />}
          {tab === 'leaderboard' && <LeaderboardScreen {...data} />}
          {tab === 'admin' && <AdminScreen {...data} />}
        </View>

        <TabBar tabs={tabs} active={tab} onChange={setTab} />

        {/* Intro liegt zuoberst und blendet sich selbst aus. */}
        {showIntro ? <Intro onDone={() => setShowIntro(false)} /> : null}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: colors.backdrop, alignItems: 'center' },
    // App-Rahmen: am Handy volle Breite, am PC auf App-Breite begrenzt und zentriert.
    frame: {
      flex: 1,
      width: '100%',
      maxWidth: APP_MAX_WIDTH,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    body: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    brandMark: {
      width: 38,
      height: 38,
      borderRadius: radius.md,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: { fontSize: 17, fontWeight: '800', color: colors.foreground, letterSpacing: 0.2 },
    brandSub: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginTop: 1 },
    themeToggle: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
