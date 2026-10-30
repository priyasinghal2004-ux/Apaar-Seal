/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../store';
import {
  ShieldCheck,
  Layers,
  AlertCircle,
  FileSpreadsheet,
  UserCheck,
  Cpu,
  Settings,
  CheckSquare,
  Shield,
  Building2,
  ChevronRight,
} from 'lucide-react';

export type NavItemKey =
  | 'overview'
  | 'exceptions'
  | 'admissions'
  | 'verify_record'
  | 'student_portal'
  | 'intake_rules'
  | 'audit_ledger'
  | 'test_runner'
  | 'settings';

interface SidebarProps {
  activeNav: NavItemKey;
  onNavigate: (key: NavItemKey) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeNav, onNavigate }) => {
  const { currentUser, reviewCases, admissions } = useStore();

  const openCasesCount = reviewCases.filter(
    (c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW'
  ).length;

  return (
    <aside className="w-[244px] fixed inset-y-0 left-0 bg-[var(--navy)] text-slate-300 flex flex-col z-30 select-none border-r border-[#152B5C] shadow-sm">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-[#1A336B] bg-[#081533]">
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-sm shrink-0">
          <Shield className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[16px] text-white tracking-tight leading-none">
              APAAR SEAL
            </span>
            <span className="text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-medium">
              AICTE
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5 font-sans-ui">
            Seat Assurance Ledger
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 text-[13.5px]">
        {/* WORKSPACE SECTION */}
        <div>
          <div className="px-2 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Workspace
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => onNavigate('overview')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-all cursor-pointer group ${
                activeNav === 'overview'
                  ? 'text-white bg-[#142959] font-medium shadow-sm ring-1 ring-white/10'
                  : 'text-slate-300 hover:text-white hover:bg-[#0E2047]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers
                  size={16}
                  strokeWidth={1.8}
                  className={activeNav === 'overview' ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}
                />
                Regulatory Overview
              </span>
            </button>

            <button
              onClick={() => onNavigate('exceptions')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-all cursor-pointer group ${
                activeNav === 'exceptions'
                  ? 'text-white bg-[#142959] font-medium shadow-sm ring-1 ring-white/10'
                  : 'text-slate-300 hover:text-white hover:bg-[#0E2047]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <AlertCircle
                  size={16}
                  strokeWidth={1.8}
                  className={activeNav === 'exceptions' ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}
                />
                Exception Queue
              </span>
              {openCasesCount > 0 && (
                <span className="font-mono-code text-[11px] px-1.5 py-0.5 bg-red-900/80 text-red-200 border border-red-700/60 rounded font-medium">
                  {openCasesCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* REGISTRIES SECTION */}
        <div>
          <div className="px-2 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Registries & Rules
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => onNavigate('admissions')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-all cursor-pointer group ${
                activeNav === 'admissions'
                  ? 'text-white bg-[#142959] font-medium shadow-sm ring-1 ring-white/10'
                  : 'text-slate-300 hover:text-white hover:bg-[#0E2047]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileSpreadsheet
                  size={16}
                  strokeWidth={1.8}
                  className={activeNav === 'admissions' ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}
                />
                Admissions Register
              </span>
              <span className="font-mono-code text-[11px] text-slate-400">
                {admissions.length}
              </span>
            </button>

            <button
              onClick={() => onNavigate('verify_record')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-all cursor-pointer group ${
                activeNav === 'verify_record'
                  ? 'text-white bg-[#142959] font-medium shadow-sm ring-1 ring-white/10'
                  : 'text-slate-300 hover:text-white hover:bg-[#0E2047]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <UserCheck
                  size={16}
                  strokeWidth={1.8}
                  className={activeNav === 'verify_record' ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}
                />
                Verify a Record
              </span>
              <span className="font-mono-code text-[10px] px-1.5 py-0.2 bg-blue-900/60 text-blue-300 rounded">
                QR
              </span>
            </button>

            <button
              onClick={() => onNavigate('student_portal')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-all cursor-pointer group ${
                activeNav === 'student_portal'
                  ? 'text-white bg-[#142959] font-medium shadow-sm ring-1 ring-white/10'
                  : 'text-slate-300 hover:text-white hover:bg-[#0E2047]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <CheckSquare
                  size={16}
                  strokeWidth={1.8}
                  className={activeNav === 'student_portal' ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}
                />
                Student Portal
              </span>
              {currentUser.role === 'STUDENT' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>

            <button
              onClick={() => onNavigate('intake_rules')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-all cursor-pointer group ${
                activeNav === 'intake_rules'
                  ? 'text-white bg-[#142959] font-medium shadow-sm ring-1 ring-white/10'
                  : 'text-slate-300 hover:text-white hover:bg-[#0E2047]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Cpu
                  size={16}
                  strokeWidth={1.8}
                  className={activeNav === 'intake_rules' ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}
                />
                Rule Versions & Intake
              </span>
            </button>

            <button
              onClick={() => onNavigate('audit_ledger')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-all cursor-pointer group ${
                activeNav === 'audit_ledger'
                  ? 'text-white bg-[#142959] font-medium shadow-sm ring-1 ring-white/10'
                  : 'text-slate-300 hover:text-white hover:bg-[#0E2047]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShieldCheck
                  size={16}
                  strokeWidth={1.8}
                  className={activeNav === 'audit_ledger' ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}
                />
                Audit Trail & Hash Chain
              </span>
            </button>
          </nav>
        </div>

        {/* GOVERNANCE & CONTROL SECTION */}
        <div>
          <div className="px-2 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Governance & Tests
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => onNavigate('test_runner')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-all cursor-pointer group ${
                activeNav === 'test_runner'
                  ? 'text-white bg-[#142959] font-medium shadow-sm ring-1 ring-white/10'
                  : 'text-slate-300 hover:text-white hover:bg-[#0E2047]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <CheckSquare
                  size={16}
                  strokeWidth={1.8}
                  className={activeNav === 'test_runner' ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}
                />
                Assurance Test Suite
              </span>
              <span className="font-mono-code text-[10.5px] px-1.5 py-0.2 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded font-medium">
                7/7
              </span>
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-all cursor-pointer group ${
                activeNav === 'settings'
                  ? 'text-white bg-[#142959] font-medium shadow-sm ring-1 ring-white/10'
                  : 'text-slate-300 hover:text-white hover:bg-[#0E2047]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings
                  size={16}
                  strokeWidth={1.8}
                  className={activeNav === 'settings' ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}
                />
                Settings & Demo Admin
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* User Context & Role Footer */}
      <div className="p-3 border-t border-[#1A336B] bg-[#081533]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10.5px] uppercase font-semibold tracking-wider text-slate-400">
            Session Context
          </span>
          <span className="font-mono-code text-[10.5px] text-amber-300 bg-amber-500/10 border border-amber-400/25 px-1.5 py-0.2 rounded font-medium">
            {currentUser.role.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="text-white font-medium text-[13px] truncate">
          {currentUser.name}
        </div>
        <div className="text-slate-400 truncate text-[11px] mt-0.5">
          {currentUser.designation}
        </div>
      </div>
    </aside>
  );
};
