/**
 * Beispieldaten NUR fuer den klickbaren Mockup (kein echtes Backend).
 *
 * Sobald Login + Notion angebunden sind, kommen dieselben Strukturen aus `src/logic/api.ts`.
 * Bis dahin lebt der Zustand in App.tsx (useState) und diese Daten sind der Startpunkt.
 */
import type { AttendanceRecord, CommunityEvent, DailyVerse, Member } from '../types';

/** Fixer "Heute"-Stichtag, damit der Mockup stabil Vergangenheit/Zukunft zeigt. */
export const TODAY = '2026-08-31';

/** Als wer man im Mockup eingeloggt ist. */
export const CURRENT_MEMBER_ID = 'm_fabio';
/** Ob der aktuelle Nutzer die Admin-Ansicht sehen darf (spaeter: Flag am Notion-Mitglied). */
export const CURRENT_IS_ADMIN = true;

/**
 * "Vers des Tages" — Start-/Fallback-Wert. Live kommt der echte Tagesvers aus
 * `api/verse.ts` (Herrnhuter Losungen) via `getDailyVerse()`. Dieser Platzhalter
 * wird angezeigt, solange geladen wird bzw. offline (z.B. im reinen Web-Mockup).
 */
export const verseOfDay: DailyVerse = {
  text: 'Denn ich weiß wohl, was ich für Gedanken über euch habe, spricht der HERR: Gedanken des Friedens und nicht des Leides, dass ich euch gebe Zukunft und Hoffnung.',
  reference: 'Jeremia 29,11',
  translation: 'Losung',
  lehrtext:
    'Der Gott der Hoffnung aber erfülle euch mit aller Freude und Frieden im Glauben, dass ihr immer reicher werdet an Hoffnung durch die Kraft des Heiligen Geistes.',
  lehrtextReference: 'Römer 15,13',
};

export const members: Member[] = [
  { id: 'm_fabio', name: 'Fabio T.', email: 'fabio@example.com', active: true, emoji: '🕊️' },
  { id: 'm_anna', name: 'Anna B.', email: 'anna@example.com', active: true, emoji: '❤️' },
  { id: 'm_ben', name: 'Ben K.', email: 'ben@example.com', active: true, emoji: '✝️' },
  { id: 'm_clara', name: 'Clara M.', email: 'clara@example.com', active: true, emoji: '🌻' },
  { id: 'm_david', name: 'David R.', email: 'david@example.com', active: true, emoji: '🎸' },
  { id: 'm_emma', name: 'Emma S.', email: 'emma@example.com', active: true, emoji: '🌟' },
];

/** Auswaehlbare Avatar-Emojis (spaeter beim Login pro Person waehlbar). */
export const EMOJI_CHOICES = [
  '🕊️', '✝️', '❤️', '🙏', '🌟', '🌻', '🔥', '🎸', '🎶', '☀️', '🌈', '😊',
];

export const events: CommunityEvent[] = [
  // — Vergangene Woche 1 —
  { id: 'e_0819', title: 'Jugendgruppe', date: '2026-08-19', location: 'Bozen · Jugendraum' },
  { id: 'e_0823', title: 'Gottesdienst', date: '2026-08-23', location: 'Bozen · JUHA Hauptsaal' },
  // — Vergangene Woche 2 (So offen fuer Admin) —
  { id: 'e_0826', title: 'Jugendgruppe', date: '2026-08-26', location: 'Bozen · Jugendraum' },
  { id: 'e_0830', title: 'Gottesdienst', date: '2026-08-30', location: 'Bozen · JUHA Hauptsaal' },
  // — Aktuelle/kommende Woche (Anmeldung offen) —
  { id: 'e_0902', title: 'Jugendgruppe', date: '2026-09-02', location: 'Bozen · Jugendraum' },
  { id: 'e_0906', title: 'Gottesdienst', date: '2026-09-06', location: 'Bozen · JUHA Hauptsaal' },
  // — Jugendgruppe Schlanders (Beispiel-Dienstplan; PLATZHALTER-Namen, echte Daten
  //   kommen spaeter aus Notion — keine echten Namen ins oeffentliche Repo!) —
  {
    id: 'e_1002',
    title: 'Jugendgruppe',
    date: '2026-10-02',
    location: 'Schlanders · Jugendraum',
    duties: [
      { role: 'Einstieg', people: ['Lukas M.', 'Sara B.'] },
      { role: 'Snacks', people: ['Mia T.', 'Jonas R.'] },
    ],
  },
  {
    id: 'e_1009',
    title: 'Jugendgruppe',
    date: '2026-10-09',
    location: 'Schlanders · Jugendraum',
    duties: [
      { role: 'Einstieg', people: ['Elias K.', 'Lena P.'] },
      { role: 'Snacks', people: ['Nina S.', 'David F.'] },
    ],
  },
];

