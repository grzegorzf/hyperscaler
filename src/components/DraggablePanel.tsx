"use client";

import React from "react";
import { GripVertical, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useDraggablePanel } from "@/hooks/useDraggablePanel";
import { PanelPosition, ClampingBounds } from "@/lib/browser/draggableMath";

interface DraggablePanelProps {
  id: string;
  title: string;
  defaultPosition: PanelPosition;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  bounds?: ClampingBounds;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id,
  title,
  defaultPosition,
  children,
  icon,
  className = "",
  bounds,
}) => {
  const {
    panelRef,
    position,
    isDragging,
    isCollapsed,
    isHydrated,
    dragHandleProps,
    toggleCollapse,
    resetPosition,
  } = useDraggablePanel({
    id,
    defaultPosition,
    bounds,
  });

  return (
    <div
      ref={panelRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: isDragging ? 40 : 25,
      }}
      className={`hidden md:flex flex-col transition-shadow duration-200 pointer-events-auto select-none ${
        isDragging
          ? "shadow-[0_24px_50px_rgba(0,0,0,0.9),0_0_24px_rgba(0,240,255,0.35)] will-change-transform scale-[1.01]"
          : "shadow-2xl"
      } ${className}`}
    >
      {/* 1. Cyber-HUD Drag Handle Bar */}
      <div
        {...dragHandleProps}
        className={`flex items-center justify-between px-3 py-1.5 rounded-t-xl border border-b-0 cursor-grab active:cursor-grabbing transition-colors duration-150 ${
          isDragging
            ? "bg-[#0b1320] border-cyan-400 text-cyan-200"
            : "bg-[#080d17]/90 hover:bg-[#0c1424] border-cyan-500/25 text-slate-400 hover:text-slate-200"
        } backdrop-blur-xl`}
        title="Drag to move panel anywhere on screen (Position saved in LocalStorage)"
      >
        <div className="flex items-center gap-2">
          <GripVertical className={`w-3.5 h-3.5 ${isDragging ? "text-cyan-400" : "text-slate-500"}`} />
          {icon && <span className="text-cyan-400">{icon}</span>}
          <span className="font-mono text-[9px] uppercase tracking-wider font-bold truncate max-w-[170px]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[9px] font-mono">
          {/* Coordinates Badge */}
          <span className="text-slate-500 hidden sm:inline-block">
            {position.x},{position.y}
          </span>

          {/* Reset position button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetPosition();
            }}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reset this panel to default position"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 2. Panel Body (collapsible) */}
      {!isCollapsed && (
        <div className="relative rounded-b-xl overflow-hidden animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};
