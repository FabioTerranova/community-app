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
}

/** Ein Termin / eine Zusammenkunft. */
export interface CommunityEvent {
  id: string;
  title: string;
  /** ISO-Datum, z.B. "2026-09-15" oder voller Zeitstempel. */
  date: string;
  location?: string;
  notes?: string;
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

/** Eine an die Community verschickte Nachricht. */
export interface NewsItem {
  id: string;
  subject: string;
  body: string;
  sentAt?: string;
  /** Empfaengergruppe; leer = alle aktiven Mitglieder. */
  audience?: string;
}
