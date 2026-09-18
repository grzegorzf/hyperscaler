"use client";

import React, { useState, useMemo } from "react";
import { useSimulationStream, ServerNode } from "@/hooks/useSimulationStream";
import { HolographicCanvas } from "@/components/HolographicCanvas";
import { TelemetryHUD } from "@/components/TelemetryHUD";
import { TrafficStormSlider } from "@/components/TrafficStormSlider";
import { ScalingControl } from "@/components/ScalingControl";
import { CdnSlider } from "@/components/CdnSlider";
import { ChaosControl } from "@/components/ChaosControl";
import { NodeInspectorModal } from "@/components/NodeInspectorModal";
import { CloudCostHUD } from "@/components/CloudCostHUD";
import { MobileDrawer } from "@/components/MobileDrawer";
import { CloudArbitrageModal } from "@/components/CloudArbitrageModal";
import { ArchitectAdvisorBanner } from "@/components/ArchitectAdvisorBanner";
import { ScenarioSelector } from "@/components/ScenarioSelector";
import { TelemetrySparklines } from "@/components/TelemetrySparklines";
import { ExportReportModal } from "@/components/ExportReportModal";
import type { CloudProvider } from "@/lib/simulation/cloudCosts";
import { getMultiCloudComparison } from "@/lib/simulation/cloudArbitrage";
import { generateArchitectureInsights } from "@/lib/simulation/advisor";
import { calculateCarbonFootprint } from "@/lib/simulation/carbonFootprint";
import { generateArchitectureReportMarkdown } from "@/lib/simulation/reportExporter";
import type { ArchitectureScenario } from "@/lib/simulation/scenarios";
import { Scale, FileText } from "lucide-react";

