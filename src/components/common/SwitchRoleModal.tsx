/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../store';
import { DEMO_USERS } from '../../services/seedData';
import { Role } from '../../types';
import { X, Check, Shield, User, School, FileSearch } from 'lucide-react';

interface SwitchRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwitchRoleModal: React.FC<SwitchRoleModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUserRole } = useStore();

  if (!isOpen) return null;

  const rolesList: {
    role: Role;
    label: string;
    user: typeof DEMO_USERS.AICTE_REGULATOR;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      role: 'AICTE_REGULATOR',
      label: 'AICTE Regulator',
      user: DEMO_USERS.AICTE_REGULATOR,
      desc: 'Systemic oversight across all 6 institutions, exception queue management, and statutory case adjudication authority.',
      icon: <Shield size={18} className="text-[#0A193B]" />,
    },
    {
      role: 'INSTITUTION_ADMIN',
      label: 'Institution Admin',
      user: DEMO_USERS.INSTITUTION_ADMIN,
      desc: 'Scoped strictly to Vindhya Institute of Technology and Management (VITM-MP). Reports admissions and reviews intake quotas.',
      icon: <School size={18} className="text-blue-700" />,
    },
    {
      role: 'STUDENT',
      label: 'Candidate / Student',
      user: DEMO_USERS.STUDENT,
      desc: 'Candidate Ananya Verma. Direct verification of personal enrolment, confirms seat acceptance, or lodges admission contestations.',
      icon: <User size={18} className="text-amber-700" />,
    },
    {
      role: 'AUDITOR',
      label: '(Read-Only) Auditor',
      user: DEMO_USERS.AUDITOR,
      desc: 'Comptroller & Auditor General empanelled. Independent oversight, cryptographic hash chain verification, no write or resolution rights.',
      icon: <FileSearch size={18} className="text-purple-700" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              All India Council for Technical Education
            </div>
            <h3 className="font-serif-title text-[20px] font-semibold text-slate-900 mt-0.5">
              Switch Demo Session Account
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/50 cursor-pointer transition-colors"
            aria-label="Close switch account modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Account options */}
        <div className="p-6 space-y-4">
          <p className="text-[13px] text-slate-600 leading-relaxed">
            Select an institutional profile to evaluate role-based access control, scope enforcement, and audit ledger logging across diverse stakeholder viewpoints.
          </p>

          <div className="space-y-2.5">
            {rolesList.map((item) => {
              const isSelected = currentUser.role === item.role;
              return (
                <div
                  key={item.role}
                  onClick={() => {
                    setCurrentUserRole(item.role);
                    onClose();
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#0A193B] bg-slate-50/80 ring-2 ring-[#0A193B]/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[14px] text-slate-900">
                            {item.user.name}
                          </span>
                          <span className="text-[11px] font-mono-code font-medium px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded">
                            {item.label}
                          </span>
                        </div>
                        <div className="text-[12px] text-slate-500 font-medium">
                          {item.user.designation}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0A193B] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <Check size={14} strokeWidth={2.5} /> Active
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-slate-500 leading-relaxed pl-12">
                    {item.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-[12px] text-slate-500">
          <span>Demonstration environment: client-side session emulation</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[12.5px] font-medium rounded-md shadow-2xs transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
