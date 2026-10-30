/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrentUser, Role } from '../types';

export class AccessDeniedError extends Error {
  public code: string;
  public actorRole: Role;
  public resourceType: string;
  public resourceId: string;

  constructor(message: string, actorRole: Role, resourceType: string, resourceId: string) {
    super(message);
    this.name = 'AccessDeniedError';
    this.code = 'ACCESS_DENIED';
    this.actorRole = actorRole;
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

export interface AccessCheckContext {
  user: CurrentUser;
  resourceType: 'INSTITUTION' | 'ADMISSION' | 'CASE' | 'STUDENT_RECORD' | 'AUDIT_LEDGER' | 'INTAKE_APPROVAL';
  resourceId?: string;
  resourceInstitutionId?: string;
  resourceStudentId?: string;
  action: 'READ' | 'WRITE' | 'RESOLVE' | 'AUDIT_VERIFY' | 'EXPORT';
}

/**
 * Service-level RBAC enforcement guard.
 * Validates permission according to strict institutional boundaries.
 * Throws AccessDeniedError if unauthorised.
 */
export function checkAccessPermission(ctx: AccessCheckContext): boolean {
  const { user, resourceType, resourceInstitutionId, resourceStudentId, action } = ctx;

  // AICTE Regulator has systemic authority across all records
  if (user.role === 'AICTE_REGULATOR') {
    return true;
  }

  // Auditor has read & audit-verify rights across all records, but NO write or case resolution
  if (user.role === 'AUDITOR') {
    if (action === 'WRITE' || action === 'RESOLVE') {
      throw new AccessDeniedError(
        `Auditor role does not possess regulatory resolution or modification rights for ${resourceType} [${ctx.resourceId || 'ALL'}]. Auditor access is restricted to read-only oversight.`,
        user.role,
        resourceType,
        ctx.resourceId || 'N/A'
      );
    }
    return true;
  }

  // Institution Admin is strictly scoped to their assigned institution
  if (user.role === 'INSTITUTION_ADMIN') {
    if (action === 'RESOLVE') {
      throw new AccessDeniedError(
        `Institution Admin cannot resolve statutory exceptions or regulatory review cases. Resolution rights are reserved exclusively for AICTE Regulatory Officers.`,
        user.role,
        resourceType,
        ctx.resourceId || 'N/A'
      );
    }

    if (resourceInstitutionId && resourceInstitutionId !== user.institutionId) {
      throw new AccessDeniedError(
        `Access denied: Institution Admin credentials for '${user.institutionId}' cannot access records belonging to institution '${resourceInstitutionId}'.`,
        user.role,
        resourceType,
        ctx.resourceId || 'N/A'
      );
    }

    return true;
  }

  // Student is strictly scoped to their own student profile & admissions
  if (user.role === 'STUDENT') {
    if (action === 'RESOLVE' || action === 'AUDIT_VERIFY') {
      throw new AccessDeniedError(
        `Student role does not have administrative rights to perform ${action} operations.`,
        user.role,
        resourceType,
        ctx.resourceId || 'N/A'
      );
    }

    if (resourceType === 'ADMISSION' || resourceType === 'STUDENT_RECORD') {
      if (resourceStudentId && resourceStudentId !== user.studentId) {
        throw new AccessDeniedError(
          `Candidate privacy restriction: Student '${user.studentId}' cannot inspect admissions of candidate '${resourceStudentId}'.`,
          user.role,
          resourceType,
          ctx.resourceId || 'N/A'
        );
      }
    } else {
      throw new AccessDeniedError(
        `Students are restricted to the candidate portal and personal enrolment records.`,
        user.role,
        resourceType,
        ctx.resourceId || 'N/A'
      );
    }

    return true;
  }

  throw new AccessDeniedError(
    `Unrecognised or unauthenticated role '${(user as any)?.role}'. Access denied.`,
    user.role,
    resourceType,
    ctx.resourceId || 'N/A'
  );
}
