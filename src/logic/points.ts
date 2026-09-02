/**
 * Reine Auswertungs-Logik fuer das Punkte-/Motivations-System.
 *
 * Grundregel (aus Fabios Beschreibung):
 *  - Angemeldet + tatsaechlich da  -> +1 Punkt   (AttendanceRecord.status === 'attended')
 *  - Nicht angemeldet              ->  0 Punkte
 *  - Angemeldet, aber nicht da     ->  0 Punkte  (Admin markiert -> status !== 'attended')
 *
 * Wichtig: Punkte werden IMMER berechnet, nie fest gespeichert -> keine Abweichungen.
 */
import type { AttendanceRecord, CommunityEvent, Member } from '../types';
import { attendanceCount } from './attendance';

/** Punkte eines Mitglieds = Anzahl tatsaechlicher Teilnahmen. */
export function memberPoints(records: AttendanceRecord[], memberId: string): number {
  return attendanceCount(records, memberId);
}

export interface LeaderboardRow {
  member: Member;
  points: number;
  rank: number;
}

/** Rangliste: nach Punkten absteigend, bei Gleichstand alphabetisch. Gleiche Punkte = gleicher Rang. */
export function leaderboard(members: Member[], records: AttendanceRecord[]): LeaderboardRow[] {
  const scored = members
    .map((member) => ({ member, points: memberPoints(records, member.id) }))
    .sort((a, b) => b.points - a.points || a.member.name.localeCompare(b.member.name));

  let lastPoints = Number.POSITIVE_INFINITY;
  let lastRank = 0;
  return scored.map((row, index) => {
    const rank = row.points === lastPoints ? lastRank : index + 1;
    lastPoints = row.points;
    lastRank = rank;
    return { ...row, rank };
  });
}

/**
 * Aktuelle Serie: wie viele der zuletzt besuchten Termine (chronologisch, bis heute)
 * in Folge mit 'attended' abgeschlossen wurden. Bricht beim ersten Nicht-Erscheinen ab.
 */
export function currentStreak(
  records: AttendanceRecord[],
  events: CommunityEvent[],
  memberId: string,
  todayIso: string,
): number {
  const statusByEvent = new Map(
    records.filter((r) => r.memberId === memberId).map((r) => [r.eventId, r.status]),
  );
  const pastForMember = events
    .filter((e) => e.date < todayIso && statusByEvent.has(e.id)) // nur echte Vergangenheit
    .sort((a, b) => b.date.localeCompare(a.date)); // neueste zuerst

  let streak = 0;
  for (const event of pastForMember) {
    if (statusByEvent.get(event.id) === 'attended') streak += 1;
    else break;
  }
  return streak;
}

export interface Milestone {
  key: string;
  label: string;
  at: number;
  reached: boolean;
}

/** Meilensteine nach Teilnahmen — bewusst reife Benennung (kein Spiel-Jargon). */
export const MILESTONES: Array<{ key: string; label: string; at: number }> = [
  { key: 'welcome', label: 'Willkommen', at: 1 },
  { key: 'regular', label: 'Regelmäßig', at: 10 },
  { key: 'reliable', label: 'Verlässlich', at: 25 },
  { key: 'pillar', label: 'Tragende Säule', at: 50 },
];

export function milestonesFor(points: number): Milestone[] {
  return MILESTONES.map((m) => ({ ...m, reached: points >= m.at }));
}

export interface MilestoneProgress {
  reachedCount: number;
  total: number;
  /** Aktuell hoechster erreichter Meilenstein (falls vorhanden). */
  current?: Milestone;
  /** Naechster Meilenstein (falls noch offen). */
  next?: Milestone;
  /** Wie viele Teilnahmen fehlen bis zum naechsten (0 wenn alle erreicht). */
  toNext: number;
  /** Fortschritt zum naechsten Meilenstein als 0..1 (1 wenn alle erreicht). */
  ratio: number;
}

/** Fortschritt in Richtung naechster Meilenstein (fuer eine ruhige Fortschritts-Anzeige). */
export function milestoneProgress(points: number): MilestoneProgress {
  const all = milestonesFor(points);
  const reached = all.filter((m) => m.reached);
  const current = reached[reached.length - 1];
  const next = all.find((m) => !m.reached);
  if (!next) {
    return { reachedCount: reached.length, total: all.length, current, toNext: 0, ratio: 1 };
  }
  const prevAt = current?.at ?? 0;
  const ratio = Math.max(0, Math.min(1, (points - prevAt) / (next.at - prevAt)));
  return {
    reachedCount: reached.length,
    total: all.length,
    current,
    next,
    toNext: Math.max(0, next.at - points),
    ratio,
  };
}

/** Letzte `n` vergangene Termine des Mitglieds als Anwesenheits-Verlauf (aelteste zuerst). */
export function attendanceTrend(
  records: AttendanceRecord[],
  events: CommunityEvent[],
  memberId: string,
  todayIso: string,
  n = 8,
): boolean[] {
  const statusByEvent = new Map(
    records.filter((r) => r.memberId === memberId).map((r) => [r.eventId, r.status]),
  );
  return events
    .filter((e) => e.date < todayIso && statusByEvent.has(e.id))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-n)
    .map((e) => statusByEvent.get(e.id) === 'attended');
}
