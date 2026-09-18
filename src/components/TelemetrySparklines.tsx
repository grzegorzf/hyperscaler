"use client";

import React, { useState, useEffect } from "react";
import type { ClusterState } from "@/lib/simulation/types";
import {
  calculateSloMetrics,
  appendHistorySample,
  generateSparklineSvgPath,
} from "@/lib/simulation/sloTracker";
import { Activity, ShieldCheck, Flame } from "lucide-react";

interface TelemetrySparklinesProps {
  state: ClusterState;
  hourlyBurnRate: number;
  className?: string;
}

export const TelemetrySparklines: React.FC<TelemetrySparklinesProps> = ({
  state,
  hourlyBurnRate,
  className = "",
}) => {
  const [trafficHistory, setTrafficHistory] = useState<number[]>(() =>
    Array(20).fill(25000)
  );
  const [originHistory, setOriginHistory] = useState<number[]>(() =>
    Array(20).fill(6250)
  );
  const [latencyHistory, setLatencyHistory] = useState<number[]>(() =>
    Array(20).fill(12)
  );
  const [costHistory, setCostHistory] = useState<number[]>(() =>
    Array(20).fill(1.78)
  );

  // Update ring buffers on state changes
  useEffect(() => {
    setTrafficHistory((prev) => appendHistorySample(prev, state.trafficRps, 24));
    setOriginHistory((prev) => appendHistorySample(prev, state.originIngressRps, 24));
    setLatencyHistory((prev) => appendHistorySample(prev, state.latencyP99Ms, 24));
    setCostHistory((prev) => appendHistorySample(prev, hourlyBurnRate, 24));
  }, [state.trafficRps, state.originIngressRps, state.latencyP99Ms, hourlyBurnRate]);

  const slo = calculateSloMetrics(
    state.errorRatePercent,
    state.latencyP99Ms,
    state.chaosActive
  );

  const trafficPath = generateSparklineSvgPath(trafficHistory, 120, 24);
  const originPath = generateSparklineSvgPath(originHistory, 120, 24);
  const latencyPath = generateSparklineSvgPath(latencyHistory, 120, 24);
  const costPath = generateSparklineSvgPath(costHistory, 120, 24);

  return (
    <div
      className={`glass-panel rounded-xl px-4 py-3 border border-slate-700/50 flex flex-col gap-2.5 font-mono text-xs w-full max-w-[420px] ${className}`}
    >
      {/* 1. Header & SLO Budget Readout */}
      <div className="flex items-center justify-between border-b border-slate-700/30 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            SRE Telemetry & 99.99% SLO
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9px] px-2 py-0.5 rounded font-bold border flex items-center gap-1 ${
              slo.status === "HEALTHY"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : slo.status === "BURNING"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
            }`}
          >
            {slo.status === "CRITICAL" ? (
              <Flame className="w-2.5 h-2.5 text-rose-400" />
            ) : (
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
            )}
            SLO: {slo.status} ({slo.burnRateMultiplier}x Burn)
          </span>
        </div>
      </div>

      {/* 2. Sparklines Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Traffic Curve (Client vs Origin) */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-400">Traffic (k/s)</span>
            <span className="text-cyan-400 font-bold">
              {(state.trafficRps / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="h-7 w-full bg-black/40 rounded border border-slate-800/80 p-0.5 relative overflow-hidden">
            <svg viewBox="0 0 120 24" className="w-full h-full overflow-visible">
              <path
                d={trafficPath}
                fill="none"
                stroke="#00f0ff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={originPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="2,2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-[8px] text-slate-500 flex justify-between">
            <span className="text-cyan-400/80">Edge</span>
            <span className="text-amber-400/80">Origin</span>
          </span>
        </div>

        {/* P99 Latency Curve */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-400">P99 Spike</span>
            <span
              className={`font-bold ${
                state.latencyP99Ms > 100 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {state.latencyP99Ms}ms
            </span>
          </div>
          <div className="h-7 w-full bg-black/40 rounded border border-slate-800/80 p-0.5 relative overflow-hidden">
            <svg viewBox="0 0 120 24" className="w-full h-full overflow-visible">
              <path
                d={latencyPath}
                fill="none"
                stroke={state.latencyP99Ms > 100 ? "#ef4444" : "#10b981"}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[8px] text-slate-500">
            P50: {state.latencyP50Ms}ms · Target &lt;50ms
          </span>
        </div>

        {/* Hourly Cost Burn Rate Curve */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-slate-400">Burn $/hr</span>
            <span className="text-white font-bold">
              ${hourlyBurnRate.toFixed(2)}
            </span>
          </div>
          <div className="h-7 w-full bg-black/40 rounded border border-slate-800/80 p-0.5 relative overflow-hidden">
            <svg viewBox="0 0 120 24" className="w-full h-full overflow-visible">
              <path
                d={costPath}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[8px] text-slate-500">
            Error Budget: {slo.remainingBudgetMinutes}m left
          </span>
        </div>
      </div>
    </div>
  );
};
