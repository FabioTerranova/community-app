/**
 * Design-Tokens — PLATZHALTER (neutral, hell).
 *
 * Bewusst schlicht gehalten, weil das Design noch nicht steht. Beim Design-Schritt
 * werden diese Werte durch die echten Marken-/Community-Farben ersetzt (wie in der
 * zenit-alpine-app die Tokens 1:1 aus der Website kamen). Struktur bleibt gleich,
 * damit spaetere Screens/Components schon jetzt aus `theme` importieren koennen.
 */
export const colors = {
  background: '#FFFFFF',
  surface: '#F5F6F8',
  muted: '#ECEEF1',
  foreground: '#1A1D21',
  secondary: '#5B636D',
  mutedForeground: '#6B7280',
  accent: '#2F6FED',
  accentForeground: '#FFFFFF',
  border: 'rgba(0,0,0,0.10)',
  borderStrong: 'rgba(0,0,0,0.18)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
} as const;
