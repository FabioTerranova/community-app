/**
 * Design-Tokens — "Soft Premium".
 *
 * Leitidee: ruhiger, heller Canvas mit hauchzartem Verlauf; Inhalte liegen in
 * weichen Karten mit Schatten darauf. Die Markenfarbe ist nur AKZENT (Buttons,
 * aktive Zustaende, Hero) — nicht die ganze Flaeche. Das laesst die App
 * hochwertig statt "bunt/billig" wirken.
 *
 * Marke (JUHA – Jugendgruppe):
 *  - HELL  : Pink-Akzent auf fast-weissem, leicht rosé getoentem Grund
 *  - DUNKEL: Blau-Akzent auf tiefem Navy
 *
 * `spacing`/`radius`/`shadow` sind Theme-unabhaengig. Farben kommen zur Laufzeit
 * ueber `useTheme()` (siehe src/ThemeContext.tsx).
 */
import { Platform, type ViewStyle } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

/**
 * Maximale Breite des App-Inhalts. Am Handy fuellt die App den Screen; am PC/breiten
 * Browser wird der Inhalt auf diese Breite begrenzt und zentriert.
 */
export const APP_MAX_WIDTH = 460;

/** '#RGB'/'#RRGGBB' -> 'rgba(r,g,b,a)'. */
function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Weiche Schatten: Web ueber modernes boxShadow, iOS/Android nativ. */
export function shadow(
  color: string,
  level: 'sm' | 'md' | 'lg' = 'md',
): ViewStyle {
  const cfg = {
    sm: { radius: 8, y: 2, opacity: 0.1, elevation: 2 },
    md: { radius: 18, y: 8, opacity: 0.14, elevation: 6 },
    lg: { radius: 32, y: 16, opacity: 0.18, elevation: 12 },
  }[level];
  return Platform.select<ViewStyle>({
    web: { boxShadow: `0px ${cfg.y}px ${cfg.radius}px ${hexToRgba(color, cfg.opacity)}` } as ViewStyle,
    android: { elevation: cfg.elevation, shadowColor: color },
    default: {
      shadowColor: color,
      shadowOpacity: cfg.opacity,
      shadowRadius: cfg.radius,
      shadowOffset: { width: 0, height: cfg.y },
    },
  })!;
}

/** Alle Farb-Slots, die Screens/Components verwenden. Beide Paletten fuellen dieselben Keys. */
export interface Palette {
  /** Flaeche AUSSERHALB des App-Rahmens (nur am PC/breiten Screen sichtbar). */
  backdrop: string;
  background: string;
  /** Sanfter Hintergrund-Verlauf (2 Stops, oben -> unten). */
  bgGradient: [string, string];
  surface: string;
  /** Zweite Flaechen-Ebene (z.B. Chips, Filter, gedaempfte Karten). */
  surfaceAlt: string;
  muted: string;
  foreground: string;
  secondary: string;
  mutedForeground: string;
  border: string;
  borderStrong: string;
  /** Basis-Farbe fuer weiche Schatten (dunkel im Hellmodus, tief-schwarz im Dunkelmodus). */
  shadowColor: string;

  accent: string;
  accentForeground: string;
  accentSoft: string;
  brand2: string;
  /** Akzent-Verlauf (Buttons/Hero). */
  accentGradient: [string, string];

  /** Punkte-/Hero-Bereich (Gamification). */
  heroGradient: [string, string];
  heroBg: string;
  heroText: string;
  points: string;
  pointsSoft: string;

  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  gold: string;

  /** Dezente Toenung der Vers-Boxen — beide in der Theme-Akzentfarbe (hell=rosa,
   *  dunkel=blau), nur leicht unterschiedliche Schattierung zum Auseinanderhalten. */
  verseTintAt: string;
  verseTintNt: string;
}

