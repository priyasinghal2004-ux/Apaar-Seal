/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store';
import { StatusBadge } from '../components/common/StatusBadge';
import { ShieldCheck, AlertCircle, CheckCircle, FileText, UserCheck, AlertTriangle, Building2, User } from 'lucide-react';
import { verifyApaarIdentityAdapter } from '../services/identityValidation';

export const StudentPortalPage: React.FC = () => {
  const {
    currentUser,
    setCurrentUserRole,
    admissions,
    institutions,
    programmes,
    confirmations,
    recordConfirmationAction,
  } = useStore();

  const [activeDisputeAdmId, setActiveDisputeAdmId] = useState<string | null>(null);
  const [disputeCategory, setDisputeCategory] = useState<string>('NEVER_APPLIED');
  const [disputeRemarks, setDisputeRemarks] = useState<string>('');

  // Target student admissions: if logged in as STUDENT, use currentUser.studentId ('STU-001'), otherwise default to Ananya Verma ('STU-001')
  const studentId = currentUser.role === 'STUDENT' && currentUser.studentId ? currentUser.studentId : 'STU-001';
  const studentAdmissions = admissions.filter((a) => a.studentId === studentId);

  // Identity verification adapter simulation
  const primaryApaar = studentAdmissions[0]?.apaarRaw || '492817354821';
  const identityCheck = verifyApaarIdentityAdapter(primaryApaar);

  const handleConfirm = (admId: string) => {
    recordConfirmationAction(admId, 'CONFIRM');
  };

  const handleDisputeSubmit = (e: React.FormEvent, admId: string) => {
    e.preventDefault();
    if (!disputeRemarks.trim()) return;

    recordConfirmationAction(admId, 'DISPUTE', disputeRemarks.trim(), disputeCategory);
    setActiveDisputeAdmId(null);
    setDisputeRemarks('');
  };

  return (
    <div className="space-y-7 max-w-[1120px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono-code font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              NATIONAL STUDENT DIGILOCKER REGISTRY
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Ministry of Education · NETF</span>
          </div>
          <h1 className="font-serif-title text-[28px] font-semibold text-slate-900 tracking-tight leading-tight">
            Candidate Admission Assurance Portal
          </h1>
          <p className="text-[14px] text-slate-600 mt-1">
            Candidate direct verification of technical institution admissions linked to your APAAR identifier.
          </p>
        </div>
        {currentUser.role !== 'STUDENT' && (
          <button
            onClick={() => setCurrentUserRole('STUDENT')}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            Switch to Student Session (Ananya Verma)
          </button>
        )}
      </div>

      {/* Candidate Profile Summary Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-card grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Candidate Name
          </span>
          <span className="font-bold text-[16px] text-slate-900 block mt-0.5">
            Ananya Verma
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Verified APAAR ID
          </span>
          <span className="font-mono-code text-[15px] font-bold text-slate-900 block mt-0.5">
            XXXX-XXXX-4821
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            APAAR Registry Status
          </span>
          <span className="inline-flex items-center gap-2 font-bold text-xs text-emerald-700 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" /> Active Demographic Identity
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Total Claimed Seats
          </span>
          <span className="font-mono-code text-[15px] font-bold text-red-700 block mt-0.5">
            {studentAdmissions.length} Institutions
          </span>
        </div>
      </div>

      {/* Statutory Mandate Notice */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-950 flex items-start gap-3 shadow-2xs">
        <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-emerald-900">Statutory Assurance Mandate: </span>
          {identityCheck.disclaimer}
        </div>
      </div>

      {/* Cross-Institution Collision Warning if multiple admissions reported */}
      {studentAdmissions.length > 1 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-950 flex items-start gap-3 shadow-2xs">
          <AlertCircle size={18} className="text-red-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-red-900">Multiple Seat Enrolment Alert: </span>
            You have been reported as an admitted student across <span className="font-bold">{studentAdmissions.length} distinct technical institutions</span> for academic session 2025-26. Under AICTE regulations, concurrent enrolment in two full-time degree programmes is void. Please confirm your genuine seat or lodge a formal contestation.
          </div>
        </div>
      )}

      {/* Admissions List */}
      <div className="space-y-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Reported Admissions For Your APAAR Identifier ({studentAdmissions.length})
        </div>

        {studentAdmissions.map((adm) => {
          const inst = institutions.find((i) => i.id === adm.institutionId);
          const prog = programmes.find((p) => p.id === adm.programmeId);
          const conf = confirmations.find((c) => c.admissionId === adm.id);
          const isDisputing = activeDisputeAdmId === adm.id;

          return (
            <div
              key={adm.id}
              className="bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[15px] text-slate-900">
                    {inst?.name} ({inst?.code})
                  </div>
                  <div className="text-xs text-slate-500 font-mono-code mt-0.5">
                    {inst?.state} · AICTE Region: {inst?.aicteRegion}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge type="state" value={adm.currentState} />
                  <StatusBadge type="confirmation" value={conf?.status || 'PENDING'} />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 text-[13px]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono-code text-xs">
                  <div>
                    <span className="text-[11px] font-sans-ui uppercase text-slate-400 block font-semibold">
                      Programme
                    </span>
                    <span className="font-sans-ui font-semibold text-slate-900 block mt-0.5">
                      {prog?.name || 'Technical Programme'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-sans-ui uppercase text-slate-400 block font-semibold">
                      Quota Category
                    </span>
                    <span className="text-slate-900 block mt-0.5">
                      {adm.quotaCategory} {adm.isSupernumerary ? '(Supernumerary)' : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-sans-ui uppercase text-slate-400 block font-semibold">
                      Counselling Roll No
                    </span>
                    <span className="text-slate-900 block mt-0.5">
                      {adm.counsellingRollNo || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-sans-ui uppercase text-slate-400 block font-semibold">
                      Reported Date
                    </span>
                    <span className="text-slate-900 block mt-0.5">
                      {adm.admissionDate}
                    </span>
                  </div>
                </div>

                {/* Disputed state details */}
                {conf?.status === 'DISPUTED' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-red-800 flex items-center gap-2">
                      <AlertCircle size={15} />
                      Formal Admission Contestation Registered
                    </div>
                    <div className="text-slate-800 font-sans-ui mt-1">
                      Reason: "{conf.disputeReason}"
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono-code mt-1">
                      Case referred to AICTE Regulatory Exception Queue for adjudication.
                    </div>
                  </div>
                )}

                {/* Confirmed state details */}
                {conf?.status === 'CONFIRMED' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircle size={16} />
                      Admission Confirmed by Candidate on {conf.confirmedAt ? conf.confirmedAt.slice(0, 10) : '2025-07-20'}
                    </div>
                    <span className="font-mono-code text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      Token: CONF-{adm.id.slice(-6)}
                    </span>
                  </div>
                )}

                {/* Action buttons (if not yet confirmed/disputed or allowed to contest) */}
                {conf?.status !== 'DISPUTED' && conf?.status !== 'CONFIRMED' && !isDisputing && (
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleConfirm(adm.id)}
                      className="px-4 py-2 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer"
                    >
                      Record Seat Confirmation
                    </button>
                    <button
                      onClick={() => setActiveDisputeAdmId(adm.id)}
                      className="px-4 py-2 bg-white hover:bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
                    >
                      Dispute Admission
                    </button>
                  </div>
                )}

                {/* If confirmed, student still has statutory right to dispute if fraudulent */}
                {conf?.status === 'CONFIRMED' && !isDisputing && (
                  <div className="pt-3 border-t border-slate-100 text-right">
                    <button
                      onClick={() => setActiveDisputeAdmId(adm.id)}
                      className="text-xs text-red-700 hover:text-red-900 hover:underline font-semibold cursor-pointer"
                    >
                      Need to contest or report irregularity for this seat?
                    </button>
                  </div>
                )}

                {/* Dispute form modal/drawer inline */}
                {isDisputing && (
                  <form
                    onSubmit={(e) => handleDisputeSubmit(e, adm.id)}
                    className="p-4 bg-red-50/40 border border-red-200 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs uppercase tracking-wider text-red-950">
                        Lodge Statutory Enrolment Contestation
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveDisputeAdmId(null)}
                        className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">
                        Contestation Grounds
                      </label>
                      <select
                        value={disputeCategory}
                        onChange={(e) => setDisputeCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded focus:outline-none font-medium"
                      >
                        <option value="NEVER_APPLIED">Never applied to or attended this institution</option>
                        <option value="DIFFERENT_PROGRAMME">Admitted into different programme than reported</option>
                        <option value="FEE_EXTORTION">Unsanctioned fee extortion grievance</option>
                        <option value="SEAT_CANCELLED_UNILATERALLY">Seat cancelled unilaterally by institution</option>
                        <option value="OTHER">Other statutory discrepancy</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">
                        Written Contestation Statement
                      </label>
                      <textarea
                        rows={2}
                        value={disputeRemarks}
                        onChange={(e) => setDisputeRemarks(e.target.value)}
                        placeholder="Detail the factual basis for this contestation..."
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded focus:outline-none resize-none font-sans-ui"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveDisputeAdmId(null)}
                        className="px-3.5 py-1.5 bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded cursor-pointer hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded shadow-sm cursor-pointer"
                      >
                        Submit Dispute to Regulator
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
