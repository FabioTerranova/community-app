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

### ⏸️ Naechster Schritt / offen
1. **Fabio traegt die vollen Termine ein** (Admin-Tab -> „Neuer Termin"), sobald die
   Daten der Gruppe da sind.
2. **⚠️ „Verantwortliche / Dienste" pro Termin (duties)** sind aktuell **nicht** im
   Live-Modell — das Termin-Formular hat nur **Titel / Datum / Ort**. Im alten Mockup
   gab es `duties` (Rolle + Personen, siehe `EventDuties.tsx` / `types.ts` `EventDuty`),
   aber Notion-Schema (`api/_lib/schema.ts` EVENTS) und `createEvent` kennen sie noch
   nicht. **Wenn Dienste/Verantwortliche gewuenscht sind, ist das ein kleiner Zusatz-
   Umbau:** Notion-Spalte (z.B. JSON/rich_text) + Formularfelder im Admin + Anzeige.
3. Optional: Julias Anzeigename „juuli" -> „Julia Oester" (sie loggt sich neu ein und
   gibt den vollen Namen an, oder Name in Notion aendern).
4. Optional/spaeter: Live-Aktualisierung (aktuell sieht man fremde Aenderungen erst
   nach App-Neuladen); Avatar-Emoji dauerhaft in Notion speichern.

### Deploy-Weg
`git push` auf `main` -> Vercel baut (`npx expo export --platform web && node
scripts/inject-head.mjs`) und deployt automatisch. Commit-Autor-Mail: die GitHub-
Noreply-Adresse funktioniert (Vercel akzeptiert sie).

### Diagnose-URLs
- `https://community-app-flame-two.vercel.app/api/notion-check` — sieht die Integration die DBs?
- `.../api/members` · `.../api/events` · `.../api/attendance` — Live-Daten pruefen.
