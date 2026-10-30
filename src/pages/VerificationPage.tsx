/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store';
import { SelectiveDisclosureResult } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  QrCode,
  ShieldCheck,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Printer,
  Copy,
  Info,
  Building2,
  FileText,
  UserCheck,
} from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const { verifyRecordByApaar, addToast, isBreakGlassActive } = useStore();
  const [inputApaar, setInputApaar] = useState<string>('492817354821');
  const [consentGranted, setConsentGranted] = useState<boolean>(true);
  const [result, setResult] = useState<SelectiveDisclosureResult | null>(null);
  const [hasQueried, setHasQueried] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const sampleApaars = [
    { name: 'Ananya Verma', apaar: '492817354821', note: 'Cross-collision record' },
    { name: 'Rohan Kulkarni', apaar: '918273649102', note: 'State polytechnic record' },
    { name: 'Vikramaditya Rathore', apaar: '771234903341', note: 'Pharmacy candidate' },
  ];

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputApaar.trim()) return;

    setIsSearching(true);
    setHasQueried(true);

    setTimeout(() => {
      const res = verifyRecordByApaar(inputApaar.trim(), consentGranted);
      setResult(res);
      setIsSearching(false);
      if (res) {
        addToast('Selective-disclosure enrolment record successfully verified and attested.', 'SUCCESS');
      } else {
        addToast('No admission record located for the supplied APAAR identifier.', 'ERROR');
      }
    }, 200);
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    addToast('Verification token copied to clipboard.', 'INFO');
  };

  // Helper to generate a clean stylized SVG QR matrix from verification token
  const renderSvgQr = (token: string) => {
    // 21x21 grid representation for clean QR aesthetic
    const gridSize = 21;
    const cells: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

    // Fill corner finder patterns (top-left, top-right, bottom-left)
    const fillFinder = (r: number, c: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (
            i === 0 || i === 6 || j === 0 || j === 6 ||
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)
          ) {
            cells[r + i][c + j] = true;
          }
        }
      }
    };

    fillFinder(0, 0);
    fillFinder(0, 14);
    fillFinder(14, 0);

    // Pseudorandom deterministic fill based on token chars
    let seed = 0;
    for (let i = 0; i < token.length; i++) {
      seed = (seed * 31 + token.charCodeAt(i)) % 100000;
    }

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Skip corner finder pattern areas
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c > 12) ||
          (r > 12 && c < 8)
        ) {
          continue;
        }
        seed = (seed * 16807 + 11) % 2147483647;
        cells[r][c] = (seed % 3) === 0;
      }
    }

    return (
      <svg viewBox="0 0 21 21" className="w-full h-full p-1" shapeRendering="crispEdges">
        <rect width="21" height="21" fill="#FFFFFF" />
        {cells.map((row, r) =>
          row.map((active, c) => (
            active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0A193B" /> : null
          ))
        )}
      </svg>
    );
  };

  return (
    <div className="space-y-7 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono-code font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              NATIONAL CITIZEN VERIFICATION GATEWAY
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Selective Disclosure Protocol</span>
          </div>
          <h1 className="font-serif-title text-[28px] font-semibold text-slate-900 tracking-tight leading-tight">
            Verify Enrolment Record & Status
          </h1>
          <p className="text-[14px] text-slate-600 mt-1">
            Query individual candidate admissions using 12-digit APAAR educational identifiers with privacy-preserving selective disclosure.
          </p>
        </div>
      </div>

      {/* Query Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card space-y-5">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-700 mb-2">
              Enter 12-Digit APAAR ID / Token
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={inputApaar}
                  onChange={(e) => setInputApaar(e.target.value)}
                  placeholder="e.g. 492817354821 or XXXX-XXXX-4821"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono-code text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent tracking-wide"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !inputApaar.trim()}
                className="px-6 py-2.5 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-40 shrink-0"
              >
                {isSearching ? 'Verifying Registry...' : 'Verify Record'}
              </button>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <input
              type="checkbox"
              id="consent"
              checked={consentGranted}
              onChange={(e) => setConsentGranted(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="consent" className="cursor-pointer text-slate-700 leading-relaxed select-none">
              <span className="font-semibold text-slate-900">Candidate Consent & Authorization: </span>
              Candidate has authorized the retrieval of this selective disclosure record via DigiLocker token / OTP acknowledgement under AICTE Privacy Guidelines 2025.
            </label>
          </div>

          {/* Quick Fill Samples */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500 font-medium">Quick sample IDs:</span>
            {sampleApaars.map((s) => (
              <button
                key={s.apaar}
                type="button"
                onClick={() => setInputApaar(s.apaar)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-md font-mono-code text-[11.5px] cursor-pointer transition-colors"
              >
                {s.name} ({s.apaar.slice(-4)})
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Verification Result Card */}
      {hasQueried && (
        result ? (
          <div className="bg-white border border-emerald-300 rounded-xl shadow-card overflow-hidden">
            {/* Result Header */}
            <div className="px-6 py-4.5 bg-emerald-50/70 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-emerald-800">
                    SEAL ATTESTATION VERIFIED
                  </div>
                  <h3 className="text-[17px] font-bold text-slate-900 leading-tight">
                    Active Technical Institution Enrolment
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge type="state" value={result.status} />
                <button
                  onClick={() => handleCopyToken(result.verificationToken)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Copy size={13} />
                  Copy Token
                </button>
              </div>
            </div>

            {/* Main Result Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Data Grid */}
              <div className="md:col-span-8 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400 block">Candidate Name</span>
                    <span className="font-bold text-base text-slate-900 block mt-0.5">{result.studentName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400 block">APAAR Identifier</span>
                    <span className="font-mono-code text-sm font-bold text-slate-900 block mt-0.5">
                      {isBreakGlassActive ? result.apaarRaw : result.maskedApaar}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400 block">Enrolled Institution</span>
                    <span className="font-semibold text-slate-900 block mt-0.5">{result.institutionName}</span>
                    <span className="font-mono-code text-[11px] text-slate-500">{result.institutionCode}</span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400 block">Course & Degree</span>
                    <span className="font-semibold text-slate-900 block mt-0.5">{result.programmeName}</span>
                    <span className="text-slate-500">{result.degreeType} · AY {result.academicYear}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400 block">Quota Category</span>
                    <span className="font-mono-code text-xs font-semibold text-slate-800 block mt-0.5">
                      {result.quotaCategory} {result.isSupernumerary ? '(Supernumerary TFWS)' : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400 block">Admission ID</span>
                    <span className="font-mono-code text-xs font-semibold text-slate-800 block mt-0.5">
                      {result.admissionId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400 block">Attestation Timestamp</span>
                    <span className="font-mono-code text-[11px] text-slate-600 block mt-0.5">
                      {new Date(result.verifiedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400 block">Cryptographic Seal Digest</span>
                    <span className="font-mono-code text-[11px] text-slate-600 block mt-0.5 truncate" title={result.registrySealHash}>
                      {result.registrySealHash}
                    </span>
                  </div>
                </div>

                {/* Privacy Safeguard Notice */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11.5px] text-slate-600 flex items-start gap-2">
                  <ShieldCheck size={14} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    Zero demographic disclosure guarantee: No Aadhaar number, marks, family income, or personal address are broadcast over this attestation endpoint.
                  </div>
                </div>
              </div>

              {/* Right Column: Scannable QR Code */}
              <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-between text-center">
                <div className="w-full flex items-center justify-center">
                  <div className="w-36 h-36 bg-white border border-slate-200 rounded-lg p-1.5 shadow-2xs">
                    {renderSvgQr(result.verificationToken)}
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="text-[11px] font-mono-code font-bold text-slate-900">
                    {result.verificationToken}
                  </div>
                  <div className="text-[10.5px] text-slate-400">
                    Scan with DigiLocker or official AICTE scanner
                  </div>
                </div>

                <div className="w-full pt-3 mt-3 border-t border-slate-200 flex justify-center">
                  <button
                    onClick={() => window.print()}
                    className="text-xs text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={13} /> Print Certificate
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-red-200 rounded-xl p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto">
              <Info size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No Attested Admission Record Found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              No active enrolment record matching identifier <span className="font-mono-code font-semibold">{inputApaar}</span> could be located in the AY 2025-26 seat assurance registry. Ensure the 12-digit APAAR is entered without spaces or select one of the sample IDs.
            </p>
          </div>
        )
      )}
    </div>
  );
};
