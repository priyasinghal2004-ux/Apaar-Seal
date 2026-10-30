/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MapPin, Building2, AlertCircle, ArrowUpRight } from 'lucide-react';

export interface StateUtilizationData {
  state: string;
  code: string;
  institutionCount: number;
  approvedIntake: number;
  reportedEnrolments: number;
  confirmedCount: number;
  utilizationRate: number; // percentage e.g. 75
  openCases: number;
  excessSeats: number;
  aicteRegion: string;
}

interface StateMapHeatmapProps {
  stateData: StateUtilizationData[];
  selectedState: string | null;
  onSelectState: (state: string | null) => void;
}

// Geometric coordinates and paths representing Indian regions/states in a stylized, accurate SVG projection
interface StatePathInfo {
  state: string;
  code: string;
  d: string;
  labelX: number;
  labelY: number;
}

const STATE_SVG_PATHS: StatePathInfo[] = [
  {
    state: 'Rajasthan',
    code: 'RJ',
    d: 'M 140 160 L 190 145 L 210 185 L 180 230 L 120 220 L 110 180 Z',
    labelX: 155,
    labelY: 185,
  },
  {
    state: 'Uttar Pradesh',
    code: 'UP',
    d: 'M 215 150 L 290 155 L 320 210 L 250 230 L 210 190 Z',
    labelX: 255,
    labelY: 185,
  },
  {
    state: 'Madhya Pradesh',
    code: 'MP',
    d: 'M 185 235 L 255 235 L 290 280 L 220 300 L 160 270 Z',
    labelX: 220,
    labelY: 265,
  },
  {
    state: 'Maharashtra',
    code: 'MH',
    d: 'M 155 275 L 220 305 L 235 370 L 160 370 L 135 310 Z',
    labelX: 180,
    labelY: 330,
  },
  {
    state: 'Karnataka',
    code: 'KA',
    d: 'M 160 375 L 215 375 L 205 450 L 165 440 L 150 400 Z',
    labelX: 180,
    labelY: 410,
  },
  {
    state: 'Assam',
    code: 'AS',
    d: 'M 370 170 L 430 160 L 440 200 L 380 210 L 360 190 Z',
    labelX: 400,
    labelY: 185,
  },
  // Background regional context outlines (North, South, East, West)
  {
    state: 'Jammu & Kashmir / Ladakh',
    code: 'JK',
    d: 'M 160 60 L 220 50 L 250 110 L 170 120 Z',
    labelX: 200,
    labelY: 85,
  },
  {
    state: 'Punjab & Haryana',
    code: 'PB',
    d: 'M 165 125 L 210 120 L 210 150 L 170 155 Z',
    labelX: 190,
    labelY: 140,
  },
  {
    state: 'Gujarat',
    code: 'GJ',
    d: 'M 85 210 L 130 215 L 140 270 L 90 275 Z',
    labelX: 110,
    labelY: 245,
  },
  {
    state: 'Bihar & Jharkhand',
    code: 'JH',
    d: 'M 295 180 L 350 185 L 350 250 L 290 250 Z',
    labelX: 320,
    labelY: 215,
  },
  {
    state: 'West Bengal & Odisha',
    code: 'OD',
    d: 'M 310 255 L 360 255 L 330 330 L 280 310 Z',
    labelX: 320,
    labelY: 290,
  },
  {
    state: 'Telangana & Andhra Pradesh',
    code: 'AP',
    d: 'M 225 320 L 280 320 L 250 430 L 210 380 Z',
    labelX: 245,
    labelY: 370,
  },
  {
    state: 'Tamil Nadu & Kerala',
    code: 'TN',
    d: 'M 180 445 L 230 440 L 210 510 L 170 490 Z',
    labelX: 195,
    labelY: 475,
  },
];

