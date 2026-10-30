/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface LedgerMetric {
  label: string;
  count: number;
  subtext: string;
  isAttention?: boolean;
}

interface LedgerStripProps {
  metrics: LedgerMetric[];
  className?: string;
}

export const LedgerStrip: React.FC<LedgerStripProps> = ({ metrics, className = '' }) => {
  const formatIndian = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div
      className={`w-full bg-[var(--surface)] border border-[var(--line)] rounded-[4px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-[var(--line)] ${className}`}
    >
      {metrics.map((m, idx) => (
        <div key={idx} className="p-3.5 flex flex-col justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-3)] mb-1">
            {m.label}
          </div>
          <div
            className={`font-mono-code text-[22px] font-medium leading-none tabular-nums my-1 ${
              m.isAttention ? 'text-[var(--saffron)]' : 'text-[var(--ink)]'
            }`}
          >
            {formatIndian(m.count)}
          </div>
          <div className="text-[11px] text-[var(--ink-2)] truncate mt-1">
            {m.subtext}
          </div>
        </div>
      ))}
    </div>
  );
};
