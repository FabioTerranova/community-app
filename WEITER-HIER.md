# 👋 Weiter hier — community-app

> Wiedereinstiegs-Punkt. Danach `CLAUDE.md` (Details & Struktur), `STACK.md` (Zugaenge).

## Stand: Alles fertig ausser Design — technisch live-faehig

Aufgebaut **genau nach dem Muster der `zenit-alpine-app`** (Expo + Vercel + Notion).
Das komplette **Backend ist implementiert**; es fehlt nur noch UI/UX & Design sowie das
externe Einrichten (Vercel-Env-Vars + Notion-Datenbanken).

### Was fertig & verifiziert ist
- **Projektstruktur** komplett + auf GitHub (public): https://github.com/FabioTerranova/community-app
- **Domaenen-Modell** `src/types.ts` (Member, CommunityEvent, AttendanceRecord, NewsItem)
  und **Auswertung** `src/logic/attendance.ts` (wie oft gekommen, Zusagen, kommende Termine).
- **Backend voll implementiert** (Vercel-Functions):
  - `api/members.ts` — GET/POST Mitglieder (Notion)
  - `api/events.ts` — GET/POST Termine (Notion, nach Datum sortiert)
  - `api/attendance.ts` — GET/POST Anwesenheit, Upsert (eintragen/an-/abmelden)
  - `api/news.ts` — POST News an aktive Mitglieder via Resend (Testmodus: `NEWS_TEST_TO`)
  - `api/sign.ts` — POST Unterschrift: pdf-lib erzeugt PDF + Datensatz wird 'attended'
  - `api/notion-check.ts` — Diagnose; `api/_lib/{notion,schema,attendanceStore}.ts` — Bausteine
- **Frontend-Client** `src/logic/api.ts` — typsicher, die Screens rufen spaeter NUR diesen.
- **Verifiziert:** App-Typecheck gruen, api-Typecheck gruen (`tsconfig.api.json`), Web-Build baut.
- **Launcher** (`claude.bat` etc.) + **Docs** (`CLAUDE.md`, `STACK.md`, `AGENTS.md`).

### ⏸️ PAUSIERT — naechster konkreter Schritt
**Fabio schickt zuerst ein Mockup / eine Design-Vorstellung.** Reihenfolge bewusst
so gewaehlt (erst sehen, wie es aussehen soll, dann live):

1. **Mockup abwarten** → dann **Design** bauen: Farben/Tokens in `src/theme.ts`, danach
   Screens (Home, Termine, Anwesenheit/Eintragen, Unterschrift, News) + Navigation in
   `App.tsx`. Die Screens haengen sich an `src/logic/api.ts` — die Logik steht bereits.
2. **DANACH erst live schalten (extern, Fabios Konten):**
   - Vercel: Repo importieren (Framework „Other", Build aus `vercel.json`), dann
     Env-Vars setzen: `NOTION_TOKEN`, `RESEND_API_KEY`, `NEWS_FROM`, Testmodus `NEWS_TEST_TO`.
   - Notion: 3 Datenbanken anlegen (Titel enthaelt „Mitglied"/„Termin"/„Anwesenheit"),
     jeweils mit der Integration teilen. Spalten legt die App automatisch an.
   - Test: `<deploy-url>/api/notion-check` sollte die 3 Datenbanken zeigen.

> Der genaue Vercel/Notion/Resend-Klickpfad wurde bereits Schritt fuer Schritt
> besprochen — bei Bedarf einfach danach fragen.

### Deploy-Weg (wie Schwester-Projekte)
`git push` auf `main` → Vercel baut automatisch. ⚠️ Commit-Autor-Mail muss
`fabio.terranova@kulmgroup.com` sein (sonst „GitHub user not found" bei Vercel).

### Deploy-Weg (wie Schwester-Projekte)
`git push` auf `main` → Vercel baut automatisch. ⚠️ Commit-Autor-Mail muss
`fabio.terranova@kulmgroup.com` sein (sonst „GitHub user not found" bei Vercel).
