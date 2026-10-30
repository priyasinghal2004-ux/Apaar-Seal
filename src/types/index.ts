/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'INSTITUTION_ADMIN' | 'STUDENT' | 'AICTE_REGULATOR' | 'AUDITOR';

export type AcademicYear = '2024-25' | '2025-26' | '2026-27';

export type Category = 'OPEN' | 'EWS' | 'OBC_NCL' | 'SC' | 'ST' | 'PwD' | 'TFWS';

export interface Institution {
  id: string;
  code: string;
  name: string;
  state: string;
  type: 'Central University' | 'State Technical' | 'Private Affiliated' | 'Polytechnic' | 'Autonomous Institute';
  address: string;
  contactEmail: string;
  contactPhone: string;
  aicteRegion: string;
  approvalStatus: 'APPROVED' | 'PROVISIONAL' | 'NOTICE_ISSUED';
}

export interface Programme {
  id: string;
  institutionId: string;
  code: string;
  name: string;
  degreeType: 'B.Tech' | 'Diploma' | 'MBA' | 'B.Pharm' | 'M.Tech';
  durationYears: number;
  approvedIntake: number;
}

export interface RuleVersion {
  id: string; // e.g. 'v2025.1', 'v2025.2'
  name: string;
  effectiveFrom: string; // ISO date
  effectiveTo: string | null;
  description: string;
  supernumeraryRules: {
    tfwsPercentage: number; // e.g. 5%
    ewsSupernumeraryPercentage: number; // e.g. 10%
    maxSupernumeraryCount: number;
    allowDirectExemption: boolean;
  };
  intakeTolerance: number; // 0 for strict compliance
}

export interface IntakeApproval {
  id: string;
  institutionId: string;
  programmeId: string;
  academicYear: AcademicYear;
  category: Category;
  approvedLimit: number;
  supernumeraryApprovedLimit: number;
  ruleVersionId: string;
  sourceRef: string; // e.g. 'AICTE/APR/2025-26/N-0194'
  issuedDate: string;
}

export interface Student {
  id: string;
  name: string;
  apaarId: string; // 12-digit string
  maskedApaar: string; // e.g. 'XXXX-XXXX-4821'
  dob: string;
  category: Category;
  email: string;
  phone: string;
  domicileState: string;
}

export type AdmissionState =
  | 'APPROVED'
  | 'ALLOTTED'
  | 'REPORTED'
  | 'STUDENT_CONFIRMED'
  | 'EVIDENCE_VERIFIED'
  | 'GRADUATED'
  | 'PENDING'
  | 'DISPUTED'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'VACATED'
  | 'MIGRATED'
  | 'DROPPED'
  | 'REJECTED';

export interface Admission {
  id: string; // e.g. 'ADM-25-004182'
  institutionId: string;
  programmeId: string;
  studentId: string;
  studentName: string;
  maskedApaar: string;
  apaarRaw: string;
  dob: string;
  academicYear: AcademicYear;
  quotaCategory: Category;
  isSupernumerary: boolean;
  supernumeraryType?: 'TFWS' | 'EWS_SUPERNUMERARY' | 'J&K_PMSSS' | 'SPORTS_QUOTA' | 'NONE';
  admissionDate: string; // ISO string
  currentState: AdmissionState;
  previousState?: AdmissionState;
  stateChangeSupportingDocRef?: string;
  counsellingRollNo?: string;
  reportedTimestamp: string;
  counsellingAuthority: string;
  notes?: string;
}

export type ConfirmationStatus = 'PENDING' | 'CONFIRMED' | 'DISPUTED' | 'EXPIRED';

export interface StudentConfirmation {
  id: string;
  admissionId: string;
  studentId: string;
  status: ConfirmationStatus;
  disputeReason?: string;
  disputeCategory?: 'NEVER_APPLIED' | 'DIFFERENT_PROGRAMME' | 'FEE_EXTORTION' | 'SEAT_CANCELLED_UNILATERALLY' | 'OTHER';
  disputeSubmittedAt?: string;
  confirmedAt?: string;
  remarks?: string;
  daysPending: number;
  lastReminderSentAt?: string;
}

export type EvidenceStatus = 'VERIFIED' | 'CONFLICT' | 'UNAVAILABLE';
export type EvidenceSourceType = 'COUNSELLING_PORTAL' | 'ACADEMIC_EXAM_BOARD' | 'INSTITUTION_ERP';

export interface EvidenceRecord {
  id: string;
  admissionId: string;
  sourceType: EvidenceSourceType;
  status: EvidenceStatus;
  reference: string;
  checkedAt: string;
  sourceSystemName: string;
  discrepancyNote?: string;
}

