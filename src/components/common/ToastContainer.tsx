/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../store';
import { X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
      {toasts.map((toast) => {
        let border = 'border-[var(--line-strong)]';
        let bg = 'bg-[var(--ink)] text-[var(--paper)]';

        if (toast.type === 'ERROR') {
          bg = 'bg-[#8A1F1D] text-[#FFF]';
          border = 'border-[#5C1413]';
        } else if (toast.type === 'WARNING') {
          bg = 'bg-[#7A4B00] text-[#FFF]';
          border = 'border-[#543400]';
        } else if (toast.type === 'SUCCESS') {
          bg = 'bg-[#1E4D2B] text-[#FFF]';
          border = 'border-[#14341D]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between px-3 py-2 text-[12px] font-sans-ui rounded-[2px] border ${border} ${bg} shadow-subtle`}
          >
            <span className="truncate pr-3 leading-normal">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-70 hover:opacity-100 p-0.5 cursor-pointer shrink-0"
              aria-label="Dismiss toast"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
