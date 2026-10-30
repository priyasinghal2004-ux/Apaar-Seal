/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReasonCode, Severity, SeverityFactor } from '../types';

export interface SeverityCalculationResult {
  severity: Severity;
  score: number;
  factors: SeverityFactor[];
  ruleSummary: string;
}

/**
 * Transparent, deterministic severity derivation.
 * NO black-box or non-reproducible scoring.
 */
export function calculateExplainableSeverity(reasonCodes: ReasonCode[], contextDetails?: {
  pendingDays?: number;
  excessSeatsInBatch?: number;
}): SeverityCalculationResult {
  const factors: SeverityFactor[] = [];
  let score = 0;

  for (const code of reasonCodes) {
    switch (code) {
      case 'DUP_IDENTIFIER':
        factors.push({
          rule: 'RULE-RISK-01 (Identity Collision)',
          weight: 45,
          explanation: 'APAAR identifier is associated with multiple concurrent admissions or institutions.',
        });
        score += 45;
        break;

      case 'INTAKE_EXCEEDED':
        factors.push({
          rule: 'RULE-RISK-02 (Sanctioned Intake Breach)',
          weight: 40,
          explanation: 'Admission count exceeds sanctioned intake threshold after policy-directed supernumerary exemptions.',
        });
        score += 40;
        break;

      case 'STUDENT_DISPUTED':
        factors.push({
          rule: 'RULE-RISK-03 (Student Contestation)',
          weight: 35,
          explanation: 'Candidate submitted formal contestation stating non-application, fee grievance, or programme mismatch.',
        });
        score += 35;
        break;

      case 'STATE_CHANGE_UNSUPPORTED':
        factors.push({
          rule: 'RULE-RISK-04 (Procedural Irregularity)',
          weight: 30,
          explanation: 'State change attempted without requisite statutory authority or supporting order reference.',
        });
        score += 30;
        break;

      case 'EVIDENCE_CONFLICT':
        factors.push({
          rule: 'RULE-RISK-05 (External Records Mismatch)',
          weight: 25,
          explanation: 'Deterministic mismatch between institution reporting and central counselling / examination registry.',
        });
        score += 25;
        break;

      case 'STUDENT_PENDING_OVERDUE': {
        const days = contextDetails?.pendingDays || 35;
        factors.push({
          rule: 'RULE-RISK-06 (Confirmation Latency)',
          weight: 15,
          explanation: `Student confirmation remains unacknowledged for ${days} days (> 30-day statutory reconciliation window).`,
        });
        score += 15;
        break;
      }

      case 'EVIDENCE_UNAVAILABLE':
        factors.push({
          rule: 'RULE-RISK-07 (Uncertain External Verification)',
          weight: 10,
          explanation: 'Central verification portal was unreachable. Unverified status treated as uncertain, not adverse.',
        });
        score += 10;
        break;

      case 'APAAR_FORMAT_INVALID':
        factors.push({
          rule: 'RULE-RISK-08 (Malformed Identifier)',
          weight: 20,
          explanation: 'Reported APAAR fails standard 12-digit structural validation checks.',
        });
        score += 20;
        break;

      case 'RECORD_OK':
        break;
    }
  }

  let severity: Severity = 'LOW';
  if (score >= 40) {
    severity = 'HIGH';
  } else if (score >= 20) {
    severity = 'MEDIUM';
  } else {
    severity = 'LOW';
  }

  const ruleSummary = factors.length === 0
    ? 'Standard baseline - no risk factors detected.'
    : `Calculated from ${factors.length} explicit regulatory rules (cumulative score ${score}/100; High >= 40, Medium >= 20).`;

  return {
    severity,
    score,
    factors,
    ruleSummary,
  };
}
