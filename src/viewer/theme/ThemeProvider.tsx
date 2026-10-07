import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { ReportTheme } from '../../core/types';
import { resolveTheme } from '../../core/defaults';
import { ThemeContext, themeToCssVars, type ThemeContextValue } from './themeContext';

export interface ThemeProviderProps {
  theme?: ReportTheme;
  children: ReactNode;
}

/**
 * Provides the resolved theme to descendants via context and sets
 * CSS custom properties on a wrapper element.
 */
export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const value = useMemo<ThemeContextValue>(() => {
    const resolved = resolveTheme(theme);
    return { theme, resolved };
  }, [theme]);

  const style = useMemo(() => themeToCssVars(value.resolved) as CSSProperties, [value.resolved]);

  return (
    <ThemeContext.Provider value={value}>
      <div style={style}>{children}</div>
    </ThemeContext.Provider>
  );
}
