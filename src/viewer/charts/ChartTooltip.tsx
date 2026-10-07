import { useState, type MouseEvent } from 'react';
import styles from '../styles/charts.module.css';

export interface TooltipEntry {
  label: string;
  value: string;
  color?: string;
}

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  entries: TooltipEntry[];
}

export const HIDDEN_TOOLTIP: TooltipState = {
  visible: false,
  x: 0,
  y: 0,
  title: '',
  entries: [],
};

/**
 * A floating tooltip positioned relative to the chart container.
 * The parent must be `position: relative`.
 */
export function ChartTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip.visible) return null;
  return (
    <div className={styles.tooltip} style={{ left: tooltip.x, top: tooltip.y }} role="tooltip">
      {tooltip.title && <div className={styles.tooltipTitle}>{tooltip.title}</div>}
      <ul className={styles.tooltipList}>
        {tooltip.entries.map((entry, i) => (
          <li key={i} className={styles.tooltipRow}>
            {entry.color && (
              <span className={styles.tooltipSwatch} style={{ background: entry.color }} />
            )}
            <span className={styles.tooltipLabel}>{entry.label}</span>
            <span className={styles.tooltipValue}>{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Hook managing tooltip state for a chart.
 * `show` receives container-relative coordinates.
 */
export function useChartTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>(HIDDEN_TOOLTIP);

  const show = (
    event: MouseEvent,
    title: string,
    entries: TooltipEntry[],
    container: HTMLElement | null,
  ) => {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: event.clientX - rect.left + 12,
      y: event.clientY - rect.top + 12,
      title,
      entries,
    });
  };

  const hide = () => setTooltip(HIDDEN_TOOLTIP);

  return { tooltip, show, hide };
}

export interface LegendItem {
  label: string;
  color: string;
}

/**
 * A horizontal legend row of colored swatches + labels.
 */
export function ChartLegend({ items }: { items: LegendItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className={styles.legend} role="list">
      {items.map((item) => (
        <span key={item.label} className={styles.legendItem} role="listitem">
          <span className={styles.legendSwatch} style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
