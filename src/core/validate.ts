import Ajv, { type ErrorObject } from 'ajv';
import { reportSchema } from './schema';
import type { Report } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});

const validate = ajv.compile(reportSchema);

/**
 * Validate an unknown value against the ReportkitJs report schema.
 * Returns a list of human-readable errors (empty when valid).
 */
export function validateReport(report: unknown): ValidationResult {
  const ok = validate(report);
  if (ok) {
    return { valid: true, errors: [] };
  }
  const errors = (validate.errors ?? []).map(formatError);
  return { valid: false, errors };
}

/**
 * Like {@link validateReport} but throws on the first invalid report.
 */
export function assertValidReport(report: unknown): asserts report is Report {
  const result = validateReport(report);
  if (!result.valid) {
    throw new Error(`Invalid report: ${result.errors.join('; ')}`);
  }
}

function formatError(err: ErrorObject): string {
  const path = err.instancePath || '(root)';
  return `${path} ${err.message ?? 'is invalid'}`.trim();
}
