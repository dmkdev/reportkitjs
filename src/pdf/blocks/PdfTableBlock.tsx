import { Text, View } from '@react-pdf/renderer';
import type { TableProps } from '../../core/types';
import { formatNumber } from '../../core/utils';
import { usePdfReportContext } from './context';

function formatCell(value: unknown, format?: string, currency?: string): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' && format) {
    return formatNumber(value, format as never, currency);
  }
  return String(value);
}

/**
 * Renders a table block. react-pdf has no `Table` component, so the table is
 * built from `View` rows with equal-width (`flex: 1`) `Text` cells.
 *
 * Unlike the interactive viewer, pagination is ignored: a PDF is a static
 * document, so all rows are rendered and flow across pages.
 */
export function PdfTableBlock({ props }: { props: TableProps }) {
  const { data, styles } = usePdfReportContext();
  const rows = data.rows[props.dataSourceId] ?? [];
  const error = data.errors[props.dataSourceId];

  if (error) {
    return <Text style={styles.error}>Failed to load data: {error}</Text>;
  }

  return (
    <View>
      {props.title && <Text style={styles.tableTitle}>{props.title}</Text>}
      {rows.length === 0 ? (
        <Text style={styles.tableEmpty}>No data</Text>
      ) : (
        <View style={styles.table}>
          <View style={{ flexDirection: 'row' }}>
            {props.columns.map((col) => (
              <Text
                key={col.field}
                style={[styles.tableHeaderCell, { flex: 1, textAlign: col.align ?? 'left' }]}
              >
                {col.label}
              </Text>
            ))}
          </View>
          {rows.map((row, i) => (
            <View key={i} style={{ flexDirection: 'row' }}>
              {props.columns.map((col) => (
                <Text
                  key={col.field}
                  style={[styles.tableCell, { flex: 1, textAlign: col.align ?? 'left' }]}
                >
                  {formatCell(row[col.field], col.format, col.currency)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
