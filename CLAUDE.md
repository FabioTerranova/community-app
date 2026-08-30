# community-app — Community-/Termin-App

> Deutsch als Arbeitssprache. **ZUERST LESEN: [`WEITER-HIER.md`](./WEITER-HIER.md)**.
> Aufgebaut nach demselben Muster wie `C:\dev\zenit-alpine-app` (Expo + Vercel + Notion).

## Idee
App fuer eine **Gemeinschaft**, um zu planen, **wer an welchen Terminen kommt**,
zu sehen **wie oft** jemand gekommen ist, sich **einzutragen/anzumelden**, in der App
zu **unterschreiben** und **News zu versenden**.

## Tech-Stack (wie zenit-alpine-app)
- **Expo** ~56 / **React Native** 0.85 / **React** 19, **TypeScript** (strict via tsc)
- Universal: laeuft im Web (Vercel) und via Expo Go am iPhone
- **Vercel Serverless Functions** in `api/` (Node) fuer das Backend
- **Notion** als Datenbank (Mitglieder / Termine / Anwesenheiten)
- **Resend** fuer E-Mail-/News-Versand
- **pdf-lib** fuer Unterschrift-/Bestaetigungs-PDFs
- Kein Router — spaeter kleine State-Machine in `App.tsx` (wie in der Schwester-App)

## Struktur
```
community-app/
├── App.tsx                  → Einstieg (aktuell Platzhalter, spaeter State-Machine)
├── index.ts                 → registerRootComponent
├── src/
│   ├── theme.ts             → Design-Tokens (PLATZHALTER, wird beim Design ersetzt)
│   ├── types.ts             → Domaenen-Modell: Member, CommunityEvent, AttendanceRecord, NewsItem
│   ├── logic/attendance.ts  → reine Auswertung ("wie oft gekommen", Zusagen, kommende Termine)
│   ├── logic/api.ts         → typsicherer Client fuer die api/-Endpunkte (Screens rufen NUR diesen)
│   ├── data/                → pflegbare Inhalte/Beispieldaten (noch leer)
│   ├── components/          → UI-Bausteine (nach Design)
│   └── screens/             → Screens (nach Design)
├── api/                     → Vercel-Serverless-Functions, VOLL implementiert (Notion/Resend/pdf-lib)
│   ├── _lib/notion.ts       → generische Notion-Anbindung (query/create/update, ensureProperties, prop/read)
│   ├── _lib/schema.ts       → Notion-Schema (DB-Namen, Env-IDs, Spalten)
│   ├── _lib/attendanceStore.ts → Upsert/Query der Anwesenheiten (von attendance.ts + sign.ts genutzt)
│   ├── notion-check.ts      → Diagnose: sieht die Integration die Datenbanken?
│   ├── members.ts           → GET/POST Mitglieder
│   ├── events.ts            → GET/POST Termine (nach Datum sortiert)
│   ├── attendance.ts        → GET/POST Anwesenheit (eintragen/an-/abmelden)
│   ├── news.ts              → POST News-Versand via Resend (an aktive Mitglieder; NEWS_TEST_TO = Testmodus)
│   └── sign.ts              → POST Unterschrift → PDF (pdf-lib) + Datensatz auf 'attended' setzen
├── scripts/inject-head.mjs  → Web-Export-Nachbearbeitung (Meta-Tags)
├── app.json · vercel.json · tsconfig.json · tsconfig.api.json · package.json · .env.example
└── claude.bat · start-web.bat · start-app.bat
```

## Datenmodell (Notion)
Drei Notion-Datenbanken, mit der Integration „Community App" **geteilt**:
- **Mitglieder** (Member): Name, E-Mail, aktiv
- **Termine** (CommunityEvent): Titel, Datum, Ort
- **Anwesenheiten** (AttendanceRecord): Mitglied, Termin, Status (yes/no/maybe/attended), Unterschrift

Aufloesung ueber Titel-Suche oder feste IDs (`NOTION_*_DB_ID`). Siehe `api/_lib/notion.ts`.

## Befehle
```bash
npm install                        # einmalig Abhaengigkeiten installieren
npm run web                        # Web-Vorschau im Browser (schnelles Iterieren)
npx tsc --noEmit                   # Typecheck App (src/)
npx tsc --noEmit -p tsconfig.api.json  # Typecheck Serverless-Functions (api/)
npx expo export --platform web     # Web-Bundle bauen (validiert End-to-End) → dist/
```

## Deploy (wie zenit-alpine-app)
- GitHub-Repo `FabioTerranova/community-app` → Vercel baut & deployt bei `git push` auf `main`.
- ⚠️ **Commit-Autor-Mail muss `fabio.terranova@kulmgroup.com` sein** (sonst blockt Vercel).
- `vercel.json`: `npx expo export --platform web` → `dist`.
- Env-Vars bei Vercel: `NOTION_TOKEN`, `RESEND_API_KEY`, `NEWS_FROM` (+ optional `NOTION_*_DB_ID`).

## Stand
Alles bis auf **UI/UX & Design** steht — technisch live-faehig:
- [x] Grundgeruest, `npm install`, beide Typechecks gruen, Web-Build baut
- [x] GitHub-Repo (public) + erster Push
- [x] Backend voll implementiert: Mitglieder, Termine, Anwesenheit, News (Resend), Unterschrift (pdf-lib)
- [x] Typsicherer Frontend-Client `src/logic/api.ts`

Fuer den Live-Gang fehlen nur noch (extern, deine Konten):
- [ ] Vercel-Projekt importieren + Env-Vars setzen (`NOTION_TOKEN`, `RESEND_API_KEY`, `NEWS_FROM`; Testmodus `NEWS_TEST_TO`)
- [ ] 3 Notion-Datenbanken anlegen (Titel enthaelt „Mitglied"/„Termin"/„Anwesenheit") + mit Integration teilen — Spalten legt die App selbst an
- [ ] **Design**: Farben in `theme.ts`, Screens + Navigation (Screens nutzen `src/logic/api.ts`)
