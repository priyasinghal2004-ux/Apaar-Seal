/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Admission } from '../types';

export interface DuplicateGroup {
  maskedApaar: string;
  count: number;
  admissions: Admission[];
  institutionsInvolved: string[];
  isCrossInstitution: boolean;
  explanation: string;
}

export interface DuplicateDetectionResult {
  hasDuplicates: boolean;
  duplicateAdmissionIds: Set<string>;
  duplicateGroups: DuplicateGroup[];
  totalDuplicateRecords: number;
}

/**
 * Scans a set of admissions for duplicate APAAR identities.
 * Detects both intra-institution (same college reported twice) and cross-institution (multiple colleges claimed same APAAR).
 */
export function detectDuplicateIdentifiers(admissions: Admission[]): DuplicateDetectionResult {
  const mapByApaar = new Map<string, Admission[]>();

  for (const adm of admissions) {
    // Normalise APAAR (strip dashes and whitespace)
    const key = adm.apaarRaw ? adm.apaarRaw.replace(/[^0-9]/g, '') : adm.maskedApaar;
    if (!key || key === 'INVALID') continue;

    const list = mapByApaar.get(key) || [];
    list.push(adm);
    mapByApaar.set(key, list);
  }

  const duplicateGroups: DuplicateGroup[] = [];
  const duplicateAdmissionIds = new Set<string>();

  for (const [, group] of mapByApaar.entries()) {
    if (group.length > 1) {
      const institutions = Array.from(new Set(group.map((a) => a.institutionId)));
      const isCrossInstitution = institutions.length > 1;
      const masked = group[0].maskedApaar || `XXXX-XXXX-${group[0].apaarRaw.slice(-4)}`;

      group.forEach((a) => duplicateAdmissionIds.add(a.id));

      const explanation = isCrossInstitution
        ? `Cross-institution collision: APAAR ${masked} is reported across ${institutions.length} separate institutions.`
        : `Duplicate entry: APAAR ${masked} reported ${group.length} times within the same institution.`;

      duplicateGroups.push({
        maskedApaar: masked,
        count: group.length,
        admissions: group,
        institutionsInvolved: institutions,
        isCrossInstitution,
        explanation,
      });
    }
  }

  return {
    hasDuplicates: duplicateGroups.length > 0,
    duplicateAdmissionIds,
    duplicateGroups,
    totalDuplicateRecords: duplicateAdmissionIds.size,
  };
}
