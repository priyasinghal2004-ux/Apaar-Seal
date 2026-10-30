/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../store';
import { ShieldCheck } from 'lucide-react';

export const AppFooter: React.FC = () => {
  const { ruleVersions } = useStore();
  const currentRule = ruleVersions[ruleVersions.length - 1];

  return (
    <footer className="mt-auto border-t border-slate-200 py-3.5 px-8 bg-white text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-700">APAAR SEAL</span>
        <span className="text-slate-300">•</span>
        <span>Seat Enrolment Assurance Ledger</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500">
          Statutory regulatory prototype with synthetic benchmark data & simulated verification bridges
        </span>
      </div>
      <div className="flex items-center gap-3 font-mono-code text-[11.5px] text-slate-500">
        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
          <ShieldCheck size={13} className="text-emerald-700" />
          Active Policy: {currentRule?.id || 'v2025.2'}
        </span>
        <span className="text-slate-300">|</span>
        <span>Build 2025.04-rc1</span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-600 font-medium">AICTE Technical Cadre</span>
      </div>
    </footer>
  );
};
