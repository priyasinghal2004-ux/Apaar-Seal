/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Admission,
  EvidenceRecord,
  IntakeApproval,
  ReasonCode,
  ReconciliationResult,
  ReconciliationStatus,
  RuleVersion,
  StudentConfirmation,
} from '../types';
import { detectDuplicateIdentifiers } from './duplicateDetection';
import { validateApaarFormat } from './identityValidation';
import { getApplicableRuleVersion, validateProgrammeIntake } from './intakeValidation';
import { calculateExplainableSeverity } from './riskRules';

export interface ReconciliationDataset {
  admissions: Admission[];
  approvals: IntakeApproval[];
  confirmations: StudentConfirmation[];
  evidenceRecords: EvidenceRecord[];
  ruleVersions?: RuleVersion[];
}

/**
 * Executes regulatory reconciliation pipeline across all admissions in deterministic sequence.
 */
export function runBatchReconciliation(dataset: ReconciliationDataset): Map<string, ReconciliationResult> {
  const { admissions, approvals, confirmations, evidenceRecords, ruleVersions } = dataset;
  const results = new Map<string, ReconciliationResult>();

  // Map confirmations by admissionId
  const confMap = new Map<string, StudentConfirmation>();
  confirmations.forEach((c) => confMap.set(c.admissionId, c));

  // Map evidence records by admissionId
  const evidenceMap = new Map<string, EvidenceRecord[]>();
  evidenceRecords.forEach((e) => {
    const list = evidenceMap.get(e.admissionId) || [];
    list.push(e);
    evidenceMap.set(e.admissionId, list);
  });

  // STEP 3: Duplicate detection across the entire batch
  const duplicateCheck = detectDuplicateIdentifiers(admissions);

  // STEP 4: Intake validation by (institutionId, programmeId)
  const admissionsByProg = new Map<string, Admission[]>();
  admissions.forEach((a) => {
    const key = `${a.institutionId}::${a.programmeId}`;
    const list = admissionsByProg.get(key) || [];
    list.push(a);
    admissionsByProg.set(key, list);
  });

  const excessAdmissionIdsByProg = new Set<string>();
  const intakeResByProg = new Map<string, any>();
  for (const [key, progAdmissions] of admissionsByProg.entries()) {
    const [instId, progId] = key.split('::');
    const approval = approvals.find((ap) => ap.institutionId === instId && ap.programmeId === progId);
    if (approval) {
      const intakeRes = validateProgrammeIntake(instId, progId, approval, progAdmissions, ruleVersions);
      intakeResByProg.set(key, intakeRes);
      intakeRes.excessAdmissionIds.forEach((id) => excessAdmissionIdsByProg.add(id));
    }
  }

  // Evaluate each admission
  for (const adm of admissions) {
    const reasonCodes: ReasonCode[] = [];
    const humanReasons: string[] = [];

    // STEP 1: Completeness
    if (!adm.studentName || !adm.counsellingRollNo || !adm.admissionDate) {
      reasonCodes.push('STATE_CHANGE_UNSUPPORTED');
      humanReasons.push('Mandatory statutory fields are missing from the admission record.');
    }

    // STEP 2: Identity Format Check
    const formatCheck = validateApaarFormat(adm.apaarRaw || adm.maskedApaar);
    if (!formatCheck.valid && !adm.maskedApaar.startsWith('XXXX-XXXX-')) {
      reasonCodes.push('APAAR_FORMAT_INVALID');
      humanReasons.push(`APAAR format validation failed: ${formatCheck.reason || 'Invalid digits'}`);
    }

    // STEP 3: Duplicate Check Result
    if (duplicateCheck.duplicateAdmissionIds.has(adm.id)) {
      reasonCodes.push('DUP_IDENTIFIER');
      const grp = duplicateCheck.duplicateGroups.find((g) => g.admissions.some((a) => a.id === adm.id));
      humanReasons.push(grp?.explanation || 'Duplicate APAAR identifier registered across records.');
    }

    // STEP 4: Intake Limit Check Result
    const isExcess = excessAdmissionIdsByProg.has(adm.id);
    if (isExcess) {
      reasonCodes.push('INTAKE_EXCEEDED');
      humanReasons.push('Reported admission exceeds sanctioned base intake limit after supernumerary allocation.');
    }

    // STEP 5: Student Confirmation Response Check
    const conf = confMap.get(adm.id);
    let pendingDays = 0;
    if (conf) {
      pendingDays = conf.daysPending || 0;
      if (conf.status === 'DISPUTED') {
        reasonCodes.push('STUDENT_DISPUTED');
        humanReasons.push(
          `Student contestation filed: ${conf.disputeReason || 'Seat allotment contested by candidate.'}`
        );
      } else if (conf.status === 'PENDING') {
        if (conf.daysPending > 30) {
          reasonCodes.push('STUDENT_PENDING_OVERDUE');
          humanReasons.push(
            `Student confirmation pending for ${conf.daysPending} days (exceeds statutory 30-day window).`
          );
        }
      }
    }

    // STEP 6: Independent Evidence Check
    const evList = evidenceMap.get(adm.id) || [];
    const hasConflict = evList.some((e) => e.status === 'CONFLICT');
    const hasUnavailable = evList.some((e) => e.status === 'UNAVAILABLE');
    const allVerified = evList.length > 0 && evList.every((e) => e.status === 'VERIFIED');

    if (hasConflict) {
      reasonCodes.push('EVIDENCE_CONFLICT');
      const conflictItems = evList.filter((e) => e.status === 'CONFLICT');
      humanReasons.push(
        `External evidence conflict: ${conflictItems.map((c) => c.discrepancyNote || c.sourceType).join('; ')}`
      );
    } else if (hasUnavailable) {
      reasonCodes.push('EVIDENCE_UNAVAILABLE');
      humanReasons.push(
        'External evidence temporarily unavailable (treated as uncertain, not proof of wrongdoing).'
      );
    }

    // Check unsupported state change flag in admission notes
    if (adm.notes?.includes('UNSUPPORTED_STATE_CHANGE') || (adm.currentState === 'MIGRATED' && !adm.stateChangeSupportingDocRef)) {
      reasonCodes.push('STATE_CHANGE_UNSUPPORTED');
      humanReasons.push('Admission state change recorded without supporting gazette or transfer order.');
    }

    // STEP 7: Status & Severity Calculation
    let status: ReconciliationStatus = 'MATCHED';
    if (reasonCodes.includes('STUDENT_DISPUTED')) {
      status = 'STUDENT_DISPUTED';
    } else if (reasonCodes.includes('INTAKE_EXCEEDED') || reasonCodes.includes('DUP_IDENTIFIER') || reasonCodes.includes('STATE_CHANGE_UNSUPPORTED')) {
      status = 'REVIEW_REQUIRED';
    } else if (reasonCodes.includes('EVIDENCE_CONFLICT')) {
      status = 'MISMATCH';
    } else if (reasonCodes.includes('EVIDENCE_UNAVAILABLE') || evList.length === 0) {
      status = 'EVIDENCE_MISSING';
    } else if (conf?.status === 'PENDING') {
      status = 'STUDENT_PENDING';
    } else if (allVerified && conf?.status === 'CONFIRMED' && reasonCodes.length === 0) {
      status = 'MATCHED';
      reasonCodes.push('RECORD_OK');
      humanReasons.push('All reconciliation checks satisfied: identity, intake, confirmation, and evidence.');
    }

    const applicableRule = getApplicableRuleVersion(adm.admissionDate, ruleVersions);
    const severityData = calculateExplainableSeverity(reasonCodes, { pendingDays });

    const progKey = `${adm.institutionId}::${adm.programmeId}`;
    const progIntakeRes = intakeResByProg.get(progKey);

    results.set(adm.id, {
      admissionId: adm.id,
      status,
      severity: severityData.severity,
      reasonCodes: reasonCodes.length > 0 ? reasonCodes : ['RECORD_OK'],
      humanReadableReasons: humanReasons.length > 0 ? humanReasons : ['Record verified and compliant with AICTE intake norms.'],
      ruleVersionApplied: applicableRule.id,
      ruleEffectiveDate: applicableRule.effectiveFrom,
      severityBreakdown: severityData.factors,
      calculatedAt: new Date().toISOString(),
      isExcessSeat: isExcess,
      intakeDetails: progIntakeRes ? {
        baseLimit: progIntakeRes.baseApprovedLimit,
        supernumeraryQuota: progIntakeRes.legitimateSupernumeraryCount,
        reportedCount: progIntakeRes.totalReportedCount,
        excessSeats: progIntakeRes.excessCount,
        calculationFormula: progIntakeRes.calculationFormula,
      } : undefined,
    });
  }

  return results;
}
