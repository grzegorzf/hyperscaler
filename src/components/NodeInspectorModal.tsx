"use client";

import React from "react";
import { ServerNode } from "@/hooks/useSimulationStream";

interface NodeInspectorModalProps {
  node: ServerNode | null;
  onClose: () => void;
}

export const NodeInspectorModal: React.FC<NodeInspectorModalProps> = ({
  node,
  onClose,
}) => {
  if (!node) return null;

  const isSuper = node.role === "SUPER_NODE";

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="glass-panel rounded-2xl p-5 border border-cyan-400/40 shadow-[0_0_30px_rgba(0,240,255,0.25)] min-w-[340px] font-mono text-xs">
        <div className="flex justify-between items-center pb-3 border-b border-cyan-500/20 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                node.status === "HEALTHY" ? "bg-emerald-400" : "bg-rose-500"
              }`}
            />
            <span className="font-bold text-slate-100 tracking-wider uppercase">
              {node.name}
            </span>
            <span
              className={`text-[9px] px-2 py-0.5 rounded ${
                isSuper
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              }`}
            >
              {isSuper ? "VERTICAL TOWER" : "ELASTIC POD"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 px-2 py-0.5 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Spec details */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-[11px]">
          <div>
            <span className="text-slate-500 block text-[9px]">CPU ALLOCATION</span>
            <span className="font-bold text-cyan-400">{node.cpuCores} Cores</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px]">MEMORY PROVISION</span>
            <span className="font-bold text-purple-400">{node.ramGb} GB RAM</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px]">ACTIVE INGRESS</span>
            <span className="font-bold text-emerald-400">
              {node.requestsHandledPerSec.toLocaleString()} req/s
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px]">HEALTH STATUS</span>
            <span
              className={`font-bold ${
                node.status === "HEALTHY" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {node.status}
            </span>
          </div>
        </div>

        {/* CPU utilization bar */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>CPU UTILIZATION</span>
            <span className="font-bold text-slate-200">{node.cpuUtilization}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                node.cpuUtilization > 85
                  ? "bg-rose-500"
                  : node.cpuUtilization > 70
                  ? "bg-amber-400"
                  : "bg-cyan-400"
              }`}
              style={{ width: `${node.cpuUtilization}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
