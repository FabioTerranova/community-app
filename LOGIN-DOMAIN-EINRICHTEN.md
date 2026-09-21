# 📧 Login für ALLE E-Mails freischalten — eigene JUHA-Domain (Cloudflare + Resend)

> **Warum das nötig ist:** Der Login verschickt einen „Magic-Link" per E-Mail (über **Resend**).
> Mit dem Test-Absender `onboarding@resend.dev` stellt Resend **nur an deine eigene
> Konto-Adresse** (Hotmail) zu. Damit **jede** E-Mail sich einloggen kann, brauchen wir einen
> Absender auf einer **in Resend verifizierten Domain**. Am **Code muss nichts** geändert werden.
>
> **Gewählter Weg:** eigene, **eigenständige** Domain nur für JUHA (z. B. `juha-jugend.ch`
> oder `.com`), DNS in Cloudflare, Domain in einem JUHA-eigenen Resend-Konto verifizieren.

**Aufwand:** ~20 Min + etwas DNS-Wartezeit. Kosten: ~10–15 CHF/Jahr je nach Endung.

> ℹ️ **Wichtig – ein eigenes JUHA-Resend-Konto:** JUHA ist ein **eigenständiges Projekt**.
> Die Domain muss in **genau dem** Resend-Konto verifiziert werden, dessen **`RESEND_API_KEY`**
> bei der community-app auf **Vercel** hinterlegt ist. Am saubersten: ein **eigenes Resend-Konto
> für JUHA** anlegen (resend.com), dort die Domain verifizieren und den API-Key von dort nehmen.
> (Nichts wird mit anderen Projekten geteilt.)

---

## Teil A — Domain registrieren

**Namen wählen:** kurz & passend, z. B. `juha-jugend.ch`, `juha-app.com`, `juhagruppe.org`.

Zwei Wege, je nach gewünschter Endung:

### A1 — `.com` / `.org` / `.net` / `.app` → direkt bei Cloudflare (am einfachsten)
Cloudflare kann diese Endungen **direkt verkaufen** (zum Selbstkostenpreis) und die DNS liegt
dann automatisch dort — keine Nameserver-Umstellung nötig.
1. **dash.cloudflare.com** einloggen (dein Cloudflare-Konto — die JUHA-Domain wird dort eine
   **eigene, separate Zone**, nichts wird mit anderen Domains vermischt).
2. Links **„Domain Registration" → „Register Domains"**.
3. Wunschnamen suchen → kaufen. Fertig — die Domain ist sofort in Cloudflare als „Zone" da.

### A2 — `.ch` (oder Endung, die Cloudflare nicht verkauft)
Cloudflare Registrar führt **kein `.ch`**. Also:
1. `.ch` bei einem Schweizer Registrar kaufen (z. B. **Infomaniak**, **Hostpoint**, **Gandi**).
2. In **Cloudflare** oben **„Add a site"** → Domain eintragen → **Free**-Plan.
3. Cloudflare zeigt dir **2 Nameserver** (z. B. `xxx.ns.cloudflare.com`).
4. Beim Registrar (wo du `.ch` gekauft hast) die **Nameserver** auf diese beiden ändern.
5. Warten, bis Cloudflare die Domain als **„Active"** meldet (Minuten bis paar Stunden).

> Ergebnis beider Wege: Die Domain liegt in **Cloudflare** und du kannst dort DNS-Einträge
> anlegen (Teil B braucht das).

---

## Teil B — Domain in Resend hinzufügen & DNS in Cloudflare setzen

1. **resend.com** einloggen — das **JUHA-Resend-Konto**, dessen `RESEND_API_KEY` bei der
   community-app auf Vercel liegt (siehe Hinweis oben).
2. Links **„Domains" → „Add Domain"**.
3. Deine JUHA-Domain eintragen → Region **EU (Ireland)** → **„Add"**.
4. Resend zeigt eine **Liste DNS-Einträge** (typisch: 1× **MX**, 1–2× **TXT** (SPF/DKIM),
   evtl. **DMARC**). ⚠️ **Deine Werte sind individuell** — immer die aus **Resend** nehmen.

