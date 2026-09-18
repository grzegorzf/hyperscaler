"use client";

import React, { useState } from "react";
import type { MultiCloudComparison } from "@/lib/simulation/cloudArbitrage";
import { X, Trophy, Check, Zap, Layers, Server, Network } from "lucide-react";

interface CloudArbitrageModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: MultiCloudComparison;
}

export const CloudArbitrageModal: React.FC<CloudArbitrageModalProps> = ({
  isOpen,
  onClose,
  comparison,
}) => {
  const [discountTier, setDiscountTier] = useState<"ON_DEMAND" | "1_YEAR" | "3_YEAR">("ON_DEMAND");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl glass-panel rounded-2xl border border-cyan-500/30 p-6 flex flex-col gap-5 text-mono text-xs shadow-[0_0_50px_rgba(0,240,255,0.15)] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase text-white font-mono flex items-center gap-2">
                Multi-Cloud Arbitrage Matrix
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  LIVE BENCHMARK
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Side-by-side financial comparison for current active traffic & node topology
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Commitment Tier Switcher */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700/50">
          <span className="text-[11px] text-slate-300 font-semibold flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Pricing Commitment Plan:
          </span>
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setDiscountTier("ON_DEMAND")}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                discountTier === "ON_DEMAND"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              On-Demand (0% Off)
            </button>
            <button
              onClick={() => setDiscountTier("1_YEAR")}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                discountTier === "1_YEAR"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              1-Year Commit (~30% Off Compute)
            </button>
            <button
              onClick={() => setDiscountTier("3_YEAR")}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                discountTier === "3_YEAR"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              3-Year Commit (~45% Off Compute)
            </button>
          </div>
        </div>

        {/* 3-Column Cloud Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparison.items.map((item) => {
            const isAws = item.provider === "AWS";
            const isGcp = item.provider === "GCP";

            const effectiveMonthly =
              discountTier === "ON_DEMAND"
                ? item.costs.monthlyTotal
                : discountTier === "1_YEAR"
                ? item.committedDiscounts.oneYearCommitMonthly
                : item.committedDiscounts.threeYearCommitMonthly;

            const effectiveHourly = (effectiveMonthly / 732).toFixed(2);
            const annualCost = effectiveMonthly * 12;

            const providerColor = isAws
              ? "border-amber-500/40 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
              : isGcp
              ? "border-blue-500/40 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.08)]"
              : "border-sky-500/40 bg-sky-500/5 shadow-[0_0_20px_rgba(14,165,233,0.08)]";

            return (
              <div
                key={item.provider}
                className={`relative rounded-xl p-4.5 border ${providerColor} flex flex-col justify-between gap-4`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isAws ? "bg-amber-400" : isGcp ? "bg-blue-400" : "bg-sky-400"
                      }`}
                    />
                    <span className="font-bold text-sm text-white tracking-wider">
                      {item.provider}
                    </span>
                  </div>

                  {item.isCheapest ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> CHEAPEST
                    </span>
                  ) : (
                    <span className="text-[9px] text-rose-400/80 font-mono">
                      +${item.deltaVsCheapestMonthly.toLocaleString()}/mo
                    </span>
                  )}
                </div>

                {/* Main Price */}
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                    {discountTier === "ON_DEMAND"
                      ? "Estimated Monthly"
                      : `${discountTier.replace("_", "-")} Plan`}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      ${effectiveMonthly.toLocaleString()}
                    </span>
                    <span className="text-slate-500 text-[10px]">/mo</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    ${effectiveHourly} / hr · ${annualCost.toLocaleString()} / yr
                  </div>
                </div>

                {/* Itemized Components */}
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-700/40 text-[10px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Server className="w-3 h-3 text-amber-400" /> Compute
                    </span>
                    <span className="font-semibold text-white">
                      ${item.costs.computeMonthly.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Network className="w-3 h-3 text-cyan-400" /> CDN / Egress
                    </span>
                    <span className="font-semibold text-white">
                      ${item.costs.cdnMonthly.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Layers className="w-3 h-3 text-emerald-400" /> Balancer
                    </span>
                    <span className="font-semibold text-white">
                      ${item.costs.loadBalancerMonthly.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Savings Banner */}
                {discountTier !== "ON_DEMAND" && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-300 font-semibold flex items-center justify-between">
                    <span>Commit Savings:</span>
                    <span>
                      +$
                      {(discountTier === "1_YEAR"
                        ? item.committedDiscounts.oneYearAnnualSavings
                        : item.committedDiscounts.threeYearAnnualSavings
                      ).toLocaleString()}
                      /yr
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Automated FinOps Recommendation Footer */}
        <div className="px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-start gap-2.5">
          <span className="text-base mt-0.5">💡</span>
          <div>
            <span className="font-bold text-white uppercase tracking-wider block mb-0.5">
              Automated FinOps Recommendation
            </span>
            <span>{comparison.recommendation}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
