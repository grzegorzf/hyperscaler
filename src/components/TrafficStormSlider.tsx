"use client";

import React from "react";

interface TrafficStormSliderProps {
  trafficRps: number;
  multiplier: number;
  onMultiplierChange: (mult: number) => void;
}

export const TrafficStormSlider: React.FC<TrafficStormSliderProps> = ({
  trafficRps,
  multiplier,
  onMultiplierChange,
}) => {
  return (
    <div className="glass-panel rounded-xl px-5 py-3.5 border border-amber-500/30 text-xs font-mono w-[300px]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] text-amber-400/90 tracking-wider uppercase font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Traffic Storm Multiplier
        </span>
        <span className="text-sm font-bold text-amber-400 glow-amber">
          x{multiplier.toFixed(1)}
        </span>
      </div>

      {/* Tactile Slider */}
      <input
        type="range"
        min="0.2"
        max="5.0"
        step="0.1"
        value={multiplier}
        onChange={(e) => onMultiplierChange(parseFloat(e.target.value))}
        className="w-full range-amber"
      />

      <div className="flex justify-between items-center mt-2 text-[9px] text-slate-400">
        <span>0x (IDLE)</span>
        <span className="text-cyan-400 font-bold">
          {(trafficRps / 1000).toFixed(0)}k req/s
        </span>
        <span>x5 (STORM)</span>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-3 gap-1.5 mt-2.5">
        <button
          onClick={() => onMultiplierChange(1.0)}
          className={`px-2 py-1 rounded text-[9px] font-semibold border transition-all ${
            Math.abs(multiplier - 1.0) < 0.05
              ? "bg-amber-500/20 border-amber-400 text-amber-300"
              : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          Normal (1x)
        </button>
        <button
          onClick={() => onMultiplierChange(2.5)}
          className={`px-2 py-1 rounded text-[9px] font-semibold border transition-all ${
            Math.abs(multiplier - 2.5) < 0.05
              ? "bg-amber-500/20 border-amber-400 text-amber-300"
              : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          Viral (2.5x)
        </button>
        <button
          onClick={() => onMultiplierChange(5.0)}
          className={`px-2 py-1 rounded text-[9px] font-semibold border transition-all ${
            Math.abs(multiplier - 5.0) < 0.05
              ? "bg-amber-500/20 border-amber-400 text-amber-300"
              : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          Spike (5x)
        </button>
      </div>
    </div>
  );
};
