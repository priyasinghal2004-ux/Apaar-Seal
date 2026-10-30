/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Admission,
  AuditEvent,
  BreakGlassLogEntry,
  ConsentAccessLogEntry,
  CurrentUser,
  EvidenceRecord,
  Institution,
  IntakeApproval,
  Programme,
  ReviewCase,
  RuleVersion,
  Student,
  StudentConfirmation,
} from '../types';
import { createAuditEvent, GENESIS_HASH } from './audit';
import { generateEvidenceRecordsForAdmission } from './evidenceAdapters';
import { RULE_VERSIONS } from './intakeValidation';

export const SEED_INSTITUTIONS: Institution[] = [
  {
    id: 'INST-01',
    code: 'VITM-MP',
    name: 'Vindhya Institute of Technology and Management',
    state: 'Madhya Pradesh',
    type: 'Private Affiliated',
    address: 'Bhopal Bypass Road, Gandhi Nagar, Bhopal 462036',
    contactEmail: 'registrar@vindhya-tech.edu.in',
    contactPhone: '+91 755 2894100',
    aicteRegion: 'Central Regional Office (CRO, Bhopal)',
    approvalStatus: 'APPROVED',
  },
  {
    id: 'INST-02',
    code: 'SCOE-MH',
    name: 'Saraswati College of Engineering',
    state: 'Maharashtra',
    type: 'Autonomous Institute',
    address: 'Sector 5, Kharghar, Navi Mumbai 410210',
    contactEmail: 'dean.admissions@saraswatieng.ac.in',
    contactPhone: '+91 22 27743701',
    aicteRegion: 'Western Regional Office (WRO, Mumbai)',
    approvalStatus: 'APPROVED',
  },
  {
    id: 'INST-03',
    code: 'KP-KA',
    name: 'Kaveri Polytechnic',
    state: 'Karnataka',
    type: 'Polytechnic',
    address: 'K.R. Circle, Mandya 571401',
    contactEmail: 'principal@kaveri-poly.edu.in',
    contactPhone: '+91 8232 224090',
    aicteRegion: 'South-Western Regional Office (SWRO, Bengaluru)',
    approvalStatus: 'APPROVED',
  },
  {
    id: 'INST-04',
    code: 'BSM-AS',
    name: 'Brahmaputra School of Management',
    state: 'Assam',
    type: 'State Technical',
    address: 'Jalukbari, Guwahati 781014',
    contactEmail: 'admissions@brahmaputra-mgmt.ac.in',
    contactPhone: '+91 361 2570411',
    aicteRegion: 'Eastern Regional Office (ERO, Kolkata)',
    approvalStatus: 'APPROVED',
  },
  {
    id: 'INST-05',
    code: 'RIP-RAJ',
    name: 'Rajputana Institute of Pharmacy',
    state: 'Rajasthan',
    type: 'Private Affiliated',
    address: 'NH-8, Amer Road, Jaipur 302028',
    contactEmail: 'info@rajputana-pharma.org',
    contactPhone: '+91 141 2635900',
    aicteRegion: 'North-Western Regional Office (NWRO, Chandigarh)',
    approvalStatus: 'NOTICE_ISSUED',
  },
  {
    id: 'INST-06',
    code: 'GEC-UP',
    name: 'Gomti Engineering College',
    state: 'Uttar Pradesh',
    type: 'State Technical',
    address: 'Faizabad Road, Lucknow 226028',
    contactEmail: 'registrar@gomti-eng.ac.in',
    contactPhone: '+91 522 2720199',
    aicteRegion: 'Northern Regional Office (NRO, Kanpur)',
    approvalStatus: 'APPROVED',
  },
];

export const SEED_PROGRAMMES: Programme[] = [
  { id: 'PROG-01', institutionId: 'INST-01', code: 'CSE-101', name: 'B.Tech Computer Science and Engineering', degreeType: 'B.Tech', durationYears: 4, approvedIntake: 100 },
  { id: 'PROG-02', institutionId: 'INST-01', code: 'CIV-102', name: 'B.Tech Civil Engineering', degreeType: 'B.Tech', durationYears: 4, approvedIntake: 60 },
  { id: 'PROG-03', institutionId: 'INST-02', code: 'CSE-201', name: 'B.Tech Computer Engineering', degreeType: 'B.Tech', durationYears: 4, approvedIntake: 60 },
  { id: 'PROG-04', institutionId: 'INST-02', code: 'MEC-202', name: 'B.Tech Mechanical Engineering', degreeType: 'B.Tech', durationYears: 4, approvedIntake: 60 },
  { id: 'PROG-05', institutionId: 'INST-03', code: 'DIP-MEC', name: 'Diploma in Mechanical Engineering', degreeType: 'Diploma', durationYears: 3, approvedIntake: 60 },
  { id: 'PROG-06', institutionId: 'INST-03', code: 'DIP-ELE', name: 'Diploma in Electrical Engineering', degreeType: 'Diploma', durationYears: 3, approvedIntake: 60 },
  { id: 'PROG-07', institutionId: 'INST-04', code: 'MBA-301', name: 'Master of Business Administration', degreeType: 'MBA', durationYears: 2, approvedIntake: 60 },
  { id: 'PROG-08', institutionId: 'INST-05', code: 'BPH-401', name: 'Bachelor of Pharmacy (B.Pharm)', degreeType: 'B.Pharm', durationYears: 4, approvedIntake: 60 },
  { id: 'PROG-09', institutionId: 'INST-06', code: 'CIV-501', name: 'B.Tech Civil Engineering', degreeType: 'B.Tech', durationYears: 4, approvedIntake: 60 },
];

