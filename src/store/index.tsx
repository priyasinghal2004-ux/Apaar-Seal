/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Admission,
  AdmissionState,
  AuditEvent,
  BreakGlassLogEntry,
  ConsentAccessLogEntry,
  CurrentUser,
  EvidenceRecord,
  Institution,
  IntakeApproval,
  Programme,
  ReconciliationResult,
  ReviewCase,
  Role,
  RuleVersion,
  SelectiveDisclosureResult,
  Student,
  StudentConfirmation,
} from '../types';
import { AccessDeniedError, checkAccessPermission } from '../services/accessControl';
import { createAuditEvent, verifyAuditChain, recomputeAuditChain } from '../services/audit';
import { generateEvidenceRecordsForAdmission } from '../services/evidenceAdapters';
import { parseAdmissionsCsv, processAndCommitBatchImport } from '../services/importService';
import { runBatchReconciliation } from '../services/reconciliation';
import { createStudentReminder } from '../services/reminders';
import { DEMO_USERS, generateSeedData } from '../services/seedData';
import { validateStateTransition } from '../services/stateMachine';

export interface ToastMessage {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
}

export interface StoreContextType {
  currentUser: CurrentUser;
  academicYear: string;
  tableDensity: 'compact' | 'comfortable';
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
  isBreakGlassActive: boolean;
  activeBreakGlassReason: string | null;
  reconciliationMap: Map<string, ReconciliationResult>;
  toasts: ToastMessage[];

  // Mutators & Actions
  setCurrentUserRole: (role: Role) => void;
  setAcademicYear: (year: string) => void;
  setTableDensity: (density: 'compact' | 'comfortable') => void;
  addToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  recordBreakGlassAccess: (reasonCode: any, justification: string, targetId?: string) => boolean;
  revokeBreakGlass: () => void;
  verifyRecordByApaar: (apaarRaw: string, consentGranted: boolean) => SelectiveDisclosureResult | null;

  startReviewCase: (caseId: string) => Promise<boolean>;
  returnCaseForCorrection: (caseId: string, feedback: string) => Promise<boolean>;
  resolveReviewCase: (caseId: string, outcome: ReviewCase['resolutionOutcome'], rationale: string) => Promise<boolean>;
  recordConfirmationAction: (admissionId: string, action: 'CONFIRM' | 'DISPUTE', disputeReason?: string, disputeCat?: any) => boolean;
  transitionAdmissionState: (admissionId: string, nextState: AdmissionState, docRef?: string) => boolean;
  dispatchReminder: (admissionId: string) => boolean;
  importAdmissionsCsvData: (csvContent: string, institutionId: string, programmeId: string) => Promise<{ success: boolean; message: string }>;
  verifyLedgerChain: () => ReturnType<typeof verifyAuditChain>;
  simulateAuditTamper: (blockIndex?: number) => void;
  restoreAuditChain: () => void;
  resetToDemoData: () => void;
}

