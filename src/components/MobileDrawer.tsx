"use client";

import React, { useState } from "react";
import type { ClusterState } from "@/hooks/useSimulationStream";
import type { CloudProvider } from "@/lib/simulation/cloudCosts";
import type { ArchitectureScenario } from "@/lib/simulation/scenarios";
import { Sliders, BarChart3, Cloud, Flame, X, ChevronUp, Scale, FileText } from "lucide-react";
import { TrafficStormSlider } from "./TrafficStormSlider";
import { CdnSlider } from "./CdnSlider";
import { ScalingControl } from "./ScalingControl";
import { ChaosControl } from "./ChaosControl";
import { TelemetryHUD } from "./TelemetryHUD";
import { CloudCostHUD } from "./CloudCostHUD";
import { ScenarioSelector } from "./ScenarioSelector";
import { TelemetrySparklines } from "./TelemetrySparklines";

export interface MobileDrawerProps {
  state: ClusterState;
  throughputHistory: number[];
  trafficMultiplier: number;
  onMultiplierChange: (mult: number) => void;
  onCacheRateChange: (rate: number) => void;
  onScaleChange: (
    mode: "HORIZONTAL" | "VERTICAL",
    autoScale: boolean,
    delta?: number,
    cores?: number
  ) => void;
  onChaosToggle: (active: boolean) => void;
  cloudProvider: CloudProvider;
  onProviderChange: (provider: CloudProvider) => void;
  onOpenArbitrage: () => void;
  onOpenExportReport: () => void;
  onSelectScenario: (scenario: ArchitectureScenario) => void;
  hourlyBurnRate: number;
}