export type ReconciliationStatus =
  | 'MATCHED'
  | 'MISMATCH'
  | 'EVIDENCE_MISSING'
  | 'STUDENT_PENDING'
  | 'STUDENT_DISPUTED'
  | 'REVIEW_REQUIRED';

export type ReasonCode =
  | 'INTAKE_EXCEEDED'
  | 'DUP_IDENTIFIER'
  | 'STUDENT_DISPUTED'
  | 'EVIDENCE_CONFLICT'
  | 'EVIDENCE_UNAVAILABLE'
  | 'STATE_CHANGE_UNSUPPORTED'
  | 'APAAR_FORMAT_INVALID'
  | 'STUDENT_PENDING_OVERDUE'
  | 'RECORD_OK';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SeverityFactor {
  rule: string;
  weight: number;
  explanation: string;
}

export interface ReconciliationResult {
  admissionId: string;
  status: ReconciliationStatus;
  severity: Severity;
  reasonCodes: ReasonCode[];
  humanReadableReasons: string[];
  ruleVersionApplied: string;
  ruleEffectiveDate?: string;
  severityBreakdown: SeverityFactor[];
  calculatedAt: string;
  isExcessSeat?: boolean;
  intakeDetails?: {
    baseLimit: number;
    supernumeraryQuota: number;
    reportedCount: number;
    excessSeats: number;
    calculationFormula: string;
  };
}

export type CaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface ReviewCase {
  id: string; // e.g. 'SEAL-2025-000417'
  admissionId: string;
  caseType: ReasonCode;
  status: CaseStatus;
  priority: Severity;
  institutionId: string;
  programmeId: string;
  assignedToRole?: Role;
  reviewerName?: string;
  reviewerRationale?: string;
  ruleVersionApplied?: string;
  ruleEffectiveDate?: string;
  calculationSummary?: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionOutcome?: 'ADMISSION_CONFIRMED' | 'ADMISSION_CANCELLED' | 'INTAKE_CORRECTED' | 'EVIDENCE_OVERRIDDEN' | 'RETURNED_FOR_CORRECTION' | 'DISMISSED';
}

export interface AuditEvent {
  id: string; // e.g. 'AUD-98214'
  timestamp: string;
  actorRole: Role;
  actorName: string;
  eventType:
    | 'STATE_TRANSITION'
    | 'INTAKE_VALIDATION'
    | 'ADMISSION_REPORTED'
    | 'CASE_RESOLVED'
    | 'DATA_CORRECTION'
    | 'REMINDER_SENT'
    | 'ACCESS_DENIED'
    | 'BREAK_GLASS_PII_REVEAL'
    | 'CONSENT_VERIFICATION'
    | 'DEMO_DATA_RESET';
  targetEntity: string;
  targetId: string;
  details: Record<string, any>;
  prevHash: string;
  hash: string;
}

export interface BreakGlassLogEntry {
  id: string;
  timestamp: string;
  officerName: string;
  officerRole: Role;
  reasonCode: 'COURT_DIRECTIVE' | 'STATUTORY_INVESTIGATION' | 'IDENTITY_DISPUTE_RESOLUTION' | 'AUDIT_COMPLIANCE_INSPECTION';
  justificationText: string;
  targetStudentOrAdmissionId: string;
  sessionDurationMinutes: number;
}

export interface ConsentAccessLogEntry {
  id: string;
  timestamp: string;
  apaarMasked: string;
  consentType: 'DIGILOCKER_OTP' | 'SELECTIVE_DISCLOSURE' | 'STATE_CET_QUERY' | 'EXAM_BOARD_QUERY';
  status: 'GRANTED' | 'REVOKED' | 'EXPIRED' | 'PENDING';
  requestor: string;
  purpose: string;
  ipMasked: string;
}

export interface SelectiveDisclosureResult {
  apaarRaw: string;
  maskedApaar: string;
  studentName: string;
  admissionId: string;
  institutionName: string;
  institutionCode: string;
  programmeName: string;
  degreeType: string;
  academicYear: AcademicYear;
  status: AdmissionState;
  quotaCategory: Category;
  isSupernumerary: boolean;
  verificationToken: string;
  verifiedAt: string;
  registrySealHash: string;
  consentGranted: boolean;
}

export interface SeatPoolBreakdown {
  generalApproved: number;
  generalFilled: number;
  supernumeraryApproved: number;
  supernumeraryFilled: number;
  nriApproved: number;
  nriFilled: number;
  ociApproved: number;
  ociFilled: number;
  fnApproved: number;
  fnFilled: number;
}

export interface Reminder {
  id: string;
  admissionId: string;
  studentId: string;
  sentAt: string;
  reminderCount: number;
  channel: 'SMS' | 'EMAIL' | 'PORTAL';
  nextActionRequired: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
  institutionId?: string; // If INSTITUTION_ADMIN
  studentId?: string;     // If STUDENT
  designation: string;
}
