import type { ReactNode } from 'react';
import type { DataSource } from '../../../core/types';
import styles from '../../styles/panels.module.css';

/** Labeled form field wrapper. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

export interface DataSourceSelectProps {
  dataSources: DataSource[];
  value: string;
  onChange: (id: string) => void;
  allowEmpty?: boolean;
}

/** Select bound to a data source id. */
export function DataSourceSelect({
  dataSources,
  value,
  onChange,
  allowEmpty,
}: DataSourceSelectProps) {
  return (
    <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
      {allowEmpty && <option value="">(none)</option>}
      {dataSources.map((ds) => (
        <option key={ds.id} value={ds.id}>
          {ds.name}
        </option>
      ))}
    </select>
  );
}

/** Derive the set of field names present in an embedded data source's rows. */
export function embeddedFields(ds: DataSource | undefined): string[] {
  if (!ds || ds.type !== 'embedded' || ds.data.length === 0) return [];
  const keys = new Set<string>();
  for (const row of ds.data) {
    for (const key of Object.keys(row)) keys.add(key);
  }
  return [...keys];
}
