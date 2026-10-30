/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../store';
import { AlertTriangle, Lock, ShieldAlert, X } from 'lucide-react';

interface BreakGlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId?: string;
}

export const BreakGlassModal: React.FC<BreakGlassModalProps> = ({
  isOpen,
  onClose,
  targetId,
}) => {
  const { currentUser, recordBreakGlassAccess } = useStore();
  const [reasonCode, setReasonCode] = useState<
    'COURT_DIRECTIVE' | 'STATUTORY_INVESTIGATION' | 'IDENTITY_DISPUTE_RESOLUTION' | 'AUDIT_COMPLIANCE_INSPECTION'
  >('IDENTITY_DISPUTE_RESOLUTION');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (justification.trim().length < 20) return;

    setIsSubmitting(true);
    const success = recordBreakGlassAccess(reasonCode, justification, targetId);
    setIsSubmitting(false);

    if (success) {
      onClose();
      setJustification('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white border border-red-200 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-red-50/70 border-b border-red-200 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-red-700">
                STATUTORY EMERGENCY ACCESS
              </div>
              <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">
                Break-Glass PII Unmasking Protocol
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Warning */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-[13px]">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-amber-900">Cryptographically Audited Action: </span>
              Unmasking candidate APAAR numbers, personal telephone numbers, and addresses is strictly governed by Section 43A of the IT Act. Every invocation binds your officer identity (<span className="font-semibold text-slate-900">{currentUser.name}</span>) to an immutable cryptographic audit block.
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-700 mb-1.5">
              Statutory Basis for Access
            </label>
            <select
              value={reasonCode}
              onChange={(e: any) => setReasonCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 font-medium text-slate-800"
            >
              <option value="IDENTITY_DISPUTE_RESOLUTION">
                Candidate Contestation & Identity Collision Resolution
              </option>
              <option value="STATUTORY_INVESTIGATION">
                AICTE Official Intake Exceedance Formal Inquiry
              </option>
              <option value="COURT_DIRECTIVE">
                Judicial / High Court Sub Judice Directive
              </option>
              <option value="AUDIT_COMPLIANCE_INSPECTION">
                Comptroller & Auditor General Empanelled Statutory Inspection
              </option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-700">
                Written Justification Rationale
              </label>
              <span
                className={`text-[11px] font-mono-code font-semibold ${
                  justification.trim().length >= 20 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {justification.trim().length}/20 chars min
              </span>
            </div>
            <textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Detail the case reference or inquiry mandate requiring unmasking of personal candidate identifiers..."
              className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 resize-none font-sans-ui"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11.5px] text-slate-500">
              Valid for: <span className="font-mono-code font-semibold text-slate-700">15 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || justification.trim().length < 20}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer disabled:opacity-40 transition-colors"
              >
                {isSubmitting ? 'Recording Log...' : 'Authorize Break-Glass Unmask'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
