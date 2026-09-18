"use client";

import React from "react";
import { ClusterState } from "@/hooks/useSimulationStream";

interface ScalingControlProps {
  state: ClusterState;
  onScaleChange: (
    mode: "HORIZONTAL" | "VERTICAL",
    autoScale: boolean,
    delta?: number,
    cores?: number
  ) => void;
}

export const ScalingControl: React.FC<ScalingControlProps> = ({
  state,
  onScaleChange,
}) => {
  const isHorizontal = state.scalingMode === "HORIZONTAL";

  return (
    <div className="glass-panel rounded-xl px-5 py-3.5 border border-cyan-500/30 text-xs font-mono w-[320px]">
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[10px] text-cyan-400 tracking-wider uppercase font-semibold">
          Scaling Architecture
        </span>
        <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/40 text-cyan-300">
          {isHorizontal ? "HORIZONTAL (PODS)" : "VERTICAL (CORES)"}
        </span>
      </div>

      {/* Mode Toggle Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => onScaleChange("HORIZONTAL", state.autoScalingEnabled)}
          className={`py-1.5 px-2 rounded-lg text-center font-bold text-[10px] transition-all border ${
            isHorizontal
              ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)]"
              : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          Horizontal (Pods)
        </button>
        <button
          onClick={() => onScaleChange("VERTICAL", state.autoScalingEnabled)}
          className={`py-1.5 px-2 rounded-lg text-center font-bold text-[10px] transition-all border ${
            !isHorizontal
              ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          Vertical (Cores)
        </button>
      </div>

      {/* Mode-Specific Sub-Controls */}
      {isHorizontal ? (
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
          <button
            onClick={() => onScaleChange("HORIZONTAL", !state.autoScalingEnabled)}
            className={`flex-1 py-1 px-2 rounded text-[9px] font-semibold border ${
              state.autoScalingEnabled
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                : "bg-slate-900/60 border-slate-700/60 text-slate-400"
            }`}
          >
            Auto-Scale: {state.autoScalingEnabled ? "ENABLED" : "PAUSED"}
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => onScaleChange("HORIZONTAL", false, -1)}
              disabled={state.totalNodes <= 2}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold disabled:opacity-40"
            >
              -1
            </button>
            <button
              onClick={() => onScaleChange("HORIZONTAL", false, 1)}
              disabled={state.totalNodes >= 32}
              className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 font-bold disabled:opacity-40"
            >
              +1
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-1 border-t border-slate-800">
          <div className="text-[9px] text-slate-400 mb-1.5">Tower Core Tier:</div>
          <div className="grid grid-cols-4 gap-1.5">
            {[8, 16, 32, 64].map((cores) => {
              const activeCores = state.nodes[0]?.cpuCores || 16;
              const isSelected = activeCores === cores;
              return (
                <button
                  key={cores}
                  onClick={() => onScaleChange("VERTICAL", false, undefined, cores)}
                  className={`py-1 rounded text-[9px] font-bold border transition-all ${
                    isSelected
                      ? "bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                      : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cores}C
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