const STORAGE_KEY = 'seal_ledger_storage_v1';

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Initialise from localStorage or generate fresh seed
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.admissions && parsed.admissions.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved state from localStorage, loading initial seed', e);
    }
    return generateSeedData();
  });

  const [currentUser, setCurrentUser] = useState<CurrentUser>(DEMO_USERS.AICTE_REGULATOR);
  const [academicYear, setAcademicYear] = useState<string>('2025-26');
  const [tableDensity, setTableDensity] = useState<'compact' | 'comfortable'>('compact');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isBreakGlassActive, setIsBreakGlassActive] = useState<boolean>(false);
  const [activeBreakGlassReason, setActiveBreakGlassReason] = useState<string | null>(null);

  // Persist to localStorage on data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  }, [data]);

  const addToast = (message: string, type: ToastMessage['type'] = 'INFO') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Switch demo account role
  const setCurrentUserRole = (role: Role) => {
    const user = DEMO_USERS[role];
    if (user) {
      setCurrentUser(user);
      addToast(`Switched active context to ${user.name} (${user.role})`, 'INFO');
    }
  };

  // Reconcile admissions deterministically
  const reconciliationMap = useMemo(() => {
    return runBatchReconciliation({
      admissions: data.admissions,
      approvals: data.approvals,
      confirmations: data.confirmations,
      evidenceRecords: data.evidenceRecords,
      ruleVersions: data.ruleVersions,
    });
  }, [data.admissions, data.approvals, data.confirmations, data.evidenceRecords, data.ruleVersions]);

  // Helper to record an audit event safely
  const recordAuditEventInternal = (
    eventType: AuditEvent['eventType'],
    targetEntity: string,
    targetId: string,
    details: Record<string, any>
  ) => {
    setData((prev: any) => {
      const prevHash = prev.auditEvents.length > 0 ? prev.auditEvents[prev.auditEvents.length - 1].hash : undefined;
      const newEvent = createAuditEvent(
        currentUser.role,
        currentUser.name,
        eventType,
        targetEntity,
        targetId,
        details,
        prevHash
      );
      return {
        ...prev,
        auditEvents: [...prev.auditEvents, newEvent],
      };
    });
  };

  // Start Case Review
  const startReviewCase = async (caseId: string): Promise<boolean> => {
    try {
      checkAccessPermission({
        user: currentUser,
        resourceType: 'CASE',
        resourceId: caseId,
        action: 'RESOLVE',
      });
    } catch (err: any) {
      recordAuditEventInternal('ACCESS_DENIED', 'ReviewCase', caseId, {
        attemptedAction: 'START_REVIEW',
        error: err.message,
      });
      addToast(`Permission Denied: ${err.message}`, 'ERROR');
      return false;
    }

    setData((prev: any) => {
      const updatedCases = prev.reviewCases.map((c: ReviewCase) => {
        if (c.id === caseId) {
          return {
            ...c,
            status: 'UNDER_REVIEW' as const,
            reviewerName: currentUser.name,
            assignedToRole: currentUser.role,
          };
        }
        return c;
      });

      const prevHash = prev.auditEvents.length > 0 ? prev.auditEvents[prev.auditEvents.length - 1].hash : undefined;
      const auditEv = createAuditEvent(
        currentUser.role,
        currentUser.name,
        'STATE_TRANSITION',
        'ReviewCase',
        caseId,
        {
          fromStatus: 'OPEN',
          toStatus: 'UNDER_REVIEW',
          reviewer: currentUser.name,
        },
        prevHash
      );

      return {
        ...prev,
        reviewCases: updatedCases,
        auditEvents: [...prev.auditEvents, auditEv],
      };
    });

    addToast(`Case ${caseId} assigned and moved to UNDER_REVIEW`, 'INFO');
    return true;
  };

  // Return Case for Correction
  const returnCaseForCorrection = async (caseId: string, feedback: string): Promise<boolean> => {
    try {
      checkAccessPermission({
        user: currentUser,
        resourceType: 'CASE',
        resourceId: caseId,
        action: 'RESOLVE',
      });
    } catch (err: any) {
      recordAuditEventInternal('ACCESS_DENIED', 'ReviewCase', caseId, {
        attemptedAction: 'RETURN_FOR_CORRECTION',
        feedback,
        error: err.message,
      });
      addToast(`Permission Denied: ${err.message}`, 'ERROR');
      return false;
    }

    if (!feedback || feedback.trim().length < 15) {
      addToast('Correction note must provide at least 15 characters of institutional instructions.', 'ERROR');
      return false;
    }

    const currentCase = data.reviewCases.find((c: ReviewCase) => c.id === caseId);
    if (!currentCase) return false;

    setData((prev: any) => {
      const updatedCases = prev.reviewCases.map((c: ReviewCase) => {
        if (c.id === caseId) {
          return {
            ...c,
            status: 'DISMISSED' as const,
            reviewerName: currentUser.name,
            reviewerRationale: `Returned for institution correction: ${feedback.trim()}`,
            resolutionOutcome: 'RETURNED_FOR_CORRECTION' as const,
            resolvedAt: new Date().toISOString(),
          };
        }
        return c;
      });

      const prevHash = prev.auditEvents.length > 0 ? prev.auditEvents[prev.auditEvents.length - 1].hash : undefined;
      const auditEv = createAuditEvent(
        currentUser.role,
        currentUser.name,
        'DATA_CORRECTION',
        'ReviewCase',
        caseId,
        {
          action: 'RETURNED_FOR_CORRECTION',
          feedback: feedback.trim(),
          admissionId: currentCase.admissionId,
          institutionId: currentCase.institutionId,
        },
        prevHash
      );

      return {
        ...prev,
        reviewCases: updatedCases,
        auditEvents: [...prev.auditEvents, auditEv],
      };
    });

    addToast(`Case ${caseId} returned to institution for statutory correction`, 'WARNING');
    return true;
  };

  // Resolve Review Case
  const resolveReviewCase = async (
    caseId: string,
    outcome: ReviewCase['resolutionOutcome'],
    rationale: string
  ): Promise<boolean> => {
    try {
      // Check RBAC permission
      checkAccessPermission({
        user: currentUser,
        resourceType: 'CASE',
        resourceId: caseId,
        action: 'RESOLVE',
      });
    } catch (err: any) {
      // Record ACCESS_DENIED audit event
      recordAuditEventInternal('ACCESS_DENIED', 'ReviewCase', caseId, {
        attemptedAction: 'RESOLVE',
        rationaleAttempted: rationale,
        error: err.message,
      });
      addToast(`Permission Denied: ${err.message}`, 'ERROR');
      return false;
    }

    // MANDATORY RATIONALE VALIDATION (min 30 characters)
    if (!rationale || rationale.trim().length < 30) {
      addToast('Reviewer rationale must be at least 30 characters explaining statutory grounds.', 'ERROR');
      return false;
    }

    const currentCase = data.reviewCases.find((c: ReviewCase) => c.id === caseId);
    if (!currentCase) {
      addToast(`Case ${caseId} not found`, 'ERROR');
      return false;
    }

    const now = new Date().toISOString();

    setData((prev: any) => {
      const updatedCases = prev.reviewCases.map((c: ReviewCase) => {
        if (c.id === caseId) {
          return {
            ...c,
            status: 'RESOLVED' as const,
            reviewerName: currentUser.name,
            reviewerRationale: rationale.trim(),
            resolutionOutcome: outcome,
            resolvedAt: now,
          };
        }
        return c;
      });

      // Also update linked admission state if applicable
      const updatedAdmissions = prev.admissions.map((adm: Admission) => {
        if (adm.id === currentCase.admissionId) {
          if (outcome === 'ADMISSION_CONFIRMED' || outcome === 'EVIDENCE_OVERRIDDEN') {
            return { ...adm, currentState: 'RESOLVED' as const };
          }
          if (outcome === 'ADMISSION_CANCELLED') {
            return { ...adm, currentState: 'REJECTED' as const };
          }
        }
        return adm;
      });

      const prevHash = prev.auditEvents.length > 0 ? prev.auditEvents[prev.auditEvents.length - 1].hash : undefined;
      const auditEv = createAuditEvent(
        currentUser.role,
        currentUser.name,
        'CASE_RESOLVED',
        'ReviewCase',
        caseId,
        {
          outcome,
          rationale: rationale.trim(),
          admissionId: currentCase.admissionId,
          institutionId: currentCase.institutionId,
        },
        prevHash
      );

      return {
        ...prev,
        reviewCases: updatedCases,
        admissions: updatedAdmissions,
        auditEvents: [...prev.auditEvents, auditEv],
      };
    });

    addToast(`Case ${caseId} resolved with outcome: ${outcome}`, 'SUCCESS');
    return true;
  };

  // Candidate confirmation action
  const recordConfirmationAction = (
    admissionId: string,
    action: 'CONFIRM' | 'DISPUTE',
    disputeReason?: string,
    disputeCat?: any
  ): boolean => {
    const admission = data.admissions.find((a: Admission) => a.id === admissionId);
    if (!admission) {
      addToast('Admission record not found', 'ERROR');
      return false;
    }

    try {
      checkAccessPermission({
        user: currentUser,
        resourceType: 'ADMISSION',
        resourceId: admissionId,
        resourceStudentId: admission.studentId,
        action: 'WRITE',
      });
    } catch (err: any) {
      recordAuditEventInternal('ACCESS_DENIED', 'Admission', admissionId, {
        attemptedAction: action,
        error: err.message,
      });
      addToast(`Access Denied: ${err.message}`, 'ERROR');
      return false;
    }

    const now = new Date().toISOString();
    const nextState: AdmissionState = action === 'CONFIRM' ? 'STUDENT_CONFIRMED' : 'DISPUTED';

    try {
      validateStateTransition(admission, nextState, currentUser.role);
    } catch (err: any) {
      addToast(err.message, 'ERROR');
      return false;
    }

    setData((prev: any) => {
      const updatedAdmissions = prev.admissions.map((adm: Admission) => {
        if (adm.id === admissionId) {
          return {
            ...adm,
            currentState: nextState,
            previousState: adm.currentState,
          };
        }
        return adm;
      });

      const updatedConfirmations = prev.confirmations.map((conf: StudentConfirmation) => {
        if (conf.admissionId === admissionId) {
          return {
            ...conf,
            status: action === 'CONFIRM' ? 'CONFIRMED' : 'DISPUTED',
            confirmedAt: action === 'CONFIRM' ? now : undefined,
            disputeReason: action === 'DISPUTE' ? disputeReason : undefined,
            disputeCategory: action === 'DISPUTE' ? disputeCat : undefined,
            disputeSubmittedAt: action === 'DISPUTE' ? now : undefined,
            daysPending: 0,
          };
        }
        return conf;
      });

      // If dispute, automatically open a ReviewCase
      const newCases = [...prev.reviewCases];
      if (action === 'DISPUTE') {
        const caseId = `SEAL-2025-${String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0')}`;
        newCases.push({
          id: caseId,
          admissionId,
          caseType: 'STUDENT_DISPUTED',
          status: 'OPEN',
          priority: 'HIGH',
          institutionId: admission.institutionId,
          programmeId: admission.programmeId,
          createdAt: now,
        });
      }

      const prevHash = prev.auditEvents.length > 0 ? prev.auditEvents[prev.auditEvents.length - 1].hash : undefined;
      const auditEv = createAuditEvent(
        currentUser.role,
        currentUser.name,
        'STATE_TRANSITION',
        'Admission',
        admissionId,
        {
          fromState: admission.currentState,
          toState: nextState,
          action,
          disputeReason,
        },
        prevHash
      );

      return {
        ...prev,
        admissions: updatedAdmissions,
        confirmations: updatedConfirmations,
        reviewCases: newCases,
        auditEvents: [...prev.auditEvents, auditEv],
      };
    });

    addToast(action === 'CONFIRM' ? 'Seat admission confirmed.' : 'Seat dispute filed and registered in review queue.', 'SUCCESS');
    return true;
  };

  // State Transition (e.g. from table or admin)
  const transitionAdmissionState = (
    admissionId: string,
    nextState: AdmissionState,
    docRef?: string
  ): boolean => {
    const admission = data.admissions.find((a: Admission) => a.id === admissionId);
    if (!admission) {
      addToast('Admission record not found', 'ERROR');
      return false;
    }

    try {
      checkAccessPermission({
        user: currentUser,
        resourceType: 'ADMISSION',
        resourceId: admissionId,
        resourceInstitutionId: admission.institutionId,
        action: 'WRITE',
      });
      validateStateTransition(admission, nextState, currentUser.role, docRef);
    } catch (err: any) {
      if (err.name === 'AccessDeniedError') {
        recordAuditEventInternal('ACCESS_DENIED', 'Admission', admissionId, {
          attemptedNextState: nextState,
          error: err.message,
        });
      }
      addToast(err.message, 'ERROR');
      return false;
    }

    setData((prev: any) => {
      const updatedAdmissions = prev.admissions.map((adm: Admission) => {
        if (adm.id === admissionId) {
          return {
            ...adm,
            currentState: nextState,
            previousState: adm.currentState,
            stateChangeSupportingDocRef: docRef || adm.stateChangeSupportingDocRef,
          };
        }
        return adm;
      });

      const prevHash = prev.auditEvents.length > 0 ? prev.auditEvents[prev.auditEvents.length - 1].hash : undefined;
      const auditEv = createAuditEvent(
        currentUser.role,
        currentUser.name,
        'STATE_TRANSITION',
        'Admission',
        admissionId,
        {
          fromState: admission.currentState,
          toState: nextState,
          docRef,
        },
        prevHash
      );

      return {
        ...prev,
        admissions: updatedAdmissions,
        auditEvents: [...prev.auditEvents, auditEv],
      };
    });

    addToast(`Record ${admissionId} status updated to ${nextState}`, 'SUCCESS');
    return true;
  };

  // Send Reminder
  const dispatchReminder = (admissionId: string): boolean => {
    const admission = data.admissions.find((a: Admission) => a.id === admissionId);
    if (!admission) return false;

    const conf = data.confirmations.find((c: StudentConfirmation) => c.admissionId === admissionId);
    const reminder = createStudentReminder(admissionId, admission.studentId, conf?.lastReminderSentAt ? 1 : 0);

    setData((prev: any) => {
      const updatedConfirmations = prev.confirmations.map((c: StudentConfirmation) => {
        if (c.admissionId === admissionId) {
          return {
            ...c,
            lastReminderSentAt: reminder.sentAt,
          };
        }
        return c;
      });

      const prevHash = prev.auditEvents.length > 0 ? prev.auditEvents[prev.auditEvents.length - 1].hash : undefined;
      const auditEv = createAuditEvent(
        currentUser.role,
        currentUser.name,
        'REMINDER_SENT',
        'StudentConfirmation',
        admissionId,
        {
          studentId: admission.studentId,
          studentName: admission.studentName,
          reminderId: reminder.id,
          reminderCount: reminder.reminderCount,
        },
        prevHash
      );

      return {
        ...prev,
        confirmations: updatedConfirmations,
        auditEvents: [...prev.auditEvents, auditEv],
      };
    });

    addToast(`Notification sent to ${admission.studentName} (${reminder.channel})`, 'SUCCESS');
    return true;
  };

  // CSV Import with atomic intake validation
  const importAdmissionsCsvData = async (
    csvContent: string,
    institutionId: string,
    programmeId: string
  ): Promise<{ success: boolean; message: string }> => {
    const approval = data.approvals.find(
      (ap: IntakeApproval) => ap.institutionId === institutionId && ap.programmeId === programmeId
    );
    if (!approval) {
      addToast('No sanctioned intake approval record found for this programme', 'ERROR');
      return { success: false, message: 'Missing approved intake definition' };
    }

    const { validRows, errors } = parseAdmissionsCsv(csvContent);
    if (errors.length > 0 && validRows.length === 0) {
      addToast(`CSV Parse Failed: ${errors[0].error}`, 'ERROR');
      return { success: false, message: errors[0].error };
    }

    const existingInProg = data.admissions.filter(
      (a: Admission) => a.institutionId === institutionId && a.programmeId === programmeId
    );

    const importResult = await processAndCommitBatchImport(
      institutionId,
      programmeId,
      approval,
      existingInProg,
      validRows,
      data.ruleVersions
    );

    // Create evidence records and confirmation records for new admissions
    const newEvidence: EvidenceRecord[] = [];
    const newConfirmations: StudentConfirmation[] = [];
    const newCases: ReviewCase[] = [];

    importResult.createdAdmissions.forEach((adm) => {
      const ev = generateEvidenceRecordsForAdmission(adm.id, adm.counsellingRollNo, institutionId, adm.admissionDate);
      newEvidence.push(...ev);

      newConfirmations.push({
        id: `CONF-${adm.id.slice(-6)}`,
        admissionId: adm.id,
        studentId: adm.studentId,
        status: 'PENDING',
        daysPending: 1,
      });
    });

    // If excess seats were generated, create Review Cases
    if (importResult.excessGenerated > 0) {
      importResult.createdAdmissions.slice(-importResult.excessGenerated).forEach((excessAdm) => {
        newCases.push({
          id: `SEAL-2025-${String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0')}`,
          admissionId: excessAdm.id,
          caseType: 'INTAKE_EXCEEDED',
          status: 'OPEN',
          priority: 'HIGH',
          institutionId,
          programmeId,
          createdAt: new Date().toISOString(),
        });
      });
    }

    setData((prev: any) => {
      const prevHash = prev.auditEvents.length > 0 ? prev.auditEvents[prev.auditEvents.length - 1].hash : undefined;
      const auditEv = createAuditEvent(
        currentUser.role,
        currentUser.name,
        'ADMISSION_REPORTED',
        'BatchImport',
        `BATCH-${Date.now()}`,
        {
          totalCommitted: importResult.totalCommitted,
          excessGenerated: importResult.excessGenerated,
          institutionId,
          programmeId,
        },
        prevHash
      );

      return {
        ...prev,
        admissions: [...prev.admissions, ...importResult.createdAdmissions],
        evidenceRecords: [...prev.evidenceRecords, ...newEvidence],
        confirmations: [...prev.confirmations, ...newConfirmations],
        reviewCases: [...prev.reviewCases, ...newCases],
        auditEvents: [...prev.auditEvents, auditEv],
      };
    });

    const summary = `Successfully imported ${importResult.totalCommitted} admissions. ${importResult.explanation}`;
    addToast(summary, importResult.excessGenerated > 0 ? 'WARNING' : 'SUCCESS');
    return { success: true, message: summary };
  };

  // Verify Audit Chain
  const verifyLedgerChain = () => {
    return verifyAuditChain(data.auditEvents);
  };

  // Simulate Audit Tamper (modifies payload of a block to break cryptographic hash verification)
  const simulateAuditTamper = (blockIndex: number = 2) => {
    setData((prev: any) => {
      if (prev.auditEvents.length <= blockIndex) return prev;
      const tamperedEvents = prev.auditEvents.map((ev: AuditEvent, idx: number) => {
        if (idx === blockIndex) {
          return {
            ...ev,
            details: {
              ...ev.details,
              unauthorizedTamper: 'SIMULATED_RECORD_MODIFICATION_CORRUPTING_HASH_CHAIN',
              forgedField: 'Tampered admission quota without recalculating cryptographic polynomial',
            },
          };
        }
        return ev;
      });

      return {
        ...prev,
        auditEvents: tamperedEvents,
      };
    });

    addToast(`Simulated payload tamper injected into audit block #${blockIndex}. Run chain verification to inspect.`, 'WARNING');
  };

  // Restore Audit Chain Integrity
  const restoreAuditChain = () => {
    setData((prev: any) => {
      const restored = recomputeAuditChain(prev.auditEvents);
      return {
        ...prev,
        auditEvents: restored,
      };
    });

    addToast('Cryptographic hash digests sequentially recomputed from genesis block. Chain integrity restored.', 'SUCCESS');
  };

  // Break-Glass Access Protocol
  const recordBreakGlassAccess = (reasonCode: any, justification: string, targetId?: string): boolean => {
    if (!justification || justification.trim().length < 20) {
      addToast('Break-glass justification must be at least 20 characters documenting statutory grounds.', 'ERROR');
      return false;
    }

    const logEntry: BreakGlassLogEntry = {
      id: `BG-2025-${String(Math.floor(100 + Math.random() * 900))}`,
      timestamp: new Date().toISOString(),
      officerName: currentUser.name,
      officerRole: currentUser.role,
      reasonCode,
      justificationText: justification.trim(),
      targetStudentOrAdmissionId: targetId || 'ALL_RECORDS',
      sessionDurationMinutes: 15,
    };

    setData((prev: any) => {
      const prevHash = prev.auditEvents.length > 0 ? prev.auditEvents[prev.auditEvents.length - 1].hash : undefined;
      const auditEv = createAuditEvent(
        currentUser.role,
        currentUser.name,
        'BREAK_GLASS_PII_REVEAL',
        'StudentIdentityMaster',
        targetId || 'SYSTEM_WIDE',
        {
          reasonCode,
          justification: justification.trim(),
          breakGlassId: logEntry.id,
        },
        prevHash
      );

      return {
        ...prev,
        breakGlassLogs: [logEntry, ...(prev.breakGlassLogs || [])],
        auditEvents: [...prev.auditEvents, auditEv],
      };
    });

    setIsBreakGlassActive(true);
    setActiveBreakGlassReason(justification.trim());
    addToast('Statutory Break-Glass override active. PII unmasked for current session. Access logged to audit ledger.', 'WARNING');
    return true;
  };

  const revokeBreakGlass = () => {
    setIsBreakGlassActive(false);
    setActiveBreakGlassReason(null);
    addToast('Break-Glass override revoked. Student PII masked.', 'INFO');
  };

  // Verify Record by APAAR ID
  const verifyRecordByApaar = (apaarRaw: string, consentGranted: boolean): SelectiveDisclosureResult | null => {
    const cleanApaar = apaarRaw.replace(/[\s-]/g, '').trim();
    if (!cleanApaar) return null;

    // Search across students and admissions
    const admission = data.admissions.find(
      (a: Admission) =>
        a.apaarRaw === cleanApaar ||
        a.maskedApaar.replace(/[\s-]/g, '') === cleanApaar ||
        a.apaarRaw.endsWith(cleanApaar.slice(-4)) ||
        a.studentId.toLowerCase() === cleanApaar.toLowerCase()
    );

    if (!admission) return null;

    const inst = data.institutions.find((i: Institution) => i.id === admission.institutionId);
    const prog = data.programmes.find((p: Programme) => p.id === admission.programmeId);

    const result: SelectiveDisclosureResult = {
      apaarRaw: admission.apaarRaw,
      maskedApaar: admission.maskedApaar,
      studentName: admission.studentName,
      admissionId: admission.id,
      institutionName: inst?.name || 'Technical Institution',
      institutionCode: inst?.code || admission.institutionId,
      programmeName: prog?.name || 'Degree Programme',
      degreeType: prog?.degreeType || 'B.Tech',
      academicYear: admission.academicYear,
      status: admission.currentState,
      quotaCategory: admission.quotaCategory,
      isSupernumerary: admission.isSupernumerary,
      verificationToken: `SEAL-VRF-${admission.id.slice(-6)}-${Date.now().toString(36).toUpperCase()}`,
      verifiedAt: new Date().toISOString(),
      registrySealHash: `0x7a8f9c${admission.id.slice(-4)}b2e4${cleanApaar.slice(-4)}d1`,
      consentGranted,
    };

    // Log the verification query to consentLogs and audit ledger
    setData((prev: any) => {
      const consentEntry: ConsentAccessLogEntry = {
        id: `CSL-2025-${String(Math.floor(100 + Math.random() * 900))}`,
        timestamp: new Date().toISOString(),
        apaarMasked: admission.maskedApaar,
        consentType: 'SELECTIVE_DISCLOSURE',
        status: consentGranted ? 'GRANTED' : 'PENDING',
        requestor: `${currentUser.name} (${currentUser.role})`,
        purpose: 'Citizen Verification / Selective Disclosure Credential Verification',
        ipMasked: '103.48.***.***',
      };

      const prevHash = prev.auditEvents.length > 0 ? prev.auditEvents[prev.auditEvents.length - 1].hash : undefined;
      const auditEv = createAuditEvent(
        currentUser.role,
        currentUser.name,
        'CONSENT_VERIFICATION',
        'Admission',
        admission.id,
        {
          apaarMasked: admission.maskedApaar,
          consentGranted,
          verificationToken: result.verificationToken,
        },
        prevHash
      );

      return {
        ...prev,
        consentLogs: [consentEntry, ...(prev.consentLogs || [])],
        auditEvents: [...prev.auditEvents, auditEv],
      };
    });

    return result;
  };

  // Reset Demo Data
  const resetToDemoData = () => {
    const pristine = generateSeedData();
    localStorage.removeItem(STORAGE_KEY);
    setData(pristine);
    setIsBreakGlassActive(false);
    setActiveBreakGlassReason(null);
    addToast('Demo database and cryptographic audit ledger restored to default state.', 'INFO');
  };

  const contextValue: StoreContextType = {
    currentUser,
    academicYear,
    tableDensity,
    institutions: data.institutions,
    programmes: data.programmes,
    approvals: data.approvals,
    ruleVersions: data.ruleVersions,
    students: data.students,
    admissions: data.admissions,
    confirmations: data.confirmations,
    evidenceRecords: data.evidenceRecords,
    reviewCases: data.reviewCases,
    auditEvents: data.auditEvents,
    breakGlassLogs: data.breakGlassLogs || [],
    consentLogs: data.consentLogs || [],
    isBreakGlassActive,
    activeBreakGlassReason,
    reconciliationMap,
    toasts,

    setCurrentUserRole,
    setAcademicYear,
    setTableDensity,
    addToast,
    removeToast,
    recordBreakGlassAccess,
    revokeBreakGlass,
    verifyRecordByApaar,
    startReviewCase,
    returnCaseForCorrection,
    resolveReviewCase,
    recordConfirmationAction,
    transitionAdmissionState,
    dispatchReminder,
    importAdmissionsCsvData,
    verifyLedgerChain,
    simulateAuditTamper,
    restoreAuditChain,
    resetToDemoData,
  };

  return <StoreContext.Provider value={contextValue}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
