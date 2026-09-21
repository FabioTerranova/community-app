# community-app — Stack & Zugaenge (Uebersicht)

> Zentrale Uebersicht aller genutzten Dienste, Repos, Domains und Einstellungen.
> **Keine Passwoerter/Keys hier ablegen** (die liegen als Umgebungsvariablen bei
> Vercel bzw. lokal in `.env`, die gitignored ist).

## Projekt

| Projekt | Ort (lokal) | GitHub | Vercel-Projekt | Domain |
|---|---|---|---|---|
| **community-app** (JUHA) | `C:\dev\Privat\community-app` | `FabioTerranova/community-app` | community-app | **juha.app** |

**App-URL:** https://juha.app (auch `www.juha.app`) · Fallback/Deploy-URL: `community-app-flame-two.vercel.app`

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
| `RESEND_API_KEY` | Login-/News-Mails versenden | ✅ |
| `NEWS_FROM` | Absender der Login-/News-Mails → **`login@juha.app`** | ✅ (Domain `juha.app` in Resend verifiziert) |
| `AUTH_SECRET` | signiert Session-Token + Login-Codes | ✅ |
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
- ✅ GitHub-Repo (public) + Vercel-Deploy live
- ✅ Notion angebunden — 4 DBs verbunden (Mitglieder, Termine, Anwesenheiten, Push-Abos)
- ✅ Design + Screens live (JUHA-Branding, Login, Home/Termine/Rangliste/Admin, Push)
- ✅ **Domain `juha.app`**: App-URL + E-Mail-Absender (`login@juha.app`), Login fuer JEDE E-Mail
- ✅ Login per 6-stelligem Code (kein Link — iPhone-PWA-tauglich), Session-Dauer 1 Jahr;
  Admin = Checkbox „Admin" in DB „Mitglieder"
