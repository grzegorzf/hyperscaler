"use client";

import React, { useRef, useEffect } from "react";
import type { ClusterState, ServerNode, ConduitParticle } from "@/lib/simulation/types";
import { computeLayout } from "@/lib/simulation/layout";
import { BASE_TRAFFIC_RPS } from "@/lib/simulation/physics";
import {
  drawTabletop,
  drawPerspectiveGrid,
  drawConduits,
  drawUserSwarm,
  drawCdnPops,
  drawLoadBalancers,
  drawComputeStageFrame,
  drawHorizontalCluster,
  drawVerticalTowers,
  spawnParticles,
  updateAndDrawParticles,
} from "@/lib/canvas/renderers";

interface HolographicCanvasProps {
  state: ClusterState;
  onSelectNode: (node: ServerNode | null) => void;
}

export const HolographicCanvas: React.FC<HolographicCanvasProps> = ({
  state,
  onSelectNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<ClusterState>(state);
  stateRef.current = state;

  const particlesRef = useRef<ConduitParticle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const nodeFlashesRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;

    const handleResize = () => {
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const currentState = stateRef.current;
      const layout = computeLayout(w, h);
      const isHoriz = currentState.scalingMode === "HORIZONTAL";
      const now = Date.now();

      const mult = Math.max(0.2, currentState.trafficRps / BASE_TRAFFIC_RPS);
      const isHighLoad = currentState.averageCpuPercent > 80 || mult >= 3.5;

      ctx.clearRect(0, 0, w, h);

      // 1. Tabletop Platform & Perspective Grid
      drawTabletop(ctx, layout.table, isHighLoad);
      drawPerspectiveGrid(ctx, layout.table);

      // 2. Conduits
      drawConduits(ctx, layout, currentState.trafficRps, isHoriz);

      // 3. User Devices (Swarm)
      drawUserSwarm(ctx, layout.clients, currentState.trafficRps, now);

      // 4. Edge CDN PoPs
      drawCdnPops(
        ctx,
        layout.cdnPops,
        currentState.trafficRps,
        currentState.edgeCacheHitRate,
        now
      );

      // 5. Load Balancers
      drawLoadBalancers(ctx, layout.loadBalancers, currentState.trafficRps, now);

      // 6. Compute Stage Frame
      const cores = currentState.nodes[0]?.cpuCores || 16;
      drawComputeStageFrame(
        ctx,
        layout.computeStage,
        isHoriz,
        currentState.nodes.length,
        cores
      );

      // 7. Compute Cluster (Horizontal Blades vs Vertical Towers)
      if (isHoriz) {
        drawHorizontalCluster(
          ctx,
          layout.computeStage,
          currentState.nodes,
          currentState.trafficRps,
          currentState.chaosActive,
          nodeFlashesRef.current,
          now
        );
      } else {
        drawVerticalTowers(
          ctx,
          layout.computeStage,
          currentState.nodes,
          currentState.averageCpuPercent,
          currentState.chaosActive,
          now
        );
      }

      // 8. Dynamic Particles & Trails
      spawnParticles(particlesRef.current, currentState, layout);
      updateAndDrawParticles(
        ctx,
        particlesRef.current,
        currentState,
        layout,
        nodeFlashesRef.current
      );

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Shared hit-testing logic for inspecting nodes on click or touch
  const inspectNodeAt = (x: number, y: number, w: number, h: number) => {
    const layout = computeLayout(w, h);
    const cs = layout.computeStage;

    if (x >= cs.x && x <= cs.x + cs.w && y >= cs.y && y <= cs.y + cs.h) {
      if (state.scalingMode === "HORIZONTAL" && state.nodes.length > 0) {
        const total = Math.max(state.nodes.length, 3);
        const cols = total > 16 ? 5 : total > 9 ? 4 : 3;
        const rows = Math.ceil(total / cols);
        const colWidth = (cs.w - 40) / cols;
        const rowHeight = (cs.h - 50) / Math.max(rows, 1);

        for (let idx = 0; idx < state.nodes.length; idx++) {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const nodeX = cs.x + 24 + col * colWidth + colWidth / 2;
          const nodeY = cs.y + 48 + row * rowHeight + rowHeight / 2;
          const bladeW = Math.min(colWidth - 12, 54);
          const bladeH = Math.min(rowHeight - 12, 38);

          if (
            x >= nodeX - bladeW / 2 &&
            x <= nodeX + bladeW / 2 &&
            y >= nodeY - bladeH / 2 &&
            y <= nodeY + bladeH / 2
          ) {
            onSelectNode(state.nodes[idx]);
            return;
          }
        }
      }

      const activeNode = state.nodes[0] || null;
      onSelectNode(activeNode);
      return;
    }

    onSelectNode(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    inspectNodeAt(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
  };

  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    inspectNodeAt(touch.clientX - rect.left, touch.clientY - rect.top, rect.width, rect.height);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      onTouchEnd={handleCanvasTouch}
      className="absolute inset-0 w-full h-full cursor-crosshair touch-manipulation"
    />
  );
};
