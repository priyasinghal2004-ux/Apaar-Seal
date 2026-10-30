/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Admission, IntakeApproval, RuleVersion } from '../types';

export const RULE_VERSIONS: RuleVersion[] = [
  {
    id: 'v2025.1',
    name: 'Illustrative Prototype Rules: Standard Baseline (Simulated Policy Configuration)',
    effectiveFrom: '2025-01-01',
    effectiveTo: '2025-06-30',
    description: 'Simulated policy configuration: Standard baseline. TFWS supernumerary quota configured at 5% of base intake, capped at maximum 5 seats.',
    supernumeraryRules: {
      tfwsPercentage: 0.05,
      ewsSupernumeraryPercentage: 0.10,
      maxSupernumeraryCount: 5,
      allowDirectExemption: true,
    },
    intakeTolerance: 0,
  },
  {
    id: 'v2025.2',
    name: 'Illustrative Prototype Rules: Amended Supernumerary Quota (Simulated Policy Configuration)',
    effectiveFrom: '2025-07-01',
    effectiveTo: null,
    description: 'Simulated policy configuration: Amended supernumerary quota. Configured threshold adjusted to authorize up to 6 TFWS seats for eligible accredited programmes.',
    supernumeraryRules: {
      tfwsPercentage: 0.05,
      ewsSupernumeraryPercentage: 0.10,
      maxSupernumeraryCount: 6,
      allowDirectExemption: true,
    },
    intakeTolerance: 0,
  },
];

/**
 * Selects applicable rule version based on transaction/admission date.
 */
export function getApplicableRuleVersion(dateString: string, availableRules: RuleVersion[] = RULE_VERSIONS): RuleVersion {
  const targetDate = new Date(dateString).getTime();

  for (const rule of availableRules) {
    const fromTime = new Date(rule.effectiveFrom).getTime();
    const toTime = rule.effectiveTo ? new Date(rule.effectiveTo).getTime() : Infinity;

    if (targetDate >= fromTime && targetDate <= toTime) {
      return rule;
    }
  }

  // Fallback to latest active rule if out of bounds
  return availableRules[availableRules.length - 1];
}

export interface IntakeCalculationResult {
  institutionId: string;
  programmeId: string;
  academicYear: string;
  ruleVersionId: string;
  ruleEffectiveDate: string;
  baseApprovedLimit: number;
  totalReportedCount: number;
  legitimateSupernumeraryCount: number;
  countedAgainstBaseLimit: number;
  excessCount: number;
  excessAdmissionIds: string[];
  compliantAdmissionIds: string[];
  supernumeraryAdmissionIds: string[];
  explanation: string;
  calculationFormula: string;
}

/**
 * Validates intake for a programme using policy-aware supernumerary quota rules.
 *
 * Example Scenario (Vindhya B.Tech CSE):
 * - Base approved intake = 100
 * - Total reported = 120
 * - 6 legitimate TFWS under v2025.2 (which permits up to 6 supernumerary seats)
 * - Counted against base limit = 120 - 6 = 114
 * - Excess admissions = 114 - 100 = 14 excess records (NOT 20).
 */
