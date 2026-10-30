/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Search, X, FileText, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAdmission: (admissionId: string) => void;
  onSelectCase: (caseId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectAdmission,
  onSelectCase,
}) => {
  const { admissions, reviewCases, institutions } = useStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQ = query.trim().toLowerCase();

  const matchedAdmissions = cleanQ
    ? admissions
        .filter(
          (a) =>
            a.id.toLowerCase().includes(cleanQ) ||
            a.studentName.toLowerCase().includes(cleanQ) ||
            a.counsellingRollNo?.toLowerCase().includes(cleanQ) ||
            a.maskedApaar.toLowerCase().includes(cleanQ)
        )
        .slice(0, 5)
    : [];

  const matchedCases = cleanQ
    ? reviewCases
        .filter((c) => c.id.toLowerCase().includes(cleanQ) || c.caseType.toLowerCase().includes(cleanQ))
        .slice(0, 4)
    : [];

  const matchedInstitutions = cleanQ
    ? institutions
        .filter(
          (i) =>
            i.name.toLowerCase().includes(cleanQ) ||
            i.code.toLowerCase().includes(cleanQ) ||
            i.state.toLowerCase().includes(cleanQ)
        )
        .slice(0, 3)
    : [];

  const hasResults = matchedAdmissions.length > 0 || matchedCases.length > 0 || matchedInstitutions.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 bg-slate-900/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-elevated overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/70">
          <Search size={18} className="text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search admission ID, case ref (SEAL-2025-...), student name, or institution..."
            className="w-full bg-transparent text-[14px] text-slate-900 placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex font-mono-code text-[11px] text-slate-500 bg-white px-2 py-0.5 border border-slate-300 rounded shadow-2xs mr-2">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/50 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[420px] overflow-y-auto p-2 divide-y divide-slate-100">
          {!cleanQ && (
            <div className="py-10 px-6 text-center space-y-2">
              <Search size={28} className="mx-auto text-slate-300" />
              <div className="text-[13px] font-medium text-slate-700">Quick Global Search</div>
              <div className="text-[12px] text-slate-500 max-w-sm mx-auto">
                Search by admission ref like <span className="font-mono-code text-slate-800 font-semibold">ADM-25-004001</span>, case ID <span className="font-mono-code text-slate-800 font-semibold">SEAL-2025-000417</span>, or candidate name.
              </div>
            </div>
          )}

          {cleanQ && !hasResults && (
            <div className="py-10 px-6 text-center text-[13px] text-slate-500">
              No matching regulatory records located for "{query}".
            </div>
          )}

          {/* Cases */}
          {matchedCases.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center justify-between">
                <span>Adjudication Cases</span>
                <span>{matchedCases.length}</span>
              </div>
              <div className="space-y-1">
                {matchedCases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCase(c.id);
                      onClose();
                    }}
                    className="px-3 py-2.5 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                        <AlertCircle size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code text-[12.5px] font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {c.id}
                          </span>
                          <span className="text-[12px] text-slate-500">({c.caseType})</span>
                        </div>
                        <div className="text-[11.5px] text-slate-400 truncate max-w-md">
                          {c.calculationSummary || c.caseType}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge type="severity" value={c.priority} />
                      <StatusBadge type="case" value={c.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admissions */}
          {matchedAdmissions.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center justify-between">
                <span>Enrolment Records</span>
                <span>{matchedAdmissions.length}</span>
              </div>
              <div className="space-y-1">
                {matchedAdmissions.map((adm) => (
                  <div
                    key={adm.id}
                    onClick={() => {
                      onSelectAdmission(adm.id);
                      onClose();
                    }}
                    className="px-3 py-2.5 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        <FileText size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code text-[12px] font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {adm.id}
                          </span>
                          <span className="text-[13px] font-medium text-slate-800">{adm.studentName}</span>
                        </div>
                        <div className="font-mono-code text-[11px] text-slate-400">
                          APAAR: {adm.maskedApaar} • Prog: {adm.programmeId}
                        </div>
                      </div>
                    </div>
                    <StatusBadge type="state" value={adm.currentState} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Institutions */}
          {matchedInstitutions.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center justify-between">
                <span>Institutions</span>
                <span>{matchedInstitutions.length}</span>
              </div>
              <div className="space-y-1">
                {matchedInstitutions.map((inst) => (
                  <div
                    key={inst.id}
                    className="px-3 py-2.5 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        <Building2 size={14} />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-slate-900">{inst.name}</div>
                        <div className="font-mono-code text-[11px] text-slate-400">
                          Code: {inst.code} • {inst.state}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-mono-code px-2 py-0.5 bg-slate-100 rounded">
                      {inst.aicteRegion}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 px-4 py-2.5 bg-slate-50/70 flex items-center justify-between text-[11.5px] text-slate-500">
          <span>Search scope: 180 admissions, 6 institutions, 5 active cases</span>
          <span>Use <kbd className="font-mono-code font-semibold">↑</kbd> <kbd className="font-mono-code font-semibold">↓</kbd> to navigate</span>
        </div>
      </div>
    </div>
  );
};
