"use client";

import React, { useState } from "react";
import type { CloudProvider, CloudCostBreakdown } from "@/lib/simulation/cloudCosts";
import { calculateCloudCosts } from "@/lib/simulation/cloudCosts";
import type { ClusterState } from "@/hooks/useSimulationStream";
import {
  Cloud,
  ChevronDown,
  ChevronUp,
  Server,
  Network,
  Layers,
  Sparkles,
  Scale,
  Leaf,
} from "lucide-react";
import { calculateCarbonFootprint } from "@/lib/simulation/carbonFootprint";
import { triggerHaptic } from "@/lib/browser/webApis";
import { safeStartViewTransition } from "@/lib/browser/viewTransitions";
import { useMouseSpotlight } from "@/hooks/useMouseSpotlight";

interface CloudCostHUDProps {
  provider: CloudProvider;
  onProviderChange: (provider: CloudProvider) => void;
  onOpenArbitrage?: () => void;
  state: ClusterState;
  className?: string;
}

export const CloudCostHUD: React.FC<CloudCostHUDProps> = ({
  provider,
  onProviderChange,
  onOpenArbitrage,
  state,
  className = "",
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const spotlight = useMouseSpotlight();

  const coresPerTower = state.nodes[0]?.cpuCores || 16;
  const costs: CloudCostBreakdown = calculateCloudCosts(
    provider,
    state.trafficRps,
    state.edgeCacheHitRate,
    state.scalingMode,
    state.totalNodes,
    coresPerTower
  );

  const carbon = calculateCarbonFootprint(
    state.trafficRps,
    state.edgeCacheHitRate,
    state.scalingMode,
    state.totalNodes,
    coresPerTower,
    costs.monthlyTotalGb
  );

  const handleProviderSelect = (p: CloudProvider) => {
    if (p === provider) return;
    triggerHaptic("medium");
    safeStartViewTransition(() => {
      onProviderChange(p);
    });
  };

  // Styling accents based on active cloud provider
  const providerTheme = {
    AWS: {
      border: "border-amber-500/30",
      activeBg: "bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]",
      badgeColor: "text-amber-400 glow-amber",
      accent: "#f59e0b",
      dot: "bg-amber-400 shadow-[0_0_8px_#f59e0b]",
    },
    GCP: {
      border: "border-blue-500/30",
      activeBg: "bg-blue-500/20 text-blue-300 border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.3)]",
      badgeColor: "text-blue-400",
      accent: "#3b82f6",
      dot: "bg-blue-400 shadow-[0_0_8px_#3b82f6]",
    },
    AZURE: {
      border: "border-sky-500/30",
      activeBg: "bg-sky-500/20 text-sky-300 border-sky-500/60 shadow-[0_0_12px_rgba(14,165,233,0.3)]",
      badgeColor: "text-sky-400 glow-cyan",
      accent: "#0ea5e9",
      dot: "bg-sky-400 shadow-[0_0_8px_#0ea5e9]",
    },
  }[provider];

  return (
    <div
      onMouseMove={spotlight.onMouseMove}
      onMouseLeave={spotlight.onMouseLeave}
      className={`glass-panel gpu-spotlight cyber-hud-notch rounded-xl px-4 py-3.5 md:px-5 md:py-4 border ${providerTheme.border} flex flex-col gap-3 font-mono text-xs w-full max-w-[420px] transition-all duration-300 pointer-events-auto ${className}`}
    >
      {/* 1. Provider Switch Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] text-slate-400 tracking-wider uppercase">
            Cloud Cost Model
          </span>
        </div>

        {/* The 3-way Cloud Switch */}
        <div className="flex items-center gap-2">
          {onOpenArbitrage && (
            <button
              onClick={() => {
                triggerHaptic("light");
                safeStartViewTransition(() => onOpenArbitrage());
              }}
              className="text-[9px] px-2 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 transition-all cursor-pointer"
              title="Open Side-by-Side Multi-Cloud Arbitrage Comparison"
            >
              <Scale className="w-3 h-3" />
              <span>Compare</span>
            </button>
          )}

          <div className="flex items-center p-0.5 rounded-lg bg-black/40 border border-slate-700/50">
            {(["AWS", "GCP", "AZURE"] as const).map((p) => {
              const isActive = provider === p;
              return (
                <button
                  key={p}
                  onClick={() => handleProviderSelect(p)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-wider transition-all duration-150 cursor-pointer ${
                    isActive
                      ? `${providerTheme.activeBg} border`
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-700/30">
        {/* Estimated Monthly */}
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider">
            Est. Monthly
          </span>
          <div className="flex items-baseline gap-0.5 mt-0.5">
            <span className={`text-lg font-bold ${providerTheme.badgeColor}`}>
              ${costs.monthlyTotal.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-500">/mo</span>
          </div>
        </div>

        {/* Hourly Burn Rate */}
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider">
            Burn Rate
          </span>
          <div className="flex items-baseline gap-0.5 mt-0.5">
            <span className="text-lg font-bold text-white">
              ${costs.hourlyBurnRate.toFixed(2)}
            </span>
            <span className="text-[9px] text-slate-500">/hr</span>
          </div>
        </div>

        {/* Cost per 1M Requests */}
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider">
            Per 1M Reqs
          </span>
          <div className="flex items-baseline gap-0.5 mt-0.5">
            <span className="text-base font-bold text-emerald-400 glow-emerald">
              ${costs.costPerMillionRequests.toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Edge CDN Savings Banner */}
      {costs.edgeSavingsMonthly > 0 && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Sparkles className="w-3 h-3 text-emerald-300" />
            <span>Edge Cache Savings</span>
          </div>
          <span className="font-bold text-emerald-300 glow-emerald">
            -${costs.edgeSavingsMonthly.toLocaleString()}/mo ({Math.round(state.edgeCacheHitRate * 100)}% offloaded)
          </span>
        </div>
      )}

      {/* 4. Collapsible Infrastructure Breakdown */}
      <div>
        <button
          onClick={() => {
            triggerHaptic("light");
            setDetailsOpen((prev) => !prev);
          }}
          className="w-full flex items-center justify-between text-[10px] text-slate-400 hover:text-slate-200 pt-1 transition-colors cursor-pointer"
        >
          <span className="uppercase tracking-wider">
            {costs.providerName} Breakdown
          </span>
          <span className="flex items-center gap-1 text-[9px] text-cyan-400">
            {detailsOpen ? (
              <>
                Hide Details <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Show Details <ChevronDown className="w-3 h-3" />
              </>
            )}
          </span>
        </button>

        {detailsOpen && (
          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-700/40 text-[11px] animate-fadeIn">
            {/* Compute Item */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px]">{costs.computeLabel}</span>
              </div>
              <span className="font-bold text-white">
                ${costs.computeMonthly.toLocaleString()}
              </span>
            </div>

            {/* CDN & Egress Item */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px]">{costs.cdnLabel}</span>
              </div>
              <span className="font-bold text-white">
                ${costs.cdnMonthly.toLocaleString()}
              </span>
            </div>

            {/* Load Balancing Item */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px]">{costs.loadBalancerLabel}</span>
              </div>
              <span className="font-bold text-white">
                ${costs.loadBalancerMonthly.toLocaleString()}
              </span>
            </div>

            {/* Scale & Traffic Summary Footnote */}
            <div className="mt-1 pt-1.5 border-t border-slate-800 text-[9px] text-slate-500 flex items-center justify-between">
              <span>Traffic: ~{costs.monthlyRequestsBillion}B req/mo</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold" title={`${carbon.ecoScoreLabel} (${carbon.monthlyKgCo2e} kg CO2e/mo)`}>
                <Leaf className="w-2.5 h-2.5 text-emerald-400" /> Eco: {carbon.ecoScore}
              </span>
              <span>Bandwidth: ~{costs.monthlyTotalGb.toLocaleString()} GB</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
