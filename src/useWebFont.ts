/**
 * Laedt "Plus Jakarta Sans" fuer die Web-Ansicht (Vercel + lokale Vorschau) und
 * setzt sie als Basis-Schrift der App. Bewusst als eine CSS-Familie mit allen
 * Gewichten -> `fontWeight` in den Styles ergibt echte Schnitte (kein Fake-Bold).
 *
 * Auf nativem Expo (iPhone) faellt es auf die System-Schrift zurueck (ready=true
 * sofort); dort koennte man spaeter `@expo-google-fonts/...` nachruesten.
 *
 * Der Scope `#root *` gewinnt per Spezifitaet gegen die Default-Styles von
 * react-native-web, ohne `!important`. Emojis bleiben unberuehrt (eigene Fallback-Font).
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const FAMILY = 'Plus Jakarta Sans';
const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
const STACK = `'${FAMILY}', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;

export function useWebFont(): boolean {
  // Nativ: sofort bereit (System-Schrift). Web: warten bis die Schrift da ist.
  const [ready, setReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const d = document;

    const preconnect = (href: string, cors?: boolean) => {
      const l = d.createElement('link');
      l.rel = 'preconnect';
      l.href = href;
      if (cors) l.crossOrigin = 'anonymous';
      d.head.appendChild(l);
    };
    preconnect('https://fonts.googleapis.com');
    preconnect('https://fonts.gstatic.com', true);

    const link = d.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_URL;
    d.head.appendChild(link);

    const style = d.createElement('style');
    style.textContent = `#root, #root * { font-family: ${STACK}; }`;
    d.head.appendChild(style);

    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };

    const anyDoc = d as any;
    if (anyDoc.fonts?.load) {
      Promise.all([
        anyDoc.fonts.load(`400 1em '${FAMILY}'`),
        anyDoc.fonts.load(`600 1em '${FAMILY}'`),
        anyDoc.fonts.load(`800 1em '${FAMILY}'`),
      ])
        .then(finish)
        .catch(finish);
    } else {
      finish();
    }
    // Sicherheitsnetz, falls das Netz haengt: nach 1.5s trotzdem starten.
    const t = setTimeout(finish, 1500);
    return () => clearTimeout(t);
  }, []);

  return ready;
}
