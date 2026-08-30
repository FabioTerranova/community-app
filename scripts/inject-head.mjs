// Nachbearbeitung des Expo-Web-Exports: ergaenzt Meta-Tags in dist/index.html,
// damit die Web-App am iPhone-Homescreen ordentlich aussieht (Statusleiste,
// Safe-Area). Farben sind Platzhalter und werden beim Design angepasst.
import { readFileSync, writeFileSync } from 'node:fs';

const path = 'dist/index.html';
let html = readFileSync(path, 'utf8');

html = html.replace('<html lang="en">', '<html lang="de">');

html = html.replace(
  /<meta name="viewport"[^>]*\/>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);

if (!html.includes('name="theme-color"')) {
  const inject = `    <meta name="theme-color" content="#FFFFFF" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Community" />
    <style>#root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}</style>
  </head>`;
  html = html.replace('</head>', inject);
}

writeFileSync(path, html);
console.log('inject-head: Meta-Tags in dist/index.html eingefuegt.');
