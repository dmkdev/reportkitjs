import { createContext, useContext } from 'react';
import type { ReportTheme } from '../../core/types';
import type { ResolvedTheme } from '../../core/defaults';

export interface ThemeContextValue {
  /** The raw theme from the report (may be partial). */
  theme: ReportTheme | undefined;
  /** Fully-resolved theme (defaults merged in). */
  resolved: ResolvedTheme;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Build the CSS custom properties for a resolved theme.
 * All variables are prefixed with `--rk-` to avoid collisions.
 */
export function themeToCssVars(theme: ResolvedTheme): Record<string, string> {
  const vars: Record<string, string> = {
    '--rk-primary': theme.primaryColor,
    '--rk-font-family': theme.fontFamily,
    '--rk-max-width': `${theme.maxWidth}px`,
    '--rk-bg': theme.colors.background,
    '--rk-surface': theme.colors.surface,
    '--rk-text': theme.colors.text,
    '--rk-text-muted': theme.colors.textMuted,
    '--rk-border': theme.colors.border,
  };
  theme.colors.chart.forEach((color, i) => {
    vars[`--rk-chart-${i}`] = color;
  });
  return vars;
}

/**
 * Access the current theme. Must be used inside a `<ThemeProvider>`.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
