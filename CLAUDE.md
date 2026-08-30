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
│   ├── data/                → pflegbare Inhalte/Beispieldaten (noch leer)
│   ├── components/          → UI-Bausteine (nach Design)
│   └── screens/             → Screens (nach Design)
├── api/
│   ├── _lib/notion.ts       → generische Notion-Anbindung (fetch, resolveDatabaseId, prop-Helfer)
│   ├── notion-check.ts      → Diagnose: sieht die Integration die Datenbanken?
│   ├── members.ts           → STUB: GET/POST Mitglieder
│   ├── events.ts            → STUB: GET/POST Termine
│   ├── attendance.ts        → STUB: GET/POST Anwesenheit (eintragen/an-/abmelden)
│   ├── news.ts              → STUB: POST News-Versand (Resend)
│   └── sign.ts              → STUB: POST Unterschrift → PDF (pdf-lib)
├── scripts/inject-head.mjs  → Web-Export-Nachbearbeitung (Meta-Tags)
├── app.json · vercel.json · tsconfig.json · package.json · .env.example
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
npm install                     # einmalig Abhaengigkeiten installieren
npm run web                     # Web-Vorschau im Browser (schnelles Iterieren)
npx tsc --noEmit                # Typecheck
npx expo export --platform web  # Web-Bundle bauen (validiert End-to-End) → dist/
```

## Deploy (wie zenit-alpine-app)
- GitHub-Repo `FabioTerranova/community-app` → Vercel baut & deployt bei `git push` auf `main`.
- ⚠️ **Commit-Autor-Mail muss `fabio.terranova@kulmgroup.com` sein** (sonst blockt Vercel).
- `vercel.json`: `npx expo export --platform web` → `dist`.
- Env-Vars bei Vercel: `NOTION_TOKEN`, `RESEND_API_KEY`, `NEWS_FROM` (+ optional `NOTION_*_DB_ID`).

## Naechste Schritte (vor Design bereits erledigt: Grundgeruest)
- [ ] `npm install` + `npx tsc --noEmit` gruen
- [ ] GitHub-Repo anlegen + pushen, Vercel-Projekt importieren, Env-Vars setzen
- [ ] **Design** festlegen (Farben in `theme.ts`, Screens, Navigation)
- [ ] Notion-Datenbanken anlegen + mit Integration teilen
- [ ] api/-Stubs implementieren (members/events/attendance/news/sign)
