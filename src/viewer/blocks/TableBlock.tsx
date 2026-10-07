import { useMemo, useState } from 'react';
import type { TableProps } from '../../core/types';
import { formatNumber } from '../../core/utils';
import styles from '../styles/blocks.module.css';

const ALIGN_CLASS = {
  left: undefined,
  center: styles.alignCenter,
  right: styles.alignRight,
} as const;

function formatCell(value: unknown, format?: string, currency?: string): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' && format) {
    return formatNumber(value, format as never, currency);
  }
  return String(value);
}

export function TableBlock({
  props,
  data,
}: {
  props: TableProps;
  data: Record<string, unknown>[];
}) {
  const [page, setPage] = useState(0);
  const pageSize = props.pagination?.pageSize;

  const pageCount = pageSize ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;
  const safePage = Math.min(page, pageCount - 1);

  const rows = useMemo(() => {
    if (!pageSize) return data;
    const start = safePage * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, pageSize, safePage]);

  return (
    <div>
      {props.title && <p className={styles.tableTitle}>{props.title}</p>}
      <div className={styles.tableWrap}>
        {data.length === 0 ? (
          <div className={styles.tableEmpty}>No data</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                {props.columns.map((col) => (
                  <th key={col.field} className={ALIGN_CLASS[col.align ?? 'left']}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {props.columns.map((col) => (
                    <td key={col.field} className={ALIGN_CLASS[col.align ?? 'left']}>
                      {formatCell(row[col.field], col.format, col.currency)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {pageSize && data.length > pageSize && (
        <div className={styles.pagination}>
          <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
            ← Prev
          </button>
          <span>
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
