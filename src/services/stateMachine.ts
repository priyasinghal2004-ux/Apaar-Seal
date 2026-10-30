/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Admission, AdmissionState, Role } from '../types';

export class StateTransitionError extends Error {
  public code: string;
  public fromState: AdmissionState;
  public toState: AdmissionState;

  constructor(message: string, code: string, fromState: AdmissionState, toState: AdmissionState) {
    super(message);
    this.name = 'StateTransitionError';
    this.code = code;
    this.fromState = fromState;
    this.toState = toState;
  }
}

export interface TransitionRule {
  target: AdmissionState;
  allowedRoles: Role[];
  requiresDocumentRef?: boolean;
  guard?: (admission: Admission, context?: Record<string, any>) => { allowed: boolean; reason?: string };
}

/**
 * Explicit non-linear state transition matrix.
 */
export const ALLOWED_TRANSITIONS: Record<AdmissionState, TransitionRule[]> = {
  APPROVED: [
    { target: 'ALLOTTED', allowedRoles: ['INSTITUTION_ADMIN', 'AICTE_REGULATOR'] },
    { target: 'REJECTED', allowedRoles: ['AICTE_REGULATOR'], requiresDocumentRef: true },
  ],
  ALLOTTED: [
    { target: 'REPORTED', allowedRoles: ['INSTITUTION_ADMIN', 'AICTE_REGULATOR'] },
    { target: 'VACATED', allowedRoles: ['INSTITUTION_ADMIN', 'AICTE_REGULATOR'], requiresDocumentRef: true },
  ],
  REPORTED: [
    { target: 'PENDING', allowedRoles: ['INSTITUTION_ADMIN', 'AICTE_REGULATOR', 'STUDENT'] },
    { target: 'STUDENT_CONFIRMED', allowedRoles: ['STUDENT', 'AICTE_REGULATOR'] },
    { target: 'DISPUTED', allowedRoles: ['STUDENT', 'AICTE_REGULATOR', 'INSTITUTION_ADMIN'] },
    { target: 'UNDER_REVIEW', allowedRoles: ['AICTE_REGULATOR'] },
    { target: 'VACATED', allowedRoles: ['INSTITUTION_ADMIN', 'AICTE_REGULATOR'], requiresDocumentRef: true },
  ],
  PENDING: [
    { target: 'STUDENT_CONFIRMED', allowedRoles: ['STUDENT', 'AICTE_REGULATOR'] },
    { target: 'DISPUTED', allowedRoles: ['STUDENT', 'AICTE_REGULATOR'] },
    { target: 'UNDER_REVIEW', allowedRoles: ['AICTE_REGULATOR'] },
    { target: 'VACATED', allowedRoles: ['INSTITUTION_ADMIN', 'AICTE_REGULATOR'], requiresDocumentRef: true },
  ],
  STUDENT_CONFIRMED: [
    { target: 'EVIDENCE_VERIFIED', allowedRoles: ['AICTE_REGULATOR', 'INSTITUTION_ADMIN'] },
    { target: 'DISPUTED', allowedRoles: ['STUDENT', 'AICTE_REGULATOR'] },
    { target: 'UNDER_REVIEW', allowedRoles: ['AICTE_REGULATOR'] },
    { target: 'MIGRATED', allowedRoles: ['INSTITUTION_ADMIN', 'AICTE_REGULATOR'], requiresDocumentRef: true },
  ],
  EVIDENCE_VERIFIED: [
    {
      target: 'GRADUATED',
      allowedRoles: ['AICTE_REGULATOR', 'INSTITUTION_ADMIN'],
      requiresDocumentRef: true,
      guard: (adm) => {
        // Enforce rule: graduation is never inferred from admission verification
        if (!adm.stateChangeSupportingDocRef) {
          return { allowed: false, reason: 'Graduation cannot be inferred from admission verification. Degree gazette/convocation reference is mandatory.' };
        }
        return { allowed: true };
      },
    },
    { target: 'UNDER_REVIEW', allowedRoles: ['AICTE_REGULATOR'] },
    { target: 'MIGRATED', allowedRoles: ['INSTITUTION_ADMIN', 'AICTE_REGULATOR'], requiresDocumentRef: true },
    { target: 'DROPPED', allowedRoles: ['INSTITUTION_ADMIN', 'AICTE_REGULATOR'], requiresDocumentRef: true },
  ],
  DISPUTED: [
    {
      target: 'EVIDENCE_VERIFIED',
      allowedRoles: ['AICTE_REGULATOR'],
      guard: () => {
        // Specific requirement: "Cannot move from DISPUTED to EVIDENCE_VERIFIED without a resolved review"
        return {
          allowed: false,
          reason: 'Cannot move from DISPUTED to EVIDENCE_VERIFIED without a resolved review. Case must proceed to UNDER_REVIEW and RESOLVED first.',
        };
      },
    },
    { target: 'UNDER_REVIEW', allowedRoles: ['AICTE_REGULATOR', 'INSTITUTION_ADMIN'] },
    { target: 'RESOLVED', allowedRoles: ['AICTE_REGULATOR'] },
    { target: 'VACATED', allowedRoles: ['AICTE_REGULATOR', 'INSTITUTION_ADMIN'], requiresDocumentRef: true },
  ],
  UNDER_REVIEW: [
    { target: 'RESOLVED', allowedRoles: ['AICTE_REGULATOR'] },
    { target: 'REJECTED', allowedRoles: ['AICTE_REGULATOR'], requiresDocumentRef: true },
    { target: 'DISPUTED', allowedRoles: ['AICTE_REGULATOR'] },
  ],
  RESOLVED: [
    { target: 'STUDENT_CONFIRMED', allowedRoles: ['AICTE_REGULATOR'] },
    { target: 'EVIDENCE_VERIFIED', allowedRoles: ['AICTE_REGULATOR'] },
    { target: 'VACATED', allowedRoles: ['AICTE_REGULATOR', 'INSTITUTION_ADMIN'], requiresDocumentRef: true },
    { target: 'REJECTED', allowedRoles: ['AICTE_REGULATOR'], requiresDocumentRef: true },
  ],
  VACATED: [
    { target: 'UNDER_REVIEW', allowedRoles: ['AICTE_REGULATOR'] },
  ],
  MIGRATED: [
    { target: 'UNDER_REVIEW', allowedRoles: ['AICTE_REGULATOR'] },
  ],
  DROPPED: [
    { target: 'UNDER_REVIEW', allowedRoles: ['AICTE_REGULATOR'] },
  ],
  REJECTED: [],
  GRADUATED: [],
};

