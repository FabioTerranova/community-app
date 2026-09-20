# 🔔 Push-Erinnerungen (2h vor Termin) — Einrichtung

Web-Push: Wer sich für einen Termin anmeldet und die **Glocke** antippt, bekommt
~2 Stunden vor Beginn ein **Popup aufs Handy**. Der Code ist fertig — es fehlen nur
noch drei externe Schritte (deine Konten).

## Wie es funktioniert
1. **Glocke an** (Startseite, bei angemeldeten Terminen) → Browser fragt nach Erlaubnis,
   legt ein Push-Abo an und meldet es beim Backend (`/api/push`) an → gespeichert in
   der Notion-DB **„Push-Abos"**.
2. Ein **externer Cron** ruft alle ~15 min `/api/push-cron` auf. Der Endpunkt sucht Abos,
   deren Termin in den nächsten 2 h startet, verschickt das Push und markiert sie als
   „Gesendet" (kein Doppelversand).
3. Der **Service-Worker** (`public/sw.js`) zeigt das Popup an — auch wenn die App
   geschlossen ist.

## Schritt 1 — VAPID-Schlüssel erzeugen und bei Vercel eintragen
Schlüsselpaar erzeugen:

```
npx web-push generate-vapid-keys
```

Die zwei Werte (publicKey/privateKey) NUR bei **Vercel → Settings → Environment
Variables** eintragen — **niemals ins Repo committen** (Private-Key ist geheim!):

```
VAPID_PUBLIC_KEY   = <publicKey aus dem Befehl>
VAPID_PRIVATE_KEY  = <privateKey aus dem Befehl>   # geheim, nur bei Vercel
VAPID_SUBJECT      = mailto:fabio.terranova@kulmgroup.com
CRON_SECRET        = <ein-langes-zufaelliges-geheimnis-ausdenken>
```

> ⚠️ Der **Private-Key** darf nur bei Vercel liegen. Falls er je in ein Repo/Chat
> gelangt ist, mit dem Befehl oben ein **frisches Paar** erzeugen und das alte verwerfen.

## Schritt 2 — Notion-DB „Push-Abos" anlegen
Neue Notion-Datenbank anlegen, deren **Titel „Push"** (oder „Erinnerung"/„Abo") enthält,
und **mit der Integration teilen** (••• → Verbindungen). Die Spalten legt die App beim
ersten Aufruf selbst an (Mitglied, Termin, Termin-Datum, Endpoint, Keys, Gesendet).

## Schritt 3 — Externer Cron (gratis, z.B. cron-job.org)
Einen Job anlegen, der **alle 15 Minuten** diese URL aufruft (GET):

```
https://<deine-vercel-url>/api/push-cron?key=<CRON_SECRET>
```

Der `key` muss exakt dem `CRON_SECRET` oben entsprechen, sonst antwortet der Endpunkt
mit `401`. Antwort bei Erfolg: `{ ok:true, checked, sent, failed, skipped }`.

## Wichtig / Grenzen
- 📱 **iPhone**: Web-Push geht **nur**, wenn die App über Safari **„Zum Home-Bildschirm"**
  hinzugefügt wurde (iOS 16.4+). Im normalen Safari-Tab kommt **kein** Popup.
  Desktop-Chrome/Edge/Firefox und Android-Chrome funktionieren auch im Browser.
- 🕐 **Termin-Uhrzeit**: Für „2 h vorher" braucht ein Termin idealerweise eine Uhrzeit.
  Hat ein Termin nur ein Datum, nimmt der Cron **19:00 Uhr** als Beginn an
  (Konstante `DEFAULT_HOUR` in `api/push-cron.ts`).
- 🧪 **Lokal testen**: Unter `npm run web` (localhost gilt als „secure context") lässt sich
  die Erlaubnis/Registrierung testen; der eigentliche Versand braucht das Deployment
  (Cron + Notion + VAPID-Env-Vars).

## Beteiligte Dateien
- `public/sw.js` — Service-Worker (zeigt das Popup)
- `src/logic/push.ts` — Client (Erlaubnis, Abo, an-/abmelden)
- `api/push.ts` — Public-Key ausliefern + Abo speichern/entfernen (Notion)
- `api/push-cron.ts` — zeitgesteuerter Versand (~2h vorher)
- `api/_lib/schema.ts` — Notion-DB-Konfig „Push-Abos" (`PUSH`)
- `App.tsx` — Glocke ruft `enablePushForEvent` / `disablePushForEvent`
