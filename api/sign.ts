import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Unterschrift-Endpunkt (STUB — Grundgeruest, Umsetzung nach dem Design).
 *
 * Geplanter Vertrag:
 *   POST /api/sign {memberId, eventId, signaturePng} -> { ok, signatureRef }
 *   Nimmt eine in der App gezeichnete Unterschrift (Base64-PNG) entgegen, erzeugt
 *   mit pdf-lib eine Anwesenheits-/Bestaetigungs-PDF und vermerkt signedAt/signatureRef
 *   am AttendanceRecord.
 *
 * Baustein pdf-lib ist bereits als Dependency vorhanden (wie in zenit-alpine-app
 * fuer die Report-PDFs). Muster: PDFDocument.create() -> embedPng -> drawImage.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({
    ok: false,
    endpoint: 'sign',
    method: req.method,
    reason: 'Noch nicht implementiert — Grundgeruest steht, Umsetzung nach dem Design.',
  });
}
