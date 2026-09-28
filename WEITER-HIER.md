# 👋 Weiter hier — community-app (JUHA)

> Wiedereinstiegs-Punkt. Danach `CLAUDE.md` (Struktur), `STACK.md` (Zugaenge),
> `LOGIN-DOMAIN-EINRICHTEN.md` (Domain/Resend-Setup).

## Stand: LIVE & in Benutzung ✅

Die App laeuft unter **https://juha.app** (PWA, iPhone-tauglich) mit **echten
Notion-Daten**. Login, Domain, Live-Daten und Admin funktionieren.

### Was live funktioniert
- **Login passwortlos per 6-stelligem Code** (kein Magic-Link — wichtig fuer die
  iPhone-PWA, die eigenen Speicher hat). Code kommt per E-Mail (steht im Betreff).
  **Session 1 Jahr.** Code: `api/auth.ts` (`action:'request'` mailt Code,
  `action:'verify'` prueft `{email, code}`), zustandslos via `api/_lib/auth.ts`
  (`makeLoginCode`/`checkLoginCode`, TOTP-artig).
- **Eigene Domain `juha.app`**: App-Adresse **und** E-Mail-Absender
  (`NEWS_FROM=login@juha.app`, in Resend verifiziert) -> Login fuer JEDE E-Mail.
  DNS in Cloudflare. PWA-Head via `scripts/inject-head.mjs`
  (Statusleiste `default`, kein `viewport-fit=cover` -> installierte App = wie Browser).
- **Live-Daten aus Notion** (kein Mockup mehr): nach Login werden
  Mitglieder/Termine/Anwesenheiten geladen (`App.tsx` -> `src/logic/api.ts`).
  An-/Abmelden und Admin-"war da" werden **direkt nach Notion gespeichert**
  (optimistisch, Revert bei Fehler). Abmelden = Status `no` (kein Delete im Upsert).
- **Admin**: Checkbox „Admin" am Mitglied in Notion (DB „Mitglieder"). Admin sieht
  den Admin-Tab und kann dort **Termine anlegen** (Formular „Neuer Termin"
  -> `createEvent`) und Anwesenheit bestaetigen.
- **Mitglieder aktuell**: Fabio, „juuli" (= Julia Oester, **Admin**), „miri".

