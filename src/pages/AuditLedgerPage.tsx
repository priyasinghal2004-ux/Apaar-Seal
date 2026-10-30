/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store';
import { AuditEvent, BreakGlassLogEntry, ConsentAccessLogEntry } from '../types';
import { BreakGlassModal } from '../components/common/BreakGlassModal';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Hash,
  Eye,
  X,
  Lock,
  Unlock,
  KeyRound,
  FileText,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

export const AuditLedgerPage: React.FC = () => {
  const {
    auditEvents,
    breakGlassLogs,
    consentLogs,
    isBreakGlassActive,
    activeBreakGlassReason,
    revokeBreakGlass,
    verifyLedgerChain,
    simulateAuditTamper,
    restoreAuditChain,
    tableDensity,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'HASH_CHAIN' | 'CONSENT_LOGS' | 'BREAK_GLASS_LOGS'>('HASH_CHAIN');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [verificationResult, setVerificationResult] = useState<ReturnType<typeof verifyLedgerChain> | null>(null);
  const [isBreakGlassModalOpen, setIsBreakGlassModalOpen] = useState<boolean>(false);

  const handleVerify = () => {
    const res = verifyLedgerChain();
    setVerificationResult(res);
  };

  const handleTamper = () => {
    simulateAuditTamper(2);
    setTimeout(() => {
      const res = verifyLedgerChain();
      setVerificationResult(res);
    }, 100);
  };

  const handleRestore = () => {
    restoreAuditChain();
    setTimeout(() => {
      const res = verifyLedgerChain();
      setVerificationResult(res);
    }, 100);
  };

  const filteredEvents = auditEvents.filter((ev) => {
    if (filterType !== 'ALL' && ev.eventType !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = ev.id.toLowerCase().includes(q);
      const matchActor = ev.actorName.toLowerCase().includes(q);
      const matchTarget = ev.targetId.toLowerCase().includes(q);
      const matchHash = ev.hash.toLowerCase().includes(q);
      if (!matchId && !matchActor && !matchTarget && !matchHash) return false;
    }
    return true;
  });

  const padCell = tableDensity === 'compact' ? 'py-2.5 px-3.5' : 'py-3.5 px-4';

  const formatIST = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      }) + ' IST';
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono-code font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              TAMPER-EVIDENT TRUST LEDGER
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono-code">Sequential Hash Digest Chain</span>
          </div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
            Trust & Privacy Assurance Ledger
          </h1>
          <p className="text-[13.5px] text-slate-600 mt-1 max-w-3xl">
            Cryptographically chained immutable audit log of administrative actions, consent queries, and statutory break-glass access justifications.
          </p>
        </div>

        {/* Break-glass & verification controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {isBreakGlassActive ? (
            <button
              onClick={revokeBreakGlass}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Lock size={14} className="text-amber-800" />
              Revoke Break-Glass (Re-mask PII)
            </button>
          ) : (
            <button
              onClick={() => setIsBreakGlassModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Unlock size={14} />
              Break-Glass Unmask Protocol
            </button>
          )}

          <button
            onClick={handleVerify}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <ShieldCheck size={15} />
            Verify Chain Integrity
          </button>
        </div>
      </div>

      {/* Break-Glass Status Banner (REQ 8: Mask personal data by default, reveal with logged break-glass reason) */}
      {isBreakGlassActive ? (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <ShieldAlert size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900 text-[13px]">
                Statutory Break-Glass Override Active
              </div>
              <p className="mt-0.5 text-amber-900 leading-relaxed font-sans-ui">
                Personal identifiers (APAAR, candidate mobile, domicile address) are unmasked for your session under justification: <strong className="font-mono-code">"{activeBreakGlassReason}"</strong>. All viewing actions are cryptographically logged.
              </p>
            </div>
          </div>
          <button
            onClick={revokeBreakGlass}
            className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
          >
            Re-Mask PII
          </button>
        </div>
      ) : (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-slate-500" />
            <span>
              <strong className="text-slate-900">Personal Data Masked by Default: </strong>
              APAAR identifiers and candidate contact details are masked. Reveal only with a logged statutory break-glass reason.
            </span>
          </div>
          <button
            onClick={() => setIsBreakGlassModalOpen(true)}
            className="text-xs text-red-700 hover:text-red-900 font-semibold underline cursor-pointer ml-2"
          >
            Request Unmask Access
          </button>
        </div>
      )}

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-4 border rounded-xl text-xs flex items-start justify-between gap-3 shadow-card ${
            verificationResult.valid
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {verificationResult.valid ? (
              <CheckCircle2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={18} className="text-red-700 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-[13.5px]">
                {verificationResult.valid
                  ? `Cryptographic Audit Chain Integrity Validated (${verificationResult.totalEvents} Blocks)`
                  : `Cryptographic Hash Inconsistency at Block Index ${verificationResult.brokenAtIndex}!`}
              </div>
              <div className="text-xs mt-1 font-mono-code opacity-90 leading-relaxed">
                {verificationResult.valid
                  ? `All sequential 64-character polynomial digests and predecessor linkages match expected invariants.`
                  : verificationResult.error}
              </div>
              {!verificationResult.valid && (
                <div className="mt-2.5">
                  <button
                    onClick={handleRestore}
                    className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded-md text-xs font-semibold cursor-pointer"
                  >
                    Restore Chain Invariants
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setVerificationResult(null)}
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('HASH_CHAIN')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'HASH_CHAIN'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Audit Hash Chain ({auditEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('CONSENT_LOGS')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'CONSENT_LOGS'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Consent & Access Log ({consentLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('BREAK_GLASS_LOGS')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'BREAK_GLASS_LOGS'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Break-Glass Audits ({breakGlassLogs.length})
        </button>
      </div>

      {/* Tab 1: Audit Hash Chain */}
      {activeTab === 'HASH_CHAIN' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-card flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative min-w-[240px] flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search event ID (AUD-...), actor, target, or hash..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Event Types ({auditEvents.length})</option>
                <option value="STATE_TRANSITION">STATE_TRANSITION</option>
                <option value="INTAKE_VALIDATION">INTAKE_VALIDATION</option>
                <option value="ADMISSION_REPORTED">ADMISSION_REPORTED</option>
                <option value="CASE_RESOLVED">CASE_RESOLVED</option>
                <option value="BREAK_GLASS_PII_REVEAL">BREAK_GLASS_PII_REVEAL</option>
                <option value="CONSENT_VERIFICATION">CONSENT_VERIFICATION</option>
                <option value="ACCESS_DENIED">ACCESS_DENIED</option>
              </select>

              <button
                onClick={handleTamper}
                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Test cryptographic failure detection on block #3"
              >
                Simulate Tamper
              </button>
            </div>
          </div>

          {/* Audit Chain Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div
              className={`${
                selectedEvent ? 'lg:col-span-7' : 'lg:col-span-12'
              } bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className={padCell}>Event ID</th>
                      <th className={padCell}>Timestamp (IST)</th>
                      <th className={padCell}>Event Type</th>
                      <th className={padCell}>Actor & Role</th>
                      <th className={padCell}>Target Entity</th>
                      <th className={padCell}>Hash (Digest)</th>
                      <th className={`${padCell} text-right`}>Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono-code text-xs">
                    {filteredEvents.map((ev) => {
                      const isSelected = selectedEvent?.id === ev.id;
                      const isAccessDenied = ev.eventType === 'ACCESS_DENIED';
                      const isBreakGlass = ev.eventType === 'BREAK_GLASS_PII_REVEAL';

                      return (
                        <tr
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`hover:bg-slate-50/90 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/50 font-medium' : ''
                          } ${isBreakGlass ? 'bg-amber-50/40' : isAccessDenied ? 'bg-red-50/40' : ''}`}
                        >
                          <td className={padCell}>
                            <span className="font-bold text-slate-900">{ev.id}</span>
                          </td>
                          <td className={padCell}>
                            <span className="text-slate-600 text-[11.5px] whitespace-nowrap">
                              {formatIST(ev.timestamp)}
                            </span>
                          </td>
                          <td className={padCell}>
                            <span
                              className={`font-sans-ui text-[11px] px-2 py-0.5 rounded font-medium border ${
                                isBreakGlass
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                  : isAccessDenied
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {ev.eventType}
                            </span>
                          </td>
                          <td className={padCell}>
                            <div className="font-sans-ui text-slate-900 font-semibold truncate max-w-[130px]">
                              {ev.actorName}
                            </div>
                            <div className="text-[10.5px] text-slate-500 font-sans-ui">
                              {ev.actorRole}
                            </div>
                          </td>
                          <td className={padCell}>
                            <div className="text-slate-800 font-sans-ui truncate max-w-[140px] font-medium">
                              {ev.targetEntity}
                            </div>
                            <div className="text-[11.5px] text-slate-500">
                              {ev.targetId}
                            </div>
                          </td>
                          <td className={padCell}>
                            <span
                              className="text-[11.5px] text-slate-500 font-mono-code bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                              title={ev.hash}
                            >
                              {ev.hash.slice(0, 10)}...{ev.hash.slice(-4)}
                            </span>
                          </td>
                          <td className={`${padCell} text-right font-sans-ui`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(ev);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-900 cursor-pointer"
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Event Payload */}
            {selectedEvent && (
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden space-y-4">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono-code font-semibold uppercase tracking-wider text-slate-500">
                      CRYPTOGRAPHIC BLOCK PAYLOAD
                    </div>
                    <div className="font-mono-code text-[16px] font-bold text-slate-900 mt-0.5">
                      {selectedEvent.id}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div className="space-y-1 font-mono-code">
                    <span className="text-[11px] uppercase font-sans-ui font-semibold text-slate-500">
                      Block Hash Digest
                    </span>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 break-all select-all font-semibold text-[11px]">
                      {selectedEvent.hash}
                    </div>
                  </div>

                  <div className="space-y-1 font-mono-code">
                    <span className="text-[11px] uppercase font-sans-ui font-semibold text-slate-500">
                      Predecessor Block Hash (prevHash)
                    </span>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 break-all select-all text-[11px]">
                      {selectedEvent.prevHash}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] uppercase font-semibold text-slate-500">
                      Canonical JSON Attributes
                    </span>
                    <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg font-mono-code text-[11px] overflow-x-auto max-h-[260px] leading-relaxed">
                      {JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Consent & Access Log (REQ 8) */}
      {activeTab === 'CONSENT_LOGS' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono-code uppercase font-semibold text-slate-500">
                CITIZEN CONSENT & TELEMETRY
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                DigiLocker Consent & Registry Access Queries ({consentLogs.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono-code">
              DPDP Act 2023 · Section 43A IT Compliance
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className={padCell}>Query ID</th>
                  <th className={padCell}>Timestamp (IST)</th>
                  <th className={padCell}>Target APAAR</th>
                  <th className={padCell}>Consent Channel</th>
                  <th className={padCell}>Status</th>
                  <th className={padCell}>Requestor</th>
                  <th className={padCell}>Purpose</th>
                  <th className={padCell}>Source IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono-code">
                {consentLogs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className={padCell}>
                      <span className="font-bold text-slate-900">{c.id}</span>
                    </td>
                    <td className={padCell}>
                      <span className="text-slate-600 whitespace-nowrap">{formatIST(c.timestamp)}</span>
                    </td>
                    <td className={padCell}>
                      <span className="font-semibold text-slate-900">{c.apaarMasked}</span>
                    </td>
                    <td className={padCell}>
                      <span className="font-sans-ui text-slate-700">{c.consentType}</span>
                    </td>
                    <td className={padCell}>
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-sans-ui font-semibold text-[11px] ${
                          c.status === 'GRANTED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className={padCell}>
                      <span className="font-sans-ui text-slate-800 truncate max-w-[150px] block" title={c.requestor}>
                        {c.requestor}
                      </span>
                    </td>
                    <td className={padCell}>
                      <span className="font-sans-ui text-slate-600 truncate max-w-[200px] block" title={c.purpose}>
                        {c.purpose}
                      </span>
                    </td>
                    <td className={padCell}>
                      <span className="text-slate-400">{c.ipMasked}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Break-Glass Audits (REQ 8) */}
      {activeTab === 'BREAK_GLASS_LOGS' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono-code uppercase font-semibold text-slate-500">
                STATUTORY EMERGENCY AUDIT LOG
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                Break-Glass Personal Identity Unmasking Record ({breakGlassLogs.length})
              </h3>
            </div>
            <button
              onClick={() => setIsBreakGlassModalOpen(true)}
              className="text-xs text-red-700 hover:text-red-900 font-semibold cursor-pointer underline"
            >
              Authorize New Emergency Break-Glass
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className={padCell}>Log ID</th>
                  <th className={padCell}>Timestamp (IST)</th>
                  <th className={padCell}>Officer & Role</th>
                  <th className={padCell}>Statutory Reason</th>
                  <th className={padCell}>Target Entity</th>
                  <th className={padCell}>Written Justification Rationale</th>
                  <th className={`${padCell} text-right`}>Session Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {breakGlassLogs.map((bg) => (
                  <tr key={bg.id} className="hover:bg-slate-50/80">
                    <td className={`${padCell} font-mono-code font-bold text-slate-900`}>
                      {bg.id}
                    </td>
                    <td className={`${padCell} font-mono-code text-slate-600 whitespace-nowrap`}>
                      {formatIST(bg.timestamp)}
                    </td>
                    <td className={padCell}>
                      <div className="font-semibold text-slate-900">{bg.officerName}</div>
                      <div className="font-mono-code text-[11px] text-slate-500">{bg.officerRole}</div>
                    </td>
                    <td className={padCell}>
                      <span className="font-mono-code text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                        {bg.reasonCode}
                      </span>
                    </td>
                    <td className={`${padCell} font-mono-code text-slate-700`}>
                      {bg.targetStudentOrAdmissionId}
                    </td>
                    <td className={padCell}>
                      <p className="text-slate-800 font-sans-ui max-w-sm leading-relaxed" title={bg.justificationText}>
                        "{bg.justificationText}"
                      </p>
                    </td>
                    <td className={`${padCell} text-right font-mono-code text-slate-500`}>
                      {bg.sessionDurationMinutes} mins
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Break-Glass Modal */}
      <BreakGlassModal
        isOpen={isBreakGlassModalOpen}
        onClose={() => setIsBreakGlassModalOpen(false)}
      />
    </div>
  );
};
