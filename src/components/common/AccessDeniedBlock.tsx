/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../store';
import { ShieldAlert } from 'lucide-react';

interface AccessDeniedBlockProps {
  resourceTitle?: string;
  requiredRole?: string;
  onSwitchRole?: () => void;
}

export const AccessDeniedBlock: React.FC<AccessDeniedBlockProps> = ({
  resourceTitle = 'this regulatory record',
  requiredRole,
  onSwitchRole,
}) => {
  const { currentUser } = useStore();

  return (
    <div className="p-8 max-w-xl mx-auto my-12 bg-[var(--surface)] border border-[var(--line)] rounded-[2px] text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 mb-3 bg-[#F6E1E1] text-[#A3262A] rounded-[2px]">
        <ShieldAlert size={20} strokeWidth={1.5} />
      </div>
      <h2 className="font-serif-title text-[18px] text-[var(--ink)] mb-2">
        You do not have access to this record
      </h2>
      <p className="text-[13px] text-[var(--ink-2)] mb-4">
        Your current session profile ({currentUser.name}, {currentUser.role}) is not authorised to view or modify {resourceTitle}.
        {requiredRole && ` This operation requires '${requiredRole}' credentials.`}
      </p>
      <div className="p-3 bg-[var(--paper)] border border-[var(--line)] text-[11px] font-mono-code text-[var(--ink-3)] text-left mb-6">
        <div>[STATUTORY AUDIT NOTICE]</div>
        <div>An ACCESS_DENIED event was automatically recorded to the tamper-evident audit ledger.</div>
        <div className="mt-1">Actor: {currentUser.name} | Role: {currentUser.role}</div>
      </div>
      {onSwitchRole && (
        <button
          onClick={onSwitchRole}
          className="px-3 py-1.5 bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)] text-[12px] font-medium rounded-[2px] cursor-pointer"
        >
          Switch Demo Account
        </button>
      )}
    </div>
  );
};
