"use client";

import React from "react";
import { triggerHaptic } from "@/lib/browser/webApis";
import { useMouseSpotlight } from "@/hooks/useMouseSpotlight";

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
  const spotlight = useMouseSpotlight();

  const handleToggle = () => {
    const nextState = !chaosActive;
    if (nextState) {
      triggerHaptic("chaos");
    } else {
      triggerHaptic("medium");
    }
    onChaosToggle(nextState);
  };

  return (
    <div
      onMouseMove={spotlight.onMouseMove}
      onMouseLeave={spotlight.onMouseLeave}
      className={`glass-panel gpu-spotlight cyber-hud-notch px-4 py-3 border border-rose-500/30 text-xs font-mono w-full max-w-[340px] md:w-[320px] ${className}`}
    >
      <button
        onClick={handleToggle}
        className={`w-full py-2.5 px-3 min-h-[44px] rounded-lg font-bold text-[10px] tracking-wider uppercase flex items-center justify-center gap-2 border transition-all touch-manipulation cursor-pointer ${
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
