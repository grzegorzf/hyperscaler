"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { Scale, FileText, MonitorPlay, RotateCcw } from "lucide-react";
import {
  triggerHaptic,
  requestWakeLock,
  releaseWakeLock,
  subscribeWakeLock,
} from "@/lib/browser/webApis";
import { safeStartViewTransition } from "@/lib/browser/viewTransitions";
import { useClusterBroadcast } from "@/hooks/useClusterBroadcast";
import { DraggablePanel } from "@/components/DraggablePanel";
import { clearStoredLayout, PanelPosition } from "@/lib/browser/draggableMath";

const DEFAULT_HUD_POSITIONS: Record<string, PanelPosition> = {
  architectAdvisor: { x: 420, y: 68 },
  telemetryHud: { x: 2500, y: 68 },
  cloudCostHud: { x: 2500, y: 220 },
  telemetrySparklines: { x: 2500, y: 490 },
  controlDock: { x: 20, y: 300 },
};

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
  const [wakeLockActive, setWakeLockActive] = useState(false);

  // Screen Wake Lock API subscription
  useEffect(() => {
    return subscribeWakeLock((active) => {
      setWakeLockActive(active);
    });
  }, []);

  const handleToggleWakeLock = async () => {
    triggerHaptic("medium");
    if (wakeLockActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  };

  // Cross-Tab Cluster Synchronization via BroadcastChannel
  const {
    broadcastTraffic,
    broadcastScaling,
    broadcastChaos,
    broadcastProvider,
  } = useClusterBroadcast({
    onTrafficSync: (rps, cdn, mult) => {
      setTrafficMultiplier(mult);
      updateTraffic(rps, cdn);
    },
    onScalingSync: (mode, auto, delta, cores) => {
      updateScaling(mode, auto, delta, cores);
    },
    onChaosSync: (active) => {
      triggerChaos(active);
    },
    onProviderSync: (provider) => {
      safeStartViewTransition(() => {
        setCloudProvider(provider);
      });
    },
  });

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
    broadcastTraffic(newTraffic, state.edgeCacheHitRate, mult);
  };

  // Handle CDN cache hit rate adjustment
  const handleCacheRateChange = (rate: number) => {
    updateTraffic(state.trafficRps, rate);
    broadcastTraffic(state.trafficRps, rate, trafficMultiplier);
  };

  // 1-Click Architecture Scenario Preset Switcher
  const handleSelectScenario = (scenario: ArchitectureScenario) => {
    triggerHaptic("heavy");
    safeStartViewTransition(() => {
      setTrafficMultiplier(scenario.trafficMultiplier);
      const baseTraffic = 25000;
      const newTraffic = Math.round(baseTraffic * scenario.trafficMultiplier);
      updateTraffic(newTraffic, scenario.edgeCacheHitRate);
      const delta =
        scenario.scalingMode === "HORIZONTAL" && scenario.manualPods !== undefined
          ? scenario.manualPods - state.totalNodes
          : 0;
      updateScaling(
        scenario.scalingMode,
        scenario.autoScalingEnabled,
        delta,
        scenario.scalingMode === "VERTICAL" ? scenario.manualCores : undefined
      );
      triggerChaos(scenario.chaosActive);

      broadcastTraffic(newTraffic, scenario.edgeCacheHitRate, scenario.trafficMultiplier);
      broadcastScaling(
        scenario.scalingMode,
        scenario.autoScalingEnabled,
        delta,
        scenario.scalingMode === "VERTICAL" ? scenario.manualCores : undefined
      );
      broadcastChaos(scenario.chaosActive);
    });
  };

  const handleProviderChange = (p: CloudProvider) => {
    safeStartViewTransition(() => {
      setCloudProvider(p);
      broadcastProvider(p);
    });
  };

  const handleScalingChange = (
    mode: "HORIZONTAL" | "VERTICAL",
    autoScale: boolean,
    delta: number = 0,
    cores?: number
  ) => {
    safeStartViewTransition(() => {
      updateScaling(mode, autoScale, delta, cores);
      broadcastScaling(mode, autoScale, delta, cores);
    });
  };

  const handleChaosToggle = (active: boolean) => {
    triggerChaos(active);
    broadcastChaos(active);
  };

  const handleOpenArbitrage = () => {
    triggerHaptic("light");
    safeStartViewTransition(() => setArbitrageOpen(true));
  };

  const handleCloseArbitrage = () => {
    triggerHaptic("light");
    safeStartViewTransition(() => setArbitrageOpen(false));
  };

  const handleOpenReport = () => {
    triggerHaptic("light");
    safeStartViewTransition(() => setReportOpen(true));
  };

  const handleCloseReport = () => {
    triggerHaptic("light");
    safeStartViewTransition(() => setReportOpen(false));
  };

  const handleSelectNode = (node: ServerNode | null) => {
    if (node) triggerHaptic("light");
    safeStartViewTransition(() => setSelectedNode(node));
  };

  const handleResetHudLayout = () => {
    triggerHaptic("medium");
    clearStoredLayout();
    safeStartViewTransition(() => {
      window.dispatchEvent(new CustomEvent("hyperscaler:reset-hud-layout"));
    });
  };

  return (
    <main className="relative w-screen h-screen bg-[#06090e] overflow-hidden flex flex-col font-sans">
      {/* 1. Header Bar */}
      <header className="h-14 bg-gradient-to-b from-[#0e1626]/95 to-[#080d17]/85 border-b border-cyan-500/20 px-4 lg:px-6 flex items-center justify-between backdrop-blur-xl z-20 shrink-0">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)] bg-cyan-950/40">
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

        {/* Center: Action Controls Toolbar */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
          <ScenarioSelector onSelectScenario={handleSelectScenario} />

          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/50 border border-slate-800 shadow-inner">
            <button
              onClick={handleOpenArbitrage}
              className="h-9 px-3 rounded-lg border border-cyan-500/20 hover:border-cyan-400/60 bg-cyan-500/5 hover:bg-cyan-500/15 text-cyan-300 hover:text-white flex items-center gap-1.5 font-mono text-xs transition-all active:scale-95 cursor-pointer"
              title="Open Multi-Cloud Arbitrage Benchmark Matrix"
            >
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              <span>Arbitrage</span>
            </button>

            <button
              onClick={handleOpenReport}
              className="h-9 px-3 rounded-lg border border-emerald-500/20 hover:border-emerald-400/60 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-300 hover:text-white flex items-center gap-1.5 font-mono text-xs transition-all active:scale-95 cursor-pointer"
              title="Generate & Export Architecture Spec Markdown"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Spec (.md)</span>
            </button>

            {/* Screen Wake Lock (Kiosk Mode) */}
            <button
              onClick={handleToggleWakeLock}
              className={`h-9 px-3 rounded-lg border flex items-center gap-1.5 font-mono text-xs transition-all active:scale-95 cursor-pointer ${
                wakeLockActive
                  ? "border-amber-400/60 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
              title={
                wakeLockActive
                  ? "Kiosk Mode Active: Display sleep is prevented for cluster monitoring"
                  : "Enable Kiosk Mode: Keeps screen awake during cluster simulations"
              }
            >
              <MonitorPlay className={`w-3.5 h-3.5 ${wakeLockActive ? "text-amber-400 animate-pulse" : "text-slate-400"}`} />
              <span>{wakeLockActive ? "Kiosk On" : "Kiosk"}</span>
            </button>

            {/* Reset HUD Layout */}
            <button
              onClick={handleResetHudLayout}
              className="h-9 px-2.5 rounded-lg border border-transparent hover:border-slate-700/60 bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-mono text-xs transition-all active:scale-95 cursor-pointer"
              title="Reset all draggable HUD panels to their default positions"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden 2xl:inline">Reset HUD</span>
            </button>
          </div>
        </div>

        {/* Right: Contained Telemetry Capsule (xl screens and above) */}
        <div className="hidden xl:flex items-center gap-3.5 px-3.5 py-1.5 rounded-xl bg-black/60 border border-slate-800 font-mono text-xs shadow-inner shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-beacon shadow-[0_0_6px_#00f0ff]" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Ingress</span>
            <span className="font-bold text-cyan-400 glow-cyan">
              {state.trafficRps.toLocaleString()}
              <span className="text-[9px] text-slate-500 font-normal ml-0.5">req/s</span>
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">CDN</span>
            <span className="font-bold text-emerald-400 glow-emerald">
              {Math.round(state.edgeCacheHitRate * 100)}%
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Mode</span>
            <span className="font-bold text-amber-400">
              {state.scalingMode === "HORIZONTAL" ? `${state.totalNodes} Pods` : `${state.nodes[0]?.cpuCores || 16}C`}
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cloud</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                cloudProvider === "AWS"
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                  : cloudProvider === "GCP"
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                  : "bg-sky-500/15 border-sky-500/40 text-sky-300 glow-cyan"
              }`}
            >
              {cloudProvider}
            </span>
          </div>
        </div>

        {/* Right (compact fallback for mobile, tablet, and medium screens) */}
        <div className="flex xl:hidden items-center gap-2 font-mono text-[10px] shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-800">
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
            <span className="text-slate-700">|</span>
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
        <HolographicCanvas state={state} onSelectNode={handleSelectNode} />

        {/* Draggable Live Senior Cloud Architect Advisory Ticker */}
        <DraggablePanel
          id="architect-advisor"
          title="Architect Advisory"
          defaultPosition={DEFAULT_HUD_POSITIONS.architectAdvisor}
          className="w-[92%] max-w-xl"
        >
          <ArchitectAdvisorBanner insights={insights} />
        </DraggablePanel>

        {/* Draggable Telemetry HUD */}
        <DraggablePanel
          id="telemetry-hud"
          title="Telemetry Engine"
          defaultPosition={DEFAULT_HUD_POSITIONS.telemetryHud}
          className="w-full max-w-[420px]"
        >
          <TelemetryHUD state={state} history={throughputHistory} className="w-full" />
        </DraggablePanel>

        {/* Draggable Cloud Cost Modeling HUD */}
        <DraggablePanel
          id="cloud-cost-hud"
          title="Multi-Cloud Cost Model"
          defaultPosition={DEFAULT_HUD_POSITIONS.cloudCostHud}
          className="w-full max-w-[420px]"
        >
          <CloudCostHUD
            provider={cloudProvider}
            onProviderChange={handleProviderChange}
            onOpenArbitrage={handleOpenArbitrage}
            state={state}
            className="w-full"
          />
        </DraggablePanel>

        {/* Draggable SRE Telemetry & 99.99% SLO Sparklines */}
        <DraggablePanel
          id="telemetry-sparklines"
          title="SRE SLO & Sparklines"
          defaultPosition={DEFAULT_HUD_POSITIONS.telemetrySparklines}
          className="w-full max-w-[420px]"
        >
          <TelemetrySparklines
            state={state}
            hourlyBurnRate={activeCosts.hourlyBurnRate}
            className="w-full"
          />
        </DraggablePanel>

        {/* Draggable Desktop Left Interactive Control Dock */}
        <DraggablePanel
          id="control-dock"
          title="Cluster Control Dock"
          defaultPosition={DEFAULT_HUD_POSITIONS.controlDock}
          className="w-[340px] md:w-[320px]"
        >
          <div className="flex flex-col gap-2.5">
            {/* Scenario Quick Selector (if screen is not large enough for header) */}
            <div className="lg:hidden">
              <ScenarioSelector onSelectScenario={handleSelectScenario} />
            </div>

            {/* Traffic Storm Multiplier */}
            <TrafficStormSlider
              trafficRps={state.trafficRps}
              multiplier={trafficMultiplier}
              onMultiplierChange={handleMultiplierChange}
              className="w-full"
            />

            {/* Edge CDN Cache Ratio */}
            <CdnSlider
              cacheHitRate={state.edgeCacheHitRate}
              onCacheRateChange={handleCacheRateChange}
              className="w-full"
            />

            {/* Scaling Architecture Toggle */}
            <ScalingControl
              state={state}
              onScaleChange={handleScalingChange}
              className="w-full"
            />

            {/* Chaos Monkey Outage Trigger */}
            <ChaosControl
              chaosActive={state.chaosActive}
              onChaosToggle={handleChaosToggle}
              className="w-full"
            />
          </div>
        </DraggablePanel>

        {/* Selected Node Details Drawer */}
        <NodeInspectorModal
          node={selectedNode}
          onClose={() => handleSelectNode(null)}
        />

        {/* Desktop Bottom-Right Legend */}
        <div className="hidden md:flex absolute bottom-6 right-6 z-20 glass-panel cyber-hud-notch rounded-xl px-4 py-2.5 border border-cyan-500/20 items-center gap-5 text-[10px] font-mono text-slate-400 pointer-events-auto">
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
          onScaleChange={handleScalingChange}
          onChaosToggle={handleChaosToggle}
          cloudProvider={cloudProvider}
          onProviderChange={handleProviderChange}
          onOpenArbitrage={handleOpenArbitrage}
          onOpenExportReport={handleOpenReport}
          onSelectScenario={handleSelectScenario}
          hourlyBurnRate={activeCosts.hourlyBurnRate}
          wakeLockActive={wakeLockActive}
          onToggleWakeLock={handleToggleWakeLock}
        />

        {/* Multi-Cloud Arbitrage Modal */}
        <CloudArbitrageModal
          isOpen={arbitrageOpen}
          onClose={handleCloseArbitrage}
          comparison={comparison}
        />

        {/* Architecture Spec & Executive FinOps Report Exporter */}
        <ExportReportModal
          isOpen={reportOpen}
          onClose={handleCloseReport}
          markdownContent={markdownReport}
        />
      </div>
    </main>
  );
}
