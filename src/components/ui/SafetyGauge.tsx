"use client";

import React, { useEffect, useState } from 'react';

interface SafetyGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const SafetyGauge: React.FC<SafetyGaugeProps> = ({ score, size = 60, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    // Basic animation replacement for framer-motion
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  const getColor = (s: number) => {
    if (s >= 90) return '#4ade80'; // Green
    if (s >= 70) return '#facc15'; // Yellow
    return '#f87171'; // Red
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black opacity-30 tracking-tighter">SCORE</span>
      </div>
    </div>
  );
};

export default SafetyGauge;
