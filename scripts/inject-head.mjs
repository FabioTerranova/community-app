// Nachbearbeitung des Expo-Web-Exports: macht aus dist/ eine "installierbare"
// Web-App, die am iPhone-/Android-Homescreen wie eine echte App wirkt:
//  - Standalone (keine Browser-Leiste) via Web-App-Manifest + apple-Meta-Tags
//  - Statusleiste/Safe-Areas nehmen die App-Hintergrundfarbe an (kein weisser Rand)
//  - theme-color hell/dunkel passend zum Theme
import { readFileSync, writeFileSync } from 'node:fs';

// Ziel-Ordner optional per Argument (Standard: dist) — praktisch fuer lokale Tests.
const dir = process.argv[2] || 'dist';
const path = `${dir}/index.html`;
let html = readFileSync(path, 'utf8');

// App-Hintergrundfarben (aus src/theme.ts – Soft Premium).
const BG_LIGHT = '#F5F6F8';
const BG_DARK = '#0E1117';

html = html.replace('<html lang="en">', '<html lang="de">');

html = html.replace(
  /<meta name="viewport"[^>]*\/>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);

if (!html.includes('name="theme-color"')) {
  const inject = `    <meta name="theme-color" media="(prefers-color-scheme: light)" content="${BG_LIGHT}" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="${BG_DARK}" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="CGS Community" />
    <link rel="manifest" href="./manifest.webmanifest" />
    <link rel="apple-touch-icon" href="./favicon.ico" />
    <style>
      html, body { background: ${BG_LIGHT}; }
      @media (prefers-color-scheme: dark) { html, body { background: ${BG_DARK}; } }
      /* Safe-Areas in der App-Hintergrundfarbe -> Statusleiste/Footer verschmelzen. */
      #root { min-height: 100vh; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
    </style>
  </head>`;
  html = html.replace('</head>', inject);
}

writeFileSync(path, html);

// Web-App-Manifest schreiben (macht "Zum Home-Bildschirm" zu einer Standalone-App).
const manifest = {
  name: 'CGS Community',
  short_name: 'CGS',
  description: 'Gemeinschaft leben – Termine, Anmeldung, Teilnahme.',
  lang: 'de',
  start_url: '.',
  scope: '.',
  display: 'standalone',
  orientation: 'portrait',
  background_color: BG_LIGHT,
  theme_color: BG_LIGHT,
  icons: [
    { src: './favicon.ico', sizes: '48x48 64x64 96x96', type: 'image/x-icon' },
  ],
};
writeFileSync(`${dir}/manifest.webmanifest`, JSON.stringify(manifest, null, 2));

console.log('inject-head: Standalone-Meta-Tags + manifest.webmanifest geschrieben.');