export default function HyperscalerPage() {
  const {
    state,
    trafficMultiplier,
    setTrafficMultiplier,
    throughputHistory,
    updateTraffic,
    updateScaling,
    triggerChaos,
  } = useSimulationStream();

  const [selectedNode, setSelectedNode] = useState<ServerNode | null>(null);
  const [cloudProvider, setCloudProvider] = useState<CloudProvider>("AWS");
  const [arbitrageOpen, setArbitrageOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Live Multi-Cloud Cost Comparison Arbitrage
  const coresPerTower = state.nodes[0]?.cpuCores || 16;
  const comparison = useMemo(
    () =>
      getMultiCloudComparison(
        state.trafficRps,
        state.edgeCacheHitRate,
        state.scalingMode,
        state.totalNodes,
        coresPerTower
      ),
    [
      state.trafficRps,
      state.edgeCacheHitRate,
      state.scalingMode,
      state.totalNodes,
      coresPerTower,
    ]
  );

  // Active Cloud Cost & Architect Advisory Insights
  const activeCosts =
    comparison.items.find((i) => i.provider === cloudProvider)?.costs ||
    comparison.items[0].costs;

  const insights = useMemo(
    () => generateArchitectureInsights(state, activeCosts),
    [state, activeCosts]
  );

  // Green Cloud Carbon Footprint & ESG Metrics
  const carbon = useMemo(
    () =>
      calculateCarbonFootprint(
        state.trafficRps,
        state.edgeCacheHitRate,
        state.scalingMode,
        state.totalNodes,
        coresPerTower,
        activeCosts.monthlyTotalGb
      ),
    [
      state.trafficRps,
      state.edgeCacheHitRate,
      state.scalingMode,
      state.totalNodes,
      coresPerTower,
      activeCosts,
    ]
  );

  // Pre-compiled Architecture & FinOps Executive Report
  const markdownReport = useMemo(
    () =>
      generateArchitectureReportMarkdown(state, comparison, carbon, insights),
    [state, comparison, carbon, insights]
  );

  // Handle traffic multiplier adjustment
  const handleMultiplierChange = (mult: number) => {
    setTrafficMultiplier(mult);
    const baseTraffic = 25000;
    const newTraffic = Math.round(baseTraffic * mult);
    updateTraffic(newTraffic, state.edgeCacheHitRate);
  };

  // Handle CDN cache hit rate adjustment
  const handleCacheRateChange = (rate: number) => {
    updateTraffic(state.trafficRps, rate);
  };

  // 1-Click Architecture Scenario Preset Switcher
  const handleSelectScenario = (scenario: ArchitectureScenario) => {
    setTrafficMultiplier(scenario.trafficMultiplier);
    const baseTraffic = 25000;
    const newTraffic = Math.round(baseTraffic * scenario.trafficMultiplier);
    updateTraffic(newTraffic, scenario.edgeCacheHitRate);
    updateScaling(
      scenario.scalingMode,
      scenario.autoScalingEnabled,
      scenario.scalingMode === "HORIZONTAL" && scenario.manualPods !== undefined
        ? scenario.manualPods - state.totalNodes
        : 0,
      scenario.scalingMode === "VERTICAL"
        ? scenario.manualCores
        : undefined
    );
    triggerChaos(scenario.chaosActive);
  };

  return (
    <main className="relative w-screen h-screen bg-[#06090e] overflow-hidden flex flex-col font-sans">
      {/* 1. Header Bar */}
      <header className="h-14 bg-gradient-to-b from-[#0e1626]/90 to-[#080d17]/70 border-b border-cyan-500/20 px-4 md:px-6 flex items-center justify-between backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)]">
            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-sm" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-white font-mono">
              Hyperscaler
            </h1>
            <p className="text-[9px] text-cyan-400/80 font-mono tracking-wider hidden sm:block">
              3D HOLOGRAPHIC CLUSTER SIMULATION
            </p>
          </div>
        </div>

        {/* Header Action Controls: Scenario Selector & Modals */}
        <div className="hidden lg:flex items-center gap-3">
          <ScenarioSelector onSelectScenario={handleSelectScenario} />

          <button
            onClick={() => setArbitrageOpen(true)}
            className="glass-panel px-3 py-1.5 rounded-xl border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white flex items-center gap-2 font-mono text-xs transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)] active:scale-95 cursor-pointer"
            title="Open Multi-Cloud Arbitrage Benchmark Matrix"
          >
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>Arbitrage Matrix</span>
          </button>

          <button
            onClick={() => setReportOpen(true)}
            className="glass-panel px-3 py-1.5 rounded-xl border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 hover:text-white flex items-center gap-2 font-mono text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-95 cursor-pointer"
            title="Generate & Export Architecture Spec Markdown"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Spec</span>
          </button>
        </div>

        {/* Global Quick Readout */}
        <div className="hidden md:flex items-center gap-6 xl:gap-8 font-mono text-xs">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">
              Global Ingress
            </span>
            <span className="font-bold text-cyan-400 glow-cyan">
              {state.trafficRps.toLocaleString()} req/s
            </span>
          </div>

          <div className="w-[1px] h-6 bg-cyan-500/20" />

          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">
              CDN Absorption
            </span>
            <span className="font-bold text-emerald-400 glow-emerald">
              {Math.round(state.edgeCacheHitRate * 100)}%
            </span>
          </div>

          <div className="w-[1px] h-6 bg-cyan-500/20" />

          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">
              Architecture
            </span>
            <span className="font-bold text-amber-400 glow-amber">
              {state.scalingMode === "HORIZONTAL" ? "HORIZONTAL MESH" : "VERTICAL BOOST"}
            </span>
          </div>

          <div className="w-[1px] h-6 bg-cyan-500/20" />

          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">
              Cloud Target
            </span>
            <span
              className={`font-bold ${
                cloudProvider === "AWS"
                  ? "text-amber-400 glow-amber"
                  : cloudProvider === "GCP"
                  ? "text-blue-400"
                  : "text-sky-400 glow-cyan"
              }`}
            >
              {cloudProvider}
            </span>
          </div>
        </div>

        {/* Mobile Quick Status Header */}
        <div className="flex md:hidden items-center gap-2 font-mono text-[10px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-cyan-500/20">
            <div
              className={`w-1.5 h-1.5 rounded-full animate-beacon ${
                state.systemHealth === "NOMINAL"
                  ? "bg-emerald-400 shadow-[0_0_6px_#10b981]"
                  : state.systemHealth === "DEGRADED"
                  ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                  : "bg-rose-500 shadow-[0_0_8px_#ef4444]"
              }`}
            />
            <span className="font-bold text-cyan-400">
              {(state.trafficRps / 1000).toFixed(0)}k req/s
            </span>
            <span className="text-slate-600">|</span>
            <span
              className={`font-bold ${
                cloudProvider === "AWS"
                  ? "text-amber-400"
                  : cloudProvider === "GCP"
                  ? "text-blue-400"
                  : "text-sky-400"
              }`}
            >
              {cloudProvider}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Central 3D Holographic Canvas Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* The 60 FPS Canvas Engine */}
        <HolographicCanvas state={state} onSelectNode={setSelectedNode} />

        {/* Live Senior Cloud Architect Advisory Ticker */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-xl pointer-events-auto">
          <ArchitectAdvisorBanner insights={insights} />
        </div>

        {/* Desktop Top-Right Telemetry & Cost Modeling Deck */}
        <div className="hidden md:flex absolute top-14 right-6 z-20 flex-col items-end gap-3 pointer-events-auto max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
          <TelemetryHUD state={state} history={throughputHistory} />
          <CloudCostHUD
            provider={cloudProvider}
            onProviderChange={setCloudProvider}
            onOpenArbitrage={() => setArbitrageOpen(true)}
            state={state}
          />
          <TelemetrySparklines
            state={state}
            hourlyBurnRate={activeCosts.hourlyBurnRate}
          />
        </div>

        {/* Desktop Left Interactive Control Dock */}
        <div className="hidden md:flex absolute bottom-6 left-6 z-20 flex-col gap-3 pointer-events-auto">
          {/* Scenario Quick Selector (if screen is not large enough for header) */}
          <div className="lg:hidden">
            <ScenarioSelector onSelectScenario={handleSelectScenario} />
          </div>

          {/* Traffic Storm Multiplier */}
          <TrafficStormSlider
            trafficRps={state.trafficRps}
            multiplier={trafficMultiplier}
            onMultiplierChange={handleMultiplierChange}
          />

          {/* Edge CDN Cache Ratio */}
          <CdnSlider
            cacheHitRate={state.edgeCacheHitRate}
            onCacheRateChange={handleCacheRateChange}
          />

          {/* Scaling Architecture Toggle */}
          <ScalingControl
            state={state}
            onScaleChange={updateScaling}
          />

          {/* Chaos Monkey Outage Trigger */}
          <ChaosControl
            chaosActive={state.chaosActive}
            onChaosToggle={triggerChaos}
          />
        </div>

        {/* Selected Node Details Drawer */}
        <NodeInspectorModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />

        {/* Desktop Bottom-Right Legend */}
        <div className="hidden md:flex absolute bottom-6 right-6 z-20 glass-panel rounded-xl px-4 py-2.5 border border-cyan-500/20 items-center gap-5 text-[10px] font-mono text-slate-400 pointer-events-auto">
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

        {/* Mobile Interactive Action Dock & Bottom Sheet */}
        <MobileDrawer
          state={state}
          throughputHistory={throughputHistory}
          trafficMultiplier={trafficMultiplier}
          onMultiplierChange={handleMultiplierChange}
          onCacheRateChange={handleCacheRateChange}
          onScaleChange={updateScaling}
          onChaosToggle={triggerChaos}
          cloudProvider={cloudProvider}
          onProviderChange={setCloudProvider}
          onOpenArbitrage={() => setArbitrageOpen(true)}
          onOpenExportReport={() => setReportOpen(true)}
          onSelectScenario={handleSelectScenario}
          hourlyBurnRate={activeCosts.hourlyBurnRate}
        />

        {/* Multi-Cloud Arbitrage Modal */}
        <CloudArbitrageModal
          isOpen={arbitrageOpen}
          onClose={() => setArbitrageOpen(false)}
          comparison={comparison}
        />

        {/* Architecture Spec & Executive FinOps Report Exporter */}
        <ExportReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          markdownContent={markdownReport}
        />
      </div>
    </main>
  );
}
