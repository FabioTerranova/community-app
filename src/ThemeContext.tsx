/**
 * Laufzeit-Theme (Hell/Dunkel) via React-Context.
 * Components lesen die aktive Palette mit `useTheme()` -> Umschalten wirkt sofort ueberall.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { palettes, type Palette, type ThemeMode } from './theme';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: Palette;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initial = 'light',
}: {
  children: React.ReactNode;
  initial?: ThemeMode;
}) {
  const [mode, setMode] = useState<ThemeMode>(initial);
  const toggle = useCallback(() => setMode((m) => (m === 'light' ? 'dark' : 'light')), []);

  // Web/PWA: Grundfarbe des GANZEN Screens (html/body + Statusleiste) an das Theme
  // koppeln -> randlos einheitlich in Hell (pink) UND Dunkel (blau), auch beim
  // Ueberscrollen und hinter Notch/Home-Indikator. Auf Nativ ist `document` undefined.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const bg = palettes[mode].background;
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, colors: palettes[mode], toggle, setMode }),
    [mode, toggle],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme muss innerhalb von <ThemeProvider> genutzt werden');
  return ctx;
}
