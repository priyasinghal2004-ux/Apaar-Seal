/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowDownRight, Check, ChevronRight } from 'lucide-react';

export type FunnelStageKey =
  | 'ALL'
  | 'APPROVED'
  | 'ALLOTTED'
  | 'REPORTED'
  | 'STUDENT_CONFIRMED'
  | 'EVIDENCE_VERIFIED'
  | 'GRADUATED';

interface FunnelStage {
  key: FunnelStageKey;
  label: string;
  count: number;
  description: string;
}

interface AdmissionFunnelProps {
  approvedCount: number;
  allottedCount: number;
  reportedCount: number;
  confirmedCount: number;
  verifiedCount: number;
  graduatedCount: number;
  activeStage: FunnelStageKey;
  onSelectStage: (stage: FunnelStageKey) => void;
}

export const AdmissionFunnel: React.FC<AdmissionFunnelProps> = ({
  approvedCount,
  allottedCount,
  reportedCount,
  confirmedCount,
  verifiedCount,
  graduatedCount,
  activeStage,
  onSelectStage,
}) => {
  const stages: FunnelStage[] = [
    { key: 'APPROVED', label: 'Approved Seats', count: approvedCount, description: 'Sanctioned intake limit' },
    { key: 'ALLOTTED', label: 'Allotted', count: allottedCount, description: 'State counselling allotments' },
    { key: 'REPORTED', label: 'Reported', count: reportedCount, description: 'Institution enrolment claims' },
    { key: 'STUDENT_CONFIRMED', label: 'Student-Confirmed', count: confirmedCount, description: 'DigiLocker OTP confirmation' },
    { key: 'EVIDENCE_VERIFIED', label: 'Evidence-Verified', count: verifiedCount, description: 'CET / Board API match' },
    { key: 'GRADUATED', label: 'Graduated', count: graduatedCount, description: 'Statutory degreed cohort' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="text-[11px] font-mono-code uppercase font-semibold tracking-wider text-slate-500">
            REGULATORY PIPELINE FUNNEL
          </div>
          <h3 className="text-[16px] font-semibold text-slate-900 mt-0.5">
            Admission & Verification Lifecycle Funnel
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {activeStage !== 'ALL' && (
            <button
              onClick={() => onSelectStage('ALL')}
              className="text-xs text-blue-700 hover:text-blue-900 font-medium underline cursor-pointer mr-2"
            >
              Reset stage filter
            </button>
          )}
          <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
            Click stage to filter table below
          </span>
        </div>
      </div>

      {/* Horizontal Funnel Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {stages.map((stage, idx) => {
          const isSelected = activeStage === stage.key;
          const prevStage = idx > 0 ? stages[idx - 1] : null;
          const dropCount = prevStage ? prevStage.count - stage.count : 0;
          const dropPct = prevStage && prevStage.count > 0 ? ((dropCount / prevStage.count) * 100).toFixed(1) : '0';
          const convRate = approvedCount > 0 ? ((stage.count / approvedCount) * 100).toFixed(1) : '0';

          return (
            <div key={stage.key} className="flex flex-col">
              <button
                type="button"
                onClick={() => onSelectStage(isSelected ? 'ALL' : stage.key)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between h-[126px] ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
                    : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10.5px] uppercase font-semibold tracking-wider text-slate-500 truncate" title={stage.label}>
                      {stage.label}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <div className="font-mono-code text-[22px] font-bold text-slate-900 tabular-nums leading-none mt-1">
                    {stage.count}
                  </div>
                  <div className="text-[10.5px] text-slate-400 mt-1 truncate">
                    {stage.description}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10.5px] font-mono-code text-slate-500">
                  <span>{convRate}% of cap</span>
                  {idx > 0 && dropCount > 0 ? (
                    <span className="text-amber-700 font-medium">-{dropPct}%</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              </button>

              {/* Transition Drop Indicator between steps for larger screens */}
              {idx < stages.length - 1 && (
                <div className="hidden lg:flex items-center justify-center my-1 text-[10px] text-slate-400 font-mono-code">
                  <span className="text-slate-300">↓ drop</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