export function validateProgrammeIntake(
  institutionId: string,
  programmeId: string,
  approval: IntakeApproval,
  admissions: Admission[],
  ruleVersions: RuleVersion[] = RULE_VERSIONS
): IntakeCalculationResult {
  // Sort admissions chronologically by reportedTimestamp so first-come-first-admitted order is deterministic
  const sorted = [...admissions].sort((a, b) => {
    return new Date(a.reportedTimestamp || a.admissionDate).getTime() - new Date(b.reportedTimestamp || b.admissionDate).getTime();
  });

  // Determine rule version from the latest batch date or approval reference
  const latestAdmissionDate = sorted.length > 0
    ? sorted[sorted.length - 1].admissionDate
    : new Date().toISOString();
  const rule = getApplicableRuleVersion(latestAdmissionDate, ruleVersions);

  const baseApproved = approval.approvedLimit;
  const maxSupernumeraryAllowed = rule.supernumeraryRules.maxSupernumeraryCount;

  const supernumeraryAdmissionIds: string[] = [];
  const compliantAdmissionIds: string[] = [];
  const excessAdmissionIds: string[] = [];

  let supernumeraryClaimed = 0;
  let baseAdmittedCount = 0;

  for (const adm of sorted) {
    // Check if this admission qualifies as supernumerary (e.g. TFWS or EWS_SUPERNUMERARY)
    const isSupernumeraryCandidate =
      adm.isSupernumerary === true ||
      adm.quotaCategory === 'TFWS' ||
      adm.supernumeraryType === 'TFWS';

    if (isSupernumeraryCandidate && supernumeraryClaimed < maxSupernumeraryAllowed) {
      supernumeraryClaimed++;
      supernumeraryAdmissionIds.push(adm.id);
    } else {
      // Must count against base approved intake limit
      if (baseAdmittedCount < baseApproved) {
        baseAdmittedCount++;
        compliantAdmissionIds.push(adm.id);
      } else {
        excessAdmissionIds.push(adm.id);
      }
    }
  }

  const excessCount = excessAdmissionIds.length;
  const countedAgainstBaseLimit = baseAdmittedCount + excessCount;

  let explanation = '';
  if (excessCount > 0) {
    explanation = `${excessCount} admissions exceed the configured limit of ${baseApproved} for ${approval.academicYear}. ${supernumeraryClaimed} seats were granted legitimate supernumerary status under ${rule.id} (max ${maxSupernumeraryAllowed}).`;
  } else {
    explanation = `Intake compliant. ${baseAdmittedCount} of ${baseApproved} approved base seats utilised with ${supernumeraryClaimed} supernumerary exemptions under ${rule.id}.`;
  }

  const calculationFormula = `Calculation: Total reported (${sorted.length}) - Eligible supernumerary (${supernumeraryClaimed} TFWS under ${rule.id}) = ${countedAgainstBaseLimit} standard seats. Sanctioned base limit = ${baseApproved}. Excess seats = ${excessCount}.`;

  return {
    institutionId,
    programmeId,
    academicYear: approval.academicYear,
    ruleVersionId: rule.id,
    ruleEffectiveDate: rule.effectiveFrom,
    baseApprovedLimit: baseApproved,
    totalReportedCount: sorted.length,
    legitimateSupernumeraryCount: supernumeraryClaimed,
    countedAgainstBaseLimit,
    excessCount,
    excessAdmissionIds,
    compliantAdmissionIds,
    supernumeraryAdmissionIds,
    explanation,
    calculationFormula,
  };
}

/**
 * Simulated atomic mutex queue to simulate transactional validate-then-commit.
 * Prevents race conditions where concurrent batch uploads both validate against
 * remaining quota before either commits.
 */
class IntakeCommitMutex {
  private lockedInstitutions: Set<string> = new Set();
  private waitQueue: Map<string, Array<() => void>> = new Map();

  async acquire(institutionId: string): Promise<() => void> {
    if (!this.lockedInstitutions.has(institutionId)) {
      this.lockedInstitutions.add(institutionId);
      return () => this.release(institutionId);
    }

    return new Promise<() => void>((resolve) => {
      const queue = this.waitQueue.get(institutionId) || [];
      queue.push(() => {
        this.lockedInstitutions.add(institutionId);
        resolve(() => this.release(institutionId));
      });
      this.waitQueue.set(institutionId, queue);
    });
  }

  private release(institutionId: string): void {
    const queue = this.waitQueue.get(institutionId);
    if (queue && queue.length > 0) {
      const next = queue.shift()!;
      next();
    } else {
      this.lockedInstitutions.delete(institutionId);
      this.waitQueue.delete(institutionId);
    }
  }

  isLocked(institutionId: string): boolean {
    return this.lockedInstitutions.has(institutionId);
  }
}

export const intakeMutex = new IntakeCommitMutex();

/**
 * Simulated atomic validate-and-commit for admission records.
 */
export async function atomicValidateAndCommitIntake(
  institutionId: string,
  programmeId: string,
  approval: IntakeApproval,
  existingAdmissions: Admission[],
  newAdmissionsBatch: Admission[],
  ruleVersions: RuleVersion[] = RULE_VERSIONS
): Promise<{
  success: boolean;
  excessGenerated: number;
  result: IntakeCalculationResult;
  committedCount: number;
}> {
  const unlock = await intakeMutex.acquire(institutionId);
  try {
    const combined = [...existingAdmissions, ...newAdmissionsBatch];
    const result = validateProgrammeIntake(institutionId, programmeId, approval, combined, ruleVersions);
    return {
      success: result.excessCount === 0,
      excessGenerated: result.excessCount,
      result,
      committedCount: newAdmissionsBatch.length,
    };
  } finally {
    unlock();
  }
}
