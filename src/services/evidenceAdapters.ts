/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvidenceRecord, EvidenceSourceType, EvidenceStatus } from '../types';

export interface ExternalAdapterResponse {
  sourceType: EvidenceSourceType;
  sourceSystemName: string;
  status: EvidenceStatus;
  reference: string;
  checkedAt: string;
  discrepancyNote?: string;
  disclaimer: string;
}

/**
 * COMPLIANCE MANDATE:
 * Missing evidence or non-response represents 'uncertain / pending' regulatory status,
 * NEVER proof of wrongdoing. Adverse determinations require documented human review.
 */
export const EVIDENCE_COMPLIANCE_FOOTNOTE =
  'Statutory Notice: Missing evidence or non-responsive verification endpoints represent an uncertain regulatory status pending manual reconciliation. They shall not be construed as prima facie proof of fraudulent admission or regulatory culpability.';

/**
 * Deterministic external evidence adapter query
 */
export function queryExternalEvidenceAdapter(
  sourceType: EvidenceSourceType,
  counsellingRollNo: string,
  institutionCode: string,
  admissionDate: string
): ExternalAdapterResponse {
  const checkedAt = new Date().toISOString();

  if (sourceType === 'COUNSELLING_PORTAL') {
    const sourceSystemName = 'National / State Central Counselling Authority (Simulated)';

    // Deterministic simulation based on institution / roll number
    if (institutionCode === 'RIP-RAJ' || counsellingRollNo.includes('UNAV')) {
      return {
        sourceType,
        sourceSystemName,
        status: 'UNAVAILABLE',
        reference: `ERR_CONN_TIMEOUT_SRC_${institutionCode}`,
        checkedAt,
        discrepancyNote: 'Central counselling portal endpoint for this state/quota timed out (504 Gateway Timeout). Retry scheduled.',
        disclaimer: EVIDENCE_COMPLIANCE_FOOTNOTE,
      };
    }

    if (counsellingRollNo.includes('CONF') || counsellingRollNo.endsWith('99')) {
      return {
        sourceType,
        sourceSystemName,
        status: 'CONFLICT',
        reference: `CCN-MISMATCH-${counsellingRollNo.slice(-6)}`,
        checkedAt,
        discrepancyNote: 'Counselling records indicate seat allotment was surrendered or assigned to an alternative candidate.',
        disclaimer: EVIDENCE_COMPLIANCE_FOOTNOTE,
      };
    }

    return {
      sourceType,
      sourceSystemName,
      status: 'VERIFIED',
      reference: `CCN-ALLOT-2025-${counsellingRollNo.slice(-6)}`,
      checkedAt,
      discrepancyNote: undefined,
      disclaimer: EVIDENCE_COMPLIANCE_FOOTNOTE,
    };
  }

  if (sourceType === 'ACADEMIC_EXAM_BOARD') {
    const sourceSystemName = 'Secondary & Higher Secondary Board Registry (Simulated)';

    if (counsellingRollNo.includes('UNAV')) {
      return {
        sourceType,
        sourceSystemName,
        status: 'UNAVAILABLE',
        reference: 'EXAM_BOARD_REG_PENDING',
        checkedAt,
        discrepancyNote: 'Academic verification service is undergoing scheduled reconciliation.',
        disclaimer: EVIDENCE_COMPLIANCE_FOOTNOTE,
      };
    }

    if (counsellingRollNo.includes('CONF')) {
      return {
        sourceType,
        sourceSystemName,
        status: 'CONFLICT',
        reference: `BRD-REV-${counsellingRollNo.slice(-6)}`,
        checkedAt,
        discrepancyNote: 'Qualifying marks recorded in admission do not match 10+2 board gazette roll record.',
        disclaimer: EVIDENCE_COMPLIANCE_FOOTNOTE,
      };
    }

    return {
      sourceType,
      sourceSystemName,
      status: 'VERIFIED',
      reference: `BRD-CERT-12TH-${counsellingRollNo.slice(-5)}`,
      checkedAt,
      discrepancyNote: undefined,
      disclaimer: EVIDENCE_COMPLIANCE_FOOTNOTE,
    };
  }

  // INSTITUTION_ERP
  return {
    sourceType: 'INSTITUTION_ERP',
    sourceSystemName: 'Institution On-Premise SIS / ERP Feed (Simulated)',
    status: 'VERIFIED',
    reference: `ERP-ENR-${counsellingRollNo.slice(-4)}`,
    checkedAt,
    disclaimer: EVIDENCE_COMPLIANCE_FOOTNOTE,
  };
}

/**
 * Creates seed evidence records for an admission
 */
export function generateEvidenceRecordsForAdmission(
  admissionId: string,
  counsellingRollNo: string = '',
  institutionCode: string = '',
  admissionDate: string = ''
): EvidenceRecord[] {
  const counselling = queryExternalEvidenceAdapter('COUNSELLING_PORTAL', counsellingRollNo, institutionCode, admissionDate);
  const academic = queryExternalEvidenceAdapter('ACADEMIC_EXAM_BOARD', counsellingRollNo, institutionCode, admissionDate);

  return [
    {
      id: `EVD-CP-${admissionId.slice(-6)}`,
      admissionId,
      sourceType: 'COUNSELLING_PORTAL',
      status: counselling.status,
      reference: counselling.reference,
      checkedAt: counselling.checkedAt,
      sourceSystemName: counselling.sourceSystemName,
      discrepancyNote: counselling.discrepancyNote,
    },
    {
      id: `EVD-AB-${admissionId.slice(-6)}`,
      admissionId,
      sourceType: 'ACADEMIC_EXAM_BOARD',
      status: academic.status,
      reference: academic.reference,
      checkedAt: academic.checkedAt,
      sourceSystemName: academic.sourceSystemName,
      discrepancyNote: academic.discrepancyNote,
    },
  ];
}
