import type { ReactNode } from 'react';
import { View } from '@react-pdf/renderer';
import type { Block, KpiBlock } from '../../core/types';
import { usePdfReportContext } from './context';
import { PdfHeaderBlock } from './PdfHeaderBlock';
import { PdfTextBlock } from './PdfTextBlock';
import { PdfKpiBlock } from './PdfKpiBlock';
import { PdfTableBlock } from './PdfTableBlock';
import { PdfChartBlock } from './PdfChartBlock';
import { PdfDividerBlock } from './PdfDividerBlock';
import { PdfImageBlock } from './PdfImageBlock';
import { PdfSectionBlock } from './PdfSectionBlock';

/**
 * Renders a single block. Data-dependent blocks (kpi, table, chart) resolve
 * their data via the shared PDF context; sections recurse via `renderBlocks`.
 */
export function PdfBlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'header':
      return <PdfHeaderBlock props={block.props} />;
    case 'text':
      return <PdfTextBlock props={block.props} />;
    case 'kpi':
      return <PdfKpiBlock props={block.props} />;
    case 'table':
      return <PdfTableBlock props={block.props} />;
    case 'chart':
      return <PdfChartBlock props={block.props} />;
    case 'divider':
      return <PdfDividerBlock props={block.props} />;
    case 'image':
      return <PdfImageBlock props={block.props} />;
    case 'section':
      return (
        <PdfSectionBlock
          props={block.props}
          renderBlocks={(blocks) => <PdfBlockList blocks={blocks} />}
        />
      );
    default:
      return null;
  }
}

/**
 * Renders a list of blocks, grouping consecutive KPI blocks into a single
 * row (each card stretches to fill its share). This mirrors the viewer's
 * CSS-grid KPI layout, which places adjacent KPIs side by side.
 */
export function PdfBlockList({ blocks }: { blocks: Block[] }) {
  const { styles } = usePdfReportContext();
  const items: ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];
    if (block.type === 'kpi') {
      // Collect the run of consecutive KPI blocks.
      const run: KpiBlock[] = [];
      while (i < blocks.length) {
        const current = blocks[i];
        if (current.type !== 'kpi') break;
        run.push(current);
        i += 1;
      }
      items.push(
        <View key={`kpi-row-${run[0].id}`} style={styles.kpiRow}>
          {run.map((kpi) => (
            <PdfKpiBlock key={kpi.id} props={kpi.props} />
          ))}
        </View>,
      );
    } else {
      items.push(<PdfBlockRenderer key={block.id} block={block} />);
      i += 1;
    }
  }

  return <>{items}</>;
}
