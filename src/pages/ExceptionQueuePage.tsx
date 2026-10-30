/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store';
import { ReasonCode, ReviewCase, Severity } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  UserCheck,
  Building2,
  X,
  ArrowRight,
  BookOpen,
  Info,
  Scale,
  RotateCcw,
} from 'lucide-react';

interface ExceptionQueuePageProps {
  initialCaseId?: string | null;
}

export const ExceptionQueuePage: React.FC<ExceptionQueuePageProps> = ({ initialCaseId }) => {
  const {
    reviewCases,
    admissions,
    institutions,
    programmes,
    confirmations,
    reconciliationMap,
    evidenceRecords,
    currentUser,
    startReviewCase,
    returnCaseForCorrection,
    resolveReviewCase,
    tableDensity,
  } = useStore();

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(initialCaseId || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterReason, setFilterReason] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE'); // ACTIVE, ALL, RESOLVED

  // Adjudication form state
  const [resolutionOutcome, setResolutionOutcome] = useState<ReviewCase['resolutionOutcome']>('ADMISSION_CONFIRMED');
  const [resolutionRationale, setResolutionRationale] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState<boolean>(false);
  const [correctionFeedback, setCorrectionFeedback] = useState<string>('');

  // Plain-language dictionary for flags
  const getPlainLanguageExplanation = (c: ReviewCase) => {
    switch (c.caseType) {
      case 'INTAKE_EXCEEDED':
        return 'Sanctioned intake capacity exceeded: Institution reported more admissions than permitted under statutory rule v2025.2 (allowing for 5% TFWS supernumerary quota).';
      case 'DUP_IDENTIFIER':
        return 'Duplicate student identifier collision: This candidate APAAR ID has been reported concurrently by two distinct state technical institutions for academic session 2025-26.';
      case 'STUDENT_DISPUTED':
        return 'Candidate contested admission: The student filed a formal contestation through the verification portal stating they never accepted or enrolled in this institution.';
      case 'EVIDENCE_CONFLICT':
        return 'External counselling mismatch: State CET or examination board allotment registers show a conflicting status (e.g. seat was surrendered or transferred).';
      case 'STATE_CHANGE_UNSUPPORTED':
        return 'Missing statutory order: Seat was marked as MIGRATED or VACATED without an attached official gazette notification or transfer order reference.';
      case 'STUDENT_PENDING_OVERDUE':
        return 'Unacknowledged student confirmation: Seat has remained in an unconfirmed pending state for over 30 days without candidate response.';
      default:
        return 'Regulatory discrepancy requiring administrative inquiry and human adjudication.';
    }
  };

  // Helper to calculate age in human-readable plain language
  const calculateAge = (isoString: string) => {
    try {
      const created = new Date(isoString).getTime();
      const now = new Date('2025-08-01T12:00:00Z').getTime();
      const diffDays = Math.max(1, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  // Helper to map ReviewCase status to regulatory status taxonomy (New, In review, Resolved, Appealed)
  const mapRegulatoryStatus = (c: ReviewCase): 'New' | 'In review' | 'Resolved' | 'Appealed' => {
    if (c.status === 'RESOLVED' || c.status === 'DISMISSED') return 'Resolved';
    if (c.status === 'UNDER_REVIEW') return 'In review';
    return 'New';
  };

  // Helper to compute student count impacted by this case
  const getStudentCount = (c: ReviewCase): number => {
    if (c.caseType === 'INTAKE_EXCEEDED') {
      // 14 students in Vindhya intake excess batch
      return 14;
    }
    return 1;
  };

  // Active counts
  const totalActive = reviewCases.filter((c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length;
  const totalResolved = reviewCases.filter((c) => c.status === 'RESOLVED' || c.status === 'DISMISSED').length;

  // Filter cases
  const filteredCases = reviewCases.filter((c) => {
    if (filterReason !== 'ALL' && c.caseType !== filterReason) return false;
    if (filterSeverity !== 'ALL' && c.priority !== filterSeverity) return false;
    if (filterStatus === 'ACTIVE' && (c.status === 'RESOLVED' || c.status === 'DISMISSED')) return false;
    if (filterStatus === 'RESOLVED' && c.status !== 'RESOLVED' && c.status !== 'DISMISSED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inst = institutions.find((i) => i.id === c.institutionId);
      const adm = admissions.find((a) => a.id === c.admissionId);
      const matchId = c.id.toLowerCase().includes(q);
      const matchInst = inst?.name.toLowerCase().includes(q) || inst?.code.toLowerCase().includes(q);
      const matchStudent = adm?.studentName.toLowerCase().includes(q) || adm?.maskedApaar.toLowerCase().includes(q);
      if (!matchId && !matchInst && !matchStudent) return false;
    }
    return true;
  });

  const selectedCase = reviewCases.find((c) => c.id === selectedCaseId);
  const linkedAdmission = selectedCase ? admissions.find((a) => a.id === selectedCase.admissionId) : null;
  const linkedInstitution = selectedCase ? institutions.find((i) => i.id === selectedCase.institutionId) : null;
  const linkedProgramme = selectedCase ? programmes.find((p) => p.id === selectedCase.programmeId) : null;
  const linkedConfirmation = linkedAdmission ? confirmations.find((c) => c.admissionId === linkedAdmission.id) : null;
  const reconciliation = linkedAdmission ? reconciliationMap.get(linkedAdmission.id) : null;
  const linkedEvidence = linkedAdmission ? evidenceRecords.filter((e) => e.admissionId === linkedAdmission.id) : [];

  const handleStartReview = async () => {
    if (!selectedCase) return;
    await startReviewCase(selectedCase.id);
  };

  const handleReturnForCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setIsSubmitting(true);
    const ok = await returnCaseForCorrection(selectedCase.id, correctionFeedback);
    setIsSubmitting(false);
    if (ok) {
      setShowCorrectionForm(false);
      setCorrectionFeedback('');
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setIsSubmitting(true);
    const success = await resolveReviewCase(selectedCase.id, resolutionOutcome, resolutionRationale);
    setIsSubmitting(false);
    if (success) {
      setResolutionRationale('');
    }
  };

  const padCell = tableDensity === 'compact' ? 'py-2.5 px-3' : 'py-3.5 px-4';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono-code font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              REGULATORY CASE-MANAGEMENT
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono-code">Simulated Adjudication Cadre</span>
          </div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
            Regulatory Exception & Review Queue
          </h1>
          <p className="text-[13.5px] text-slate-600 mt-1 max-w-3xl">
            Administrative queue of intake exceedances, multi-institution APAAR collisions, and contested enrolments requiring human review before determination.
          </p>
        </div>

        {/* Quick Filter Counts */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterStatus === 'ACTIVE'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Active Flags ({totalActive})
          </button>
          <button
            onClick={() => setFilterStatus('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterStatus === 'RESOLVED'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Resolved ({totalResolved})
          </button>
        </div>
      </div>

      {/* Mandatory Human Review Callout (REQ 6: "Human review required before any action. No automatic penalty language anywhere.") */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-3 shadow-2xs">
        <Scale size={18} className="text-blue-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-blue-950">Human Review Required Before Any Action: </span>
          In accordance with AICTE procedural fairness directives, flags generated by intake discrepancy rules or external registry delays constitute administrative notices for inquiry. <strong className="font-semibold text-slate-900">No automated penalties, fines, or seat cancellations are permitted.</strong> Every determination requires human officer review, institution response opportunity, and mandatory written rationale.
        </div>
      </div>

      {/* Main Layout: Flags Table + Side Dossier Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table of Flags */}
        <div
          className={`${
            selectedCase ? 'lg:col-span-7' : 'lg:col-span-12'
          } bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden`}
        >
          {/* Table Controls */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center gap-2.5 text-xs">
            <div className="relative min-w-[200px] flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Case ID, institution, candidate..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filter by reason */}
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="bg-white border border-slate-200 text-xs text-slate-700 px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Reason Codes</option>
              <option value="INTAKE_EXCEEDED">INTAKE_EXCEEDED</option>
              <option value="DUP_IDENTIFIER">DUP_IDENTIFIER</option>
              <option value="STUDENT_DISPUTED">STUDENT_DISPUTED</option>
              <option value="EVIDENCE_CONFLICT">EVIDENCE_CONFLICT</option>
              <option value="STATE_CHANGE_UNSUPPORTED">STATE_CHANGE_UNSUPPORTED</option>
            </select>

            {/* Filter by severity */}
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-white border border-slate-200 text-xs text-slate-700 px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className={padCell}>Reason Code</th>
                  <th className={padCell}>Severity</th>
                  <th className={padCell}>Institution</th>
                  <th className={`${padCell} text-right`}>Students</th>
                  <th className={padCell}>Age</th>
                  <th className={padCell}>Owner</th>
                  <th className={padCell}>Status</th>
                  <th className={`${padCell} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                      No exception cases match current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => {
                    const inst = institutions.find((i) => i.id === c.institutionId);
                    const adm = admissions.find((a) => a.id === c.admissionId);
                    const isSelected = selectedCaseId === c.id;
                    const regStatus = mapRegulatoryStatus(c);
                    const studentCount = getStudentCount(c);
                    const age = calculateAge(c.createdAt);
                    const owner = c.reviewerName || 'Unassigned';

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCaseId(c.id)}
                        className={`hover:bg-slate-50/90 transition-colors cursor-pointer group ${
                          isSelected ? 'bg-blue-50/50 font-medium' : ''
                        }`}
                      >
                        {/* Reason Code */}
                        <td className={padCell}>
                          <StatusBadge type="reason" value={c.caseType} />
                          <div className="font-mono-code text-[11px] text-slate-400 mt-1">
                            {c.id}
                          </div>
                        </td>

                        {/* Severity */}
                        <td className={padCell}>
                          <StatusBadge type="severity" value={c.priority} />
                        </td>

                        {/* Institution */}
                        <td className={padCell}>
                          <div className="font-semibold text-slate-900 truncate max-w-[170px]" title={inst?.name}>
                            {inst?.code}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                            {inst?.name}
                          </div>
                        </td>

                        {/* Student Count */}
                        <td className={`${padCell} text-right font-mono-code tabular-nums font-bold text-slate-900`}>
                          {studentCount}
                        </td>

                        {/* Age */}
                        <td className={`${padCell} font-mono-code text-xs text-slate-500 whitespace-nowrap`}>
                          {age}
                        </td>

                        {/* Owner */}
                        <td className={padCell}>
                          <span className={`text-xs ${owner === 'Unassigned' ? 'text-slate-400 italic' : 'text-slate-900 font-medium'}`}>
                            {owner}
                          </span>
                        </td>

                        {/* Status (New, In review, Resolved, Appealed) */}
                        <td className={padCell}>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              regStatus === 'Resolved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : regStatus === 'In review'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {regStatus}
                          </span>
                        </td>

                        {/* Action */}
                        <td className={`${padCell} text-right`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCaseId(c.id);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Case Dossier Panel */}
        {selectedCase && (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden space-y-4">
            {/* Dossier Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <div className="text-[11px] font-mono-code uppercase font-semibold text-slate-500">
                  FLAG DOSSIER & ADJUDICATION
                </div>
                <div className="font-mono-code text-[17px] font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                  {selectedCase.id}
                  <StatusBadge type="case" value={selectedCase.status} />
                </div>
              </div>
              <button
                onClick={() => setSelectedCaseId(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                title="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5 text-[13px]">
              {/* Plain Language Flag Explanation (REQ 6) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Info size={14} className="text-blue-700 shrink-0" />
                  Plain Language Summary
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-sans-ui">
                  {getPlainLanguageExplanation(selectedCase)}
                </p>
                <div className="pt-2 border-t border-slate-200/60 font-mono-code text-[11px] text-slate-500">
                  Statutory Rule: v2025.2 · Intake formula validated
                </div>
              </div>

              {/* Institution and Student Details */}
              <div className="grid grid-cols-2 gap-3.5 text-xs border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[11px] uppercase text-slate-400 font-semibold block">Institution</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{linkedInstitution?.name}</span>
                  <span className="font-mono-code text-slate-500">{linkedInstitution?.code} · {linkedInstitution?.state}</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase text-slate-400 font-semibold block">Candidate Record</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{linkedAdmission?.studentName}</span>
                  <span className="font-mono-code text-slate-500">{linkedAdmission?.maskedApaar}</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase text-slate-400 font-semibold block">Impacted Seats</span>
                  <span className="font-mono-code text-base font-bold text-slate-900 block mt-0.5">
                    {getStudentCount(selectedCase)} students
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase text-slate-400 font-semibold block">Adjudication Officer</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {selectedCase.reviewerName || 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Action Workflow: Start Review, Return for Correction, Resolve */}
              {selectedCase.status === 'RESOLVED' || selectedCase.status === 'DISMISSED' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 text-[13px]">
                    <CheckCircle2 size={16} />
                    Case Adjudicated ({selectedCase.resolutionOutcome})
                  </div>
                  <div className="text-slate-600">
                    Reviewer: <strong className="text-slate-900">{selectedCase.reviewerName}</strong>
                  </div>
                  <div className="p-3 bg-white border border-emerald-200 rounded-lg text-slate-800 leading-relaxed font-sans-ui mt-1">
                    "{selectedCase.reviewerRationale}"
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* If OPEN, assign to officer */}
                  {selectedCase.status === 'OPEN' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-xs text-slate-900">
                          Case is Currently Unassigned
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Assign to {currentUser.name} ({currentUser.role})
                        </div>
                      </div>
                      <button
                        onClick={handleStartReview}
                        className="px-3.5 py-2 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                      >
                        Start Review
                      </button>
                    </div>
                  )}

                  {/* Return for Correction form toggle */}
                  {!showCorrectionForm ? (
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-500">Need institutional clarification?</span>
                      <button
                        type="button"
                        onClick={() => setShowCorrectionForm(true)}
                        className="text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer"
                      >
                        Return for Institution Correction
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleReturnForCorrection} className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-amber-950 uppercase tracking-wider">
                          Return Directive to Institution
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowCorrectionForm(false)}
                          className="text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={correctionFeedback}
                        onChange={(e) => setCorrectionFeedback(e.target.value)}
                        placeholder="Specify statutory clarification required (min 15 chars)..."
                        className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded-lg focus:outline-none resize-none font-sans-ui"
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                      >
                        Dispatch Clarification Notice
                      </button>
                    </form>
                  )}

                  {/* Adjudication form */}
                  <form onSubmit={handleResolve} className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Record Determination (Human Adjudication)
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                        Determination Outcome
                      </label>
                      <select
                        value={resolutionOutcome}
                        onChange={(e: any) => setResolutionOutcome(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none font-medium"
                      >
                        <option value="ADMISSION_CONFIRMED">ADMISSION_CONFIRMED (Approve Enrolment)</option>
                        <option value="ADMISSION_CANCELLED">ADMISSION_CANCELLED (Revoke Invalid Seat)</option>
                        <option value="INTAKE_CORRECTED">INTAKE_CORRECTED (Reallocate into Next Quota)</option>
                        <option value="EVIDENCE_OVERRIDDEN">EVIDENCE_OVERRIDDEN (Manual Verification Override)</option>
                        <option value="DISMISSED">DISMISSED (No Regulatory Breach Found)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold">
                          Written Reviewer Rationale
                        </label>
                        <span
                          className={`font-mono-code text-[11px] font-semibold ${
                            resolutionRationale.trim().length >= 30 ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {resolutionRationale.trim().length}/30 chars min
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={resolutionRationale}
                        onChange={(e) => setResolutionRationale(e.target.value)}
                        placeholder="Document verified counselling gazette roll sheet or quota reallocation grounds..."
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-lg focus:outline-none resize-none font-sans-ui"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || resolutionRationale.trim().length < 30}
                      className="w-full py-2.5 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer disabled:opacity-40 transition-colors"
                    >
                      {isSubmitting ? 'Recording Adjudication...' : 'Record Determination & Commit to Ledger'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
