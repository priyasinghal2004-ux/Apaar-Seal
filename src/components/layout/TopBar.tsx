/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../store';
import { Search, SlidersHorizontal, ChevronRight, ChevronDown, Shield } from 'lucide-react';
import { NavItemKey } from './Sidebar';

interface TopBarProps {
  activeNav: NavItemKey;
  activeCaseId?: string | null;
  onOpenSearch: () => void;
  onOpenSwitchRole: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeNav,
  activeCaseId,
  onOpenSearch,
  onOpenSwitchRole,
}) => {
  const { currentUser, academicYear, setAcademicYear, tableDensity, setTableDensity } = useStore();

  const getBreadcrumb = () => {
    const rolePrefix =
      currentUser.role === 'AICTE_REGULATOR'
        ? 'AICTE Regulatory Bureau'
        : currentUser.role === 'INSTITUTION_ADMIN'
        ? 'Institution Portal'
        : currentUser.role === 'STUDENT'
        ? 'Student Verification Portal'
        : 'Statutory Audit Wing';

    let pageName = 'Regulatory Overview';
    if (activeNav === 'exceptions') pageName = 'Exception Queue';
    if (activeNav === 'admissions') pageName = 'Admissions Register';
    if (activeNav === 'verify_record') pageName = 'Verify Enrolment Record';
    if (activeNav === 'student_portal') pageName = 'Candidate Verification';
    if (activeNav === 'intake_rules') pageName = 'Intake Approvals & Rules';
    if (activeNav === 'audit_ledger') pageName = 'Audit Ledger & Hash Chain';
    if (activeNav === 'test_runner') pageName = 'Assurance Test Suite';
    if (activeNav === 'settings') pageName = 'Settings & Demo Admin';

    if (activeCaseId && activeNav === 'exceptions') {
      return (
        <div className="flex items-center gap-2 text-[13px] text-slate-500 truncate">
          <span className="font-medium text-slate-700">{rolePrefix}</span>
          <ChevronRight size={13} className="text-slate-400 shrink-0" />
          <span className="hover:text-slate-900 cursor-pointer">{pageName}</span>
          <ChevronRight size={13} className="text-slate-400 shrink-0" />
          <span className="font-mono-code font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {activeCaseId}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-[13px] text-slate-500 truncate">
        <span className="font-medium text-slate-600">{rolePrefix}</span>
        <ChevronRight size={13} className="text-slate-400 shrink-0" />
        <span className="font-semibold text-slate-900">{pageName}</span>
      </div>
    );
  };

  return (
    <header className="h-14 pl-[260px] pr-6 bg-white border-b border-slate-200 shadow-sm fixed top-0 left-0 right-0 z-20 flex items-center justify-between select-none">
      {/* Left Breadcrumb */}
      <div className="flex items-center min-w-0 mr-4">
        {getBreadcrumb()}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[13px] text-slate-600 cursor-pointer shadow-2xs hover:border-slate-300"
          title="Search admissions, cases, or institutions (Cmd/Ctrl + K)"
        >
          <Search size={14} className="text-slate-400" />
          <span className="hidden sm:inline font-sans-ui">Search ledger...</span>
          <kbd className="hidden md:inline-block font-mono-code text-[11px] text-slate-500 px-1.5 py-0.2 bg-white border border-slate-200 rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Academic Year Selector */}
        <div className="flex items-center gap-1.5 text-[13px] text-slate-600 border-l border-slate-200 pl-3">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold hidden md:inline">
            Session:
          </span>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[13px] text-slate-800 font-mono-code px-2.5 py-1 rounded-md cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26 (Active)</option>
            <option value="2026-27">2026-27</option>
          </select>
        </div>

        {/* Density Toggle */}
        <button
          onClick={() => setTableDensity(tableDensity === 'compact' ? 'comfortable' : 'compact')}
          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer shadow-2xs"
          title={`Table density: ${tableDensity} (click to toggle)`}
        >
          <SlidersHorizontal size={15} />
        </button>

        {/* User Account / Role Switcher Trigger */}
        <div className="border-l border-slate-200 pl-3 flex items-center">
          <button
            onClick={onOpenSwitchRole}
            className="flex items-center gap-2.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-left cursor-pointer group shadow-2xs hover:border-slate-300"
          >
            <div className="w-6 h-6 rounded bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center font-semibold text-[11px] shadow-2xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <div className="text-[13px] font-medium text-slate-900 truncate max-w-[130px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] font-mono-code text-slate-500 uppercase">
                {currentUser.role.replace(/_/g, ' ')}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-700 ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
