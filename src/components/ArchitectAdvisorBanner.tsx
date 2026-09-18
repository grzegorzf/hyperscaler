"use client";

import React, { useState } from "react";
import type { ArchitectureInsight } from "@/lib/simulation/advisor";
import {
  AlertTriangle,
  Flame,
  Info,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useMouseSpotlight } from "@/hooks/useMouseSpotlight";
import { triggerHaptic } from "@/lib/browser/webApis";

interface ArchitectAdvisorBannerProps {
  insights: ArchitectureInsight[];
  className?: string;
}

export const ArchitectAdvisorBanner: React.FC<ArchitectAdvisorBannerProps> = ({
  insights,
  className = "",
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const spotlight = useMouseSpotlight();

  if (!insights || insights.length === 0) return null;

  const activeInsight = insights[activeIndex % insights.length];

  const severityConfig = {
    SUCCESS: {
      border: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    INFO: {
      border: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
      icon: <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />,
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    },
    WARNING: {
      border: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    CRITICAL: {
      border: "border-rose-500/50 bg-rose-500/15 text-rose-300 animate-pulse",
      icon: <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
      badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    },
  }[activeInsight.severity];

  const handleNext = () => {
    triggerHaptic("light");
    setActiveIndex((prev) => (prev + 1) % insights.length);
  };

  const handlePrev = () => {
    triggerHaptic("light");
    setActiveIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  return (
    <div
      onMouseMove={spotlight.onMouseMove}
      onMouseLeave={spotlight.onMouseLeave}
      className={`glass-panel gpu-spotlight cyber-hud-notch rounded-xl px-4 py-2.5 border ${severityConfig.border} flex items-center justify-between gap-3 text-xs font-mono transition-all duration-300 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {severityConfig.icon}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-[11px] truncate">
              {activeInsight.title}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold uppercase ${severityConfig.badge}`}
            >
              {activeInsight.category}
            </span>
            {activeInsight.metricBadge && (
              <span className="text-[9px] text-slate-400 font-mono">
                [{activeInsight.metricBadge}]
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-300 line-clamp-1">
            {activeInsight.message}
            {activeInsight.actionRecommendation && (
              <span className="text-cyan-300 font-semibold ml-1">
                → {activeInsight.actionRecommendation}
              </span>
            )}
          </span>
        </div>
      </div>

      {insights.length > 1 && (
        <div className="flex items-center gap-1 shrink-0 text-[10px] text-slate-400">
          <span>
            {activeIndex + 1}/{insights.length}
          </span>
          <button
            onClick={handlePrev}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