export const SEED_APPROVALS: IntakeApproval[] = [
  {
    id: 'APR-01',
    institutionId: 'INST-01',
    programmeId: 'PROG-01',
    academicYear: '2025-26',
    category: 'OPEN',
    approvedLimit: 100,
    supernumeraryApprovedLimit: 6,
    ruleVersionId: 'v2025.2',
    sourceRef: 'AICTE/APR/2025-26/N-0194',
    issuedDate: '2025-05-18',
  },
  {
    id: 'APR-02',
    institutionId: 'INST-01',
    programmeId: 'PROG-02',
    academicYear: '2025-26',
    category: 'OPEN',
    approvedLimit: 60,
    supernumeraryApprovedLimit: 3,
    ruleVersionId: 'v2025.2',
    sourceRef: 'AICTE/APR/2025-26/N-0195',
    issuedDate: '2025-05-18',
  },
  {
    id: 'APR-03',
    institutionId: 'INST-02',
    programmeId: 'PROG-03',
    academicYear: '2025-26',
    category: 'OPEN',
    approvedLimit: 60,
    supernumeraryApprovedLimit: 3,
    ruleVersionId: 'v2025.2',
    sourceRef: 'AICTE/APR/2025-26/W-0881',
    issuedDate: '2025-05-20',
  },
  {
    id: 'APR-03-B',
    institutionId: 'INST-02',
    programmeId: 'PROG-04',
    academicYear: '2025-26',
    category: 'OPEN',
    approvedLimit: 60,
    supernumeraryApprovedLimit: 3,
    ruleVersionId: 'v2025.2',
    sourceRef: 'AICTE/APR/2025-26/W-0882',
    issuedDate: '2025-05-20',
  },
  {
    id: 'APR-04',
    institutionId: 'INST-03',
    programmeId: 'PROG-05',
    academicYear: '2025-26',
    category: 'OPEN',
    approvedLimit: 60,
    supernumeraryApprovedLimit: 3,
    ruleVersionId: 'v2025.2',
    sourceRef: 'AICTE/APR/2025-26/SW-0412',
    issuedDate: '2025-05-22',
  },
  {
    id: 'APR-04-B',
    institutionId: 'INST-03',
    programmeId: 'PROG-06',
    academicYear: '2025-26',
    category: 'OPEN',
    approvedLimit: 60,
    supernumeraryApprovedLimit: 3,
    ruleVersionId: 'v2025.2',
    sourceRef: 'AICTE/APR/2025-26/SW-0413',
    issuedDate: '2025-05-22',
  },
  {
    id: 'APR-05',
    institutionId: 'INST-04',
    programmeId: 'PROG-07',
    academicYear: '2025-26',
    category: 'OPEN',
    approvedLimit: 60,
    supernumeraryApprovedLimit: 3,
    ruleVersionId: 'v2025.2',
    sourceRef: 'AICTE/APR/2025-26/E-0129',
    issuedDate: '2025-05-25',
  },
  {
    id: 'APR-06',
    institutionId: 'INST-05',
    programmeId: 'PROG-08',
    academicYear: '2025-26',
    category: 'OPEN',
    approvedLimit: 60,
    supernumeraryApprovedLimit: 3,
    ruleVersionId: 'v2025.2',
    sourceRef: 'AICTE/APR/2025-26/NW-0518',
    issuedDate: '2025-05-29',
  },
  {
    id: 'APR-07',
    institutionId: 'INST-06',
    programmeId: 'PROG-09',
    academicYear: '2025-26',
    category: 'OPEN',
    approvedLimit: 60,
    supernumeraryApprovedLimit: 3,
    ruleVersionId: 'v2025.2',
    sourceRef: 'AICTE/APR/2025-26/N-0731',
    issuedDate: '2025-06-02',
  },
];

export const DEMO_USERS: Record<string, CurrentUser> = {
  INSTITUTION_ADMIN: {
    id: 'USR-INST-01',
    name: 'Dr. Rameshwar Sharma',
    role: 'INSTITUTION_ADMIN',
    institutionId: 'INST-01',
    designation: 'Registrar & Admissions In-charge (Vindhya Tech)',
  },
  STUDENT: {
    id: 'USR-STU-01',
    name: 'Ananya Verma',
    role: 'STUDENT',
    studentId: 'STU-001',
    designation: 'Candidate (B.Tech CSE Applicant)',
  },
  AICTE_REGULATOR: {
    id: 'USR-REG-01',
    name: 'Smt. K. Meenakshi Sundaram',
    role: 'AICTE_REGULATOR',
    designation: 'Advisor-I (Approval Bureau), AICTE HQ New Delhi',
  },
  AUDITOR: {
    id: 'USR-AUD-01',
    name: 'Shri Vikramaditya Sen',
    role: 'AUDITOR',
    designation: 'Senior Audit Officer, Comptroller & Auditor General Empanelled',
  },
};

