import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Anwesenheits-Endpunkt (STUB — Grundgeruest, Umsetzung nach dem Design).
 *
 * Geplanter Vertrag:
 *   GET  /api/attendance?eventId=  -> AttendanceRecord[]   (Zu-/Absagen zu einem Termin)
 *   POST /api/attendance {memberId,eventId,status} -> AttendanceRecord
 *        (eintragen / an- und abmelden; status: 'yes'|'no'|'maybe'|'attended')
 *
 * Umsetzung dann via api/_lib/notion.ts:
 *   resolveDatabaseId(token, /anwesenheit|attendance/i, process.env.NOTION_ATTENDANCE_DB_ID)
 * Auswertung ("wie oft gekommen") lebt bereits in src/logic/attendance.ts.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({
    ok: false,
    endpoint: 'attendance',
    method: req.method,
    reason: 'Noch nicht implementiert — Grundgeruest steht, Umsetzung nach dem Design.',
  });
}
