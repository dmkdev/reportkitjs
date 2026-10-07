import type { Block } from '../../core/types';
import { useReportDataContext } from '../hooks/useReportData';
import { HeaderBlock } from './HeaderBlock';
import { TextBlock } from './TextBlock';
import { KpiBlock } from './KpiBlock';
import { TableBlock } from './TableBlock';
import { ChartBlock } from './ChartBlock';
import { DividerBlock } from './DividerBlock';
import { ImageBlock } from './ImageBlock';
import { SectionBlock } from './SectionBlock';
import styles from '../styles/blocks.module.css';

export interface BlockRendererProps {
  block: Block;
}

/**
 * Renders a single block. Data-dependent blocks (kpi, table, chart) resolve
 * their data via the report's centralized data context; sections recurse
 * via `renderBlocks`.
 */
export function BlockRenderer({ block }: BlockRendererProps) {
  switch (block.type) {
    case 'header':
      return <HeaderBlock props={block.props} />;
    case 'text':
      return <TextBlock props={block.props} />;
    case 'kpi':
      return <KpiBlock props={block.props} />;
    case 'table':
      return <TableBlockWithSource props={block.props} />;
    case 'chart':
      return <ChartBlock props={block.props} />;
    case 'divider':
      return <DividerBlock props={block.props} />;
    case 'image':
      return <ImageBlock props={block.props} />;
    case 'section':
      return (
        <SectionBlock
          props={block.props}
          renderBlocks={(blocks) => (
            <div className={styles.sectionBlocks}>
              {blocks.map((b) => (
                <BlockRenderer key={b.id} block={b} />
              ))}
            </div>
          )}
        />
      );
    default:
      return null;
  }
}

/**
 * Resolves a table's data source (embedded or external) via the report's
 * centralized data context and renders the table.
 */
function TableBlockWithSource({ props }: { props: Extract<Block, { type: 'table' }>['props'] }) {
  const { getSource } = useReportDataContext();
  const { data, loading, error } = getSource(props.dataSourceId);

  if (loading) return <div className={styles.loading}>Loading data…</div>;
  if (error) return <div className={styles.error}>Failed to load data: {error}</div>;
  return <TableBlock props={props} data={data} />;
}
