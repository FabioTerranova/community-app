import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { prop, updatePage } from './_lib/notion';
import { findAttendance, upsertAttendance } from './_lib/attendanceStore';

/**
 * In der App unterschreiben:
 *   POST /api/sign {memberId, eventId, signaturePng, memberName?, eventTitle?}
 *     signaturePng: Base64-PNG der gezeichneten Unterschrift (mit oder ohne data:-Praefix)
 *   -> { ok, pdfBase64, signatureRef }
 *
 * Ablauf:
 *   1. erzeugt mit pdf-lib eine Anwesenheits-/Unterschrift-Bestaetigung (A4) inkl. Unterschrift-Bild
 *   2. markiert den Anwesenheits-Datensatz als unterschrieben + Status 'attended'
 *   3. gibt das PDF als Base64 zurueck (Frontend kann es anzeigen/herunterladen)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'Method not allowed.' });

  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ ok: false, reason: 'NOTION_TOKEN fehlt.' });

  const { memberId, eventId, signaturePng, memberName, eventTitle } = (req.body || {}) as {
    memberId?: string;
    eventId?: string;
    signaturePng?: string;
    memberName?: string;
    eventTitle?: string;
  };
  if (!memberId || !eventId || !signaturePng) {
    return res.status(400).json({ ok: false, reason: 'memberId, eventId und signaturePng noetig.' });
  }

  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

    // 1) PDF bauen
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const ink = rgb(0.1, 0.11, 0.13);

    page.drawText('Anwesenheitsbestaetigung', { x: 50, y: 780, size: 22, font: bold, color: ink });
    const lines = [
      `Mitglied: ${memberName || memberId}`,
      `Termin: ${eventTitle || eventId}`,
      `Datum der Unterschrift: ${dateStr}`,
    ];
    lines.forEach((t, i) => page.drawText(t, { x: 50, y: 730 - i * 26, size: 13, font, color: ink }));

    page.drawText('Unterschrift:', { x: 50, y: 300, size: 13, font: bold, color: ink });
    const raw = signaturePng.replace(/^data:image\/png;base64,/, '');
    try {
      const img = await pdf.embedPng(new Uint8Array(Buffer.from(raw, 'base64')));
      const w = 240;
      const h = (img.height / img.width) * w;
      page.drawImage(img, { x: 50, y: 300 - h - 8, width: w, height: Math.min(h, 120) });
    } catch {
      page.drawText('(Unterschrift konnte nicht eingebettet werden)', { x: 50, y: 270, size: 11, font, color: ink });
    }

    const bytes = await pdf.save();
    const pdfBase64 = Buffer.from(bytes).toString('base64');

    // 2) Anwesenheit als unterschrieben + 'attended' markieren
    const signatureRef = `sign-${now.toISOString()}`;
    const existing = await findAttendance(token, memberId, eventId);
    if (existing) {
      await updatePage(token, existing.id, {
        Status: prop.select('attended'),
        'Unterschrieben am': prop.date(now.toISOString()),
        Unterschrift: prop.text(signatureRef),
      });
    } else {
      const row = await upsertAttendance(token, {
        memberId,
        eventId,
        status: 'attended',
        memberName,
        eventTitle,
      });
      await updatePage(token, row.id, {
        'Unterschrieben am': prop.date(now.toISOString()),
        Unterschrift: prop.text(signatureRef),
      });
    }

    return res.status(200).json({ ok: true, pdfBase64, signatureRef });
  } catch (err: any) {
    return res.status(500).json({ ok: false, reason: err?.message || 'Fehler' });
  }
}
