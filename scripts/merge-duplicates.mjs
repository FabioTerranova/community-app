/**
 * Einmalige Bereinigung der doppelten Mitglieder ueber die Live-API
 * (`POST /api/merge`). Haengt Anwesenheiten + Avatar aufs behaltene Konto um und
 * archiviert die Duplikate (Notion-Papierkorb, ~30 Tage wiederherstellbar).
 *
 * IDEMPOTENT: schon zusammengefuehrte/archivierte Konten werden serverseitig
 * uebersprungen -> mehrfaches Ausfuehren schadet nicht.
 *
 * Aufruf:
 *   node scripts/merge-duplicates.mjs --dry     # nur anzeigen, nichts aendern
 *   node scripts/merge-duplicates.mjs           # echt zusammenfuehren (juha.app)
 *   node scripts/merge-duplicates.mjs https://xyz.app
 *
 * Die "keep"-IDs sind bewusst die Konten MIT Foto/Emoji bzw. Anwesenheiten
 * (= die echten, aktiven Accounts). Matthias: Emoji/Anwesenheiten liegen auf der
 * Wegwerf-Mail -> werden auf sein echtes iCloud-Konto umgezogen.
 */

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const base = (args.find((a) => a.startsWith('http')) || 'https://juha.app').replace(/\/$/, '');

const GROUPS = [
  {
    name: 'Nora Kaserer',
    keep: '3e78d0bf-a6fb-81f1-b753-c791270b32c3', // nora.kaserer@ssp-latsch.eu (Emoji ❤️ + Anwesenheit)
    merge: [
      '3e78d0bf-a6fb-81c6-9043-fb117eac7cb0', // nora.kaserer@ssplatsch.eu
      '3e78d0bf-a6fb-81fa-9a36-f8c331880b61', // nora.kaserer14@gmail.com
    ],
  },
  {
    name: 'Anna Mahovská',
    keep: '3e78d0bf-a6fb-8131-ac73-e693a6b8d65d', // mahovskaanna125@gmail.com (Emoji 🕊️ + 4× Anwesenheit)
    merge: ['3e78d0bf-a6fb-8144-a596-f17fe2cb4ebe'], // anna.mahovska@gmail.com
  },
  {
    name: 'Ferdinand Slotawa',
    keep: '3e78d0bf-a6fb-8138-b11c-c056fd3ad82f', // ferdinandslotawa@gmail.com (Foto + Anwesenheit)
    merge: ['3e78d0bf-a6fb-8137-99d0-ee39a4498729'], // ferdinandslotawa@gimeil.com (Tippfehler)
  },
  {
    name: 'Matthias Thomas Holzer',
    keep: '3e78d0bf-a6fb-8171-abe8-cd5bd1a0d62b', // pro_kamera.8o@icloud.com (echte Mail)
    merge: ['3e78d0bf-a6fb-81d9-80b0-f237d807e86d'], // ...@jbsze.net (Wegwerf; Emoji+Anwesenheit ziehen um)
  },
  {
    name: 'Frieda Primisser',
    keep: '3e78d0bf-a6fb-81f1-80f8-f69c58ada9c8', // frieda.primisser@gmail.com (Emoji ✝️ + Anwesenheit)
    merge: ['3e78d0bf-a6fb-819a-8d39-d832ac818fe5'], // stu-prmfrd12a68@snets.it (Schul-Mail)
  },
  {
    name: 'Daniel Stuppner',
    keep: '3e68d0bf-a6fb-8154-a3be-d2fa3606d601', // stuppnerdaniel12@gmail.com (Anwesenheit)
    merge: ['3e78d0bf-a6fb-818e-8b98-ce7d34bcb191'], // danielstuppner12@gmail.com
  },
  {
    name: 'Vero',
    keep: '3e68d0bf-a6fb-81ee-a803-ea8b90e9ee9a', // veronika.steck@hotmail.de (Emoji 🌈 + Anwesenheit)
    merge: ['3e78d0bf-a6fb-8119-bbe1-e99ab8b3f9e1'], // serino@ehwu.com (Wegwerf)
  },
];

async function main() {
  console.log(`Ziel: ${base}/api/merge${dry ? '   (DRY-RUN — nichts wird geaendert)' : ''}\n`);
  let moved = 0;
  let archived = 0;

  for (const g of GROUPS) {
    if (dry) {
      console.log(`  •  ${g.name}: behalte ${g.keep}, entferne ${g.merge.length} Duplikat(e)`);
      continue;
    }
    const r = await fetch(`${base}/api/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keepId: g.keep, mergeIds: g.merge }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d?.ok === false) {
      console.error(`  ✗  ${g.name}  -> ${d?.reason || r.status}`);
      continue;
    }
    const warn = d.photoWarning ? `  ⚠️ ${d.photoWarning} Foto(s) nicht uebertragbar` : '';
    console.log(
      `  ✓  ${g.name}  (Anwesenheiten umgezogen: ${d.movedAttendance}, archiviert: ${d.archivedMembers})${warn}`,
    );
    moved += d.movedAttendance || 0;
    archived += d.archivedMembers || 0;
  }

  if (!dry) console.log(`\nFertig. Anwesenheiten umgezogen: ${moved}, Duplikate archiviert: ${archived}.`);
  else console.log(`\n${GROUPS.length} Gruppen wuerden zusammengefuehrt. Ohne --dry ausfuehren zum Anwenden.`);
}

main().catch((e) => {
  console.error('Fehler:', e.message);
  process.exit(1);
});
