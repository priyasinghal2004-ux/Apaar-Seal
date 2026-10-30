/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, BookOpen, ShieldAlert, CheckCircle2, Scale, AlertCircle, FileText } from 'lucide-react';

interface PolicyRuleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PolicyRuleDrawer: React.FC<PolicyRuleDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono-code font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                STATUTORY REGULATORY POLICY
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs font-mono-code text-slate-500">Gazette Notif. 2025.2</span>
            </div>
            <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight">
              AICTE Intake Rule v2025.2
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Effective Date: 1 July 2025 · Academic Session 2025-26
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
            title="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[13px] text-slate-600 leading-relaxed">
          {/* Executive Summary */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-[13.5px]">
              <Scale size={16} className="text-blue-700" />
              Policy Charter & Scope
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rule Version v2025.2 governs the mechanical reconciliation of technical institution seat allocations against statutory intake ceilings approved by the AICTE Executive Committee. All numbers rendered in this registry represent simulated regulatory monitoring data.
            </p>
          </div>

          {/* Section 1: Supernumerary Quota Rules */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-slate-900 text-[14px] flex items-center gap-2">
              <span className="font-mono-code text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">§ 7.1</span>
              Supernumerary Seat Allocation Formula
            </h3>
            <p className="text-xs text-slate-600">
              Under § 7.1(a), legitimate supernumerary seats are calculated independently over and above sanctioned base intake:
            </p>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono-code text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-800">
                <span>Tuition Fee Waiver Scheme (TFWS):</span>
                <span className="font-bold text-blue-700">5% of Sanctioned Base</span>
              </div>
              <div className="flex justify-between items-center text-slate-800">
                <span>Economically Weaker Section (EWS):</span>
                <span className="font-bold text-blue-700">10% Statutory Ceiling</span>
              </div>
              <div className="flex justify-between items-center text-slate-800">
                <span>Intake Tolerance Threshold:</span>
                <span className="font-bold text-red-700">0 Seats (Strict)</span>
              </div>
            </div>
            <p className="text-[12px] text-slate-500 italic">
              Example: For Vindhya Tech (VITM-MP) B.Tech CSE (Base = 100), exactly 6 TFWS seats are allowed. Standard admissions = 120 reported - 6 TFWS = 114 standard vs 100 sanctioned base = exactly 14 excess admissions.
            </p>
          </div>

          {/* Section 2: Presumption of Non-Wrongdoing */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-slate-900 text-[14px] flex items-center gap-2">
              <span className="font-mono-code text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">§ 7.4</span>
              Presumption of Procedural Due Process
            </h3>
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                <AlertCircle size={14} className="text-amber-700 shrink-0" />
                Uncertain State ≠ Proof of Infraction
              </div>
              <p className="leading-relaxed">
                A student confirmation that is pending or an external state counselling API that is temporarily unavailable is recorded as <span className="font-semibold">Uncertain / Pending</span>. Under statutory policy, uncertainty is never treated as adverse evidence or automated proof of institutional malpractice.
              </p>
            </div>
          </div>

          {/* Section 3: Human Review Mandate */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-slate-900 text-[14px] flex items-center gap-2">
              <span className="font-mono-code text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">§ 7.8</span>
              Mandatory Human Adjudication (No Auto-Penalties)
            </h3>
            <p className="text-xs text-slate-600">
              No regulatory sanction, seat cancellation, or penalty notice may be automatically issued by the platform algorithms. Any exception flag requires:
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 pl-4 list-disc">
              <li>Assignment to a designated AICTE Regulatory Adjudication Officer.</li>
              <li>Verification against state counselling gazette roll sheets.</li>
              <li>Opportunity for institution clarification (Return for Correction).</li>
              <li>Mandatory written rationale of at least 30 characters before closing.</li>
            </ul>
          </div>

          {/* Section 4: Comparison v2025.1 vs v2025.2 */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-slate-900 text-[14px]">
              Chronological Comparison: v2025.1 vs v2025.2
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr className="border-b border-slate-200">
                    <th className="p-2.5">Provision</th>
                    <th className="p-2.5">v2025.1 (Legacy)</th>
                    <th className="p-2.5">v2025.2 (Active)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono-code">
                  <tr>
                    <td className="p-2.5 font-sans-ui text-slate-800">Supernumerary Cap</td>
                    <td className="p-2.5 text-slate-600">Provisional</td>
                    <td className="p-2.5 font-bold text-blue-700">Strict 5% TFWS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans-ui text-slate-800">Student Response Window</td>
                    <td className="p-2.5 text-slate-600">45 Days</td>
                    <td className="p-2.5 font-bold text-slate-900">30 Days + Reminders</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans-ui text-slate-800">Audit Trail</td>
                    <td className="p-2.5 text-slate-600">Relational Log</td>
                    <td className="p-2.5 font-bold text-emerald-700">Cryptographic Hash Chain</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>AICTE Approval Bureau · HQ New Delhi</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Policy Guide
          </button>
        </div>
      </div>
    </div>
  );
};
