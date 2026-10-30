/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../store';
import { RULE_VERSIONS } from '../services/intakeValidation';
import { Cpu, ShieldCheck, CheckCircle2, AlertTriangle, BookOpen, Info } from 'lucide-react';

export const IntakeRulesPage: React.FC = () => {
  const { approvals, institutions, programmes, admissions, reconciliationMap, tableDensity } = useStore();

  const padCell = tableDensity === 'compact' ? 'py-2.5 px-3.5' : 'py-3.5 px-4';

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono-code font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              POLICY SPECIFICATION & APPROVAL NORMS
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">AICTE Handbook Protocols</span>
          </div>
          <h1 className="font-serif-title text-[28px] font-semibold text-slate-900 tracking-tight leading-tight">
            AICTE Approval Norms & Rule Engine Configuration
          </h1>
          <p className="text-[14px] text-slate-600 mt-1 max-w-3xl">
            Temporal rule versioning, supernumerary seat exemptions (Tuition Fee Waiver Scheme), and sanctioned capacity ceilings evaluated per academic session.
          </p>
        </div>
        <div className="text-xs font-mono-code text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
          Rule Engine: Policy-Aware Deterministic Evaluation
        </div>
      </div>

      {/* Rule Versions Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Chronological Policy Configurations
          </span>
          <span className="text-xs text-slate-500">
            Simulated policy configuration for regulatory demonstration
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {RULE_VERSIONS.map((rule) => {
            const isActive = rule.id === 'v2025.2';
            return (
              <div
                key={rule.id}
                className={`bg-white border rounded-lg p-5 space-y-3.5 shadow-card transition-all ${
                  isActive
                    ? 'border-blue-600 ring-2 ring-blue-600/10'
                    : 'border-slate-200 opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono-code text-[15px] font-bold text-slate-900">
                      {rule.id}
                    </span>
                    {isActive ? (
                      <span className="font-mono-code text-[10.5px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold">
                        Active Statutory Norm
                      </span>
                    ) : (
                      <span className="font-mono-code text-[10.5px] px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded">
                        Superseded (H1 2025)
                      </span>
                    )}
                  </div>
                  <span className="font-mono-code text-xs text-slate-500">
                    {rule.effectiveFrom} to {rule.effectiveTo || 'Present'}
                  </span>
                </div>

                <div className="font-bold text-[14px] text-slate-900">
                  {rule.name}
                </div>

                <p className="text-[13px] text-slate-600 leading-relaxed">
                  {rule.description}
                </p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md font-mono-code text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">TFWS Supernumerary Quota:</span>
                    <span className="text-slate-900 font-semibold">{rule.supernumeraryRules.tfwsPercentage * 100}% of approved intake</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Max Supernumerary Seats per Branch:</span>
                    <span className="font-bold text-blue-700">{rule.supernumeraryRules.maxSupernumeraryCount} seats</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Intake Breach Tolerance:</span>
                    <span className="text-red-700 font-bold">{rule.intakeTolerance} (Strict Non-exceedance)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sanctioned Approvals Master Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden">
        <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Sanctioned Approval Limits
            </div>
            <div className="font-semibold text-[15px] text-slate-900 mt-0.5">
              Approved Intake & Supernumerary Master Register (Session 2025-26)
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px] border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className={padCell}>Approval Ref</th>
                <th className={padCell}>Institution</th>
                <th className={padCell}>Programme</th>
                <th className={`${padCell} text-right`}>Base Limit</th>
                <th className={`${padCell} text-right`}>TFWS Limit</th>
                <th className={`${padCell} text-right`}>Reported Total</th>
                <th className={`${padCell} text-right`}>TFWS Exempt</th>
                <th className={`${padCell} text-right`}>Excess Seats</th>
                <th className={padCell}>Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono-code text-[12.5px]">
              {approvals.map((ap) => {
                const inst = institutions.find((i) => i.id === ap.institutionId);
                const prog = programmes.find((p) => p.id === ap.programmeId);

                const progAdmissions = admissions.filter(
                  (a) => a.institutionId === ap.institutionId && a.programmeId === ap.programmeId
                );

                const supernumeraryClaimed = progAdmissions.filter((a) => a.isSupernumerary).length;
                const exemptSupernumerary = Math.min(supernumeraryClaimed, ap.supernumeraryApprovedLimit);
                const standardReported = progAdmissions.length - exemptSupernumerary;
                const excess = Math.max(0, standardReported - ap.approvedLimit);

                return (
                  <tr key={ap.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className={padCell}>
                      <span className="text-slate-900 font-bold">{ap.sourceRef}</span>
                    </td>
                    <td className={`${padCell} font-sans-ui`}>
                      <div className="text-slate-900 font-semibold">{inst?.code}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">{inst?.name}</div>
                    </td>
                    <td className={`${padCell} font-sans-ui`}>
                      <div className="text-slate-900 font-medium">{prog?.name}</div>
                      <div className="text-xs text-slate-500">{prog?.code}</div>
                    </td>
                    <td className={`${padCell} text-right text-slate-600 font-medium`}>
                      {ap.approvedLimit}
                    </td>
                    <td className={`${padCell} text-right text-blue-700 font-semibold`}>
                      +{ap.supernumeraryApprovedLimit}
                    </td>
                    <td className={`${padCell} text-right font-bold text-slate-900`}>
                      {progAdmissions.length}
                    </td>
                    <td className={`${padCell} text-right text-emerald-700 font-semibold`}>
                      {exemptSupernumerary}
                    </td>
                    <td className={`${padCell} text-right`}>
                      {excess > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold border border-red-200">
                          +{excess}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className={`${padCell} font-sans-ui`}>
                      {excess > 0 ? (
                        <span className="font-mono-code text-[11px] px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-bold">
                          INTAKE_EXCEEDED ({excess} excess)
                        </span>
                      ) : (
                        <span className="font-mono-code text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold">
                          COMPLIANT
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