// Seed Indian names generator for ~180 realistic records
const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Advait', 'Akash', 'Ananya', 'Anik', 'Anushka', 'Arjun', 'Arnav', 'Ayush',
  'Bhavna', 'Chetan', 'Deepak', 'Devansh', 'Dhruv', 'Diya', 'Divyansh', 'Gaurav', 'Harsh', 'Ishaan',
  'Ishita', 'Jatin', 'Kalyan', 'Karan', 'Kavya', 'Krish', 'Madhav', 'Manish', 'Meera', 'Mohit',
  'Naveen', 'Neha', 'Nikhil', 'Pooja', 'Pranav', 'Prateek', 'Priya', 'Rahul', 'Rishi', 'Ritu',
  'Rohan', 'Sakshi', 'Sameer', 'Sanjay', 'Sanya', 'Shlok', 'Shreya', 'Siddharth', 'Sneha', 'Tanvi',
  'Tarun', 'Utkarsh', 'Vaibhav', 'Varun', 'Vedant', 'Vidya', 'Vikram', 'Vinay', 'Yash', 'Zoya'
];

const LAST_NAMES = [
  'Agarwal', 'Banerjee', 'Bhatt', 'Chakraborty', 'Chauhan', 'Das', 'Deshmukh', 'Dubey', 'Garg', 'Ghosh',
  'Gupta', 'Iyer', 'Jadhav', 'Jain', 'Jha', 'Joshi', 'Kashyap', 'Khan', 'Kulkarni', 'Kumar',
  'Mishra', 'Mukherjee', 'Nair', 'Pandey', 'Patel', 'Patil', 'Pawar', 'Prasad', 'Rao', 'Reddy',
  'Roy', 'Saxena', 'Sen', 'Shah', 'Sharma', 'Shukla', 'Singh', 'Srivastava', 'Tiwari', 'Tripathi',
  'Varma', 'Verma', 'Yadav'
];

export interface SeedDataPayload {
  institutions: Institution[];
  programmes: Programme[];
  approvals: IntakeApproval[];
  ruleVersions: RuleVersion[];
  students: Student[];
  admissions: Admission[];
  confirmations: StudentConfirmation[];
  evidenceRecords: EvidenceRecord[];
  reviewCases: ReviewCase[];
  auditEvents: AuditEvent[];
  breakGlassLogs: BreakGlassLogEntry[];
  consentLogs: ConsentAccessLogEntry[];
}