### 🧹 Duplikate bereinigt + kuenftig vermieden (28.09.2026)
- **Ursache**: Leute haben sich mit ZWEI verschiedenen E-Mails angemeldet (Schul- vs.
  Gmail, Tippfehler wie „gimeil.com", Wegwerf-Mails) -> `findByEmail` fand das
  bestehende Konto nicht und legte ein zweites an.
- **Bereinigt**: 7 Gruppen zusammengefuehrt (44 -> 36 Mitglieder). Behalten wurde das
  Konto mit Foto/Emoji bzw. Anwesenheiten; Duplikate archiviert (Notion-Papierkorb,
  ~30 Tage wiederherstellbar). Matthias: Emoji+Anwesenheiten lagen auf einer
  Wegwerf-Mail -> auf sein echtes iCloud-Konto umgezogen. **0 verwaiste Datensaetze.**
- **Werkzeuge (bleiben nutzbar)**:
  - `POST /api/merge {keepId, mergeIds[]}` (`api/merge.ts`) — haengt Anwesenheiten +
    Avatar um, archiviert Duplikate; idempotent.
  - `scripts/merge-duplicates.mjs [--dry]` — einmalige Bereinigung gegen die Live-API.
  - **Admin-Tab -> „Doppelte zusammenfuehren"**: zwei Mitglieder waehlen + mergen;
    schlaegt verdaechtige Namensdubletten automatisch vor.
- **Vorbeugung**: Bei Selbstregistrierung mit neuer Mail, aber schon existierendem
  Namen, fragt der Login zurueck („Kennen wir dich schon?") und zeigt einen
  **maskierten Hinweis** auf die vorhandene Mail (`n****@ssp-latsch.eu`). Bestaetigt
  der Nutzer „Ich bin wirklich neu", wird trotzdem angelegt (`confirmNew`).
  Logik in `api/auth.ts` (`findByName`/`maskEmail`) + `LoginScreen.tsx`.

### 🏆 Getrennte Ranglisten Bozen / Schlanders (28.09.2026)
Rangliste hat einen Umschalter **Gesamt / Schlanders / Bozen** (`LeaderboardScreen.tsx`).
Ort je Termin aus Titel/Ort abgeleitet (`eventPlace` in `src/logic/format.ts`); die
persoenliche Karte oben bleibt gesamt-basiert. **Alle Tabs zeigen alle Mitglieder**
(auch mit 0 Punkten) — Punkte zaehlen nur `attended` (Admin-„War da"), fuellen sich also
erst nach dem ersten stattgefundenen Termin.

### 🛡️ Admin-Verwaltung in der App (28.09.2026)
Admin-Tab -> **„Admins verwalten"**: alle Mitglieder (Admins oben) mit Suche + Umschalter
je Person. `Member.admin` im Modell; `GET /api/members` liefert `admin`;
`PATCH /api/members {memberId, admin}` setzt das Notion-Haekchen; Client
`setMemberAdmin` + optimistischer Handler `onSetAdmin` in `App.tsx`.
Alternativ per Skript: `node scripts/set-admin.mjs <mail> [<mail> …]` (`--off`/`--dry`).
Aktuelle Admins: Fabio, juuli, Elia Weiss, Samuel Hoechenberger, Lukas Palla,
Sarah Rechenmacher, Vero. (2 weitere folgen, sobald sie sich angemeldet haben.)

### ⏸️ Naechster Schritt / offen
1. ✅ **JUHA-Termine sind importiert** (15 Stueck, live in Notion): JUHA Schlanders
   (11× Fr 18:00–19:30, CGS Zentrum) + JUHA Bozen (Fr 19:00–21:00, Achille-Grandistr.
   22; inkl. 30.10 „Encounter Night"). Import via `scripts/import-events.mjs`
   (idempotent, gegen die Live-API; `--dry` moeglich). **Bozen: weitere Termine folgen**
   laut Plakat — einfach im Admin-Tab „Neuer Termin" oder das Skript ergaenzen.
2. ✅ **Dienste/Verantwortliche pro Termin sind im Live-Modell.** Umgesetzt als zwei
   eigene Notion-Spalten **`Vorbereitung`** und **`Snacks`** (mehrere Personen
   kommagetrennt) in DB „Termine". `api/events.ts` liest/schreibt sie und baut daraus
   `duties[]` (angezeigt via `EventDuties.tsx`). **Nur Schlanders** hat Dienste
   (Platzhalter **„offen"**), **Bozen hat keine** (dort gibt es das nicht) —
   **echte Namen einfach direkt in Notion** in die Spalten eintragen (oder im Admin-
   Formular „Neuer Termin", Felder Vorbereitung/Snacks). Hinweis: **Bestehende Termine
   editieren geht nur in Notion** (das Admin-Formular legt bisher nur neu an).
3. Optional: Julias Anzeigename „juuli" -> „Julia Oester" (sie loggt sich neu ein und
   gibt den vollen Namen an, oder Name in Notion aendern).
4. ✅ **Avatare: Foto + Emoji dauerhaft in Notion.** Mitglieder-Spalte `Foto` (files,
   Notion-Datei-Upload) + `Emoji` (rich_text). Setzen via `POST /api/avatar`
   ({memberId, emoji?, photoBase64?}); `GET /api/members` liest beide. Auswahl in der
   **Rangliste** unter „Dein Symbol" / „Dein Foto". Anzeige-Vorrang: Foto > Emoji >
   Initialen (`Avatar` in `ui.tsx`). **Foto-Upload aktuell Web-only** (Datei-Dialog +
   quadratischer Zuschnitt/Verkleinerung auf ~256px JPEG, `src/logic/photo.ts`); native
   (Expo Go) koennte man mit `expo-image-picker` ergaenzen. Foto-URLs sind temporaer
   (Notion/S3, ~1h) -> je App-Start frisch geladen, daher unkritisch.
5. Optional/spaeter: Live-Aktualisierung (fremde Aenderungen sieht man erst nach
   App-Neuladen); Foto-Upload auch in der nativen App (Expo Go).

### Deploy-Weg
`git push` auf `main` -> Vercel baut (`npx expo export --platform web && node
scripts/inject-head.mjs`) und deployt automatisch. Commit-Autor-Mail: die GitHub-
Noreply-Adresse funktioniert (Vercel akzeptiert sie).

### Diagnose-URLs
- `https://community-app-flame-two.vercel.app/api/notion-check` — sieht die Integration die DBs?
- `.../api/members` · `.../api/events` · `.../api/attendance` — Live-Daten pruefen.
