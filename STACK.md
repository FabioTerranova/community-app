# community-app — Stack & Zugaenge (Uebersicht)

> Zentrale Uebersicht aller genutzten Dienste, Repos, Domains und Einstellungen.
> **Keine Passwoerter/Keys hier ablegen** (die liegen als Umgebungsvariablen bei
> Vercel bzw. lokal in `.env`, die gitignored ist).

## Projekt

| Projekt | Ort (lokal) | GitHub | Vercel-Projekt | Domain |
|---|---|---|---|---|
| **community-app** | `C:\dev\community-app` | `FabioTerranova/community-app` *(anzulegen)* | community-app *(anzulegen)* | *(offen)* |

**Deploy-Prinzip:** `git push` auf `main` → Vercel baut & deployt automatisch (~30–60 s).
⚠️ Commit-Autor-Mail muss **`fabio.terranova@kulmgroup.com`** sein (sonst blockt Vercel).

## Dienste

| Dienst | Wofuer | Login / URL | Zugang / wo liegt der Schluessel |
|---|---|---|---|
| **GitHub** | Code-Repo | github.com/FabioTerranova | GitHub-Login |
| **Vercel** | Hosting & Deploy | vercel.com | GitHub-Login; Env-Vars siehe unten |
| **Notion** | Datenbank (Mitglieder/Termine/Anwesenheiten) | notion.so | Integration „Community App" → Token als `NOTION_TOKEN` |
| **Resend** | News-/E-Mail-Versand | resend.com | API-Key → `RESEND_API_KEY` |

## Vercel-Umgebungsvariablen (Projekt `community-app`)

| Variable | Zweck | Pflicht |
|---|---|---|
| `NOTION_TOKEN` | Zugriff auf die Notion-Datenbanken | ✅ |
| `RESEND_API_KEY` | News-Mails versenden | ✅ (fuer News) |
| `NEWS_FROM` | Absender der News-Mails | optional (Default `onboarding@resend.dev`) |
| `NOTION_MEMBERS_DB_ID` | feste DB-ID Mitglieder | optional (sonst Auto-Suche) |
| `NOTION_EVENTS_DB_ID` | feste DB-ID Termine | optional |
| `NOTION_ATTENDANCE_DB_ID` | feste DB-ID Anwesenheiten | optional |

> Env-Var aendern: Vercel → Projekt → Settings → Environment Variables → **danach neu deployen**.

## Notion — Datenbanken (anzulegen)

- **Mitglieder**, **Termine**, **Anwesenheiten** — jeweils mit der Integration
  „Community App" **teilen** (••• → Verbindungen), sonst sieht die App sie nicht.
- **Diagnose:** `<deploy-url>/api/notion-check` (zeigt, welche DBs die Integration sieht).

## Kontakt / Identitaeten

- **Commit-Autor (Vercel-Freigabe):** fabio.terranova@kulmgroup.com

## Status / offen

- ✅ Grundgeruest + Backend voll implementiert (Mitglieder/Termine/Anwesenheit/News/Unterschrift)
- ✅ Beide Typechecks gruen, Web-Build baut
- ✅ GitHub-Repo (public) + erster Push
- ⬜ Vercel-Projekt importieren + Env-Vars setzen
- ⬜ Notion-Datenbanken anlegen + mit Integration teilen
- ⬜ Design (Farben/Screens/Navigation) — der bewusst aufgesparte Teil
