"use client";

import React, { useState } from "react";
import {
  ARCHITECTURE_SCENARIOS,
  type ArchitectureScenario,
  type ScenarioId,
} from "@/lib/simulation/scenarios";
import { Compass, Sparkles, ChevronDown, Check } from "lucide-react";

interface ScenarioSelectorProps {
  onSelectScenario: (scenario: ArchitectureScenario) => void;
  className?: string;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  onSelectScenario,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<ScenarioId>("STEADY_STATE");

  const currentScenario = ARCHITECTURE_SCENARIOS.find((s) => s.id === selectedId) || ARCHITECTURE_SCENARIOS[0];

  const handleSelect = (scenario: ArchitectureScenario) => {
    setSelectedId(scenario.id);
    setIsOpen(false);
    onSelectScenario(scenario);
  };

  return (
    <div className={`relative font-mono text-xs ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="glass-panel rounded-xl px-3.5 py-2 border border-cyan-500/30 hover:border-cyan-400 flex items-center justify-between gap-3 text-slate-200 transition-all duration-200 w-full md:w-auto"
      >
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            Scenario:
          </span>
          <span className="font-bold text-white text-[11px]">
            {currentScenario.name}
          </span>
        </div>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-80 md:w-96 glass-panel rounded-xl border border-cyan-500/40 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 flex flex-col gap-1.5 animate-fadeIn">
          <div className="px-2 py-1 text-[9px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/40 pb-1.5 mb-1 flex items-center justify-between">
            <span>Predefined Architecture Scenarios</span>
            <span className="text-cyan-400">1-Click Benchmark</span>
          </div>

          {ARCHITECTURE_SCENARIOS.map((scenario) => {
            const isSelected = scenario.id === selectedId;
            return (
              <button
                key={scenario.id}
                onClick={() => handleSelect(scenario)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1 ${
                  isSelected
                    ? "bg-cyan-500/20 border-cyan-400/80 shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                    : "bg-slate-900/60 border-slate-700/40 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                    {scenario.name}
                    {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                  </span>
                  <span
                    className={`text-[8px] px-1.5 py-0.5 rounded border font-semibold ${scenario.badgeColor}`}
                  >
                    x{scenario.trafficMultiplier.toFixed(1)} · {Math.round(scenario.edgeCacheHitRate * 100)}% CDN
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {scenario.subtitle}
                </span>
                <span className="text-[9px] text-cyan-300/80 italic mt-0.5">
                  💡 {scenario.educationalTakeaway}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
