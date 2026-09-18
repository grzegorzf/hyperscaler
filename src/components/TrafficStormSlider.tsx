"use client";

import React from "react";
import { triggerHaptic } from "@/lib/browser/webApis";
import { useMouseSpotlight } from "@/hooks/useMouseSpotlight";

interface TrafficStormSliderProps {
  trafficRps: number;
  multiplier: number;
  onMultiplierChange: (mult: number) => void;
  className?: string;
}

export const TrafficStormSlider: React.FC<TrafficStormSliderProps> = ({
  trafficRps,
  multiplier,
  onMultiplierChange,
  className = "",
}) => {
  const spotlight = useMouseSpotlight();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    triggerHaptic("light");
    onMultiplierChange(parseFloat(e.target.value));
  };

  const handlePresetClick = (val: number) => {
    triggerHaptic("medium");
    onMultiplierChange(val);
  };

  return (
    <div
      onMouseMove={spotlight.onMouseMove}
      onMouseLeave={spotlight.onMouseLeave}
      className={`glass-panel gpu-spotlight gpu-spotlight-amber cyber-hud-notch px-5 py-3.5 border border-amber-500/30 text-xs font-mono w-full max-w-[340px] md:w-[300px] ${className}`}
    >
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
        min="0.0"
        max="5.0"
        step="0.1"
        value={multiplier}
        onChange={handleSliderChange}
        className="w-full range-amber"
      />

      <div className="flex justify-between items-center mt-2 text-[9px] text-slate-400">
        <span>0x (IDLE)</span>
        <span className="text-cyan-400 font-bold">
          {trafficRps <= 0 ? "0 req/s" : `${(trafficRps / 1000).toFixed(0)}k req/s`}
        </span>
        <span>x5 (STORM)</span>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-4 gap-1 mt-2.5">
        <button
          onClick={() => handlePresetClick(0.0)}
          className={`px-1.5 py-1 rounded text-[9px] font-semibold border transition-all text-center cursor-pointer ${
            multiplier <= 0.05
              ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
              : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          Zero (0x)
        </button>
        <button
          onClick={() => handlePresetClick(1.0)}
          className={`px-1.5 py-1 rounded text-[9px] font-semibold border transition-all text-center cursor-pointer ${
            Math.abs(multiplier - 1.0) < 0.05
              ? "bg-amber-500/20 border-amber-400 text-amber-300"
              : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          Norm (1x)
        </button>
        <button
          onClick={() => handlePresetClick(2.5)}
          className={`px-1.5 py-1 rounded text-[9px] font-semibold border transition-all text-center cursor-pointer ${
            Math.abs(multiplier - 2.5) < 0.05
              ? "bg-amber-500/20 border-amber-400 text-amber-300"
              : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          Viral (2.5x)
        </button>
        <button
          onClick={() => handlePresetClick(5.0)}
          className={`px-1.5 py-1 rounded text-[9px] font-semibold border transition-all text-center cursor-pointer ${
            Math.abs(multiplier - 5.0) < 0.05
              ? "bg-amber-500/20 border-amber-400 text-amber-300"
              : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          Storm (5x)
        </button>
      </div>
    </div>
  );
};
