"use client";

import React from "react";
import { ClusterState } from "@/hooks/useSimulationStream";

interface TelemetryHUDProps {
  state: ClusterState;
  history: number[];
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ state, history }) => {
  const isHealthy = state.systemHealth === "NOMINAL";
  const isDegraded = state.systemHealth === "DEGRADED";

  // Format throughput nicely
  const gbps = ((state.trafficRps * 1.8) / 1000).toFixed(1);

  // Sparkline points SVG
  const maxHistory = Math.max(...history, 1);
  const sparkPoints = history
    .map((val, idx) => {
      const x = (idx / (history.length - 1)) * 120;
      const y = 30 - (val / maxHistory) * 26;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="absolute top-5 right-6 z-20 flex flex-col gap-3 pointer-events-auto">
      {/* Top Main Telemetry Cluster */}
      <div className="glass-panel rounded-xl px-5 py-4 border border-cyan-500/30 flex items-center gap-6 text-xs font-mono">
        {/* 1. Region Latency */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 tracking-wider uppercase">Region Latency</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-cyan-400 glow-cyan">
              {state.latencyP50Ms}
            </span>
            <span className="text-[10px] text-cyan-500">ms</span>
          </div>
          <span className="text-[9px] text-slate-500">p99: {state.latencyP99Ms}ms</span>
        </div>

        <div className="w-[1px] h-8 bg-cyan-500/20" />

        {/* 2. Network Throughput Sparkline */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center gap-3">
            <span className="text-[10px] text-slate-400 tracking-wider uppercase">Throughput</span>
            <span className="text-xs font-bold text-emerald-400 glow-emerald">{gbps} Gbps</span>
          </div>
          <div className="mt-1 w-[120px] h-[30px]">
            <svg className="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparkPoints}
              />
            </svg>
          </div>
        </div>

        <div className="w-[1px] h-8 bg-cyan-500/20" />

        {/* 3. Active Nodes */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 tracking-wider uppercase">Active Nodes</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-amber-400 glow-amber">
              {state.scalingMode === "HORIZONTAL" ? state.totalNodes : 3}
            </span>
            <span className="text-[10px] text-slate-400">
              {state.scalingMode === "HORIZONTAL" ? "Pods" : `Units (${state.nodes[0]?.cpuCores || 16}C)`}
            </span>
          </div>
          <span className="text-[9px] text-emerald-400">Auto-Scale: {state.autoScalingEnabled ? "ON" : "OFF"}</span>
        </div>

        <div className="w-[1px] h-8 bg-cyan-500/20" />

        {/* 4. CPU Util. Segmented Bars */}
        <div className="flex flex-col min-w-[110px]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 tracking-wider uppercase">CPU Util.</span>
            <span
              className={`text-xs font-bold ${
                state.averageCpuPercent > 85
                  ? "text-rose-400 glow-ruby"
                  : state.averageCpuPercent > 70
                  ? "text-amber-400 glow-amber"
                  : "text-cyan-400 glow-cyan"
              }`}
            >
              {state.averageCpuPercent}%
            </span>
          </div>
          {/* LED segmented bar */}
          <div className="flex gap-[3px] mt-1.5 h-3">
            {Array.from({ length: 12 }).map((_, i) => {
              const threshold = (i + 1) * (100 / 12);
              const isFilled = state.averageCpuPercent >= threshold;
              const color =
                i >= 10
                  ? "bg-rose-500"
                  : i >= 7
                  ? "bg-amber-400"
                  : "bg-cyan-400";

              return (
                <div
                  key={i}
                  className={`flex-1 rounded-[1px] transition-all duration-150 ${
                    isFilled
                      ? `${color} shadow-[0_0_6px_currentColor]`
                      : "bg-slate-800/80"
                  }`}
                />
              );
            })}
          </div>
        </div>

        <div className="w-[1px] h-8 bg-cyan-500/20" />

        {/* 5. Health Status Beacon */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full animate-beacon ${
              isHealthy
                ? "bg-emerald-400 shadow-[0_0_10px_#10b981]"
                : isDegraded
                ? "bg-amber-400 shadow-[0_0_10px_#f59e0b]"
                : "bg-rose-500 shadow-[0_0_12px_#ef4444]"
            }`}
          />
          <span
            className={`text-[10px] font-bold tracking-widest uppercase ${
              isHealthy
                ? "text-emerald-400"
                : isDegraded
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {state.systemHealth}
          </span>
        </div>
      </div>
    </div>
  );
};