/**
 * Diszipliniertes 4-Farben-System (bewusst KEINE Regenbogen-Kategorien):
 *  1) Ink      — Text (foreground/secondary/mutedForeground = eine Graustufen-Familie)
 *  2) Neutral  — Flaechen/Grund/Raender (background/surface/muted)
 *  3) Weiss    — Karten
 *  4) Akzent   — die EINE Markenfarbe (Buttons, aktive Zustaende, Hero)
 * Status (war da / nicht da / angemeldet) wird ueber Akzent vs. Neutral geloest,
 * nicht ueber zusaetzliche Ampelfarben -> wirkt ruhig und professionell.
 *
 * HELL — kuehler Neutral-Grund, Text-Ink, ein Pink-Akzent.
 */
export const lightPalette: Palette = {
  backdrop: '#E6E8EC',
  background: '#F5F6F8',
  bgGradient: ['#F8F9FB', '#EFF1F4'],
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F6',
  muted: '#ECEEF2',
  foreground: '#1A1D24',
  secondary: '#565C66',
  mutedForeground: '#8A909B',
  border: 'rgba(26,29,36,0.08)',
  borderStrong: 'rgba(26,29,36,0.16)',
  shadowColor: '#1A1D24',

  accent: '#DE3E79',
  accentForeground: '#FFFFFF',
  accentSoft: '#FBE7EF',
  brand2: '#DE3E79',
  accentGradient: ['#E9548C', '#D33470'],

  heroGradient: ['#E9548C', '#D33470'],
  heroBg: '#DE3E79',
  heroText: '#FFFFFF',
  points: '#DE3E79',
  pointsSoft: '#FBE7EF',

  // Status bewusst NUR Akzent/Neutral (keine Ampelfarben).
  success: '#DE3E79',
  successSoft: '#FBE7EF',
  warning: '#565C66',
  warningSoft: '#ECEEF2',
  danger: '#565C66',
  dangerSoft: '#ECEEF2',
  gold: '#DE3E79',

  verseTintAt: '#FCEDF2',
  verseTintNt: '#F6DAE6',
};

/**
 * DUNKEL — tiefes, kuehles Ink; ein Blau-Akzent, Karten leicht erhoeht.
 */
export const darkPalette: Palette = {
  backdrop: '#05070B',
  background: '#0E1117',
  bgGradient: ['#12151C', '#0C0E13'],
  surface: '#191D26',
  surfaceAlt: '#1F2430',
  muted: '#232834',
  foreground: '#EDEFF3',
  secondary: '#A2A9B6',
  mutedForeground: '#6E7686',
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.18)',
  shadowColor: '#000000',

  accent: '#5B8CFF',
  accentForeground: '#0B0E13',
  accentSoft: '#1C2740',
  brand2: '#5B8CFF',
  accentGradient: ['#5B8CFF', '#3E6EF0'],

  heroGradient: ['#5B8CFF', '#3E6EF0'],
  heroBg: '#4E7CF0',
  heroText: '#FFFFFF',
  points: '#7CA3FF',
  pointsSoft: '#1C2740',

  success: '#5B8CFF',
  successSoft: '#1C2740',
  warning: '#A2A9B6',
  warningSoft: '#232834',
  danger: '#A2A9B6',
  dangerSoft: '#232834',
  gold: '#5B8CFF',

  verseTintAt: '#1B2540',
  verseTintNt: '#243357',
};

export type ThemeMode = 'light' | 'dark';

export const palettes: Record<ThemeMode, Palette> = {
  light: lightPalette,
  dark: darkPalette,
};

/**
 * Bunte, aber deterministische Avatar-Farben (macht das Punkte-Sammeln freundlicher).
 * Gleicher Name -> gleiche Farbe.
 */
const AVATAR_COLORS = [
  '#FB5793', '#F2994A', '#27AE87', '#2D9CDB', '#9B51E0',
  '#E0A72B', '#EB5757', '#2653F5', '#EC6BB0', '#56C2B6',
];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
