import { blockTypeLabels } from '../../core/defaults';
import { useEditorStore, findBlockDeep } from '../store/editorStore';
import styles from '../styles/panels.module.css';
import { ChartForm } from './forms/ChartForm';
import { DividerForm } from './forms/DividerForm';
import { HeaderForm } from './forms/HeaderForm';
import { ImageForm } from './forms/ImageForm';
import { KpiForm } from './forms/KpiForm';
import { SectionForm } from './forms/SectionForm';
import { TableForm } from './forms/TableForm';
import { TextForm } from './forms/TextForm';

/**
 * Right-hand panel: shows the property form for the currently selected
 * block, or a hint when nothing is selected.
 */
export function PropertiesPanel() {
  const report = useEditorStore((s) => s.report);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);

  const block = selectedBlockId ? findBlockDeep(report.blocks, selectedBlockId) : undefined;

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Properties</h2>
      {!block ? (
        <div className={styles.empty}>Select a block on the canvas to edit its properties.</div>
      ) : (
        <>
          <span className={styles.badge}>{blockTypeLabels[block.type]}</span>
          {block.type === 'header' && <HeaderForm id={block.id} props={block.props} />}
          {block.type === 'text' && <TextForm id={block.id} props={block.props} />}
          {block.type === 'kpi' && <KpiForm id={block.id} props={block.props} />}
          {block.type === 'table' && <TableForm id={block.id} props={block.props} />}
          {block.type === 'chart' && <ChartForm id={block.id} props={block.props} />}
          {block.type === 'divider' && <DividerForm id={block.id} props={block.props} />}
          {block.type === 'image' && <ImageForm id={block.id} props={block.props} />}
          {block.type === 'section' && <SectionForm id={block.id} props={block.props} />}
        </>
      )}
    </div>
  );
}
