/**
 * Gemeinsame Anwesenheits-Logik gegen Notion — genutzt von api/attendance.ts
 * und api/sign.ts (damit Eintragen und Unterschreiben denselben Datensatz treffen).
 */
import { createPage, ensureProperties, prop, queryDatabase, read, resolveDatabaseId, updatePage } from './notion';
import { ATTENDANCE, envId } from './schema';

export type AttendanceStatus = 'yes' | 'no' | 'maybe' | 'attended';

export interface AttendanceRow {
  id: string;
  memberId: string;
  memberName?: string;
  eventId: string;
  eventTitle?: string;
  status: AttendanceStatus;
  signedAt?: string;
  signatureRef?: string;
}

export async function getAttendanceDb(token: string): Promise<{ dbId: string; titleProp: string }> {
  const dbId = await resolveDatabaseId(token, ATTENDANCE.match, envId(ATTENDANCE));
  const titleProp = await ensureProperties(token, dbId, ATTENDANCE.props);
  return { dbId, titleProp };
}

function toRow(r: any): AttendanceRow {
  return {
    id: r.id,
    memberId: read.text(r.properties?.['Mitglied-ID']),
    memberName: read.text(r.properties?.Mitglied) || undefined,
    eventId: read.text(r.properties?.['Termin-ID']),
    eventTitle: read.text(r.properties?.Termin) || undefined,
    status: (read.select(r.properties?.Status) || 'yes') as AttendanceStatus,
    signedAt: read.date(r.properties?.['Unterschrieben am']) || undefined,
    signatureRef: read.text(r.properties?.Unterschrift) || undefined,
  };
}

/** Alle Datensaetze, optional gefiltert nach eventId/memberId. */
export async function listAttendance(
  token: string,
  filters: { eventId?: string; memberId?: string } = {},
): Promise<AttendanceRow[]> {
  const { dbId } = await getAttendanceDb(token);
  const and: any[] = [];
  if (filters.eventId) and.push({ property: 'Termin-ID', rich_text: { equals: filters.eventId } });
  if (filters.memberId) and.push({ property: 'Mitglied-ID', rich_text: { equals: filters.memberId } });
  const rows = await queryDatabase(token, dbId, and.length ? { filter: { and } } : {});
  return rows.map(toRow);
}

/** Bestehenden Datensatz zu memberId+eventId finden (oder null). */
export async function findAttendance(
  token: string,
  memberId: string,
  eventId: string,
): Promise<AttendanceRow | null> {
  const { dbId } = await getAttendanceDb(token);
  const rows = await queryDatabase(token, dbId, {
    filter: {
      and: [
        { property: 'Mitglied-ID', rich_text: { equals: memberId } },
        { property: 'Termin-ID', rich_text: { equals: eventId } },
      ],
    },
    page_size: 1,
  });
  return rows.length ? toRow(rows[0]) : null;
}

/** Eintragen/aktualisieren (Upsert) — legt an oder aendert den Status. */
export async function upsertAttendance(
  token: string,
  input: {
    memberId: string;
    eventId: string;
    status: AttendanceStatus;
    memberName?: string;
    eventTitle?: string;
  },
): Promise<AttendanceRow> {
  const { dbId, titleProp } = await getAttendanceDb(token);
  const existing = await findAttendance(token, input.memberId, input.eventId);

  const properties: Record<string, any> = {
    'Mitglied-ID': prop.text(input.memberId),
    'Termin-ID': prop.text(input.eventId),
    Status: prop.select(input.status),
  };
  if (input.memberName) properties.Mitglied = prop.text(input.memberName);
  if (input.eventTitle) properties.Termin = prop.text(input.eventTitle);

  if (existing) {
    await updatePage(token, existing.id, properties);
    return { ...existing, ...input };
  }

  const label = `${input.memberName || input.memberId} – ${input.eventTitle || input.eventId}`;
  const page = await createPage(token, dbId, { [titleProp]: prop.title(label), ...properties });
  return { id: page.id, ...input };
}