export const StateMapHeatmap: React.FC<StateMapHeatmapProps> = ({
  stateData,
  selectedState,
  onSelectState,
}) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Map state to utilization data
  const dataMap = new Map<string, StateUtilizationData>();
  stateData.forEach((sd) => dataMap.set(sd.state, sd));

  const activeHoverData = hoveredState ? dataMap.get(hoveredState) : null;
  const activeSelectedData = selectedState ? dataMap.get(selectedState) : null;
  const displayData = activeHoverData || activeSelectedData || null;

  const getColorForRate = (rate: number, hasData: boolean) => {
    if (!hasData) return '#F1F5F9'; // neutral slate
    if (rate >= 60) return '#0A193B'; // deep navy high intake
    if (rate >= 30) return '#1E3A78'; // medium navy
    if (rate >= 15) return '#D97706'; // amber moderate
    return '#E2E8F0';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      {/* Left: Interactive SVG Map */}
      <div className="md:col-span-7 flex flex-col items-center justify-center p-2">
        <div className="relative w-full max-w-[420px] aspect-[460/530]">
          <svg
            viewBox="70 40 380 480"
            className="w-full h-full filter drop-shadow-xs select-none"
            aria-label="Map of India showing institution seat utilization"
          >
            {STATE_SVG_PATHS.map((item) => {
              const info = dataMap.get(item.state);
              const hasData = Boolean(info);
              const isSelected = selectedState === item.state;
              const isHovered = hoveredState === item.state;
              const fillColor = getColorForRate(info?.utilizationRate || 0, hasData);

              return (
                <g key={item.code} className="transition-all">
                  <path
                    d={item.d}
                    fill={fillColor}
                    stroke={isSelected ? '#2563EB' : isHovered ? '#0F172A' : '#CBD5E1'}
                    strokeWidth={isSelected ? '2.5' : isHovered ? '2' : '1.2'}
                    className={`transition-all duration-150 ${
                      hasData ? 'cursor-pointer hover:opacity-90' : 'cursor-default opacity-60'
                    }`}
                    onMouseEnter={() => hasData && setHoveredState(item.state)}
                    onMouseLeave={() => setHoveredState(null)}
                    onClick={() => {
                      if (hasData) {
                        onSelectState(selectedState === item.state ? null : item.state);
                      }
                    }}
                  />
                  {hasData && (
                    <text
                      x={item.labelX}
                      y={item.labelY}
                      fill={info && info.utilizationRate >= 30 ? '#FFFFFF' : '#0F172A'}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="IBM Plex Mono"
                      textAnchor="middle"
                      className="pointer-events-none select-none"
                    >
                      {item.code}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono-code text-slate-600 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#0A193B]" />
            <span>≥60% High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#1E3A78]" />
            <span>30–59%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#D97706]" />
            <span>15–29%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#F1F5F9] border border-slate-300" />
            <span>Non-reporting</span>
          </div>
        </div>
      </div>

      {/* Right: State Details Card */}
      <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        {displayData ? (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono-code font-semibold uppercase tracking-wider text-slate-500">
                  {displayData.aicteRegion}
                </span>
                <h4 className="text-[18px] font-bold text-slate-900 mt-0.5">
                  {displayData.state}
                </h4>
              </div>
              <span className="font-mono-code text-xs px-2.5 py-1 rounded bg-white border border-slate-200 font-bold text-blue-700 shadow-2xs">
                {displayData.utilizationRate.toFixed(1)}% Used
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Sanctioned Intake</span>
                <span className="font-mono-code text-base font-bold text-slate-900 tabular-nums">
                  {displayData.approvedIntake}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Reported Enrolments</span>
                <span className="font-mono-code text-base font-bold text-slate-900 tabular-nums">
                  {displayData.reportedEnrolments}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Student Confirmed</span>
                <span className="font-mono-code text-base font-bold text-blue-700 tabular-nums">
                  {displayData.confirmedCount}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Excess Seats</span>
                <span className={`font-mono-code text-base font-bold tabular-nums ${displayData.excessSeats > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                  {displayData.excessSeats > 0 ? `+${displayData.excessSeats}` : '0'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Open Flags: <strong className="font-mono-code text-red-700">{displayData.openCases} cases</strong>
              </span>
              <button
                onClick={() => onSelectState(selectedState === displayData.state ? null : displayData.state)}
                className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                {selectedState === displayData.state ? 'Clear Filter' : 'Filter Table'}
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mx-auto text-slate-500">
              <MapPin size={20} />
            </div>
            <div className="text-[13.5px] font-semibold text-slate-800">
              Interactive State Heatmap
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Hover over or click highlighted states (MP, MH, KA, AS, RAJ, UP) to inspect territorial intake utilization and active cases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
