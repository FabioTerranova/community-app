# 👋 Weiter hier — community-app

> Wiedereinstiegs-Punkt. Danach `CLAUDE.md` (Details & Struktur), `STACK.md` (Zugaenge).

## Stand: Grundgeruest steht (vor Design)

Aufgebaut **genau nach dem Muster der `zenit-alpine-app`** (Expo + Vercel + Notion),
aber **bewusst noch ohne Design** — erst das Fundament, das wir vor der Gestaltung
klaeren koennen.

### Was fertig ist
- **Projektstruktur** komplett: `App.tsx` (Platzhalter), `src/`, `api/`, `scripts/`,
  `assets/`, `public/`, Config (`package.json`, `app.json`, `vercel.json`, `tsconfig.json`,
  `.gitignore`, `.env.example`).
- **Domaenen-Modell** in `src/types.ts`: Member, CommunityEvent, AttendanceRecord, NewsItem.
- **Auswertungs-Logik** in `src/logic/attendance.ts`: „wie oft gekommen", Zusagen je
  Termin, kommende Termine (reine, testbare Funktionen).
- **Notion-Backend-Skelett**: generische `api/_lib/notion.ts` + Diagnose-Endpunkt
  `api/notion-check.ts` + Stubs `members/events/attendance/news/sign` mit dokumentiertem Vertrag.
- **Launcher**: `claude.bat`, `start-web.bat`, `start-app.bat` (wie in den anderen Projekten).
- **Docs**: `CLAUDE.md`, `STACK.md`, `AGENTS.md`.

### Naechste Schritte (in dieser Reihenfolge)
1. **Abhaengigkeiten + Typecheck**: `npm install` → `npx tsc --noEmit` → `npm run web`
   (Platzhalter-Screen sollte im Browser erscheinen).
2. **GitHub + Vercel** ("das Vercel-GitHub-Ding"):
   - GitHub-Repo `FabioTerranova/community-app` anlegen, ersten Commit pushen
     (⚠️ Commit-Autor `fabio.terranova@kulmgroup.com`).
   - Vercel: Repo importieren, Framework „Other", Build kommt aus `vercel.json`.
   - Env-Vars bei Vercel setzen (siehe `STACK.md`).
3. **Design** festlegen: Farben in `src/theme.ts`, dann Screens + Navigation.
4. **Notion** einrichten: 3 Datenbanken anlegen, mit Integration teilen; api-Stubs
   implementieren.

### Deploy-Weg (wie Schwester-Projekte)
`git push` auf `main` → Vercel baut automatisch. ⚠️ Commit-Autor-Mail muss
`fabio.terranova@kulmgroup.com` sein (sonst „GitHub user not found" bei Vercel).
