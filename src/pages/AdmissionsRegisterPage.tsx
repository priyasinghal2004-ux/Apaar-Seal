/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Admission, AdmissionState, Category } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Download,
  Upload,
  Search,
  Filter,
  ArrowUpDown,
  Mail,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Eye,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface AdmissionsRegisterPageProps {
  initialInstitutionId?: string;
  onSelectAdmission?: (admissionId: string) => void;
  onSelectCase?: (caseId: string) => void;
}

export const AdmissionsRegisterPage: React.FC<AdmissionsRegisterPageProps> = ({
  initialInstitutionId,
  onSelectAdmission,
  onSelectCase,
}) => {
  const {
    admissions,
    institutions,
    programmes,
    confirmations,
    evidenceRecords,
    reviewCases,
    reconciliationMap,
    currentUser,
    isBreakGlassActive,
    tableDensity,
    dispatchReminder,
    transitionAdmissionState,
    importAdmissionsCsvData,
  } = useStore();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstitution, setFilterInstitution] = useState<string>(
    initialInstitutionId ||
      (currentUser.role === 'INSTITUTION_ADMIN' && currentUser.institutionId
        ? currentUser.institutionId
        : 'ALL')
  );

  React.useEffect(() => {
    if (initialInstitutionId) {
      setFilterInstitution(initialInstitutionId);
    }
  }, [initialInstitutionId]);

  const [filterState, setFilterState] = useState<string>('ALL');
  const [filterQuota, setFilterQuota] = useState<string>('ALL');
  const [filterSupernumerary, setFilterSupernumerary] = useState<boolean>(false);

  // Sorting
  const [sortField, setSortField] = useState<keyof Admission>('reportedTimestamp');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Selected for Detailed Dossier Inspection
  const [inspectedAdmission, setInspectedAdmission] = useState<Admission | null>(null);

  // CSV Import Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importCsvText, setImportCsvText] = useState<string>('');
  const [importProgId, setImportProgId] = useState<string>('PROG-01');
  const [importInstId, setImportInstId] = useState<string>('INST-01');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Quick State Transition Modal
  const [transitionTargetAdm, setTransitionTargetAdm] = useState<Admission | null>(null);
  const [nextSelectedState, setNextSelectedState] = useState<AdmissionState>('EVIDENCE_VERIFIED');
  const [docRefInput, setDocRefInput] = useState<string>('');

  // Scoping enforcement for Institution Admin
  const availableAdmissions = useMemo(() => {
    if (currentUser.role === 'INSTITUTION_ADMIN' && currentUser.institutionId) {
      return admissions.filter((a) => a.institutionId === currentUser.institutionId);
    }
    return admissions;
  }, [admissions, currentUser]);

  // Filtering
  const filteredAdmissions = useMemo(() => {
    return availableAdmissions.filter((adm) => {
      if (filterInstitution !== 'ALL' && adm.institutionId !== filterInstitution) return false;
      if (filterState !== 'ALL' && adm.currentState !== filterState) return false;
      if (filterQuota !== 'ALL' && adm.quotaCategory !== filterQuota) return false;
      if (filterSupernumerary && !adm.isSupernumerary) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = adm.studentName.toLowerCase().includes(q);
        const matchId = adm.id.toLowerCase().includes(q);
        const matchApaar = adm.maskedApaar.toLowerCase().includes(q);
        const matchRoll = adm.counsellingRollNo?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchApaar && !matchRoll) return false;
      }
      return true;
    });
  }, [availableAdmissions, filterInstitution, filterState, filterQuota, filterSupernumerary, searchQuery]);

  // Sorting
  const sortedAdmissions = useMemo(() => {
    return [...filteredAdmissions].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredAdmissions, sortField, sortAsc]);

  // Pagination calculation
  const totalItems = sortedAdmissions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedAdmissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAdmissions.slice(start, start + pageSize);
  }, [sortedAdmissions, currentPage, pageSize]);

  const toggleSort = (field: keyof Admission) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Admission ID',
      'Student Name',
      'Masked APAAR',
      'Institution Code',
      'Programme Code',
      'Quota Category',
      'Is Supernumerary',
      'Supernumerary Type',
      'Admission Date',
      'Current State',
      'Counselling Roll No',
      'Statutory Reconciliation Status',
    ];

    const rows = sortedAdmissions.map((adm) => {
      const inst = institutions.find((i) => i.id === adm.institutionId);
      const prog = programmes.find((p) => p.id === adm.programmeId);
      const res = reconciliationMap.get(adm.id);
      return [
        adm.id,
        `"${adm.studentName}"`,
        adm.maskedApaar,
        inst?.code || adm.institutionId,
        prog?.code || adm.programmeId,
        adm.quotaCategory,
        adm.isSupernumerary ? 'YES' : 'NO',
        adm.supernumeraryType || 'NONE',
        adm.admissionDate,
        adm.currentState,
        adm.counsellingRollNo || '',
        res?.status || 'UNPROCESSED',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SEAL_ADMISSIONS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV Import
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCsvText.trim()) return;

    setIsImporting(true);
    const res = await importAdmissionsCsvData(importCsvText, importInstId, importProgId);
    setIsImporting(false);

    if (res.success) {
      setShowImportModal(false);
      setImportCsvText('');
    }
  };

  const handleExecuteTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitionTargetAdm) return;

    const ok = transitionAdmissionState(transitionTargetAdm.id, nextSelectedState, docRefInput);
    if (ok) {
      setTransitionTargetAdm(null);
      setDocRefInput('');
    }
  };

  const padCell = tableDensity === 'compact' ? 'py-2.5 px-3.5' : 'py-3.5 px-4';

  const sampleCsvContent = `Student Name, APAAR ID, DOB, Quota Category, Is Supernumerary, Counselling Roll No, Admission Date
Harsh Vardhan Singh, 882194820194, 2004-04-12, OPEN, false, CCN-MP-2025-9011, 2025-07-28
Pooja Kulkarni, 882194820195, 2004-09-18, TFWS, true, CCN-MP-2025-9012, 2025-07-28
Sameer Akhtar, 882194820196, 2004-11-22, OBC_NCL, false, CCN-MP-2025-9013, 2025-07-28`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono-code font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              NATIONAL ENROLMENT MASTER
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Statutory Session 2025-26</span>
          </div>
          <h1 className="font-serif-title text-[28px] font-semibold text-slate-900 tracking-tight leading-tight">
            Admissions Register & Enrolment Master
          </h1>
          <p className="text-[14px] text-slate-600 mt-1 max-w-3xl">
            Individual student admissions reported by institutions, quota classifications, supernumerary designations, and APAAR reconciliation states.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            <Download size={15} /> Export CSV
          </button>
          {currentUser.role !== 'AUDITOR' && currentUser.role !== 'STUDENT' && (
            <button
              onClick={() => {
                setImportCsvText(sampleCsvContent);
                setShowImportModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer"
            >
              <Upload size={15} /> Upload CSV Batch
            </button>
          )}
        </div>
      </div>

      {/* Scoping alert for Institution Admin */}
      {currentUser.role === 'INSTITUTION_ADMIN' && (
        <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-lg text-[13px] text-blue-900 flex items-center justify-between shadow-2xs">
          <span>Institution Scoped Session: Showing exclusively admissions for Vindhya Institute of Technology (VITM-MP).</span>
          <span className="font-mono-code text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
            VITM-MP · RBAC Active
          </span>
        </div>
      )}

      {/* Search and Filters Strip */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-card flex flex-wrap items-center gap-3.5 text-[13px]">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by student name, ID, roll no, or masked APAAR..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Institution filter */}
        {currentUser.role !== 'INSTITUTION_ADMIN' && (
          <select
            value={filterInstitution}
            onChange={(e) => {
              setFilterInstitution(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 px-3 py-1.5 rounded-md focus:outline-none"
          >
            <option value="ALL">All Institutions ({institutions.length})</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} - {i.name.slice(0, 24)}...
              </option>
            ))}
          </select>
        )}

        {/* State filter */}
        <select
          value={filterState}
          onChange={(e) => {
            setFilterState(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-50 border border-slate-200 text-xs text-slate-700 px-3 py-1.5 rounded-md focus:outline-none"
        >
          <option value="ALL">All States</option>
          <option value="REPORTED">REPORTED</option>
          <option value="STUDENT_CONFIRMED">STUDENT_CONFIRMED</option>
          <option value="EVIDENCE_VERIFIED">EVIDENCE_VERIFIED</option>
          <option value="PENDING">PENDING</option>
          <option value="DISPUTED">DISPUTED</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="GRADUATED">GRADUATED</option>
          <option value="MIGRATED">MIGRATED</option>
        </select>

        {/* Quota filter */}
        <select
          value={filterQuota}
          onChange={(e) => {
            setFilterQuota(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-50 border border-slate-200 text-xs text-slate-700 px-3 py-1.5 rounded-md focus:outline-none"
        >
          <option value="ALL">All Quota Categories</option>
          <option value="OPEN">OPEN</option>
          <option value="EWS">EWS</option>
          <option value="OBC_NCL">OBC-NCL</option>
          <option value="SC">SC</option>
          <option value="ST">ST</option>
          <option value="TFWS">TFWS (Supernumerary)</option>
        </select>

        {/* Supernumerary checkbox */}
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none px-2 py-1 bg-slate-50 rounded border border-slate-200">
          <input
            type="checkbox"
            checked={filterSupernumerary}
            onChange={(e) => {
              setFilterSupernumerary(e.target.checked);
              setCurrentPage(1);
            }}
            className="rounded text-blue-600"
          />
          Supernumerary Only
        </label>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px] border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th
                  onClick={() => toggleSort('id')}
                  className={`${padCell} cursor-pointer hover:text-slate-900 select-none`}
                >
                  <span className="flex items-center gap-1">
                    Admission ID <ArrowUpDown size={11} />
                  </span>
                </th>
                <th
                  onClick={() => toggleSort('studentName')}
                  className={`${padCell} cursor-pointer hover:text-slate-900 select-none`}
                >
                  <span className="flex items-center gap-1">
                    Candidate & Masked APAAR <ArrowUpDown size={11} />
                  </span>
                </th>
                <th className={padCell}>Institution</th>
                <th className={padCell}>Quota / Type</th>
                <th className={padCell}>Counselling Roll</th>
                <th
                  onClick={() => toggleSort('admissionDate')}
                  className={`${padCell} cursor-pointer hover:text-slate-900 select-none`}
                >
                  <span className="flex items-center gap-1">
                    Date <ArrowUpDown size={11} />
                  </span>
                </th>
                <th className={padCell}>Status</th>
                <th className={padCell}>Assurance Flag</th>
                <th className={`${padCell} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAdmissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[13.5px] text-slate-500">
                    No admission records match current filters.
                  </td>
                </tr>
              ) : (
                paginatedAdmissions.map((adm) => {
                  const inst = institutions.find((i) => i.id === adm.institutionId);
                  const res = reconciliationMap.get(adm.id);
                  const conf = confirmations.find((c) => c.admissionId === adm.id);
                  const isPendingOverdue = conf?.status === 'PENDING' && (conf?.daysPending || 0) > 30;

                  return (
                    <tr
                      key={adm.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        setInspectedAdmission(adm);
                        if (onSelectAdmission) onSelectAdmission(adm.id);
                      }}
                    >
                      {/* ID */}
                      <td className={padCell}>
                        <span className="font-mono-code text-[12.5px] font-bold text-slate-900">
                          {adm.id}
                        </span>
                      </td>

                      {/* Name & APAAR */}
                      <td className={padCell}>
                        <div className="font-semibold text-slate-900">{adm.studentName}</div>
                        <div className="font-mono-code text-[11.5px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>{isBreakGlassActive ? adm.apaarRaw : adm.maskedApaar}</span>
                          {isBreakGlassActive && (
                            <span className="text-[10px] px-1 bg-amber-100 text-amber-800 rounded font-semibold">
                              UNMASKED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Institution */}
                      <td className={padCell}>
                        <div className="text-slate-700 text-[13px] truncate max-w-[140px]" title={inst?.name}>
                          {inst?.code}
                        </div>
                      </td>

                      {/* Quota */}
                      <td className={padCell}>
                        <div className="font-mono-code text-[12.5px] text-slate-900 font-medium">
                          {adm.quotaCategory}
                        </div>
                        {adm.isSupernumerary && (
                          <span className="text-[10.5px] text-amber-700 font-semibold block">
                            {adm.supernumeraryType || 'TFWS'} (Supernumerary)
                          </span>
                        )}
                      </td>

                      {/* Counselling Roll */}
                      <td className={padCell}>
                        <span className="font-mono-code text-[12px] text-slate-600">
                          {adm.counsellingRollNo || '—'}
                        </span>
                      </td>

                      {/* Admission Date */}
                      <td className={padCell}>
                        <span className="font-mono-code text-[12px] text-slate-600 whitespace-nowrap">
                          {adm.admissionDate}
                        </span>
                      </td>

                      {/* Status */}
                      <td className={padCell}>
                        <StatusBadge type="state" value={adm.currentState} />
                      </td>

                      {/* Assurance Flag / Reason */}
                      <td className={padCell}>
                        {res && res.reasonCodes.length > 0 && res.reasonCodes[0] !== 'RECORD_OK' ? (
                          <StatusBadge type="reason" value={res.reasonCodes[0]} />
                        ) : (
                          <span className="text-xs font-mono-code text-emerald-700 font-medium">OK</span>
                        )}
                        {res?.isExcessSeat && (
                          <span className="block text-[11px] font-mono-code text-red-700 font-bold mt-0.5">
                            EXCESS SEAT
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className={`${padCell} text-right space-x-1.5 whitespace-nowrap`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedAdmission(adm);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-medium text-slate-800 rounded cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                          title="Open candidate admission verification dossier"
                        >
                          <Eye size={13} />
                          Inspect
                        </button>

                        {conf?.status === 'PENDING' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatchReminder(adm.id);
                            }}
                            className={`px-2.5 py-1 border text-xs rounded cursor-pointer inline-flex items-center gap-1.5 transition-colors ${
                              isPendingOverdue
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                            title={`Student confirmation pending for ${conf.daysPending} days`}
                          >
                            <Mail size={13} />
                            Reminder
                          </button>
                        )}

                        {currentUser.role !== 'AUDITOR' && currentUser.role !== 'STUDENT' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransitionTargetAdm(adm);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded cursor-pointer transition-colors"
                          >
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-slate-200 px-5 py-3.5 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="font-mono-code text-[11.5px]">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} admissions
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 px-2 py-1 rounded text-xs font-mono-code focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1.5 border border-slate-200 rounded disabled:opacity-30 cursor-pointer bg-white hover:bg-slate-50"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="font-mono-code text-xs px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 border border-slate-200 rounded disabled:opacity-30 cursor-pointer bg-white hover:bg-slate-50"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-lg shadow-elevated overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Transactional Admission Reporting
                </div>
                <h3 className="font-serif-title text-[20px] text-slate-900 font-semibold mt-0.5">
                  Upload CSV Admissions Batch
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    Target Institution
                  </label>
                  <select
                    value={importInstId}
                    onChange={(e) => setImportInstId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded focus:outline-none"
                  >
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.code} ({i.name.slice(0, 22)}...)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    Target Programme
                  </label>
                  <select
                    value={importProgId}
                    onChange={(e) => setImportProgId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded focus:outline-none"
                  >
                    {programmes
                      .filter((p) => p.institutionId === importInstId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Admissions CSV Payload
                  </label>
                  <span className="text-[11px] font-mono-code text-slate-400">
                    Name, APAAR (12 digits), DOB, Quota, Supernumerary, RollNo, Date
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  placeholder="Paste CSV rows here..."
                  className="w-full font-mono-code text-xs bg-slate-50 border border-slate-200 p-3 rounded focus:outline-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-900">Simulated Atomic Mutex Guarantee:</div>
                <div className="leading-relaxed">
                  Batch undergoes transactional validate-then-commit under an exclusive institution mutex queue. Excess seats exceeding approved quota are automatically recorded into the regulatory exception queue.
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-5 py-2 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white text-xs font-semibold rounded shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? 'Validating Mutex Queue...' : 'Commit Batch to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* State Transition Drawer / Modal */}
      {transitionTargetAdm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-elevated overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Regulatory State Machine
                </div>
                <h4 className="font-serif-title text-[18px] text-slate-900 font-semibold mt-0.5">
                  Update Enrolment State ({transitionTargetAdm.id})
                </h4>
              </div>
              <button
                onClick={() => setTransitionTargetAdm(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExecuteTransition} className="p-5 space-y-3.5 text-[13px]">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                <div>Candidate: <span className="font-bold text-slate-900">{transitionTargetAdm.studentName}</span></div>
                <div>Current State: <span className="font-mono-code font-bold text-blue-700">{transitionTargetAdm.currentState}</span></div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                  Target Next State
                </label>
                <select
                  value={nextSelectedState}
                  onChange={(e: any) => setNextSelectedState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded focus:outline-none font-medium"
                >
                  <option value="STUDENT_CONFIRMED">STUDENT_CONFIRMED</option>
                  <option value="EVIDENCE_VERIFIED">EVIDENCE_VERIFIED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="VACATED">VACATED (Requires Supporting Ref)</option>
                  <option value="MIGRATED">MIGRATED (Requires Supporting Ref)</option>
                  <option value="GRADUATED">GRADUATED (Requires Gazette Ref)</option>
                  <option value="REJECTED">REJECTED (Requires Supporting Ref)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                  Statutory Order / Gazette Reference
                </label>
                <input
                  type="text"
                  value={docRefInput}
                  onChange={(e) => setDocRefInput(e.target.value)}
                  placeholder="e.g. AICTE/NOTIF/2025/MIG-0182 or Convocation Roll"
                  className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded focus:outline-none font-mono-code"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Mandatory for VACATED, MIGRATED, GRADUATED, or REJECTED states.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTransitionTargetAdm(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white text-xs font-semibold rounded shadow-sm cursor-pointer"
                >
                  Commit State Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Admission Verification Dossier Modal */}
      {inspectedAdmission && (() => {
        const inst = institutions.find((i) => i.id === inspectedAdmission.institutionId);
        const prog = programmes.find((p) => p.id === inspectedAdmission.programmeId);
        const res = reconciliationMap.get(inspectedAdmission.id);
        const conf = confirmations.find((c) => c.admissionId === inspectedAdmission.id);
        const evid = evidenceRecords.find((e) => e.admissionId === inspectedAdmission.id);
        const linkedCase = reviewCases.find((c) => c.admissionId === inspectedAdmission.id);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
            <div className="w-full max-w-3xl max-h-[92vh] bg-white border border-slate-200 rounded-lg shadow-elevated flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Statutory Enrolment Assurance Dossier
                    </span>
                    <span className="font-mono-code text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">
                      {inspectedAdmission.id}
                    </span>
                  </div>
                  <h3 className="font-serif-title text-[24px] text-slate-900 font-bold mt-0.5">
                    {inspectedAdmission.studentName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <StatusBadge type="state" value={inspectedAdmission.currentState} />
                    <span className="font-mono-code text-xs px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 font-medium">
                      APAAR: {isBreakGlassActive ? inspectedAdmission.apaarRaw : inspectedAdmission.maskedApaar}
                      {isBreakGlassActive && ' (Unmasked)'}
                    </span>
                    <span className="font-mono-code text-xs px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 font-medium">
                      Quota: {inspectedAdmission.quotaCategory}
                      {inspectedAdmission.isSupernumerary && ` (${inspectedAdmission.supernumeraryType || 'TFWS'})`}
                    </span>
                    {res?.isExcessSeat && (
                      <span className="font-mono-code text-xs px-2.5 py-1 bg-red-100 border border-red-300 text-red-800 font-bold rounded">
                        EXCESS ADMISSION
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setInspectedAdmission(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  title="Close dossier"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-[13px]">
                {/* Privacy Safeguard Strip */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-950 flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-emerald-900">APAAR Statutory Verification Guarantee: </span>
                    APAAR is utilized strictly as an educational identifier. Demographic data and school credentials are unlinked from commercial profiling under Section 43A IT Act protocols.
                  </div>
                </div>

                {/* Candidate & Programme Allocation */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-2xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Institutional Allocation Profile
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[11px] uppercase font-semibold text-slate-400 block">Institution</span>
                      <span className="text-slate-900 font-bold block mt-0.5">{inst?.name}</span>
                      <span className="font-mono-code text-xs text-slate-500">{inst?.code} · {inst?.state}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase font-semibold text-slate-400 block">Programme</span>
                      <span className="text-slate-900 font-bold block mt-0.5">{prog?.name}</span>
                      <span className="font-mono-code text-xs text-slate-500">{prog?.code} · UG Engineering</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase font-semibold text-slate-400 block">Counselling Roll & Rank</span>
                      <span className="font-mono-code text-sm font-bold text-slate-900 block mt-0.5">
                        {inspectedAdmission.counsellingRollNo || '—'}
                      </span>
                      <span className="text-xs text-slate-500">Admission Date: {inspectedAdmission.admissionDate}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Lifecycle Timeline */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3.5 shadow-2xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Multi-Source Assurance & Verification Timeline
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Stage 1: Reported */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <CheckCircle2 size={15} className="text-emerald-700" />
                        1. Institution Upload
                      </div>
                      <div className="text-xs text-slate-600">
                        Reported on <span className="font-mono-code font-semibold">{inspectedAdmission.admissionDate}</span> via atomic institution batch.
                      </div>
                    </div>

                    {/* Stage 2: Student Confirmation */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          {conf?.status === 'CONFIRMED' ? (
                            <CheckCircle2 size={15} className="text-blue-700" />
                          ) : conf?.status === 'DISPUTED' ? (
                            <AlertTriangle size={15} className="text-red-700" />
                          ) : (
                            <Clock size={15} className="text-amber-700" />
                          )}
                          2. Candidate Response
                        </div>
                        <StatusBadge type="state" value={conf?.status || 'PENDING'} />
                      </div>
                      <div className="text-xs text-slate-600">
                        {conf?.status === 'CONFIRMED'
                          ? `Confirmed by student via DigiLocker OTP on ${conf.confirmedAt?.slice(0, 10)}.`
                          : conf?.status === 'DISPUTED'
                          ? `Candidate disputed seat: "${conf.disputeReason}".`
                          : `Awaiting student login response (${conf?.daysPending || 0} days pending).`}
                      </div>
                    </div>

                    {/* Stage 3: Independent Evidence */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <ShieldCheck size={15} className="text-emerald-700" />
                          3. Independent Registry
                        </div>
                        <span className="font-mono-code text-[11px] px-1.5 py-0.2 bg-white border border-slate-200 rounded font-medium">
                          {evid?.status || (inspectedAdmission.currentState === 'EVIDENCE_VERIFIED' ? 'VERIFIED' : 'UNAVAILABLE')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Source: {evid?.sourceSystemName || 'State CET Central Board API'}. Ref: <span className="font-mono-code font-semibold">{evid?.reference || 'STATE-ALLOT-2025'}</span>.
                      </div>
                    </div>
                  </div>

                  {/* Non-Wrongdoing Statutory Notice */}
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-950">
                    <span className="font-bold text-amber-900">Statutory Review Presumption: </span>
                    Candidate non-response or unavailable third-party evidence remains in an uncertain/pending state and does <span className="font-bold text-amber-950">NOT</span> automatically constitute proof of institutional wrongdoing or irregular admission.
                  </div>
                </div>

                {/* Policy Provenance & Intake Calculation Formula */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Regulatory Intake Rule Provenance
                    </div>
                    <span className="font-mono-code text-xs px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-800 font-bold">
                      Rule Applied: {res?.ruleVersionApplied || 'v2025.2'} (Eff: {res?.ruleEffectiveDate || '2025-07-01'})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                      <div className="text-[11px] uppercase font-semibold text-slate-500">Base Quota</div>
                      <div className="font-mono-code text-[17px] font-bold text-slate-900 mt-0.5">
                        {res?.intakeDetails?.baseLimit ?? 100}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                      <div className="text-[11px] uppercase font-semibold text-slate-500">TFWS Exempt</div>
                      <div className="font-mono-code text-[17px] font-bold text-blue-700 mt-0.5">
                        {res?.intakeDetails?.supernumeraryQuota ?? 6}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                      <div className="text-[11px] uppercase font-semibold text-slate-500">Reported Intake</div>
                      <div className="font-mono-code text-[17px] font-bold text-slate-900 mt-0.5">
                        {res?.intakeDetails?.reportedCount ?? 120}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                      <div className="text-[11px] uppercase font-semibold text-slate-500">Excess Identified</div>
                      <div className={`font-mono-code text-[17px] font-bold mt-0.5 ${res?.isExcessSeat ? 'text-red-700' : 'text-emerald-700'}`}>
                        {res?.intakeDetails?.excessSeats ?? (res?.isExcessSeat ? 14 : 0)}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono-code text-xs space-y-1">
                    <div className="text-slate-500 uppercase text-[10.5px] font-sans-ui font-bold">
                      Deterministic Intake Formula
                    </div>
                    <div className="text-slate-900 font-semibold">
                      {res?.intakeDetails?.calculationFormula ||
                        (res?.isExcessSeat
                          ? 'Reported (120) - Supernumerary TFWS (6) = 114; Excess = max(0, 114 - 100) = 14'
                          : 'Counted intake within approved capacity')}
                    </div>
                    <div className="text-xs text-slate-500 font-sans-ui">
                      Reason Code: <span className="font-mono-code font-bold text-slate-900">{res?.reasonCodes?.join(', ') || 'RECORD_OK'}</span>
                    </div>
                  </div>
                </div>

                {/* Linked Regulatory Exception Case */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-2xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Linked Regulatory Review Case
                  </div>
                  {linkedCase ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code text-[13px] font-bold text-slate-900">
                            {linkedCase.id}
                          </span>
                          <StatusBadge type="state" value={linkedCase.status} />
                          <StatusBadge type="severity" value={linkedCase.priority} />
                        </div>
                        <div className="text-xs text-slate-700 mt-1">
                          {linkedCase.calculationSummary || linkedCase.caseType}
                        </div>
                        <div className="text-[11px] font-mono-code text-slate-500 mt-0.5">
                          Assigned: {linkedCase.reviewerName || 'AICTE Regional Reviewer'}
                        </div>
                      </div>
                      {onSelectCase && (
                        <button
                          onClick={() => {
                            setInspectedAdmission(null);
                            onSelectCase(linkedCase.id);
                          }}
                          className="flex items-center gap-2 px-3.5 py-2 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer whitespace-nowrap"
                        >
                          <ExternalLink size={13} />
                          Open Case in Exception Queue
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs">
                      <CheckCircle2 size={16} />
                      <span>No regulatory exception cases or intake violations logged against this candidate admission.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                <div className="font-mono-code text-xs text-slate-500">
                  Session: 2025-26 · Mutex: Confirmed
                </div>
                <div className="flex items-center gap-2.5">
                  {conf?.status === 'PENDING' && (
                    <button
                      onClick={() => dispatchReminder(inspectedAdmission.id)}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-md cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Mail size={14} />
                      Send Reminder
                    </button>
                  )}
                  {currentUser.role !== 'AUDITOR' && currentUser.role !== 'STUDENT' && (
                    <button
                      onClick={() => {
                        setTransitionTargetAdm(inspectedAdmission);
                      }}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-md cursor-pointer shadow-2xs"
                    >
                      Update State
                    </button>
                  )}
                  <button
                    onClick={() => setInspectedAdmission(null)}
                    className="px-4 py-2 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white text-xs font-semibold rounded-md shadow-sm cursor-pointer"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
