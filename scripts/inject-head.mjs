// Nachbearbeitung des Expo-Web-Exports: macht aus dist/ eine "installierbare"
// Web-App, die am iPhone-/Desktop-Homescreen wie eine echte App wirkt:
//  - Eigenes App-Icon (JUHA-Taube auf Marken-Verlauf) via manifest + apple-touch-icon
//  - Standalone (keine Browser-Leiste)
//  - Fensterrahmen / Statusleiste / Safe-Areas in Marken-Farbe (NICHT weiss)
import { readFileSync, writeFileSync } from 'node:fs';

// Ziel-Ordner optional per Argument (Standard: dist) — praktisch fuer lokale Tests.
const dir = process.argv[2] || 'dist';
const path = `${dir}/index.html`;
let html = readFileSync(path, 'utf8');

// Marken-Farben (aus src/theme.ts – Akzent Pink). Chrome bewusst in Markenfarbe,
// damit Titelleiste/Statusleiste/Safe-Areas nicht weiss sind.
const ACCENT = '#DE3E79';
const ACCENT_1 = '#E9548C';
const ACCENT_2 = '#D33470';

// App-Icon als SVG (Taube auf Marken-Verlauf, mit Sicherheitsrand fuer "maskable").
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ACCENT_1}"/>
      <stop offset="1" stop-color="${ACCENT_2}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <g transform="translate(128,128) scale(5.333)">
    <path d="M40 12c-3 0-6 1.5-8.5 4.5C29 20 27 24 21 24c-4.5 0-7-2-9-4 0 6 3.5 11 10 12l-3.5 5.5c-.5.8.1 1.8 1 1.7l6-.7c7.5-1 13-7.2 13-15V13c0-.7-.8-1.2-1.4-.8L40 12Z" fill="#FFFFFF"/>
    <circle cx="33" cy="17.5" r="1.3" fill="${ACCENT_2}"/>
  </g>
</svg>`;
writeFileSync(`${dir}/icon.svg`, ICON_SVG);

html = html.replace('<html lang="en">', '<html lang="de">');

html = html.replace(
  /<meta name="viewport"[^>]*\/>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);

if (!html.includes('name="theme-color"')) {
  const inject = `    <meta name="theme-color" content="${ACCENT}" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="JUHA" />
    <link rel="manifest" href="./manifest.webmanifest" />
    <link rel="icon" type="image/svg+xml" href="./icon.svg" />
    <link rel="apple-touch-icon" href="./icon.svg" />
    <style>
      /* Rahmen/Safe-Areas in Marken-Farbe -> Header/Footer nicht weiss. */
      html, body { background: ${ACCENT}; }
      #root { min-height: 100vh; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
    </style>
  </head>`;
  html = html.replace('</head>', inject);
}

writeFileSync(path, html);

// Web-App-Manifest schreiben (macht "Zum Home-Bildschirm" zu einer Standalone-App).
const manifest = {
  name: 'JUHA',
  short_name: 'JUHA',
  description: 'Jugendgruppe – Termine, Anmeldung, Teilnahme.',
  lang: 'de',
  start_url: '.',
  scope: '.',
  display: 'standalone',
  orientation: 'portrait',
  background_color: ACCENT,
  theme_color: ACCENT,
  icons: [
    { src: './icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    { src: './icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
  ],
};
writeFileSync(`${dir}/manifest.webmanifest`, JSON.stringify(manifest, null, 2));

console.log('inject-head: Icon + Standalone-Meta-Tags + manifest.webmanifest geschrieben.');