type MobileTab = "NONE" | "CONTROLS" | "TELEMETRY" | "COSTS";

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  state,
  throughputHistory,
  trafficMultiplier,
  onMultiplierChange,
  onCacheRateChange,
  onScaleChange,
  onChaosToggle,
  cloudProvider,
  onProviderChange,
  onOpenArbitrage,
  onOpenExportReport,
  onSelectScenario,
  hourlyBurnRate,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>("NONE");

  const toggleTab = (tab: MobileTab) => {
    setActiveTab((prev) => (prev === tab ? "NONE" : tab));
  };

  const isHealthy = state.systemHealth === "NOMINAL";
  const isDegraded = state.systemHealth === "DEGRADED";

  return (
    <>
      {/* 1. Floating Bottom Action Dock (Always visible on mobile when sheet is closed) */}
      <div className="fixed bottom-3 left-3 right-3 z-30 md:hidden pointer-events-auto pb-safe">
        <div className="glass-panel rounded-2xl p-1.5 border border-cyan-500/30 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          {/* Controls Tab Button */}
          <button
            onClick={() => toggleTab("CONTROLS")}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-1 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all touch-manipulation ${
              activeTab === "CONTROLS"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Controls</span>
          </button>

          {/* Telemetry Tab Button */}
          <button
            onClick={() => toggleTab("TELEMETRY")}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-1 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all touch-manipulation ${
              activeTab === "TELEMETRY"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Telemetry</span>
          </button>

          {/* Cloud Costs Tab Button */}
          <button
            onClick={() => toggleTab("COSTS")}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-1 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all touch-manipulation ${
              activeTab === "COSTS"
                ? "bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{cloudProvider}</span>
          </button>

          {/* Quick Chaos Outage Button */}
          <button
            onClick={() => onChaosToggle(!state.chaosActive)}
            title="Trigger Chaos Monkey"
            className={`min-h-[44px] w-11 flex items-center justify-center rounded-xl border transition-all touch-manipulation ${
              state.chaosActive
                ? "bg-rose-500/40 border-rose-500 text-rose-300 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                : "bg-rose-950/30 border-rose-800/50 text-rose-400 hover:text-rose-200"
            }`}
          >
            <Flame className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Expanded Mobile Bottom Sheet */}
      {activeTab !== "NONE" && (
        <div className="fixed inset-0 z-40 md:hidden flex flex-col justify-end">
          {/* Backdrop (tap to dismiss) */}
          <div
            onClick={() => setActiveTab("NONE")}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity pointer-events-auto"
          />

          {/* Slide-Up Drawer */}
          <div className="relative z-50 glass-panel rounded-t-3xl border-t border-cyan-500/40 p-4 max-h-[85vh] flex flex-col shadow-[0_-12px_40px_rgba(0,0,0,0.9)] animate-slide-up pointer-events-auto pb-safe">
            {/* Drag Handle Indicator */}
            <div
              onClick={() => setActiveTab("NONE")}
              className="w-12 h-1 bg-slate-600/80 rounded-full mx-auto mb-3 cursor-pointer"
            />

            {/* Header Switcher & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
              {/* Tabs Switcher in Sheet */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-slate-700/60 font-mono text-[10px]">
                <button
                  onClick={() => setActiveTab("CONTROLS")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all min-h-[36px] ${
                    activeTab === "CONTROLS"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50"
                      : "text-slate-400"
                  }`}
                >
                  Controls
                </button>
                <button
                  onClick={() => setActiveTab("TELEMETRY")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all min-h-[36px] ${
                    activeTab === "TELEMETRY"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/50"
                      : "text-slate-400"
                  }`}
                >
                  Telemetry
                </button>
                <button
                  onClick={() => setActiveTab("COSTS")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all min-h-[36px] ${
                    activeTab === "COSTS"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-400/50"
                      : "text-slate-400"
                  }`}
                >
                  Costs ({cloudProvider})
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setActiveTab("NONE")}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white touch-manipulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Matrix & Report Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => {
                  setActiveTab("NONE");
                  onOpenArbitrage();
                }}
                className="min-h-[44px] py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 active:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center gap-2 touch-manipulation transition-all"
              >
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>Compare Clouds</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("NONE");
                  onOpenExportReport();
                }}
                className="min-h-[44px] py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold flex items-center justify-center gap-2 touch-manipulation transition-all"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Spec (.md)</span>
              </button>
            </div>

            {/* Drawer Body with smooth scrolling */}
            <div className="overflow-y-auto pr-1 flex flex-col gap-3.5 pb-6">
              {activeTab === "CONTROLS" && (
                <div className="flex flex-col gap-3">
                  {/* Predefined Architecture Scenario Presets */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                      Architecture Scenario Preset
                    </span>
                    <ScenarioSelector
                      onSelectScenario={onSelectScenario}
                      className="w-full"
                    />
                  </div>

                  <TrafficStormSlider
                    trafficRps={state.trafficRps}
                    multiplier={trafficMultiplier}
                    onMultiplierChange={onMultiplierChange}
                    className="w-full"
                  />
                  <CdnSlider
                    cacheHitRate={state.edgeCacheHitRate}
                    onCacheRateChange={onCacheRateChange}
                    className="w-full"
                  />
                  <ScalingControl
                    state={state}
                    onScaleChange={onScaleChange}
                    className="w-full"
                  />
                  <ChaosControl
                    chaosActive={state.chaosActive}
                    onChaosToggle={onChaosToggle}
                    className="w-full"
                  />
                </div>
              )}

              {activeTab === "TELEMETRY" && (
                <div className="flex flex-col gap-3">
                  <TelemetryHUD
                    state={state}
                    history={throughputHistory}
                    className="w-full"
                  />
                  <TelemetrySparklines
                    state={state}
                    hourlyBurnRate={hourlyBurnRate}
                    className="w-full"
                  />
                  {/* Legend inside mobile telemetry */}
                  <div className="glass-panel rounded-xl px-4 py-3 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                      <span>Edge Hit (5ms)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                      <span>Origin Pass (30ms)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />
                      <span>Dropped / Throttled</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "COSTS" && (
                <div className="flex flex-col gap-3">
                  <CloudCostHUD
                    provider={cloudProvider}
                    onProviderChange={onProviderChange}
                    onOpenArbitrage={() => {
                      setActiveTab("NONE");
                      onOpenArbitrage();
                    }}
                    state={state}
                    className="w-full max-w-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
