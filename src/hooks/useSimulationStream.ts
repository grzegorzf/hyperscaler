"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ClusterState, ServerNode } from "@/lib/simulation/types";
import {
  createInitialState,
  stepSimulation,
  applyScalingCommand,
} from "@/lib/simulation/engine";

export type { ServerNode, ClusterState };

export function useSimulationStream() {
  const [state, setState] = useState<ClusterState>(createInitialState);
  const [trafficMultiplier, setTrafficMultiplier] = useState(1.0);
  const [throughputHistory, setThroughputHistory] = useState<number[]>(() =>
    Array(24).fill(25000)
  );

  const manualCoresRef = useRef<number>(16);

  // Simulation tick loop (~8.3 ticks/sec / 120ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setState((current) => {
        const { nextState, updatedManualCores } = stepSimulation(
          current,
          manualCoresRef.current
        );
        manualCoresRef.current = updatedManualCores;

        setThroughputHistory((prev) => [...prev.slice(1), nextState.trafficRps]);
        return nextState;
      });
    }, 120);

    return () => clearInterval(timer);
  }, []);

  // Dispatch Actions
  const updateTraffic = useCallback((trafficRps: number, cacheHitRate: number) => {
    setState((prev) => ({
      ...prev,
      trafficRps,
      edgeCacheHitRate: cacheHitRate,
    }));
  }, []);

  const updateScaling = useCallback(
    (
      mode: "HORIZONTAL" | "VERTICAL",
      autoScale: boolean,
      nodeDelta?: number,
      coreCount?: number
    ) => {
      setState((prev) => {
        const { nextState, newManualCores } = applyScalingCommand(
          prev,
          mode,
          autoScale,
          manualCoresRef.current,
          nodeDelta,
          coreCount
        );
        manualCoresRef.current = newManualCores;
        return nextState;
      });
    },
    []
  );

  const triggerChaos = useCallback((active: boolean) => {
    setState((prev) => ({
      ...prev,
      chaosActive: active,
    }));

    // Auto-recover after 4.5 seconds with self-healing wave
    if (active) {
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          chaosActive: false,
        }));
      }, 4500);
    }
  }, []);

  return {
    state,
    trafficMultiplier,
    setTrafficMultiplier,
    throughputHistory,
    updateTraffic,
    updateScaling,
    triggerChaos,
  };
}
