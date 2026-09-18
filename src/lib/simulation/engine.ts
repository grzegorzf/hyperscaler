import type { ClusterState, ScalingMode, ServerNode } from "./types";
import {
  BASE_TRAFFIC_RPS,
  calculateOriginTraffic,
  calculateTargetPods,
  calculateTargetCores,
  calculateClusterMetrics,
} from "./physics";

export function createInitialState(): ClusterState {
  const initialTraffic = BASE_TRAFFIC_RPS;
  const initialCacheRate = 0.75;
  const { absorbedRps, originRps } = calculateOriginTraffic(initialTraffic, initialCacheRate);
  const metrics = calculateClusterMetrics(originRps, 8, 16, "HORIZONTAL", false);

  return {
    timestamp: Date.now(),
    trafficRps: initialTraffic,
    edgeCacheHitRate: initialCacheRate,
    edgeAbsorbedRps: absorbedRps,
    originIngressRps: originRps,
    latencyP50Ms: metrics.latencyP50,
    latencyP95Ms: metrics.latencyP95,
    latencyP99Ms: metrics.latencyP99,
    errorRatePercent: metrics.errorRatePercent,
    scalingMode: "HORIZONTAL",
    autoScalingEnabled: true,
    chaosActive: false,
    systemHealth: metrics.health,
    totalNodes: 8,
    averageCpuPercent: metrics.avgCpu,
    averageRamPercent: metrics.avgRam,
    nodes: Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `pod-${i + 1}`,
      role: "POD",
      cpuCores: 4,
      ramGb: 16,
      cpuUtilization: metrics.avgCpu,
      ramUtilization: metrics.avgRam,
      requestsHandledPerSec: Math.round(originRps / 8),
      status: "HEALTHY",
    })),
  };
}

export function stepSimulation(
  current: ClusterState,
  manualCores: number
): { nextState: ClusterState; updatedManualCores: number } {
  const traffic = Math.round(current.trafficRps);
  const cacheRate = current.edgeCacheHitRate;
  const { absorbedRps, originRps } = calculateOriginTraffic(traffic, cacheRate);

  const isHoriz = current.scalingMode === "HORIZONTAL";
  let nodeCount = current.nodes.length;
  let activeCores = current.nodes[0]?.cpuCores || manualCores;
  let updatedManualCores = manualCores;

  if (current.autoScalingEnabled) {
    if (isHoriz) {
      const targetPods = calculateTargetPods(traffic);
      if (nodeCount < targetPods) nodeCount++;
      else if (nodeCount > targetPods) nodeCount--;
    } else {
      activeCores = calculateTargetCores(traffic);
      updatedManualCores = activeCores;
    }
  } else if (!isHoriz) {
    activeCores = manualCores;
  }

  const metrics = calculateClusterMetrics(
    originRps,
    nodeCount,
    activeCores,
    current.scalingMode,
    current.chaosActive
  );

  const updatedNodes: ServerNode[] = isHoriz
    ? Array.from({ length: nodeCount }, (_, i) => ({
        id: i + 1,
        name: `pod-${i + 1}`,
        role: "POD",
        cpuCores: 4,
        ramGb: 16,
        cpuUtilization: metrics.avgCpu,
        ramUtilization: metrics.avgRam,
        requestsHandledPerSec: Math.round(originRps / Math.max(nodeCount, 1)),
        status: current.chaosActive
          ? "OVERLOADED"
          : metrics.avgCpu > 90
          ? "OVERLOADED"
          : "HEALTHY",
      }))
    : Array.from({ length: 4 }, (_, i) => ({
        id: i + 1,
        name: `vnode-tower-${i + 1}`,
        role: "SUPER_NODE",
        cpuCores: activeCores,
        ramGb: activeCores * 4,
        cpuUtilization: metrics.avgCpu,
        ramUtilization: metrics.avgRam,
        requestsHandledPerSec: Math.round(originRps / 4),
        status: current.chaosActive
          ? "OVERLOADED"
          : metrics.avgCpu > 90
          ? "OVERLOADED"
          : "HEALTHY",
      }));

  return {
    nextState: {
      ...current,
      timestamp: Date.now(),
      edgeAbsorbedRps: absorbedRps,
      originIngressRps: originRps,
      averageCpuPercent: metrics.avgCpu,
      averageRamPercent: metrics.avgRam,
      latencyP50Ms: metrics.latencyP50,
      latencyP95Ms: metrics.latencyP95,
      latencyP99Ms: metrics.latencyP99,
      errorRatePercent: metrics.errorRatePercent,
      systemHealth: metrics.health,
      totalNodes: updatedNodes.length,
      nodes: updatedNodes,
    },
    updatedManualCores,
  };
}

export function applyScalingCommand(
  prev: ClusterState,
  mode: ScalingMode,
  autoScale: boolean,
  currentManualCores: number,
  nodeDelta?: number,
  coreCount?: number
): { nextState: ClusterState; newManualCores: number } {
  let newManualCores = currentManualCores;
  if (coreCount) {
    newManualCores = coreCount;
  }

  let updatedNodes = [...prev.nodes];
  if (mode === "VERTICAL") {
    const cores = coreCount || newManualCores;
    updatedNodes = Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      name: `vnode-tower-${i + 1}`,
      role: "SUPER_NODE",
      cpuCores: cores,
      ramGb: cores * 4,
      cpuUtilization: prev.averageCpuPercent,
      ramUtilization: 48,
      requestsHandledPerSec: Math.round(prev.originIngressRps / 4),
      status: "HEALTHY",
    }));
  } else {
    // Horizontal mode
    let count = prev.scalingMode === "VERTICAL" ? 8 : updatedNodes.length;
    if (nodeDelta) {
      count = Math.max(3, Math.min(28, count + nodeDelta));
    }
    updatedNodes = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `pod-${i + 1}`,
      role: "POD",
      cpuCores: 4,
      ramGb: 16,
      cpuUtilization: prev.averageCpuPercent,
      ramUtilization: 48,
      requestsHandledPerSec: Math.round(prev.originIngressRps / Math.max(count, 1)),
      status: "HEALTHY",
    }));
  }

  return {
    nextState: {
      ...prev,
      scalingMode: mode,
      autoScalingEnabled: autoScale,
      totalNodes: updatedNodes.length,
      nodes: updatedNodes,
    },
    newManualCores,
  };
}
