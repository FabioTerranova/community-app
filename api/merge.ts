import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  archivePage,
  queryDatabase,
  read,
  resolveDatabaseId,
  updatePage,
} from './_lib/notion';
import { getAttendanceDb } from './_lib/attendanceStore';
import { MEMBERS, PUSH, envId } from './_lib/schema';

/**
 * Doppelte Mitglieder zusammenfuehren:
 *   POST /api/merge {keepId, mergeIds:string[]}  -> { ok, movedAttendance, archivedMembers }
 *
 * Fuer jede zu entfernende Mitglieds-ID werden die Anwesenheiten aufs behaltene
 * Konto umgehaengt (bei Termin-Konflikt gewinnt der hoehere Status), dann wird
 * das Duplikat-Mitglied archiviert (Notion-Papierkorb, ~30 Tage wiederherstellbar).
 * Idempotent: schon-archivierte/fehlende Mitglieder werden uebersprungen.
 *
 * Genutzt vom einmaligen Bereinigungs-Skript (scripts/merge-duplicates.mjs) und
 * vom Admin-Merge-Werkzeug in der App.
 */

// Rang der Status: "war da" schlaegt "zugesagt" schlaegt "vielleicht" schlaegt "abgesagt".
const RANK: Record<string, number> = { attended: 3, yes: 2, maybe: 1, no: 0 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'Method not allowed.' });
  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ ok: false, reason: 'NOTION_TOKEN fehlt.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const keepId: string = String(body.keepId || '').trim();
  const mergeIds: string[] = Array.isArray(body.mergeIds)
    ? body.mergeIds.map((x: unknown) => String(x || '').trim()).filter(Boolean)
    : [];

  if (!keepId) return res.status(400).json({ ok: false, reason: 'keepId fehlt.' });
  const targets = mergeIds.filter((id) => id && id !== keepId);
  if (targets.length === 0) return res.status(400).json({ ok: false, reason: 'mergeIds fehlt (oder nur keepId).' });

  try {
    // Behaltenes Mitglied laden (Name fuer die umgehaengten Datensaetze).
    const membersDbId = await resolveDatabaseId(token, MEMBERS.match, envId(MEMBERS));
    const membersRows = await queryDatabase(token, membersDbId);
    const titleProp =
      Object.entries((membersRows[0]?.properties as Record<string, any>) || {}).find(
        ([, def]) => (def as any)?.type === 'title',
      )?.[0] || 'Name';
    const keepRow = membersRows.find((r) => r.id === keepId);
    if (!keepRow) return res.status(404).json({ ok: false, reason: 'keepId ist kein Mitglied.' });
    const keepName = read.titleText(keepRow.properties?.[titleProp]) || '';

    // Avatar-Erhalt: falls das behaltene Konto weder Emoji noch Foto hat, aber
    // ein Duplikat eines, uebernehmen (Emoji direkt; Foto per external-URL-Referenz).
    const keepEmoji = read.text(keepRow.properties?.Emoji);
    const keepFotoFiles = Array.isArray(keepRow.properties?.Foto?.files)
      ? keepRow.properties.Foto.files
      : [];
    const avatarUpdate: Record<string, any> = {};
    let photoWarning = 0;
    if (!keepEmoji) {
      const donor = membersRows.find(
        (r) => targets.includes(r.id) && read.text(r.properties?.Emoji),
      );
      if (donor) {
        avatarUpdate.Emoji = {
          rich_text: [{ type: 'text', text: { content: read.text(donor.properties?.Emoji) } }],
        };
      }
    }
    if (keepFotoFiles.length === 0) {
      const donor = membersRows.find(
        (r) => targets.includes(r.id) && (r.properties?.Foto?.files || []).length > 0,
      );
      const url = donor ? read.fileUrl(donor.properties?.Foto) : '';
      // Notion-eigene Dateien haben nur temporaere URLs -> nicht zuverlaessig kopierbar.
      // Externe URLs koennen wir referenzieren; sonst als "nicht uebernommen" zaehlen.
      if (url && !/amazonaws\.com|notion-static\.com|prod-files-secure/.test(url)) {
        avatarUpdate.Foto = { files: [{ type: 'external', name: 'foto', external: { url } }] };
      } else if (donor) {
        photoWarning++;
      }
    }
    if (Object.keys(avatarUpdate).length) await updatePage(token, keepId, avatarUpdate);

    const { dbId: attDbId } = await getAttendanceDb(token);

    // Alle Anwesenheiten des behaltenen Kontos: Termin-ID -> {recId, status}
    const keepAtt = await queryDatabase(token, attDbId, {
      filter: { property: 'Mitglied-ID', rich_text: { equals: keepId } },
    });
    const keepByEvent = new Map<string, { id: string; status: string }>();
    for (const r of keepAtt) {
      keepByEvent.set(read.text(r.properties?.['Termin-ID']), {
        id: r.id,
        status: read.select(r.properties?.Status) || 'yes',
      });
    }

    let movedAttendance = 0;
    for (const mergeId of targets) {
      const rows = await queryDatabase(token, attDbId, {
        filter: { property: 'Mitglied-ID', rich_text: { equals: mergeId } },
      });
      for (const r of rows) {
        const eventId = read.text(r.properties?.['Termin-ID']);
        const status = read.select(r.properties?.Status) || 'yes';
        const existing = keepByEvent.get(eventId);
        if (!existing) {
          // Kein Konflikt -> Datensatz aufs behaltene Konto umhaengen.
          await updatePage(token, r.id, {
            'Mitglied-ID': { rich_text: [{ type: 'text', text: { content: keepId } }] },
            Mitglied: { rich_text: [{ type: 'text', text: { content: keepName } }] },
          });
          keepByEvent.set(eventId, { id: r.id, status });
          movedAttendance++;
        } else {
          // Konflikt: hoeheren Status behalten, doppelten Datensatz archivieren.
          if ((RANK[status] ?? 0) > (RANK[existing.status] ?? 0)) {
            await updatePage(token, existing.id, { Status: { select: { name: status } } });
            existing.status = status;
          }
          await archivePage(token, r.id);
        }
      }
    }

    // Push-Abos der Duplikate umhaengen (best effort — DB evtl. nicht vorhanden).
    try {
      const pushDbId = await resolveDatabaseId(token, PUSH.match, envId(PUSH));
      for (const mergeId of targets) {
        const rows = await queryDatabase(token, pushDbId, {
          filter: { property: 'Mitglied-ID', rich_text: { equals: mergeId } },
        });
        for (const r of rows) {
          await updatePage(token, r.id, {
            'Mitglied-ID': { rich_text: [{ type: 'text', text: { content: keepId } }] },
            Mitglied: { rich_text: [{ type: 'text', text: { content: keepName } }] },
          });
        }
      }
    } catch {
      /* keine Push-DB -> ignorieren */
    }

    // Duplikat-Mitglieder archivieren (idempotent: fehlende/archivierte ignorieren).
    let archivedMembers = 0;
    for (const mergeId of targets) {
      try {
        await archivePage(token, mergeId);
        archivedMembers++;
      } catch {
        /* schon weg -> ok */
      }
    }

    return res
      .status(200)
      .json({ ok: true, keepId, keepName, movedAttendance, archivedMembers, photoWarning });
  } catch (err: any) {
    return res.status(500).json({ ok: false, reason: err?.message || 'Fehler' });
  }
}
