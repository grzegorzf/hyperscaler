"use client";

import React from "react";

interface ChaosControlProps {
  chaosActive: boolean;
  onChaosToggle: (active: boolean) => void;
  className?: string;
}

export const ChaosControl: React.FC<ChaosControlProps> = ({
  chaosActive,
  onChaosToggle,
  className = "",
}) => {
  return (
    <div className={`glass-panel rounded-xl px-4 py-3 border border-rose-500/30 text-xs font-mono w-full max-w-[340px] md:w-[320px] ${className}`}>
      <button
        onClick={() => onChaosToggle(!chaosActive)}
        className={`w-full py-2.5 px-3 min-h-[44px] rounded-lg font-bold text-[10px] tracking-wider uppercase flex items-center justify-center gap-2 border transition-all touch-manipulation ${
          chaosActive
            ? "bg-rose-500/30 border-rose-500 text-rose-300 shadow-[0_0_16px_rgba(239,68,68,0.5)] animate-pulse"
            : "bg-rose-950/40 border-rose-800/60 text-rose-400 hover:bg-rose-900/40 hover:text-rose-200"
        }`}
      >
        <span>🔥</span>
        <span>
          {chaosActive ? "Recovering Cluster..." : "Chaos Monkey: Inject Outage"}
        </span>
      </button>
    </div>
  );
};
