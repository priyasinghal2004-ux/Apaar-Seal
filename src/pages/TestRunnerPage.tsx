/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { runAllRegulatoryAssuranceTests, TestResult } from '../tests/regulatoryTests';
import { Play, CheckCircle2, XCircle, Clock, ShieldCheck, Terminal, ArrowRight, RefreshCw } from 'lucide-react';

export const TestRunnerPage: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>(() => runAllRegulatoryAssuranceTests());
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastRunAt, setLastRunAt] = useState<string>(new Date().toISOString());

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAllRegulatoryAssuranceTests();
      setResults(res);
      setIsRunning(false);
      setLastRunAt(new Date().toISOString());
    }, 250);
  };

  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = passedCount === results.length;
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono-code font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck size={13} className="text-emerald-700" />
              Automated Assurance Matrix
            </span>
            <span className="text-xs text-slate-400 font-mono-code">v0.9-benchmark</span>
          </div>
          <h1 className="font-serif-title text-[24px] sm:text-[26px] font-semibold text-slate-900 tracking-tight">
            Statutory Assurance Automated Test Suite
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Unit and integration verification across canonical intake limits, supernumerary quotas (14 excess assertion), role permissions, dispute states, and SHA-256 tamper-evident audit chains.
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0A193B] hover:bg-[#142959] text-white text-[13px] font-medium rounded-md shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isRunning ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Executing Suite...
            </>
          ) : (
            <>
              <Play size={14} className="fill-current" /> Run All Tests
            </>
          )}
        </button>
      </div>

      {/* Summary Banner Card */}
      <div
        className={`p-5 rounded-lg border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          allPassed
            ? 'bg-gradient-to-r from-emerald-50/70 to-white border-emerald-200'
            : 'bg-gradient-to-r from-rose-50/70 to-white border-rose-200'
        }`}
      >
        <div className="flex items-start md:items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              allPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {allPassed ? (
              <CheckCircle2 size={22} strokeWidth={2} />
            ) : (
              <XCircle size={22} strokeWidth={2} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-title text-[18px] font-semibold text-slate-900">
                {allPassed ? 'All 7 Statutory Assurance Assertions Verified' : 'Test Assertions Failed'}
              </span>
              <span
                className={`text-[11px] font-mono-code font-bold px-2 py-0.5 rounded ${
                  allPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {passedCount} / {results.length} PASSED
              </span>
            </div>
            <div className="text-[12px] text-slate-500 mt-1 font-mono-code flex items-center gap-2 flex-wrap">
              <span>Execution time: {totalDuration.toFixed(2)}ms</span>
              <span>•</span>
              <span>Completed at: {new Date(lastRunAt).toLocaleTimeString()}</span>
              <span>•</span>
              <span>Environment: Browser In-Memory Sandbox</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-slate-100 text-[12px] font-mono-code rounded-md shadow-sm border border-slate-800">
            <Terminal size={13} className="text-emerald-400" />
            <span>npm test</span>
          </div>
        </div>
      </div>

      {/* Test Results Table Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Assertion Specifications & Trace Log
            </span>
            <span className="text-xs text-slate-400">({results.length} specs)</span>
          </div>
          <div className="font-mono-code text-[11px] text-slate-500 flex items-center gap-1.5">
            <Clock size={12} />
            Cumulative: {totalDuration.toFixed(2)}ms
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {results.map((t) => (
            <div key={t.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono-code text-[11px] font-bold text-slate-700 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded">
                    {t.id}
                  </span>
                  <span className="font-semibold text-[13.5px] text-slate-900">
                    {t.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono-code text-[11.5px] text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    {t.durationMs.toFixed(2)}ms
                  </span>
                  {t.passed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono-code font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      PASSED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono-code font-bold px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                      FAILED
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[12.5px] text-slate-600 leading-relaxed">
                {t.description}
              </div>

              <div className="p-3 bg-slate-900 text-slate-100 rounded-md font-mono-code text-[11.5px] space-y-1 shadow-inner border border-slate-800">
                <div className="flex items-start gap-2">
                  <ArrowRight size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">
                    <span className="text-slate-400">Assertion:</span> {t.assertionDetails}
                  </span>
                </div>
                {t.error && (
                  <div className="text-rose-400 font-semibold pt-1 border-t border-slate-800">
                    Error Trace: {t.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
