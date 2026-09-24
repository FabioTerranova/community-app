import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ensureProperties,
  prop,
  read,
  resolveDatabaseId,
  updatePage,
  uploadFile,
} from './_lib/notion';
import { MEMBERS, envId } from './_lib/schema';

/**
 * Avatar eines Mitglieds setzen (Emoji und/oder Profilfoto):
 *   POST /api/avatar {
 *     memberId,           // Notion-Page-ID des Mitglieds
 *     emoji?,             // gewaehltes Emoji ("" loescht es)
 *     photoBase64?,       // Bild als Base64 (ohne data:-Prefix); "" loescht das Foto
 *     contentType?,       // Standard: image/jpeg
 *   }
 * -> { ok, emoji?, photoUrl? }
 *
 * Das Foto wird als Notion-Datei hochgeladen (uploadFile) und an die Foto-Spalte
 * gehaengt. Die zurueckgegebene Foto-URL ist temporaer (Notion/S3, ~1h) — die App
 * laedt die Mitglieder je Start neu, daher unkritisch.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ ok: false, reason: 'NOTION_TOKEN fehlt.' });
  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'Method not allowed.' });

  try {
    const { memberId, emoji, photoBase64, contentType } = (req.body || {}) as {
      memberId?: string;
      emoji?: string;
      photoBase64?: string;
      contentType?: string;
    };
    if (!memberId) return res.status(400).json({ ok: false, reason: 'memberId fehlt.' });

    // Sicherstellen, dass Emoji-/Foto-Spalten existieren.
    const dbId = await resolveDatabaseId(token, MEMBERS.match, envId(MEMBERS));
    await ensureProperties(token, dbId, MEMBERS.props);

    const properties: Record<string, any> = {};

    if (typeof emoji === 'string') {
      properties.Emoji = prop.text(emoji);
    }

    if (typeof photoBase64 === 'string') {
      if (photoBase64) {
        const type = contentType || 'image/jpeg';
        const ext = type.includes('png') ? 'png' : 'jpg';
        const bytes = Uint8Array.from(Buffer.from(photoBase64, 'base64'));
        const uploadId = await uploadFile(token, bytes, `avatar.${ext}`, type);
        properties.Foto = prop.fileUpload(uploadId, `avatar.${ext}`);
      } else {
        properties.Foto = prop.fileUpload(undefined);
      }
    }

    if (Object.keys(properties).length === 0) {
      return res.status(400).json({ ok: false, reason: 'Nichts zu speichern (emoji oder photoBase64 noetig).' });
    }

    const page = await updatePage(token, memberId, properties);
    return res.status(200).json({
      ok: true,
      emoji: read.text(page.properties?.Emoji) || undefined,
      photoUrl: read.fileUrl(page.properties?.Foto) || undefined,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, reason: err?.message || 'Fehler' });
  }
}
