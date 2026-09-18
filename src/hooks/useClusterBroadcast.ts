"use client";

import { useEffect, useRef, useCallback } from "react";
import { supportsBroadcastChannel } from "@/lib/browser/webApis";
import type { CloudProvider } from "@/lib/simulation/cloudCosts";
import type { ScalingMode } from "@/lib/simulation/types";

export type ClusterBroadcastMessage =
  | {
      type: "TRAFFIC_UPDATE";
      trafficRps: number;
      edgeCacheHitRate: number;
      trafficMultiplier: number;
      senderId: string;
    }
  | {
      type: "SCALING_UPDATE";
      mode: ScalingMode;
      autoScaling: boolean;
      manualDelta: number;
      manualCores?: number;
      senderId: string;
    }
  | {
      type: "CHAOS_TOGGLE";
      active: boolean;
      senderId: string;
    }
  | {
      type: "PROVIDER_CHANGE";
      provider: CloudProvider;
      senderId: string;
    };

interface UseClusterBroadcastProps {
  onTrafficSync?: (trafficRps: number, cacheHitRate: number, multiplier: number) => void;
  onScalingSync?: (
    mode: ScalingMode,
    autoScaling: boolean,
    manualDelta: number,
    manualCores?: number
  ) => void;
  onChaosSync?: (active: boolean) => void;
  onProviderSync?: (provider: CloudProvider) => void;
}

export function useClusterBroadcast({
  onTrafficSync,
  onScalingSync,
  onChaosSync,
  onProviderSync,
}: UseClusterBroadcastProps) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  // Generate random instance ID for deduplication
  const instanceIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `tab_${Math.random().toString(36).slice(2, 9)}`
  );

  useEffect(() => {
    if (!supportsBroadcastChannel()) return;

    const channel = new BroadcastChannel("hyperscaler_cluster_sync");
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<ClusterBroadcastMessage>) => {
      const data = event.data;
      if (!data || data.senderId === instanceIdRef.current) return;

      switch (data.type) {
        case "TRAFFIC_UPDATE":
          onTrafficSync?.(data.trafficRps, data.edgeCacheHitRate, data.trafficMultiplier);
          break;
        case "SCALING_UPDATE":
          onScalingSync?.(data.mode, data.autoScaling, data.manualDelta, data.manualCores);
          break;
        case "CHAOS_TOGGLE":
          onChaosSync?.(data.active);
          break;
        case "PROVIDER_CHANGE":
          onProviderSync?.(data.provider);
          break;
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [onTrafficSync, onScalingSync, onChaosSync, onProviderSync]);

  const broadcastTraffic = useCallback(
    (trafficRps: number, edgeCacheHitRate: number, trafficMultiplier: number) => {
      channelRef.current?.postMessage({
        type: "TRAFFIC_UPDATE",
        trafficRps,
        edgeCacheHitRate,
        trafficMultiplier,
        senderId: instanceIdRef.current,
      } as ClusterBroadcastMessage);
    },
    []
  );

  const broadcastScaling = useCallback(
    (
      mode: ScalingMode,
      autoScaling: boolean,
      manualDelta: number,
      manualCores?: number
    ) => {
      channelRef.current?.postMessage({
        type: "SCALING_UPDATE",
        mode,
        autoScaling,
        manualDelta,
        manualCores,
        senderId: instanceIdRef.current,
      } as ClusterBroadcastMessage);
    },
    []
  );

  const broadcastChaos = useCallback((active: boolean) => {
    channelRef.current?.postMessage({
      type: "CHAOS_TOGGLE",
      active,
      senderId: instanceIdRef.current,
    } as ClusterBroadcastMessage);
  }, []);

  const broadcastProvider = useCallback((provider: CloudProvider) => {
    channelRef.current?.postMessage({
      type: "PROVIDER_CHANGE",
      provider,
      senderId: instanceIdRef.current,
    } as ClusterBroadcastMessage);
  }, []);

  return {
    broadcastTraffic,
    broadcastScaling,
    broadcastChaos,
    broadcastProvider,
  };
}
