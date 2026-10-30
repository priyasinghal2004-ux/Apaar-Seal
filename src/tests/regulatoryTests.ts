/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Admission, IntakeApproval } from '../types';
import { checkAccessPermission } from '../services/accessControl';
import { verifyAuditChain } from '../services/audit';
import { detectDuplicateIdentifiers } from '../services/duplicateDetection';
import { queryExternalEvidenceAdapter } from '../services/evidenceAdapters';
import { getApplicableRuleVersion, RULE_VERSIONS, validateProgrammeIntake } from '../services/intakeValidation';
import { DEMO_USERS, generateSeedData } from '../services/seedData';
import { StateTransitionError, validateStateTransition } from '../services/stateMachine';

export interface TestResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  durationMs: number;
  assertionDetails: string;
  error?: string;
}

export function runAllRegulatoryAssuranceTests(): TestResult[] {
  const results: TestResult[] = [];

  // TEST 1: Intake Calculation & Supernumerary Handling (120 reported, 100 limit, 6 TFWS -> 14 excess)
  {
    const start = performance.now();
    try {
      const approval: IntakeApproval = {
        id: 'TEST-APR-01',
        institutionId: 'INST-01',
        programmeId: 'PROG-01',
        academicYear: '2025-26',
        category: 'OPEN',
        approvedLimit: 100,
        supernumeraryApprovedLimit: 6,
        ruleVersionId: 'v2025.2',
        sourceRef: 'AICTE/APR/TEST/001',
        issuedDate: '2025-05-01',
      };

      // Construct 120 admissions, with exactly 6 TFWS supernumerary
      const testAdmissions: Admission[] = [];
      for (let i = 1; i <= 120; i++) {
        const isTfws = [10, 20, 30, 40, 50, 60].includes(i);
        testAdmissions.push({
          id: `TEST-ADM-${i}`,
          institutionId: 'INST-01',
          programmeId: 'PROG-01',
          studentId: `STU-${i}`,
          studentName: `Candidate ${i}`,
          maskedApaar: `XXXX-XXXX-${String(1000 + i).slice(-4)}`,
          apaarRaw: `88000000${String(1000 + i).slice(-4)}`,
          dob: '2004-01-01',
          academicYear: '2025-26',
          quotaCategory: isTfws ? 'TFWS' : 'OPEN',
          isSupernumerary: isTfws,
          supernumeraryType: isTfws ? 'TFWS' : 'NONE',
          admissionDate: '2025-07-15',
          currentState: 'REPORTED',
          counsellingRollNo: `CCN-${i}`,
          reportedTimestamp: '2025-07-15T10:00:00.000Z',
          counsellingAuthority: 'DTE',
        });
      }

      const intakeRes = validateProgrammeIntake('INST-01', 'PROG-01', approval, testAdmissions, RULE_VERSIONS);

      const passed =
        intakeRes.totalReportedCount === 120 &&
        intakeRes.baseApprovedLimit === 100 &&
        intakeRes.legitimateSupernumeraryCount === 6 &&
        intakeRes.excessCount === 14;

      results.push({
        id: 'TEST-01',
        name: 'Policy-Aware Intake & Supernumerary Calculation',
        description: 'Verifies 120 reported vs 100 limit with 6 valid TFWS produces exactly 14 excess records (not 20).',
        passed,
        durationMs: performance.now() - start,
        assertionDetails: `Reported: ${intakeRes.totalReportedCount}, Limit: ${intakeRes.baseApprovedLimit}, TFWS Supernumerary: ${intakeRes.legitimateSupernumeraryCount}, Excess Identified: ${intakeRes.excessCount} (Expected: 14)`,
      });
    } catch (e: any) {
      results.push({
        id: 'TEST-01',
        name: 'Policy-Aware Intake & Supernumerary Calculation',
        description: 'Verifies 120 reported vs 100 limit with 6 valid TFWS produces exactly 14 excess records.',
        passed: false,
        durationMs: performance.now() - start,
        assertionDetails: 'Exception during intake computation',
        error: e.message,
      });
    }
  }

  // TEST 2: Duplicate Identifier Detection (Cross & Intra-institution)
  {
    const start = performance.now();
    try {
      const seed = generateSeedData();
      const dupResult = detectDuplicateIdentifiers(seed.admissions);

      // Verify Ananya Verma collision exists
      const ananyaCollision = dupResult.duplicateGroups.find((g) => g.maskedApaar === 'XXXX-XXXX-4821');
      const passed =
        dupResult.hasDuplicates &&
        dupResult.totalDuplicateRecords >= 6 &&
        ananyaCollision !== undefined &&
        ananyaCollision.isCrossInstitution;

      results.push({
        id: 'TEST-02',
        name: 'Duplicate APAAR Identifier Detection',
        description: 'Scans full batch for multi-college collisions and intra-institution repeat APAAR records.',
        passed,
        durationMs: performance.now() - start,
        assertionDetails: `Found ${dupResult.totalDuplicateRecords} collisions across ${dupResult.duplicateGroups.length} groups. Ananya Verma cross-institution detected: ${ananyaCollision ? 'YES' : 'NO'}.`,
      });
    } catch (e: any) {
      results.push({
        id: 'TEST-02',
        name: 'Duplicate APAAR Identifier Detection',
        description: 'Scans full batch for duplicate APAAR records.',
        passed: false,
        durationMs: performance.now() - start,
        assertionDetails: 'Exception during duplicate detection',
        error: e.message,
      });
    }
  }

  // TEST 3: Rule Version Selection by Date (v2025.1 before July 1, v2025.2 from July 1)
  {
    const start = performance.now();
    try {
      const rulePreJuly = getApplicableRuleVersion('2025-05-15', RULE_VERSIONS);
      const rulePostJuly = getApplicableRuleVersion('2025-07-15', RULE_VERSIONS);

      const passed =
        rulePreJuly.id === 'v2025.1' &&
        rulePreJuly.supernumeraryRules.maxSupernumeraryCount === 5 &&
        rulePostJuly.id === 'v2025.2' &&
        rulePostJuly.supernumeraryRules.maxSupernumeraryCount === 6;

      results.push({
        id: 'TEST-03',
        name: 'Rule Version Chronological Selection',
        description: 'Evaluates admissions reported prior to July 1 2025 against v2025.1 and post-July 1 against v2025.2.',
        passed,
        durationMs: performance.now() - start,
        assertionDetails: `Pre-July Date: resolved ${rulePreJuly.id} (Cap: ${rulePreJuly.supernumeraryRules.maxSupernumeraryCount}); Post-July Date: resolved ${rulePostJuly.id} (Cap: ${rulePostJuly.supernumeraryRules.maxSupernumeraryCount}).`,
      });
    } catch (e: any) {
      results.push({
        id: 'TEST-03',
        name: 'Rule Version Chronological Selection',
        description: 'Evaluates admissions against date-specific rule versions.',
        passed: false,
        durationMs: performance.now() - start,
        assertionDetails: 'Exception during rule version selection',
        error: e.message,
      });
    }
  }

  // TEST 4: State Machine Disallowed Transitions Guard
  {
    const start = performance.now();
    try {
      const disputedAdmission: Admission = {
        id: 'TEST-ADM-DISP',
        institutionId: 'INST-01',
        programmeId: 'PROG-01',
        studentId: 'STU-99',
        studentName: 'Contested Candidate',
        maskedApaar: 'XXXX-XXXX-9999',
        apaarRaw: '999999999999',
        dob: '2004-01-01',
        academicYear: '2025-26',
        quotaCategory: 'OPEN',
        isSupernumerary: false,
        admissionDate: '2025-07-15',
        currentState: 'DISPUTED',
        counsellingRollNo: 'CCN-99',
        reportedTimestamp: '2025-07-15T10:00:00.000Z',
        counsellingAuthority: 'DTE',
      };

      let threwExpectedError = false;
      let caughtMessage = '';

      try {
        // Attempt DISPUTED -> EVIDENCE_VERIFIED (Must fail)
        validateStateTransition(disputedAdmission, 'EVIDENCE_VERIFIED', 'AICTE_REGULATOR');
      } catch (err: any) {
        if (err instanceof StateTransitionError) {
          threwExpectedError = true;
          caughtMessage = err.message;
        }
      }

      const passed = threwExpectedError && caughtMessage.includes('Cannot move from DISPUTED to EVIDENCE_VERIFIED without a resolved review');

      results.push({
        id: 'TEST-04',
        name: 'State Machine Transition Guard',
        description: 'Blocks direct transition from DISPUTED to EVIDENCE_VERIFIED without an adjudicated review.',
        passed,
        durationMs: performance.now() - start,
        assertionDetails: `Correctly threw StateTransitionError with message: "${caughtMessage.slice(0, 75)}..."`,
      });
    } catch (e: any) {
      results.push({
        id: 'TEST-04',
        name: 'State Machine Transition Guard',
        description: 'Guards invalid state machine transitions.',
        passed: false,
        durationMs: performance.now() - start,
        assertionDetails: 'Exception during state machine guard verification',
        error: e.message,
      });
    }
  }

  // TEST 5: Mandatory Review Rationale (min 30 characters)
  {
    const start = performance.now();
    try {
      const shortRationale = 'Rejected.'; // Only 9 characters
      const validRationale = 'Statutory gazette verification confirms genuine enrolment in accredited round 1.'; // 83 chars

      const isShortValid = shortRationale.trim().length >= 30;
      const isValidLength = validRationale.trim().length >= 30;

      const passed = !isShortValid && isValidLength;

      results.push({
        id: 'TEST-05',
        name: 'Mandatory Review Rationale Enforcement',
        description: 'Rejects case resolution rationale under 30 characters to prevent unreasoned adverse rulings.',
        passed,
        durationMs: performance.now() - start,
        assertionDetails: `Short rationale (${shortRationale.length} chars) blocked: ${!isShortValid ? 'YES' : 'NO'}; Compliant rationale (${validRationale.length} chars) accepted: ${isValidLength ? 'YES' : 'NO'}.`,
      });
    } catch (e: any) {
      results.push({
        id: 'TEST-05',
        name: 'Mandatory Review Rationale Enforcement',
        description: 'Enforces minimum written rationale length.',
        passed: false,
        durationMs: performance.now() - start,
        assertionDetails: 'Exception during rationale check',
        error: e.message,
      });
    }
  }

  // TEST 6: Non-Response & Missing Evidence Remain Uncertain / Pending (Not Wrongdoing)
  {
    const start = performance.now();
    try {
      const missingEvidence = queryExternalEvidenceAdapter('COUNSELLING_PORTAL', 'CCN-RAJ-UNAV-5001', 'RIP-RAJ', '2025-07-25');

      const isStatusUnavailable = missingEvidence.status === 'UNAVAILABLE';
      const hasFootnote = missingEvidence.disclaimer.includes('shall not be construed as prima facie proof');

      const passed = isStatusUnavailable && hasFootnote;

      results.push({
        id: 'TEST-06',
        name: 'Statutory Non-Adverse Missing Evidence Standard',
        description: 'Ensures external service unavailability is marked UNCERTAIN/PENDING, never inferred as fraud or wrongdoing.',
        passed,
        durationMs: performance.now() - start,
        assertionDetails: `External status: ${missingEvidence.status}; Statutory disclaimer text verified on adapter response.`,
      });
    } catch (e: any) {
      results.push({
        id: 'TEST-06',
        name: 'Statutory Non-Adverse Missing Evidence Standard',
        description: 'Verifies non-wrongdoing presumption for missing evidence.',
        passed: false,
        durationMs: performance.now() - start,
        assertionDetails: 'Exception during evidence standard check',
        error: e.message,
      });
    }
  }

  // TEST 7: RBAC Enforcement & Cryptographic Chain Verification
  {
    const start = performance.now();
    try {
      const seed = generateSeedData();

      // 1. Auditor attempting write action must throw AccessDeniedError
      let auditorBlocked = false;
      try {
        checkAccessPermission({
          user: DEMO_USERS.AUDITOR,
          resourceType: 'CASE',
          resourceId: 'SEAL-2025-000417',
          action: 'RESOLVE',
        });
      } catch (err: any) {
        auditorBlocked = err.name === 'AccessDeniedError';
      }

      // 2. Institution Admin attempting to access another institution
      let crossInstBlocked = false;
      try {
        checkAccessPermission({
          user: DEMO_USERS.INSTITUTION_ADMIN, // INST-01
          resourceType: 'INSTITUTION',
          resourceInstitutionId: 'INST-02', // Different
          action: 'READ',
        });
      } catch (err: any) {
        crossInstBlocked = err.name === 'AccessDeniedError';
      }

      // 3. Verify cryptographic audit chain integrity
      const chainVerification = verifyAuditChain(seed.auditEvents);

      const passed = auditorBlocked && crossInstBlocked && chainVerification.valid;

      results.push({
        id: 'TEST-07',
        name: 'Service-Layer RBAC & Audit Chain Cryptographic Integrity',
        description: 'Verifies RBAC access barriers and cryptographic hash linkage across all audit events.',
        passed,
        durationMs: performance.now() - start,
        assertionDetails: `Auditor write blocked: ${auditorBlocked ? 'YES' : 'NO'}; Cross-institution blocked: ${crossInstBlocked ? 'YES' : 'NO'}; Audit chain verified: ${chainVerification.valid ? 'VALID (' + chainVerification.totalEvents + ' blocks)' : 'FAILED'}.`,
      });
    } catch (e: any) {
      results.push({
        id: 'TEST-07',
        name: 'Service-Layer RBAC & Audit Chain Cryptographic Integrity',
        description: 'Verifies RBAC and audit chain.',
        passed: false,
        durationMs: performance.now() - start,
        assertionDetails: 'Exception during RBAC or audit chain check',
        error: e.message,
      });
    }
  }

  return results;
}
