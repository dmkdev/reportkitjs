import { useEffect, useRef, useState, type RefObject } from 'react';
import { DEFAULT_CHART } from './scales';
import { computeChartLayout, type ChartLayout } from './layout';
import type { BaseChartProps } from './types';

export interface ChartLayoutWithRef extends ChartLayout {
  /** Attach to the wrapping div so the chart can measure its width. */
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Shared layout computation for cartesian charts (line/bar).
 * Measures the container width via ResizeObserver and falls back
 * to the default width when unavailable (SSR, jsdom).
 */
export function useChartLayout(props: BaseChartProps): ChartLayoutWithRef {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(DEFAULT_CHART.width);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setWidth(Math.round(w));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layout = computeChartLayout(props, width);

  return { ...layout, containerRef };
}
