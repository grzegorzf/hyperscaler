"use client";

import React from "react";

interface CdnSliderProps {
  cacheHitRate: number;
  onCacheRateChange: (rate: number) => void;
  className?: string;
}

export const CdnSlider: React.FC<CdnSliderProps> = ({
  cacheHitRate,
  onCacheRateChange,
  className = "",
}) => {
  const percent = Math.round(cacheHitRate * 100);

  return (
    <div className={`glass-panel rounded-xl px-5 py-3.5 border border-emerald-500/30 text-xs font-mono w-full max-w-[340px] md:w-[300px] ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] text-emerald-400 tracking-wider uppercase font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Edge CDN Caching Ratio
        </span>
        <span className="text-sm font-bold text-emerald-400 glow-emerald">
          {percent}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="98"
        step="1"
        value={percent}
        onChange={(e) => onCacheRateChange(parseInt(e.target.value) / 100)}
        className="w-full"
      />

      <div className="flex justify-between items-center mt-2 text-[9px] text-slate-400">
        <span>0% (ALL MISS)</span>
        <span className="text-emerald-400 font-bold">
          {percent >= 80 ? "HIGH SHIELD" : "DIRECT LOAD"}
        </span>
        <span>98% (EDGE ABSORB)</span>
      </div>
    </div>
  );
};
