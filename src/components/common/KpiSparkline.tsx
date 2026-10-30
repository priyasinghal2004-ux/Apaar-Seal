/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface KpiSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export const KpiSparkline: React.FC<KpiSparklineProps> = ({
  data,
  color = '#2563EB',
  height = 24,
  width = 72,
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * innerWidth;
    const y = height - padding - ((val - min) / range) * innerHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0" aria-hidden="true">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End point dot */}
      {points.length > 0 && (() => {
        const last = points[points.length - 1].split(',');
        return (
          <circle
            cx={Number(last[0])}
            cy={Number(last[1])}
            r="2.5"
            fill={color}
          />
        );
      })()}
    </svg>
  );
};
