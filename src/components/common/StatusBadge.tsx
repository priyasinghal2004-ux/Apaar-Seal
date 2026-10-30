/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AdmissionState, CaseStatus, ConfirmationStatus, EvidenceStatus, ReasonCode, Severity } from '../../types';

interface StatusBadgeProps {
  type: 'state' | 'severity' | 'reason' | 'confirmation' | 'evidence' | 'case';
  value: string;
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  className = '',
  showDot = true,
}) => {
  let label = value.replace(/_/g, ' ');
  let bgClass = 'bg-slate-100';
  let textClass = 'text-slate-700';
  let borderClass = 'border-slate-200';
  let dotClass = 'bg-slate-500';

  if (type === 'severity') {
    switch (value as Severity) {
      case 'HIGH':
        bgClass = 'bg-red-50';
        textClass = 'text-red-700 font-semibold';
        borderClass = 'border-red-200';
        dotClass = 'bg-red-600';
        break;
      case 'MEDIUM':
        bgClass = 'bg-amber-50';
        textClass = 'text-amber-800 font-medium';
        borderClass = 'border-amber-200';
        dotClass = 'bg-amber-500';
        break;
      case 'LOW':
      default:
        bgClass = 'bg-emerald-50';
        textClass = 'text-emerald-700 font-medium';
        borderClass = 'border-emerald-200';
        dotClass = 'bg-emerald-500';
        break;
    }
  } else if (type === 'state') {
    switch (value as AdmissionState) {
      case 'EVIDENCE_VERIFIED':
      case 'GRADUATED':
        bgClass = 'bg-emerald-50';
        textClass = 'text-emerald-700 font-medium';
        borderClass = 'border-emerald-200';
        dotClass = 'bg-emerald-600';
        break;
      case 'STUDENT_CONFIRMED':
      case 'RESOLVED':
        bgClass = 'bg-blue-50';
        textClass = 'text-blue-700 font-medium';
        borderClass = 'border-blue-200';
        dotClass = 'bg-blue-600';
        break;
      case 'REPORTED':
      case 'ALLOTTED':
      case 'APPROVED':
        bgClass = 'bg-slate-100';
        textClass = 'text-slate-700 font-medium';
        borderClass = 'border-slate-200';
        dotClass = 'bg-slate-500';
        break;
      case 'PENDING':
        bgClass = 'bg-amber-50';
        textClass = 'text-amber-800 font-medium';
        borderClass = 'border-amber-200';
        dotClass = 'bg-amber-500';
        break;
      case 'UNDER_REVIEW':
        bgClass = 'bg-purple-50';
        textClass = 'text-purple-700 font-medium';
        borderClass = 'border-purple-200';
        dotClass = 'bg-purple-600';
        break;
      case 'DISPUTED':
      case 'REJECTED':
      case 'VACATED':
        bgClass = 'bg-red-50';
        textClass = 'text-red-700 font-semibold';
        borderClass = 'border-red-200';
        dotClass = 'bg-red-600';
        break;
      case 'MIGRATED':
        bgClass = 'bg-indigo-50';
        textClass = 'text-indigo-700 font-medium';
        borderClass = 'border-indigo-200';
        dotClass = 'bg-indigo-500';
        break;
      default:
        bgClass = 'bg-slate-100';
        textClass = 'text-slate-600';
        borderClass = 'border-slate-200';
        dotClass = 'bg-slate-400';
        break;
    }
  } else if (type === 'reason') {
    switch (value as ReasonCode) {
      case 'INTAKE_EXCEEDED':
      case 'DUP_IDENTIFIER':
      case 'STUDENT_DISPUTED':
      case 'STATE_CHANGE_UNSUPPORTED':
        bgClass = 'bg-red-50';
        textClass = 'text-red-700 font-semibold';
        borderClass = 'border-red-200';
        dotClass = 'bg-red-600';
        break;
      case 'EVIDENCE_CONFLICT':
      case 'STUDENT_PENDING_OVERDUE':
        bgClass = 'bg-amber-50';
        textClass = 'text-amber-800 font-medium';
        borderClass = 'border-amber-200';
        dotClass = 'bg-amber-500';
        break;
      case 'EVIDENCE_UNAVAILABLE':
      case 'APAAR_FORMAT_INVALID':
        bgClass = 'bg-slate-100';
        textClass = 'text-slate-700 font-medium';
        borderClass = 'border-slate-200';
        dotClass = 'bg-slate-500';
        break;
      case 'RECORD_OK':
      default:
        bgClass = 'bg-emerald-50';
        textClass = 'text-emerald-700 font-medium';
        borderClass = 'border-emerald-200';
        dotClass = 'bg-emerald-600';
        break;
    }
  } else if (type === 'evidence') {
    switch (value as EvidenceStatus) {
      case 'VERIFIED':
        bgClass = 'bg-emerald-50';
        textClass = 'text-emerald-700 font-medium';
        borderClass = 'border-emerald-200';
        dotClass = 'bg-emerald-600';
        break;
      case 'CONFLICT':
        bgClass = 'bg-red-50';
        textClass = 'text-red-700 font-semibold';
        borderClass = 'border-red-200';
        dotClass = 'bg-red-600';
        break;
      case 'UNAVAILABLE':
      default:
        bgClass = 'bg-slate-100';
        textClass = 'text-slate-600';
        borderClass = 'border-slate-200';
        dotClass = 'bg-slate-400';
        break;
    }
  } else if (type === 'confirmation') {
    switch (value as ConfirmationStatus) {
      case 'CONFIRMED':
        bgClass = 'bg-blue-50';
        textClass = 'text-blue-700 font-medium';
        borderClass = 'border-blue-200';
        dotClass = 'bg-blue-600';
        break;
      case 'DISPUTED':
        bgClass = 'bg-red-50';
        textClass = 'text-red-700 font-semibold';
        borderClass = 'border-red-200';
        dotClass = 'bg-red-600';
        break;
      case 'PENDING':
      default:
        bgClass = 'bg-amber-50';
        textClass = 'text-amber-800 font-medium';
        borderClass = 'border-amber-200';
        dotClass = 'bg-amber-500';
        break;
    }
  } else if (type === 'case') {
    switch (value as CaseStatus) {
      case 'RESOLVED':
        bgClass = 'bg-emerald-50';
        textClass = 'text-emerald-700 font-medium';
        borderClass = 'border-emerald-200';
        dotClass = 'bg-emerald-600';
        break;
      case 'UNDER_REVIEW':
        bgClass = 'bg-purple-50';
        textClass = 'text-purple-700 font-medium';
        borderClass = 'border-purple-200';
        dotClass = 'bg-purple-600';
        break;
      case 'DISMISSED':
        bgClass = 'bg-slate-100';
        textClass = 'text-slate-700 font-medium';
        borderClass = 'border-slate-200';
        dotClass = 'bg-slate-500';
        break;
      case 'OPEN':
      default:
        bgClass = 'bg-red-50';
        textClass = 'text-red-700 font-semibold';
        borderClass = 'border-red-200';
        dotClass = 'bg-red-600';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-[11.5px] leading-tight whitespace-nowrap ${bgClass} ${textClass} ${borderClass} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />}
      <span className={type === 'reason' ? 'font-mono-code text-[10.5px] tracking-tight' : 'font-sans-ui'}>
        {label}
      </span>
    </span>
  );
};
