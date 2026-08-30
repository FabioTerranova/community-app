/**
 * Reine (design-freie) Auswertungs-Logik rund um Anwesenheit.
 * Deterministisch und ohne Seiteneffekte -> spaeter leicht testbar und in Screens nutzbar.
 */
import type { AttendanceRecord, CommunityEvent, Member } from '../types';

/** Wie oft ist ein Mitglied tatsaechlich gekommen (status === 'attended'). */
export function attendanceCount(records: AttendanceRecord[], memberId: string): number {
  return records.filter((r) => r.memberId === memberId && r.status === 'attended').length;
}

/** Anwesenheits-Zaehler je Mitglied als Map<memberId, Anzahl>. */
export function attendanceByMember(records: AttendanceRecord[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of records) {
    if (r.status !== 'attended') continue;
    counts.set(r.memberId, (counts.get(r.memberId) ?? 0) + 1);
  }
  return counts;
}

/** Alle Zu-/Absagen zu einem Termin. */
export function recordsForEvent(records: AttendanceRecord[], eventId: string): AttendanceRecord[] {
  return records.filter((r) => r.eventId === eventId);
}

/** Wer hat fuer einen Termin zugesagt (status 'yes' oder bereits 'attended')? */
export function attendeesForEvent(
  records: AttendanceRecord[],
  members: Member[],
  eventId: string,
): Member[] {
  const ids = new Set(
    records
      .filter((r) => r.eventId === eventId && (r.status === 'yes' || r.status === 'attended'))
      .map((r) => r.memberId),
  );
  return members.filter((m) => ids.has(m.id));
}

/** Kommende Termine (Datum >= Stichtag), aufsteigend sortiert. */
export function upcomingEvents(events: CommunityEvent[], nowIso: string): CommunityEvent[] {
  return events
    .filter((e) => e.date >= nowIso)
    .sort((a, b) => a.date.localeCompare(b.date));
}
