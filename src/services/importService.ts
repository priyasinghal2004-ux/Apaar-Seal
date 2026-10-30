/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Admission, Category, IntakeApproval, RuleVersion } from '../types';
import { generateEvidenceRecordsForAdmission } from './evidenceAdapters';
import { validateApaarFormat } from './identityValidation';
import { atomicValidateAndCommitIntake } from './intakeValidation';

export interface CsvImportRow {
  studentName: string;
  apaarId: string;
  dob: string;
  quotaCategory: Category;
  isSupernumerary: boolean;
  supernumeraryType?: 'TFWS' | 'EWS_SUPERNUMERARY' | 'NONE';
  counsellingRollNo: string;
  admissionDate: string;
  counsellingAuthority?: string;
  notes?: string;
}

export interface ParseCsvResult {
  validRows: CsvImportRow[];
  errors: { row: number; error: string; raw: string }[];
}

export function parseAdmissionsCsv(csvText: string): ParseCsvResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    return { validRows: [], errors: [{ row: 0, error: 'CSV file is empty or missing data rows', raw: '' }] };
  }

  // Header row
  const validRows: CsvImportRow[] = [];
  const errors: { row: number; error: string; raw: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const cols = raw.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

    if (cols.length < 5) {
      errors.push({ row: i + 1, error: 'Insufficient columns (expected minimum 5)', raw });
      continue;
    }

    const [name, apaarRaw, dob, quota, isSuperStr, rollNo, admDate] = cols;

    if (!name || name.length < 2) {
      errors.push({ row: i + 1, error: 'Student name is invalid or blank', raw });
      continue;
    }

    const formatCheck = validateApaarFormat(apaarRaw);
    if (!formatCheck.valid) {
      errors.push({ row: i + 1, error: `Invalid APAAR: ${formatCheck.reason}`, raw });
      continue;
    }

    const quotaCategory = (quota?.toUpperCase() as Category) || 'OPEN';
    const isSuper = isSuperStr?.toLowerCase() === 'true' || isSuperStr === '1' || quotaCategory === 'TFWS';

    validRows.push({
      studentName: name,
      apaarId: formatCheck.cleanApaar,
      dob: dob || '2004-01-01',
      quotaCategory,
      isSupernumerary: isSuper,
      supernumeraryType: isSuper ? 'TFWS' : 'NONE',
      counsellingRollNo: rollNo || `CCN-IMP-${Math.floor(100000 + Math.random() * 900000)}`,
      admissionDate: admDate || new Date().toISOString().slice(0, 10),
      counsellingAuthority: 'State Technical Joint Entrance (Simulated)',
    });
  }

  return { validRows, errors };
}

export interface CommitImportResult {
  success: boolean;
  totalParsed: number;
  totalCommitted: number;
  excessGenerated: number;
  createdAdmissions: Admission[];
  explanation: string;
}

export async function processAndCommitBatchImport(
  institutionId: string,
  programmeId: string,
  approval: IntakeApproval,
  existingAdmissions: Admission[],
  rows: CsvImportRow[],
  ruleVersions?: RuleVersion[]
): Promise<CommitImportResult> {
  const timestamp = new Date().toISOString();

  const newAdmissions: Admission[] = rows.map((row, index) => {
    const format = validateApaarFormat(row.apaarId);
    const id = `ADM-25-${String(Math.floor(100000 + Math.random() * 900000) + index).padStart(6, '0')}`;
    return {
      id,
      institutionId,
      programmeId,
      studentId: `STU-GEN-${id.slice(-6)}`,
      studentName: row.studentName,
      maskedApaar: format.maskedApaar,
      apaarRaw: format.cleanApaar,
      dob: row.dob,
      academicYear: approval.academicYear,
      quotaCategory: row.quotaCategory,
      isSupernumerary: row.isSupernumerary,
      supernumeraryType: row.supernumeraryType || (row.isSupernumerary ? 'TFWS' : 'NONE'),
      admissionDate: row.admissionDate,
      currentState: 'REPORTED',
      counsellingRollNo: row.counsellingRollNo,
      reportedTimestamp: timestamp,
      counsellingAuthority: row.counsellingAuthority || 'State Centralised Admission Committee',
      notes: row.notes,
    };
  });

  // Execute atomic transactional validate-and-commit
  const validation = await atomicValidateAndCommitIntake(
    institutionId,
    programmeId,
    approval,
    existingAdmissions,
    newAdmissions,
    ruleVersions
  );

  return {
    success: validation.success,
    totalParsed: rows.length,
    totalCommitted: newAdmissions.length,
    excessGenerated: validation.excessGenerated,
    createdAdmissions: newAdmissions,
    explanation: validation.result.explanation,
  };
}