5. **Diese Einträge in Cloudflare anlegen:**
   Cloudflare → deine Domain (Zone) → **„DNS" → „Records" → „Add record"**. Für jeden
   Resend-Eintrag:
   - **Type**: wie in Resend (MX / TXT).
   - **Name**: den **Namen-Teil** eintragen, den Resend zeigt — bei Cloudflare **ohne**
     die eigene Domain. Beispiel: zeigt Resend `send.juha-jugend.ch`, trägst du in Cloudflare
     nur **`send`** ein. Zeigt Resend `resend._domainkey.juha-jugend.ch`, dann
     **`resend._domainkey`**. (Für „root" nimmt Cloudflare `@`.)
   - **Content / Target**: exakt aus Resend kopieren (DKIM-TXT ist sehr lang → **komplett**).
   - **Priority** (nur MX): die Zahl von Resend (meist `10`).
   - **Proxy status**: ⚠️ **„DNS only" (graue Wolke!)** — NICHT proxen. E-Mail-DNS darf nie
     durch den Cloudflare-Proxy. (Klick auf die orange Wolke, bis sie grau ist.)
   - **Save**. Nächsten Eintrag anlegen.

6. Zurück in Resend **„Verify"** klicken → Status wird **grün („Verified")**, sobald DNS
   greift (bei Cloudflare oft in 1–5 Min). Bei „Pending" kurz warten, nochmal „Verify".

> 💡 Cloudflare-DNS greift meist sehr schnell. Prüfen: https://dnschecker.org (Typ TXT/MX).

---

## Teil C — Absender in der App setzen (Vercel)

1. **vercel.com** → Projekt **community-app** → **Settings → Environment Variables**.
2. **`NEWS_FROM`** (bearbeiten oder neu anlegen):
   - **Value**: Adresse **auf deiner neuen Domain**, z. B. `login@juha-jugend.ch`
     oder `no-reply@juha-jugend.ch`. (Das Postfach muss **nicht** existieren.)
   - Environments: **Production** (am besten alle drei ankreuzen).
3. Prüfen, dass auch **`RESEND_API_KEY`** und **`AUTH_SECRET`** gesetzt sind (siehe Tabelle unten).
4. **Speichern** → **Redeploy**: Deployments-Tab → neuester Deploy → **„…" → „Redeploy"**
   (oder ein kleiner `git push` auf `main`).

---

## Teil D — Testen

1. App öffnen → **Login** mit einer **fremden** E-Mail (z. B. Adresse eines Kollegen).
2. Im Postfach sollte **„Dein JUHA-Login"** ankommen (auch **Spam** prüfen).
3. **„Jetzt anmelden"** → sollte einloggen. 🎉

**Wenn nichts ankommt — Checkliste:**
- Resend → Domains: Domain wirklich **„Verified"** (grün)?
- Resend → **„Emails"** (Logs): Sendeversuch sichtbar? `Delivered` / `Bounced`?
  - `Bounced` → Empfängeradresse falsch.
  - kein Eintrag → App sendet nicht → `RESEND_API_KEY`/`NEWS_FROM` prüfen, Redeploy gemacht?
- `NEWS_FROM` = Adresse **@deiner verifizierten JUHA-Domain**? Und dieselbe Resend-Konto-Zugehörigkeit
  wie der `RESEND_API_KEY` auf Vercel?
- DNS-Einträge in Cloudflare auf **„DNS only" (grau)**, nicht proxied?
- Spam-/Junk-Ordner beim Empfänger?

---

## Kurz-Referenz — Vercel-Env-Vars (community-app)

| Variable | Wert | Zweck |
|---|---|---|
| `RESEND_API_KEY` | (aus dem **JUHA-Resend-Konto**, in dem die Domain verifiziert ist) | E-Mail-Versand |
| `NEWS_FROM` | `login@deine-juha-domain` | Absender der Login-/News-Mails |
| `AUTH_SECRET` | langer Zufallswert | signiert Login-/Session-Token |
| `NOTION_TOKEN` | (aus Notion) | Mitglieder/Termine speichern |

> **Merksatz:** Eigene JUHA-Domain in **Cloudflare** → in **JUHA-Resend-Konto** verifizieren
> (DNS, „DNS only"!) → **`NEWS_FROM`** auf diese Domain → **Redeploy**. Danach kann sich jede
> E-Mail einloggen.
