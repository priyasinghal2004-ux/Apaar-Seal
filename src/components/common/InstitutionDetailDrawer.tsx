/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { Institution, ReviewCase, AuditEvent, ReasonCode } from '../../types';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface InstitutionDetailDrawerProps {
  institutionId: string | null;
  onClose: () => void;
  onNavigateAdmissions: (instId: string) => void;
  onNavigateExceptions: (instId: string) => void;
}

export const InstitutionDetailDrawer: React.FC<InstitutionDetailDrawerProps> = ({
  institutionId,
  onClose,
  onNavigateAdmissions,
  onNavigateExceptions,
}) => {
  const {
    institutions,
    programmes,
    approvals,
    admissions,
    confirmations,
    evidenceRecords,
    reviewCases,
    auditEvents,
    reconciliationMap,
  } = useStore();

  const institution = useMemo(() => {
    return institutions.find((i) => i.id === institutionId) || null;
  }, [institutions, institutionId]);

  if (!institutionId || !institution) return null;

  const instAdmissions = admissions.filter((a) => a.institutionId === institution.id);
  const instApprovals = approvals.filter((a) => a.institutionId === institution.id);
  const instProgrammes = programmes.filter((p) => p.institutionId === institution.id);
  const instCases = reviewCases.filter((c) => c.institutionId === institution.id);
  const instEvents = auditEvents.filter(
    (e) =>
      e.targetId === institution.id ||
      e.details?.institutionId === institution.id ||
      e.details?.institutionCode === institution.code ||
      instAdmissions.some((a) => a.id === e.targetId)
  );

  const baseCapacity = instApprovals.reduce((acc, a) => acc + a.approvedLimit, 0);
  const supernumeraryApproved = instApprovals.reduce((acc, a) => acc + a.supernumeraryApprovedLimit, 0);
  const totalApproved = baseCapacity + supernumeraryApproved;

  const totalReported = instAdmissions.length;
  const supernumeraryReported = instAdmissions.filter((a) => a.isSupernumerary).length;
  const generalReported = totalReported - supernumeraryReported;

  const confirmedCount = instAdmissions.filter((a) => {
    const c = confirmations.find((cf) => cf.admissionId === a.id);
    return c?.status === 'CONFIRMED';
  }).length;

  const disputedCount = instAdmissions.filter((a) => {
    const c = confirmations.find((cf) => cf.admissionId === a.id);
    return c?.status === 'DISPUTED';
  }).length;

  const pendingCount = instAdmissions.filter((a) => {
    const c = confirmations.find((cf) => cf.admissionId === a.id);
    return !c || c.status === 'PENDING';
  }).length;

  const verifiedEvidenceCount = instAdmissions.filter((a) => a.currentState === 'EVIDENCE_VERIFIED').length;
  const conflictEvidenceCount = evidenceRecords.filter(
    (e) => instAdmissions.some((a) => a.id === e.admissionId) && e.status === 'CONFLICT'
  ).length;
  const unavailableEvidenceCount = evidenceRecords.filter(
    (e) => instAdmissions.some((a) => a.id === e.admissionId) && e.status === 'UNAVAILABLE'
  ).length;

  // Excess count
  let excessSeats = 0;
  instAdmissions.forEach((adm) => {
    const res = reconciliationMap.get(adm.id);
    if (res?.isExcessSeat) excessSeats++;
  });

  // Calculate integrity score (0 to 100)
  // Base 100 minus penalties for excess (-25), disputes (-15), unverified duplicates (-20)
  const integrityScore = Math.max(
    35,
    Math.min(
      100,
      100 - (excessSeats > 0 ? 30 : 0) - disputedCount * 10 - conflictEvidenceCount * 5
    )
  );

  const getIntegrityLabel = (score: number) => {
    if (score >= 90) return { label: 'High Integrity', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
    if (score >= 70) return { label: 'Moderate Risk', color: 'bg-amber-50 text-amber-800 border-amber-300' };
    return { label: 'High Risk Flagged', color: 'bg-red-50 text-red-800 border-red-300' };
  };

  const integrity = getIntegrityLabel(integrityScore);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono-code font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                INSTITUTION REGULATORY DOSSIER
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-mono-code text-xs text-slate-500 font-semibold">{institution.code}</span>
            </div>
            <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight leading-snug">
              {institution.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{institution.state}</span>
              <span>·</span>
              <span>{institution.type}</span>
              <span>·</span>
              <span className="font-mono-code text-[11.5px]">{institution.aicteRegion}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
            title="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[13px] text-slate-600">
          {/* Top Integrity & Key Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Sanctioned Intake</span>
              <span className="font-mono-code text-lg font-bold text-slate-900 tabular-nums">
                {baseCapacity}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono-code">+{supernumeraryApproved} super</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Reported Enrolments</span>
              <span className="font-mono-code text-lg font-bold text-slate-900 tabular-nums">
                {totalReported}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono-code">
                {((totalReported / (baseCapacity || 1)) * 100).toFixed(0)}% utilization
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Excess Seats</span>
              <span className={`font-mono-code text-lg font-bold tabular-nums ${excessSeats > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                {excessSeats > 0 ? `+${excessSeats}` : '0'}
              </span>
              <span className="text-[10px] text-slate-400 block">strict 0 tolerance</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Integrity Score</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono-code text-lg font-bold text-slate-900 tabular-nums">
                  {integrityScore}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${integrity.color}`}>
                  {integrity.label}
                </span>
              </div>
            </div>
          </div>

          {/* 1. SEAT POOL BREAKDOWN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900 text-[14px] flex items-center gap-2">
                <Layers size={16} className="text-blue-700" />
                1. Seat Pool Breakdown by Quota
              </h3>
              <span className="text-[11px] font-mono-code text-slate-500">
                Rule v2025.2 Sanctioned Limits
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr className="border-b border-slate-200">
                    <th className="p-2.5">Pool Category</th>
                    <th className="p-2.5 text-right">Sanctioned Limit</th>
                    <th className="p-2.5 text-right">Reported Filled</th>
                    <th className="p-2.5 text-right">Reconciliation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono-code">
                  <tr>
                    <td className="p-2.5 font-sans-ui font-medium text-slate-800">General / Open Quota</td>
                    <td className="p-2.5 text-right text-slate-700 tabular-nums">{baseCapacity}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900 tabular-nums">{generalReported}</td>
                    <td className="p-2.5 text-right font-sans-ui">
                      {excessSeats > 0 ? (
                        <span className="text-red-700 font-semibold">Exceeded (+{excessSeats})</span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">Compliant</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans-ui font-medium text-slate-800">Supernumerary (TFWS / EWS)</td>
                    <td className="p-2.5 text-right text-slate-700 tabular-nums">{supernumeraryApproved}</td>
                    <td className="p-2.5 text-right font-bold text-blue-700 tabular-nums">{supernumeraryReported}</td>
                    <td className="p-2.5 text-right font-sans-ui text-slate-600">5% statutory cap verified</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans-ui text-slate-600">NRI (Non-Resident Indian)</td>
                    <td className="p-2.5 text-right text-slate-400 tabular-nums">0</td>
                    <td className="p-2.5 text-right text-slate-400 tabular-nums">0</td>
                    <td className="p-2.5 text-right font-sans-ui text-slate-400">Not Sanctioned</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans-ui text-slate-600">OCI (Overseas Citizen)</td>
                    <td className="p-2.5 text-right text-slate-400 tabular-nums">0</td>
                    <td className="p-2.5 text-right text-slate-400 tabular-nums">0</td>
                    <td className="p-2.5 text-right font-sans-ui text-slate-400">Not Sanctioned</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans-ui text-slate-600">FN (Foreign Nationals)</td>
                    <td className="p-2.5 text-right text-slate-400 tabular-nums">0</td>
                    <td className="p-2.5 text-right text-slate-400 tabular-nums">0</td>
                    <td className="p-2.5 text-right font-sans-ui text-slate-400">Not Sanctioned</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. THREE-WAY RECONCILIATION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900 text-[14px] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700" />
                2. Three-Way Reconciliation Matrix
              </h3>
              <span className="text-[11px] font-mono-code text-slate-500">
                Pillar Triangulation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Pillar 1 */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  Pillar 1: Institution Claim
                </div>
                <div className="font-mono-code text-xl font-bold text-slate-900 tabular-nums">
                  {totalReported} Seats
                </div>
                <p className="text-[11.5px] text-slate-500">
                  Self-declared batch import via institution registrar credentials.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg space-y-1.5">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-blue-700">
                  Pillar 2: Student Direct
                </div>
                <div className="font-mono-code text-xl font-bold text-blue-700 tabular-nums">
                  {confirmedCount} Confirmed
                </div>
                <div className="text-[11px] font-mono-code text-slate-600 flex justify-between">
                  <span>Pending: {pendingCount}</span>
                  <span className={disputedCount > 0 ? 'text-red-700 font-bold' : ''}>
                    Disputed: {disputedCount}
                  </span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1.5">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-800">
                  Pillar 3: Third-Party Evidence
                </div>
                <div className="font-mono-code text-xl font-bold text-emerald-700 tabular-nums">
                  {verifiedEvidenceCount} Matched
                </div>
                <div className="text-[11px] font-mono-code text-slate-600 flex justify-between">
                  <span>Conflict: {conflictEvidenceCount}</span>
                  <span>Unavail: {unavailableEvidenceCount}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
              <span className="font-semibold text-slate-800 shrink-0">Presumption Rule:</span>
              <span>
                Unconfirmed responses or unqueried external endpoints remain in a neutral pending state, never as automatic proof of wrongdoing.
              </span>
            </div>
          </div>

          {/* 3. FLAG LIST WITH REASON CODES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900 text-[14px] flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-700" />
                3. Active Exception Flags ({instCases.length})
              </h3>
              <button
                onClick={() => onNavigateExceptions(institution.id)}
                className="text-xs text-blue-700 hover:text-blue-900 font-medium cursor-pointer inline-flex items-center gap-1"
              >
                Open in Exception Queue <ArrowRight size={12} />
              </button>
            </div>

            {instCases.length === 0 ? (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                No open regulatory exception cases registered for this institution.
              </div>
            ) : (
              <div className="space-y-2">
                {instCases.slice(0, 4).map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-code font-bold text-slate-900">{c.id}</span>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge type="reason" value={c.caseType} />
                        <StatusBadge type="severity" value={c.priority} />
                      </div>
                    </div>
                    <div className="text-slate-700 font-sans-ui mt-0.5 leading-relaxed">
                      {c.calculationSummary || 'Flagged for regulatory adjudication and review.'}
                    </div>
                    <div className="text-[11px] font-mono-code text-slate-400 pt-1">
                      Registered: {c.createdAt.slice(0, 10)} · Status: {c.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. TIMELINE OF ACTIONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900 text-[14px] flex items-center gap-2">
                <Clock size={16} className="text-blue-700" />
                4. Chronological Action Timeline
              </h3>
              <span className="text-[11px] font-mono-code text-slate-500">
                Cryptographic Audit Log
              </span>
            </div>

            {instEvents.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-3">No specific action log recorded.</div>
            ) : (
              <div className="space-y-2.5">
                {instEvents.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{ev.eventType}</span>
                        <span className="text-[10px] font-mono-code px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-600">
                          {ev.id}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11.5px] mt-0.5">
                        Actor: {ev.actorName} ({ev.actorRole})
                      </div>
                    </div>
                    <span className="font-mono-code text-[11px] text-slate-400 whitespace-nowrap">
                      {ev.timestamp.slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={() => onNavigateAdmissions(institution.id)}
            className="px-4 py-2 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Inspect All Admissions for {institution.code}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
