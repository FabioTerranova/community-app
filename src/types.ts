/**
 * Domaenen-Modell der Community-App (geteilt zwischen App-Frontend und api/-Functions).
 *
 * Fachlicher Kern (aus Fabios Beschreibung):
 *  - Wer kommt an welchen Terminen?           -> Event + Attendance(status)
 *  - Wie oft ist jemand gekommen?              -> Attendance(status='attended') zaehlen
 *  - Eintragen / anmelden                      -> Attendance anlegen/aktualisieren
 *  - In der App unterschreiben                 -> Attendance.signature (pdf-lib)
 *  - News versenden                            -> NewsItem (Resend)
 */

/** Ein Mitglied der Gemeinschaft. */
export interface Member {
  id: string;
  name: string;
  email?: string;
  active?: boolean;
  /** Selbst gewaehltes Avatar-Emoji (Spass-Faktor); faellt sonst auf Initialen zurueck. */
  emoji?: string;
}

/**
 * Ein Dienst/eine Einteilung an einem Termin, z.B. „Einstieg" oder „Snacks".
 * Bewusst generisch (Rolle + Personen), damit spaeter beliebige Rollen dazukommen
 * koennen (Technik, Lobpreis, Aufraeumen …) ohne Datenmodell-Aenderung.
 */
export interface EventDuty {
  /** Bezeichnung des Dienstes, z.B. "Einstieg" / "Snacks". */
  role: string;
  /** Eingeteilte Personen (Namen; spaeter ggf. Member-IDs). */
  people: string[];
}

/** Ein Termin / eine Zusammenkunft. */
export interface CommunityEvent {
  id: string;
  title: string;
  /** ISO-Datum, z.B. "2026-09-15" oder voller Zeitstempel. */
  date: string;
  location?: string;
  notes?: string;
  /** Einteilungen/Dienste fuer diesen Termin (optional). */
  duties?: EventDuty[];
}

/** Zu-/Absage bzw. tatsaechliche Teilnahme eines Mitglieds an einem Termin. */
export type AttendanceStatus = 'yes' | 'no' | 'maybe' | 'attended';

export interface AttendanceRecord {
  id: string;
  memberId: string;
  eventId: string;
  status: AttendanceStatus;
  /** Zeitpunkt der Unterschrift (falls unterschrieben). */
  signedAt?: string;
  /** Referenz auf das gespeicherte Unterschrift-/Bestaetigungs-PDF (spaeter). */
  signatureRef?: string;
}

/**
 * "Vers des Tages" (Herrnhuter Tageslosung). Kommt live aus `api/verse.ts`
 * (offizielle Losungen-XML), faellt im Mockup/offline auf einen Platzhalter zurueck.
 */
export interface DailyVerse {
  /** Losungstext (Altes Testament) — der eigentliche Tagesvers. */
  text: string;
  /** Bibelstelle zum Losungstext, z.B. "Jesaja 25,8". */
  reference: string;
  /** Uebersetzung/Quelle, z.B. "Losung" (Luther). */
  translation: string;
  /** Datum, auf das sich der Vers bezieht (YYYY-MM-DD). */
  date?: string;
  /** Lehrtext (Neues Testament) — der zweite Teil der Tageslosung. */
  lehrtext?: string;
  /** Bibelstelle zum Lehrtext. */
  lehrtextReference?: string;
}

/** Eine an die Community verschickte Nachricht. */
export interface NewsItem {
  id: string;
  subject: string;
  body: string;
  sentAt?: string;
  /** Empfaengergruppe; leer = alle aktiven Mitglieder. */
  audience?: string;
}
