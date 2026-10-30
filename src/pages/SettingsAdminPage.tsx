/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store';
import { RotateCcw, Download, Shield, Database, Server, Info, AlertTriangle, CheckCircle2, Sliders, ExternalLink } from 'lucide-react';

export const SettingsAdminPage: React.FC = () => {
  const { resetToDemoData, admissions, institutions, auditEvents, reviewCases, confirmations } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleExportFullBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      appVersion: 'v0.9-prototype',
      admissionsCount: admissions.length,
      auditBlocksCount: auditEvents.length,
      casesCount: reviewCases.length,
      storageKey: 'seal_ledger_storage_v1',
      admissions,
      institutions,
      auditEvents,
      reviewCases,
      confirmations,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `APAAR_SEAL_LEDGER_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePerformReset = () => {
    resetToDemoData();
    setConfirmReset(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono-code font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Sliders size={13} className="text-amber-600" />
              System Governance & Environment
            </span>
            <span className="text-xs text-slate-400 font-mono-code">AICTE Portal Config</span>
          </div>
          <h1 className="font-serif-title text-[24px] sm:text-[26px] font-semibold text-slate-900 tracking-tight">
            Settings & Prototype Environment Control
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Demonstration parameters, synthetic data restoration, external regulatory connector status, and audit snapshot backup.
          </p>
        </div>
      </div>

      {/* Mandatory Statutory Limitation Callout */}
      <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-lg shadow-sm flex items-start gap-3">
        <Info size={18} className="text-amber-800 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-[13px] text-amber-900">
            Production Architecture Notice & Non-Binding Sandbox
          </div>
          <p className="text-[12.5px] text-amber-800/90 leading-relaxed">
            This platform is an architectural prototype operating with synthetic benchmark data. Client-side state persistence (localStorage) and role switching are demonstration facilities. Production deployment mandates hardware security module (HSM) key management, mTLS authorized government endpoints (APAAR, SAMARTH, State DTEs), and PostgreSQL relational guarantees.
          </p>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm flex items-center gap-3 text-emerald-800 text-[13px]">
          <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
          <span>Default synthetic dataset (180 admissions, 14 excess seats, 5 cases) successfully restored.</span>
        </div>
      )}

      {/* Simulated Integration Services Status */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Simulated External Endpoints & Connectors
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Status of regulatory data feeds and secondary verification registries
            </p>
          </div>
          <span className="text-[11px] font-mono-code text-slate-400">4 Active Bridges</span>
        </div>

        <div className="divide-y divide-slate-100 text-[13px]">
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="font-medium text-slate-900 flex items-center gap-2">
                <Database size={15} className="text-slate-400" />
                Ministry of Education APAAR / ABC Registry
              </div>
              <div className="text-xs text-slate-500 pl-6">
                12-digit student structural validation and demographic identity match
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono-code text-[11.5px] px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-medium self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              ONLINE (Simulated)
            </span>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="font-medium text-slate-900 flex items-center gap-2">
                <Server size={15} className="text-slate-400" />
                Central & State Counselling Allotment Registry
              </div>
              <div className="text-xs text-slate-500 pl-6">
                DTE MP, CET Cell Maharashtra, KEA Karnataka, DTE Assam, RUHS Rajasthan
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono-code text-[11.5px] px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-medium self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              ACTIVE (1 Timeout Endpoint)
            </span>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="font-medium text-slate-900 flex items-center gap-2">
                <Shield size={15} className="text-slate-400" />
                Secondary & Higher Secondary Board Examination Rolls
              </div>
              <div className="text-xs text-slate-500 pl-6">
                Qualifying examination roll number and eligibility gazette verification
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono-code text-[11.5px] px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-medium self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              ONLINE (Simulated)
            </span>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="font-medium text-slate-900 flex items-center gap-2">
                <Database size={15} className="text-slate-400" />
                Tamper-Evident Cryptographic Ledger Chain
              </div>
              <div className="text-xs text-slate-500 pl-6">
                SHA-256 hash chain linking all regulatory transitions, approvals, and decisions
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono-code text-[11.5px] px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-medium self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {auditEvents.length} BLOCKS VERIFIED
            </span>
          </div>
        </div>
      </div>

      {/* Demo State & Database Actions */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-card p-5 space-y-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Demo State & Database Actions
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Snapshot state or reset back to canonical SIH demonstration baseline
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Ledger Backup */}
          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="font-semibold text-[13.5px] text-slate-900 flex items-center gap-2">
                <Download size={16} className="text-slate-600" />
                Export Full Ledger JSON Snapshot
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Download complete serialized state including {admissions.length} admissions, review cases, institutional profiles, and the audit hash chain.
              </p>
            </div>
            <button
              onClick={handleExportFullBackup}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-[12.5px] font-medium rounded-md shadow-sm transition-all cursor-pointer w-full sm:w-auto"
            >
              <Download size={14} /> Download JSON Backup
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="p-4 border border-rose-200/80 rounded-lg bg-rose-50/30 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="font-semibold text-[13.5px] text-rose-900 flex items-center gap-2">
                <RotateCcw size={16} className="text-rose-700" />
                Reset Demo Data
              </div>
              <p className="text-[12px] text-slate-600 leading-relaxed">
                Restores the standard benchmark dataset (180 admissions, 14 excess seats in Vindhya CSE, seat collisions, and seed audit ledger).
              </p>
            </div>
            {confirmReset ? (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handlePerformReset}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[12.5px] font-medium rounded-md shadow-sm transition-all cursor-pointer"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[12.5px] rounded-md transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-800 text-[12.5px] font-medium rounded-md shadow-sm transition-all cursor-pointer w-full sm:w-auto"
              >
                <RotateCcw size={14} /> Reset to Default Demo State
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