/**
 * Validates and executes a state transition.
 */
export function validateStateTransition(
  admission: Admission,
  nextState: AdmissionState,
  actorRole: Role,
  supportingDocRef?: string,
  context?: Record<string, any>
): void {
  const fromState = admission.currentState;

  // Direct no-op
  if (fromState === nextState) {
    return;
  }

  const allowedTransitions = ALLOWED_TRANSITIONS[fromState] || [];
  const matchedRule = allowedTransitions.find((t) => t.target === nextState);

  if (!matchedRule) {
    throw new StateTransitionError(
      `Illegal transition from '${fromState}' to '${nextState}'. This path is disallowed by the regulatory state machine.`,
      'STATE_CHANGE_UNSUPPORTED',
      fromState,
      nextState
    );
  }

  // Check role authorization
  if (!matchedRule.allowedRoles.includes(actorRole)) {
    throw new StateTransitionError(
      `Role '${actorRole}' is not authorised to execute transition from '${fromState}' to '${nextState}'. Required roles: ${matchedRule.allowedRoles.join(', ')}.`,
      'ROLE_UNAUTHORISED',
      fromState,
      nextState
    );
  }

  // Check supporting document requirement
  if (matchedRule.requiresDocumentRef && (!supportingDocRef || supportingDocRef.trim().length === 0)) {
    throw new StateTransitionError(
      `Transition to '${nextState}' requires a valid statutory supporting document reference (order number, transfer ref, or court filing).`,
      'STATE_CHANGE_UNSUPPORTED',
      fromState,
      nextState
    );
  }

  // Check custom guard condition
  if (matchedRule.guard) {
    const guardResult = matchedRule.guard(admission, context);
    if (!guardResult.allowed) {
      throw new StateTransitionError(
        guardResult.reason || `Regulatory guard rejected transition from '${fromState}' to '${nextState}'.`,
        'STATE_CHANGE_UNSUPPORTED',
        fromState,
        nextState
      );
    }
  }
}