export function generateSeedData(): SeedDataPayload {
  const students: Student[] = [];
  const admissions: Admission[] = [];
  const confirmations: StudentConfirmation[] = [];
  const evidenceRecords: EvidenceRecord[] = [];
  const reviewCases: ReviewCase[] = [];

  // Anchor Student: Ananya Verma (demonstrating cross-institution collision)
  // Masked APAAR: XXXX-XXXX-4821
  const ananyaApaar = '492817354821';
  const ananyaStudent: Student = {
    id: 'STU-001',
    name: 'Ananya Verma',
    apaarId: ananyaApaar,
    maskedApaar: 'XXXX-XXXX-4821',
    dob: '2004-06-15',
    category: 'OPEN',
    email: 'ananya.verma24@example.in',
    phone: '+91 98260 41201',
    domicileState: 'Madhya Pradesh',
  };
  students.push(ananyaStudent);

  // 1. VINDHYA B.TECH CSE SCENARIO: EXACTLY 120 REPORTED ADMISSIONS AGAINST 100 BASE LIMIT
  // Under v2025.2, 6 seats are legitimate TFWS supernumerary seats.
  // Standard admissions = 120 - 6 = 114.
  // Base approved limit = 100.
  // Resulting excess = 114 - 100 = 14 excess admissions.
  // This satisfies requirement 4(a) and 5 strictly.
  for (let i = 1; i <= 120; i++) {
    const isAnanya = i === 1;
    const name = isAnanya
      ? 'Ananya Verma'
      : `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 3) % LAST_NAMES.length]}`;
    const studentId = isAnanya ? 'STU-001' : `STU-VITM-${String(i).padStart(4, '0')}`;
    const rawApaar = isAnanya ? ananyaApaar : `88${String(1000000000 + i * 7391).slice(-10)}`;
    const maskedApaar = `XXXX-XXXX-${rawApaar.slice(-4)}`;

    if (!isAnanya) {
      students.push({
        id: studentId,
        name,
        apaarId: rawApaar,
        maskedApaar,
        dob: `2004-0${(i % 9) + 1}-12`,
        category: i % 8 === 0 ? 'TFWS' : i % 5 === 0 ? 'OBC_NCL' : i % 7 === 0 ? 'SC' : 'OPEN',
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.in`,
        phone: `+91 98${String(10000000 + i * 291).slice(-8)}`,
        domicileState: 'Madhya Pradesh',
      });
    }

    // Designate exactly 6 records as legitimate TFWS supernumerary (e.g. indices 10, 20, 30, 40, 50, 60)
    const isTfwsSuper = [10, 20, 30, 40, 50, 60].includes(i);
    const admId = `ADM-25-${String(4000 + i).padStart(6, '0')}`;
    const admDate = i <= 30 ? '2025-06-20' : '2025-07-15'; // Mixed dates demonstrating v2025.1 vs v2025.2

    let currentState: Admission['currentState'] = 'REPORTED';
    let confirmationStatus: StudentConfirmation['status'] = 'CONFIRMED';
    let daysPending = 0;
    let disputeReason: string | undefined = undefined;

    // Disputed cases in Vindhya (3 cases)
    if (i === 14) {
      currentState = 'DISPUTED';
      confirmationStatus = 'DISPUTED';
      disputeReason = 'Never applied to this institution; student confirmed enrollment at NIT Trichy.';
    } else if (i === 28) {
      currentState = 'DISPUTED';
      confirmationStatus = 'DISPUTED';
      disputeReason = 'Admitted but programme is different from reported (opted for Civil, reported in CSE).';
    } else if (i === 42) {
      currentState = 'DISPUTED';
      confirmationStatus = 'DISPUTED';
      disputeReason = 'Tuition fee extortion grievance lodged on AICTE Grievance Portal.';
    } else if (i > 70 && i <= 100) {
      // Pending confirmations
      currentState = 'PENDING';
      confirmationStatus = 'PENDING';
      daysPending = i > 85 ? 38 : 14; // >30 days for some
    } else if (i > 100) {
      currentState = 'REPORTED';
      confirmationStatus = 'CONFIRMED';
    }

    const adm: Admission = {
      id: admId,
      institutionId: 'INST-01',
      programmeId: 'PROG-01',
      studentId,
      studentName: name,
      maskedApaar,
      apaarRaw: rawApaar,
      dob: `2004-0${(i % 9) + 1}-12`,
      academicYear: '2025-26',
      quotaCategory: isTfwsSuper ? 'TFWS' : (i % 6 === 0 ? 'EWS' : i % 5 === 0 ? 'OBC_NCL' : 'OPEN'),
      isSupernumerary: isTfwsSuper,
      supernumeraryType: isTfwsSuper ? 'TFWS' : 'NONE',
      admissionDate: admDate,
      currentState,
      counsellingRollNo: `CCN-MP-2025-${String(1000 + i).padStart(6, '0')}`,
      reportedTimestamp: `${admDate}T10:${String((i * 3) % 60).padStart(2, '0')}:00.000Z`,
      counsellingAuthority: 'Directorate of Technical Education (DTE, MP)',
      notes: i === 115 ? 'UNSUPPORTED_STATE_CHANGE: Record reported with pending gazette order' : undefined,
    };
    admissions.push(adm);

    // Confirmation record
    confirmations.push({
      id: `CONF-${admId.slice(-6)}`,
      admissionId: admId,
      studentId,
      status: confirmationStatus,
      disputeReason,
      disputeCategory: disputeReason ? (i === 14 ? 'NEVER_APPLIED' : i === 28 ? 'DIFFERENT_PROGRAMME' : 'FEE_EXTORTION') : undefined,
      disputeSubmittedAt: disputeReason ? '2025-07-22T14:30:00.000Z' : undefined,
      confirmedAt: confirmationStatus === 'CONFIRMED' ? '2025-07-16T11:20:00.000Z' : undefined,
      daysPending,
      lastReminderSentAt: daysPending > 30 ? '2025-08-01T09:00:00.000Z' : undefined,
    });

    // Evidence records
    const ev = generateEvidenceRecordsForAdmission(admId, adm.counsellingRollNo, 'VITM-MP', admDate);
    // Introduce deliberate conflict for a couple records
    if (i === 18 || i === 33) {
      ev[0].status = 'CONFLICT';
      ev[0].discrepancyNote = 'Counselling authority records indicate candidate surrendered seat in Round 2.';
    }
    evidenceRecords.push(...ev);
  }

  // 2. SARASWATI COLLEGE OF ENGINEERING (INST-02): ~25 admissions
  // Deliberate cross-institution collision with Ananya Verma!
  for (let i = 1; i <= 25; i++) {
    const isCollision = i === 1;
    const name = isCollision ? 'Ananya Verma' : `${FIRST_NAMES[(i + 15) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 4) % LAST_NAMES.length]}`;
    const studentId = isCollision ? 'STU-001' : `STU-SCOE-${String(i).padStart(4, '0')}`;
    const rawApaar = isCollision ? ananyaApaar : `77${String(2000000000 + i * 4913).slice(-10)}`;
    const maskedApaar = `XXXX-XXXX-${rawApaar.slice(-4)}`;
    const admId = `ADM-25-${String(5000 + i).padStart(6, '0')}`;
    const admDate = '2025-07-18';

    if (!isCollision) {
      students.push({
        id: studentId,
        name,
        apaarId: rawApaar,
        maskedApaar,
        dob: '2004-03-22',
        category: 'OPEN',
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.in`,
        phone: `+91 97${String(20000000 + i * 192).slice(-8)}`,
        domicileState: 'Maharashtra',
      });
    }

    const adm: Admission = {
      id: admId,
      institutionId: 'INST-02',
      programmeId: 'PROG-03',
      studentId,
      studentName: name,
      maskedApaar,
      apaarRaw: rawApaar,
      dob: '2004-03-22',
      academicYear: '2025-26',
      quotaCategory: 'OPEN',
      isSupernumerary: false,
      admissionDate: admDate,
      currentState: isCollision ? 'UNDER_REVIEW' : 'EVIDENCE_VERIFIED',
      counsellingRollNo: `CCN-MH-2025-${String(2000 + i).padStart(6, '0')}`,
      reportedTimestamp: `${admDate}T12:00:00.000Z`,
      counsellingAuthority: 'State Common Entrance Test Cell (CET Cell, MH)',
    };
    admissions.push(adm);

    confirmations.push({
      id: `CONF-${admId.slice(-6)}`,
      admissionId: admId,
      studentId,
      status: isCollision ? 'DISPUTED' : 'CONFIRMED',
      disputeReason: isCollision ? 'Never applied to Saraswati College; registered at Vindhya Tech.' : undefined,
      confirmedAt: isCollision ? undefined : '2025-07-20T10:00:00.000Z',
      daysPending: 0,
    });

    const ev = generateEvidenceRecordsForAdmission(admId, adm.counsellingRollNo, 'SCOE-MH', admDate);
    evidenceRecords.push(...ev);
  }

  // 3. KAVERI POLYTECHNIC (INST-03): ~15 admissions
  // Includes second collision pair (reported at Kaveri and Brahmaputra)
  const sharedApaar2 = '918273649102';
  for (let i = 1; i <= 15; i++) {
    const isDup = i === 1;
    const name = isDup ? 'Rohan Kulkarni' : `${FIRST_NAMES[(i + 30) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 5) % LAST_NAMES.length]}`;
    const rawApaar = isDup ? sharedApaar2 : `66${String(3000000000 + i * 8127).slice(-10)}`;
    const maskedApaar = `XXXX-XXXX-${rawApaar.slice(-4)}`;
    const studentId = `STU-KP-${String(i).padStart(4, '0')}`;
    const admId = `ADM-25-${String(6000 + i).padStart(6, '0')}`;
    const admDate = '2025-07-20';

    students.push({
      id: studentId,
      name,
      apaarId: rawApaar,
      maskedApaar,
      dob: '2005-02-14',
      category: 'OBC_NCL',
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.in`,
      phone: `+91 94${String(30000000 + i * 381).slice(-8)}`,
      domicileState: 'Karnataka',
    });

    const adm: Admission = {
      id: admId,
      institutionId: 'INST-03',
      programmeId: 'PROG-05',
      studentId,
      studentName: name,
      maskedApaar,
      apaarRaw: rawApaar,
      dob: '2005-02-14',
      academicYear: '2025-26',
      quotaCategory: 'OBC_NCL',
      isSupernumerary: false,
      admissionDate: admDate,
      currentState: 'REPORTED',
      counsellingRollNo: `CCN-KA-2025-${String(3000 + i).padStart(6, '0')}`,
      reportedTimestamp: `${admDate}T14:00:00.000Z`,
      counsellingAuthority: 'Karnataka Examination Authority (KEA)',
    };
    admissions.push(adm);

    confirmations.push({
      id: `CONF-${admId.slice(-6)}`,
      admissionId: admId,
      studentId,
      status: 'CONFIRMED',
      confirmedAt: '2025-07-22T09:30:00.000Z',
      daysPending: 0,
    });

    const ev = generateEvidenceRecordsForAdmission(admId, adm.counsellingRollNo, 'KP-KA', admDate);
    evidenceRecords.push(...ev);
  }

  // 4. BRAHMAPUTRA SCHOOL OF MANAGEMENT (INST-04): ~10 admissions
  // Shares sharedApaar2 with Kaveri Polytechnic
  for (let i = 1; i <= 10; i++) {
    const isDup = i === 1;
    const name = isDup ? 'Rohan Kulkarni' : `${FIRST_NAMES[(i + 40) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 6) % LAST_NAMES.length]}`;
    const rawApaar = isDup ? sharedApaar2 : `55${String(4000000000 + i * 2911).slice(-10)}`;
    const maskedApaar = `XXXX-XXXX-${rawApaar.slice(-4)}`;
    const studentId = `STU-BSM-${String(i).padStart(4, '0')}`;
    const admId = `ADM-25-${String(7000 + i).padStart(6, '0')}`;
    const admDate = '2025-07-22';

    if (!isDup) {
      students.push({
        id: studentId,
        name,
        apaarId: rawApaar,
        maskedApaar,
        dob: '2002-11-08',
        category: 'OPEN',
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.in`,
        phone: `+91 93${String(40000000 + i * 492).slice(-8)}`,
        domicileState: 'Assam',
      });
    }

    const adm: Admission = {
      id: admId,
      institutionId: 'INST-04',
      programmeId: 'PROG-07',
      studentId,
      studentName: name,
      maskedApaar,
      apaarRaw: rawApaar,
      dob: '2002-11-08',
      academicYear: '2025-26',
      quotaCategory: 'OPEN',
      isSupernumerary: false,
      admissionDate: admDate,
      currentState: isDup ? 'UNDER_REVIEW' : 'REPORTED',
      counsellingRollNo: `CCN-AS-2025-${String(4000 + i).padStart(6, '0')}`,
      reportedTimestamp: `${admDate}T16:00:00.000Z`,
      counsellingAuthority: 'Directorate of Technical Education (Assam)',
    };
    admissions.push(adm);

    confirmations.push({
      id: `CONF-${admId.slice(-6)}`,
      admissionId: admId,
      studentId,
      status: isDup ? 'DISPUTED' : 'CONFIRMED',
      disputeReason: isDup ? 'Admitted to Kaveri Polytechnic in Karnataka; never sought MBA admission in Assam.' : undefined,
      confirmedAt: isDup ? undefined : '2025-07-24T12:00:00.000Z',
      daysPending: 0,
    });

    const ev = generateEvidenceRecordsForAdmission(admId, adm.counsellingRollNo, 'BSM-AS', admDate);
    evidenceRecords.push(...ev);
  }

  // 5. RAJPUTANA INSTITUTE OF PHARMACY (INST-05): ~12 admissions
  // Demonstrates:
  // - Counselling endpoint UNAVAILABLE (~12 records with UNAVAILABLE evidence)
  // - Intra-institution duplicate (same APAAR reported twice in Rajputana)
  const sharedApaar3 = '771234903341';
  for (let i = 1; i <= 12; i++) {
    const isDup = i === 1 || i === 2;
    const name = isDup ? 'Vikramaditya Rathore' : `${FIRST_NAMES[(i + 50) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]}`;
    const rawApaar = isDup ? sharedApaar3 : `44${String(5000000000 + i * 5191).slice(-10)}`;
    const maskedApaar = `XXXX-XXXX-${rawApaar.slice(-4)}`;
    const studentId = `STU-RIP-${String(i).padStart(4, '0')}`;
    const admId = `ADM-25-${String(8000 + i).padStart(6, '0')}`;
    const admDate = '2025-07-25';

    if (i !== 2) {
      students.push({
        id: studentId,
        name,
        apaarId: rawApaar,
        maskedApaar,
        dob: '2004-08-19',
        category: 'OPEN',
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.in`,
        phone: `+91 92${String(50000000 + i * 718).slice(-8)}`,
        domicileState: 'Rajasthan',
      });
    }

    const adm: Admission = {
      id: admId,
      institutionId: 'INST-05',
      programmeId: 'PROG-08',
      studentId,
      studentName: name,
      maskedApaar,
      apaarRaw: rawApaar,
      dob: '2004-08-19',
      academicYear: '2025-26',
      quotaCategory: 'OPEN',
      isSupernumerary: false,
      admissionDate: admDate,
      currentState: isDup ? 'UNDER_REVIEW' : 'PENDING',
      counsellingRollNo: `CCN-RAJ-UNAV-${String(5000 + i).padStart(6, '0')}`,
      reportedTimestamp: `${admDate}T11:00:00.000Z`,
      counsellingAuthority: 'Rajasthan University of Health Sciences (RUHS)',
    };
    admissions.push(adm);

    confirmations.push({
      id: `CONF-${admId.slice(-6)}`,
      admissionId: admId,
      studentId,
      status: 'PENDING',
      daysPending: 18,
    });

    const ev = generateEvidenceRecordsForAdmission(admId, adm.counsellingRollNo, 'RIP-RAJ', admDate);
    evidenceRecords.push(...ev);
  }

  // 6. GOMTI ENGINEERING COLLEGE (INST-06): ~8 admissions
  // Demonstrates unsupported state transition (migrated without supporting doc)
  for (let i = 1; i <= 8; i++) {
    const name = `${FIRST_NAMES[(i + 55) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 8) % LAST_NAMES.length]}`;
    const rawApaar = `33${String(6000000000 + i * 9182).slice(-10)}`;
    const maskedApaar = `XXXX-XXXX-${rawApaar.slice(-4)}`;
    const studentId = `STU-GEC-${String(i).padStart(4, '0')}`;
    const admId = `ADM-25-${String(9000 + i).padStart(6, '0')}`;
    const admDate = '2025-07-28';

    students.push({
      id: studentId,
      name,
      apaarId: rawApaar,
      maskedApaar,
      dob: '2004-12-05',
      category: 'OPEN',
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.in`,
      phone: `+91 91${String(60000000 + i * 991).slice(-8)}`,
      domicileState: 'Uttar Pradesh',
    });

    const isMigrated = i === 1;
    const adm: Admission = {
      id: admId,
      institutionId: 'INST-06',
      programmeId: 'PROG-09',
      studentId,
      studentName: name,
      maskedApaar,
      apaarRaw: rawApaar,
      dob: '2004-12-05',
      academicYear: '2025-26',
      quotaCategory: 'OPEN',
      isSupernumerary: false,
      admissionDate: admDate,
      currentState: isMigrated ? 'MIGRATED' : 'STUDENT_CONFIRMED',
      counsellingRollNo: `CCN-UP-2025-${String(6000 + i).padStart(6, '0')}`,
      reportedTimestamp: `${admDate}T15:30:00.000Z`,
      counsellingAuthority: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
      // Note: i === 1 intentionally lacks stateChangeSupportingDocRef to demonstrate STATE_CHANGE_UNSUPPORTED
      stateChangeSupportingDocRef: isMigrated ? undefined : 'AKTU/AFF/2025-REG-019',
      notes: isMigrated ? 'UNSUPPORTED_STATE_CHANGE: Transferred seat marked MIGRATED without official transfer gazette' : undefined,
    };
    admissions.push(adm);

    confirmations.push({
      id: `CONF-${admId.slice(-6)}`,
      admissionId: admId,
      studentId,
      status: 'CONFIRMED',
      confirmedAt: '2025-07-30T10:00:00.000Z',
      daysPending: 0,
    });

    const ev = generateEvidenceRecordsForAdmission(admId, adm.counsellingRollNo, 'GEC-UP', admDate);
    evidenceRecords.push(...ev);
  }

  // Pre-generate Review Cases for key flagged scenarios
  // 1. Vindhya B.Tech CSE: 14 Excess Admissions (from index 106 to 119 in admissions)
  // 120 reported - 6 legitimate TFWS supernumerary under v2025.2 = 114 standard seats.
  // Approved base limit = 100. Excess = 14 records.
  for (let idx = 0; idx < 14; idx++) {
    const excessAdm = admissions[106 + idx];
    const caseNum = String(401 + idx).padStart(6, '0');
    reviewCases.push({
      id: `SEAL-2025-${caseNum}`,
      admissionId: excessAdm.id,
      caseType: 'INTAKE_EXCEEDED',
      status: idx === 0 ? 'UNDER_REVIEW' : 'OPEN',
      priority: 'HIGH',
      institutionId: 'INST-01',
      programmeId: 'PROG-01',
      assignedToRole: idx === 0 ? 'AICTE_REGULATOR' : undefined,
      reviewerName: idx === 0 ? 'Smt. K. Meenakshi Sundaram' : undefined,
      ruleVersionApplied: 'v2025.2',
      ruleEffectiveDate: '2025-07-01',
      calculationSummary: 'Exceeds sanctioned base intake: 120 reported admissions - 6 legitimate TFWS supernumerary under v2025.2 = 114 standard admissions vs 100 base limit (14 excess records).',
      createdAt: '2025-07-26T10:14:00.000Z',
    });
  }

  // 2. Ananya Verma cross-institution collision (Case SEAL-2025-000415)
  reviewCases.push({
    id: 'SEAL-2025-000415',
    admissionId: admissions[120].id, // Ananya at Saraswati
    caseType: 'DUP_IDENTIFIER',
    status: 'UNDER_REVIEW',
    priority: 'HIGH',
    institutionId: 'INST-02',
    programmeId: 'PROG-03',
    assignedToRole: 'AICTE_REGULATOR',
    reviewerName: 'Smt. K. Meenakshi Sundaram',
    ruleVersionApplied: 'v2025.2',
    ruleEffectiveDate: '2025-07-01',
    calculationSummary: 'Cross-institution collision: APAAR XXXX-XXXX-4821 reported concurrently at Vindhya (VITM-MP) and Saraswati (SCOE-MH).',
    createdAt: '2025-07-26T11:00:00.000Z',
  });

  // 3. Disputed admission at Vindhya (Never applied)
  reviewCases.push({
    id: 'SEAL-2025-000416',
    admissionId: admissions[13].id,
    caseType: 'STUDENT_DISPUTED',
    status: 'OPEN',
    priority: 'HIGH',
    institutionId: 'INST-01',
    programmeId: 'PROG-01',
    ruleVersionApplied: 'v2025.1',
    ruleEffectiveDate: '2025-01-01',
    calculationSummary: 'Candidate filed contestation stating admission was never sought at this institution.',
    createdAt: '2025-07-26T14:22:00.000Z',
  });

  // 4. Evidence Conflict
  reviewCases.push({
    id: 'SEAL-2025-000417',
    admissionId: admissions[17].id,
    caseType: 'EVIDENCE_CONFLICT',
    status: 'OPEN',
    priority: 'MEDIUM',
    institutionId: 'INST-01',
    programmeId: 'PROG-01',
    ruleVersionApplied: 'v2025.1',
    ruleEffectiveDate: '2025-01-01',
    calculationSummary: 'External counselling registry discrepancy: candidate record shows seat surrender in Round 2.',
    createdAt: '2025-07-27T09:15:00.000Z',
  });

  // 5. Unsupported state change at Gomti
  reviewCases.push({
    id: 'SEAL-2025-000418',
    admissionId: admissions[admissions.length - 8].id,
    caseType: 'STATE_CHANGE_UNSUPPORTED',
    status: 'OPEN',
    priority: 'HIGH',
    institutionId: 'INST-06',
    programmeId: 'PROG-09',
    ruleVersionApplied: 'v2025.2',
    ruleEffectiveDate: '2025-07-01',
    calculationSummary: 'State change to MIGRATED recorded without mandatory statutory order/transfer reference.',
    createdAt: '2025-07-28T16:00:00.000Z',
  });

  // Pre-populate cryptographic audit chain with realistic chained history events
  const auditEvents: AuditEvent[] = [];
  let prevHash = GENESIS_HASH;

  const seedAuditBlueprints = [
    {
      actorRole: 'AICTE_REGULATOR' as const,
      actorName: 'System Bootstrap Officer',
      eventType: 'INTAKE_VALIDATION' as const,
      targetEntity: 'RuleVersion',
      targetId: 'v2025.2',
      details: { action: 'ACTIVATED_RULE_VERSION', policyProvenance: 'Illustrative prototype rules: Simulated policy configuration v2025.2' },
    },
    {
      actorRole: 'AICTE_REGULATOR' as const,
      actorName: 'Smt. K. Meenakshi Sundaram',
      eventType: 'INTAKE_VALIDATION' as const,
      targetEntity: 'IntakeApproval',
      targetId: 'APR-01',
      details: { institutionCode: 'VITM-MP', approvedLimit: 100, supernumeraryApprovedLimit: 6 },
    },
    {
      actorRole: 'INSTITUTION_ADMIN' as const,
      actorName: 'Dr. Rameshwar Sharma',
      eventType: 'ADMISSION_REPORTED' as const,
      targetEntity: 'AdmissionBatch',
      targetId: 'BATCH-VITM-2025-01',
      details: { batchSize: 120, programmeCode: 'CSE-101', institutionId: 'INST-01' },
    },
    {
      actorRole: 'AICTE_REGULATOR' as const,
      actorName: 'Automated Assurance Engine',
      eventType: 'INTAKE_VALIDATION' as const,
      targetEntity: 'Admission',
      targetId: 'ADM-25-004120',
      details: { reasonCode: 'INTAKE_EXCEEDED', excessIdentified: 14, ruleVersion: 'v2025.2' },
    },
    {
      actorRole: 'STUDENT' as const,
      actorName: 'Ananya Verma',
      eventType: 'STATE_TRANSITION' as const,
      targetEntity: 'Admission',
      targetId: 'ADM-25-004001',
      details: { fromState: 'REPORTED', toState: 'DISPUTED', contestationReason: 'Registered at Vindhya; Saraswati entry is erroneous' },
    },
    {
      actorRole: 'INSTITUTION_ADMIN' as const,
      actorName: 'Dr. Rameshwar Sharma',
      eventType: 'REMINDER_SENT' as const,
      targetEntity: 'StudentConfirmation',
      targetId: 'BATCH-REMINDER-01',
      details: { recipientsCount: 15, trigger: 'CONFIRMATION_PENDING_OVER_30_DAYS' },
    },
    {
      actorRole: 'AICTE_REGULATOR' as const,
      actorName: 'Smt. K. Meenakshi Sundaram',
      eventType: 'CASE_RESOLVED' as const,
      targetEntity: 'ReviewCase',
      targetId: 'SEAL-2025-000399',
      details: { outcome: 'ADMISSION_CONFIRMED', rationale: 'Substantiated by verified state counselling gazette roll sheet.' },
    },
  ];

  for (const b of seedAuditBlueprints) {
    const ev = createAuditEvent(b.actorRole, b.actorName, b.eventType, b.targetEntity, b.targetId, b.details, prevHash);
    prevHash = ev.hash;
    auditEvents.push(ev);
  }

  const breakGlassLogs: BreakGlassLogEntry[] = [
    {
      id: 'BG-2025-001',
      timestamp: '2025-07-26T11:15:00.000Z',
      officerName: 'Smt. K. Meenakshi Sundaram',
      officerRole: 'AICTE_REGULATOR',
      reasonCode: 'IDENTITY_DISPUTE_RESOLUTION',
      justificationText: 'Resolution of concurrent admission conflict across Vindhya Tech and Saraswati College (Case SEAL-2025-000415). Unmasked candidate mobile and domicile to confirm genuine seat.',
      targetStudentOrAdmissionId: 'STU-001',
      sessionDurationMinutes: 15,
    },
  ];

  const consentLogs: ConsentAccessLogEntry[] = [
    {
      id: 'CSL-2025-001',
      timestamp: '2025-07-16T11:20:00.000Z',
      apaarMasked: 'XXXX-XXXX-4821',
      consentType: 'DIGILOCKER_OTP',
      status: 'GRANTED',
      requestor: 'AICTE SEAL Verification Gateway',
      purpose: 'Candidate seat admission confirmation for Vindhya Tech B.Tech CSE',
      ipMasked: '103.21.***.***',
    },
    {
      id: 'CSL-2025-002',
      timestamp: '2025-07-18T14:10:00.000Z',
      apaarMasked: 'XXXX-XXXX-4821',
      consentType: 'STATE_CET_QUERY',
      status: 'GRANTED',
      requestor: 'CET Cell Maharashtra API Adapter',
      purpose: 'Cross-verification of allotment roll CCN-MH-2025-2001',
      ipMasked: '14.139.***.***',
    },
    {
      id: 'CSL-2025-003',
      timestamp: '2025-07-20T10:00:00.000Z',
      apaarMasked: 'XXXX-XXXX-9102',
      consentType: 'DIGILOCKER_OTP',
      status: 'GRANTED',
      requestor: 'AICTE SEAL Verification Gateway',
      purpose: 'Candidate seat admission confirmation for Kaveri Polytechnic',
      ipMasked: '117.200.***.***',
    },
    {
      id: 'CSL-2025-004',
      timestamp: '2025-07-25T09:30:00.000Z',
      apaarMasked: 'XXXX-XXXX-3341',
      consentType: 'EXAM_BOARD_QUERY',
      status: 'PENDING',
      requestor: 'RUHS Jaipur Allotment Service',
      purpose: 'Automated counselling registry sync for Pharmacy intake',
      ipMasked: '49.36.***.***',
    },
  ];

  return {
    institutions: SEED_INSTITUTIONS,
    programmes: SEED_PROGRAMMES,
    approvals: SEED_APPROVALS,
    ruleVersions: RULE_VERSIONS,
    students,
    admissions,
    confirmations,
    evidenceRecords,
    reviewCases,
    auditEvents,
    breakGlassLogs,
    consentLogs,
  };
}