/**
 * Start-Anwesenheiten. 'attended' = war da (+1 Punkt), 'no' = angemeldet, nicht gekommen (0),
 * 'yes' = angemeldet (bei vergangenem Termin e_0826 = vom Admin noch zu bestaetigen).
 */
export const attendance: AttendanceRecord[] = [
  // Woche 1 — abgeschlossen
  { id: 'a1', memberId: 'm_fabio', eventId: 'e_0817', status: 'attended' },
  { id: 'a2', memberId: 'm_fabio', eventId: 'e_0818', status: 'no' }, // angemeldet, aber nicht da -> kein Punkt
  { id: 'a3', memberId: 'm_fabio', eventId: 'e_0819', status: 'attended' },
  { id: 'a4', memberId: 'm_anna', eventId: 'e_0817', status: 'attended' },
  { id: 'a5', memberId: 'm_anna', eventId: 'e_0818', status: 'attended' },
  { id: 'a6', memberId: 'm_anna', eventId: 'e_0819', status: 'attended' },
  { id: 'a7', memberId: 'm_ben', eventId: 'e_0817', status: 'attended' },
  { id: 'a8', memberId: 'm_ben', eventId: 'e_0819', status: 'attended' },
  { id: 'a9', memberId: 'm_clara', eventId: 'e_0818', status: 'attended' },
  { id: 'a10', memberId: 'm_clara', eventId: 'e_0819', status: 'attended' },
  { id: 'a11', memberId: 'm_david', eventId: 'e_0817', status: 'attended' },
  { id: 'a12', memberId: 'm_emma', eventId: 'e_0819', status: 'attended' },

  // Woche 2 — Mo/Di bestaetigt
  { id: 'a13', memberId: 'm_fabio', eventId: 'e_0824', status: 'attended' },
  { id: 'a14', memberId: 'm_fabio', eventId: 'e_0825', status: 'attended' },
  { id: 'a15', memberId: 'm_anna', eventId: 'e_0824', status: 'attended' },
  { id: 'a16', memberId: 'm_anna', eventId: 'e_0825', status: 'attended' },
  { id: 'a17', memberId: 'm_clara', eventId: 'e_0824', status: 'attended' },
  { id: 'a18', memberId: 'm_ben', eventId: 'e_0825', status: 'attended' },
  { id: 'a19', memberId: 'm_david', eventId: 'e_0825', status: 'attended' },

  // Woche 2 — Mi (e_0826) VERGANGEN, teils noch nicht vom Admin bestaetigt
  { id: 'a20', memberId: 'm_fabio', eventId: 'e_0826', status: 'attended' },
  { id: 'a21', memberId: 'm_anna', eventId: 'e_0826', status: 'yes' },
  { id: 'a22', memberId: 'm_clara', eventId: 'e_0826', status: 'yes' },
  { id: 'a23', memberId: 'm_emma', eventId: 'e_0826', status: 'yes' },

  // Gottesdienst So 23.08 — bestaetigt
  { id: 'a27', memberId: 'm_fabio', eventId: 'e_0823', status: 'attended' },
  { id: 'a28', memberId: 'm_anna', eventId: 'e_0823', status: 'attended' },
  { id: 'a29', memberId: 'm_clara', eventId: 'e_0823', status: 'attended' },
  { id: 'a30', memberId: 'm_david', eventId: 'e_0823', status: 'attended' },

  // Gottesdienst So 30.08 — VERGANGEN, teils noch offen (Admin bestaetigt nach dem Gottesdienst)
  { id: 'a31', memberId: 'm_fabio', eventId: 'e_0830', status: 'attended' },
  { id: 'a32', memberId: 'm_david', eventId: 'e_0830', status: 'attended' },
  { id: 'a33', memberId: 'm_anna', eventId: 'e_0830', status: 'yes' },
  { id: 'a34', memberId: 'm_ben', eventId: 'e_0830', status: 'yes' },
  { id: 'a35', memberId: 'm_clara', eventId: 'e_0830', status: 'yes' },
  { id: 'a36', memberId: 'm_emma', eventId: 'e_0830', status: 'yes' },

  // Kommende Woche — bereits angemeldet (status 'yes')
  { id: 'a24', memberId: 'm_fabio', eventId: 'e_0831', status: 'yes' },
  { id: 'a25', memberId: 'm_anna', eventId: 'e_0831', status: 'yes' },
  { id: 'a26', memberId: 'm_ben', eventId: 'e_0901', status: 'yes' },
  { id: 'a37', memberId: 'm_fabio', eventId: 'e_0906', status: 'yes' },
  { id: 'a38', memberId: 'm_anna', eventId: 'e_0906', status: 'yes' },
  { id: 'a39', memberId: 'm_clara', eventId: 'e_0906', status: 'yes' },
];
