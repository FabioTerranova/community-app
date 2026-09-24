import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_MAX_WIDTH, radius, spacing, type Palette } from './src/theme';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import type { AttendanceRecord, CommunityEvent, DailyVerse, Member } from './src/types';
import { verseOfDay } from './src/data/mock';
import {
  createEvent as apiCreateEvent,
  getAttendance,
  getDailyVerse,
  getEvents,
  getMembers,
  setAttendance as apiSetAttendance,
} from './src/logic/api';
import { disablePushForEvent, enablePushForEvent, isPushSupported } from './src/logic/push';
import { logout, restoreSession, type AuthMember } from './src/logic/auth';
import { LoginScreen } from './src/screens/LoginScreen';
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
 * App-Einstieg — Punkte-/Anwesenheits-System mit LIVE-Daten aus Notion.
 *
 * Kleine State-Machine (kein Router): `tab` steuert den Screen. Beim Start laeuft
 * ein kurzes Intro (Wortmarke). Hell/Dunkel via ThemeProvider. Nach dem Login
 * werden Mitglieder/Termine/Anwesenheiten aus Notion geladen; An-/Abmelden und
 * Admin-Bestaetigungen werden direkt zurueck nach Notion gespeichert.
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

  // Live-Daten aus Notion (via src/logic/api). Start leer, wird nach Login geladen.
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Emoji-Avatare (memberId -> Emoji); wird aus den geladenen Mitgliedern befuellt.
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  // "Heute" real (YYYY-MM-DD) -> steuert Vergangenheit/Zukunft der Termine.
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // --- Login (Code per E-Mail) ---
  const [authMember, setAuthMember] = useState<AuthMember | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const currentMemberId = authMember?.id ?? '';
  const isAdmin = !!authMember?.admin;

  // Eingeloggtes Mitglied in die lokale Mitgliederliste uebernehmen.
  function mergeMember(m: AuthMember) {
    const asMember: Member = {
      id: m.id,
      name: m.name,
      email: m.email,
      active: m.active,
      emoji: m.emoji,
    };
    setMembers((prev) =>
      prev.some((x) => x.id === m.id)
        ? prev.map((x) => (x.id === m.id ? { ...x, ...asMember } : x))
        : [...prev, asMember],
    );
    if (m.emoji) setAvatars((prev) => ({ ...prev, [m.id]: m.emoji as string }));
  }

  function handleLogout() {
    logout();
    setAuthMember(null);
    setTab('home');
  }

  function setAvatar(emoji: string) {
    if (currentMemberId) setAvatars((prev) => ({ ...prev, [currentMemberId]: emoji }));
  }

  // Eingeloggtes Mitglied uebernehmen (aus dem Login-Screen nach Code-Eingabe).
  function handleAuthenticated(m: AuthMember) {
    setAuthMember(m);
    mergeMember(m);
  }

  // Beim Start: bestehende Session pruefen (Login selbst laeuft per Code im Login-Screen).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await restoreSession();
        if (alive && m) {
          setAuthMember(m);
          mergeMember(m);
        }
      } catch (e: any) {
        if (alive) setAuthError(e?.message || 'Anmeldung fehlgeschlagen.');
      } finally {
        if (alive) setAuthChecked(true);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nach Login: echte Daten aus Notion laden (Mitglieder, Termine, Anwesenheiten).
  useEffect(() => {
    if (!authMember) return;
    let alive = true;
    (async () => {
      try {
        const [ms, es, rs] = await Promise.all([getMembers(), getEvents(), getAttendance()]);
        if (!alive) return;
        setMembers(ms);
        setEvents(es);
        setRecords(rs);
        setAvatars((prev) => {
          const map = { ...prev };
          for (const m of ms) if (m.emoji) map[m.id] = m.emoji;
          return map;
        });
      } catch (e: any) {
        if (alive) setAuthError(e?.message || 'Daten konnten nicht geladen werden.');
      } finally {
        if (alive) setDataLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMember]);

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

  // Mitglied meldet sich selbst an/ab (nur bei kommenden Terminen sinnvoll).
  // Die Push-Erinnerung haengt direkt an der Anmeldung: anmelden -> Abo anlegen
  // (Server schickt ~2h vor Beginn ein Popup), abmelden -> Abo entfernen.
  function toggleSignup(memberId: string, eventId: string) {
    // Aktuell angemeldet? Dann ist dieser Klick ein Abmelden.
    const isSignedUp = records.some(
      (r) =>
        r.memberId === memberId &&
        r.eventId === eventId &&
        (r.status === 'yes' || r.status === 'attended'),
    );
    // Kein Loeschen im Notion-Upsert -> Abmelden = Status 'no' (zaehlt nicht als Zusage).
    const newStatus: AttendanceRecord['status'] = isSignedUp ? 'no' : 'yes';
    const me = members.find((m) => m.id === memberId);
    const ev = events.find((e) => e.id === eventId);

    // Optimistisch lokal setzen ...
    const prevRecords = records;
    setRecords((prev) => {
      const existing = prev.find((r) => r.memberId === memberId && r.eventId === eventId);
      if (existing) return prev.map((r) => (r === existing ? { ...r, status: newStatus } : r));
      return [...prev, { id: `${memberId}__${eventId}`, memberId, eventId, status: newStatus }];
    });
    // ... und in Notion speichern (bei Fehler zuruecksetzen).
    apiSetAttendance({
      memberId,
      eventId,
      status: newStatus,
      memberName: me?.name,
      eventTitle: ev?.title,
    })
      .then((rec) =>
        setRecords((prev) =>
          prev.map((r) => (r.memberId === memberId && r.eventId === eventId ? rec : r)),
        ),
      )
      .catch(() => {
        setRecords(prevRecords);
        if (typeof window !== 'undefined') {
          window.alert('Konnte nicht gespeichert werden. Bitte erneut versuchen.');
        }
      });

    // Push nur fuers eigene Geraet und nur im Web/PWA-Kontext.
    if (memberId !== currentMemberId || !isPushSupported()) return;
    const info = {
      memberId,
      memberName: me?.name,
      eventId,
      eventTitle: ev?.title,
      eventDate: ev?.date,
    };
    if (!isSignedUp) {
      // gerade angemeldet -> Erinnerung aktivieren (fragt beim 1. Mal nach Erlaubnis)
      enablePushForEvent(info).catch(() => {
        /* Erlaubnis verweigert / offline — Anmeldung bleibt trotzdem bestehen */
      });
    } else {
      // gerade abgemeldet -> Erinnerung entfernen
      disablePushForEvent(info);
    }
  }

  // Admin setzt fuer einen (vergangenen) Termin, ob jemand da war -> vergibt/entzieht Punkt.
  function setStatus(memberId: string, eventId: string, status: AttendanceRecord['status']) {
    const prevRecords = records;
    const me = members.find((m) => m.id === memberId);
    const ev = events.find((e) => e.id === eventId);
    setRecords((prev) => {
      const existing = prev.find((r) => r.memberId === memberId && r.eventId === eventId);
      if (existing) return prev.map((r) => (r === existing ? { ...r, status } : r));
      return [...prev, { id: `${memberId}__${eventId}`, memberId, eventId, status }];
    });
    apiSetAttendance({ memberId, eventId, status, memberName: me?.name, eventTitle: ev?.title })
      .then((rec) =>
        setRecords((prev) =>
          prev.map((r) => (r.memberId === memberId && r.eventId === eventId ? rec : r)),
        ),
      )
      .catch(() => {
        setRecords(prevRecords);
        if (typeof window !== 'undefined') window.alert('Konnte nicht gespeichert werden.');
      });
  }

  // Admin legt einen neuen Termin an -> in Notion speichern, lokal einsortieren.
  async function createEvent(input: {
    title: string;
    date: string;
    location?: string;
    vorbereitung?: string;
    snacks?: string;
  }) {
    const ev = await apiCreateEvent(input);
    setEvents((prev) => [...prev, ev].sort((a, b) => a.date.localeCompare(b.date)));
  }

  const data: ScreenData = {
    members,
    events,
    records,
    currentMemberId,
    today,
    onToggleSignup: toggleSignup,
    onSetStatus: setStatus,
    onCreateEvent: createEvent,
    avatars,
    onSetAvatar: setAvatar,
    verse,
  };

  const tabs: TabDef[] = [
    { key: 'home', label: 'Start' },
    { key: 'events', label: 'Termine' },
    { key: 'leaderboard', label: 'Rangliste' },
    ...(isAdmin ? [{ key: 'admin' as TabKey, label: 'Admin' }] : []),
  ];

  // Warten bis Web-Schrift bereit UND Login geprueft ist -> kein Flackern.
  if (!fontReady || !authChecked) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  // Nicht eingeloggt -> Login-Screen (Code per E-Mail).
  if (!authMember) {
    return <LoginScreen initialError={authError} onAuthenticated={handleAuthenticated} />;
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
          <View style={s.headerActions}>
            <Pressable
              onPress={handleLogout}
              style={s.logoutBtn}
              accessibilityRole="button"
              accessibilityLabel="Abmelden"
            >
              <Text style={s.logoutText}>Abmelden</Text>
            </Pressable>
            <Pressable onPress={toggle} style={s.themeToggle}>
              {mode === 'dark' ? (
                <SunIcon size={20} color={colors.foreground} />
              ) : (
                <MoonIcon size={20} color={colors.foreground} />
              )}
            </Pressable>
          </View>
        </View>

        <View style={s.body}>
          {!dataLoaded ? (
            <View style={s.loading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <>
              {tab === 'home' && <HomeScreen {...data} />}
              {tab === 'events' && <EventsScreen {...data} />}
              {tab === 'leaderboard' && <LeaderboardScreen {...data} />}
              {tab === 'admin' && <AdminScreen {...data} />}
            </>
          )}
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
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    logoutBtn: {
      height: 40,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutText: { fontSize: 13, fontWeight: '700', color: colors.secondary },
  });
}
