/**
 * Laufzeit-Theme (Hell/Dunkel) via React-Context.
 * Components lesen die aktive Palette mit `useTheme()` -> Umschalten wirkt sofort ueberall.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
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
