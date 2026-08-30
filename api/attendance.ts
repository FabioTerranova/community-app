import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listAttendance, upsertAttendance, type AttendanceStatus } from './_lib/attendanceStore';

/**
 * Anwesenheit (eintragen / an- und abmelden):
 *   GET  /api/attendance?eventId=&memberId=  -> { ok, records: AttendanceRecord[] }
 *   POST /api/attendance {memberId,eventId,status,memberName?,eventTitle?}
 *        status: 'yes' | 'no' | 'maybe' | 'attended'   -> { ok, record }
 *
 * Auswertung "wie oft gekommen" lebt clientseitig in src/logic/attendance.ts
 * (attendanceCount) auf Basis dieser Datensaetze.
 */
const VALID: AttendanceStatus[] = ['yes', 'no', 'maybe', 'attended'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ ok: false, reason: 'NOTION_TOKEN fehlt.' });

  try {
    if (req.method === 'GET') {
      const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : undefined;
      const memberId = typeof req.query.memberId === 'string' ? req.query.memberId : undefined;
      const records = await listAttendance(token, { eventId, memberId });
      return res.status(200).json({ ok: true, records });
    }

    if (req.method === 'POST') {
      const { memberId, eventId, status, memberName, eventTitle } = (req.body || {}) as {
        memberId?: string;
        eventId?: string;
        status?: AttendanceStatus;
        memberName?: string;
        eventTitle?: string;
      };
      if (!memberId || !eventId || !status) {
        return res.status(400).json({ ok: false, reason: 'memberId, eventId und status noetig.' });
      }
      if (!VALID.includes(status)) {
        return res.status(400).json({ ok: false, reason: `status muss eines von ${VALID.join('/')} sein.` });
      }
      const record = await upsertAttendance(token, { memberId, eventId, status, memberName, eventTitle });
      return res.status(200).json({ ok: true, record });
    }

    return res.status(405).json({ ok: false, reason: 'Method not allowed.' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, reason: err?.message || 'Fehler' });
  }
}
