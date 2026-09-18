import type { ScalingMode, SystemHealth } from "./types";

export const BASE_TRAFFIC_RPS = 25000;
export const POD_CAPACITY_RPS = 3000;
export const CORE_CAPACITY_RPS = 850;

/**
 * Calculates how much traffic is absorbed at edge vs reaches origin.
 */
export function calculateOriginTraffic(trafficRps: number, cacheHitRate: number): {
  absorbedRps: number;
  originRps: number;
} {
  const safeTraffic = Math.max(0, trafficRps);
  const safeRate = Math.max(0, Math.min(1, cacheHitRate));
  const absorbedRps = Math.round(safeTraffic * safeRate);
  const originRps = Math.max(0, safeTraffic - absorbedRps);
  return { absorbedRps, originRps };
}

/**
 * Calculates the active on-screen particle pool size strictly proportional to traffic.
 * When traffic is 0, returns 0 particles.
 */
export function calculateTargetParticlePool(trafficRps: number): number {
  if (trafficRps <= 0) return 0;
  const mult = trafficRps / BASE_TRAFFIC_RPS;
  if (mult <= 1.0) {
    // 0.2x -> 6 particles (calm trickle), 1.0x -> 22 particles (clean rhythmic stream)
    return Math.max(1, Math.round(mult * 22));
  }
  // 1.0x -> 22 particles, 2.5x -> 67 particles (busy), 5.0x -> 142 particles (dense torrent)
  return Math.round(22 + (mult - 1.0) * 30);
}

/**
 * Calculates packet particle velocity based on traffic intensity.
 */
export function calculateParticleVelocity(trafficRps: number, randomJitter = 0): number {
  if (trafficRps <= 0) return 0;
  const mult = Math.max(0.1, trafficRps / BASE_TRAFFIC_RPS);
  const base = 0.012 + mult * 0.007;
  const jitterFactor = 0.85 + (randomJitter % 1) * 0.3;
  return base * jitterFactor;
}

/**
 * Calculates target pod count for Horizontal Auto-Scaling based on origin load.
 * When origin traffic is 0, scales down to 0 pods (Scale-to-Zero).
 */
export function calculateTargetPods(originRps: number): number {
  if (originRps <= 0) return 0;
  // Dynamic capacity: ~2,800 req/s per pod
  const needed = Math.ceil(originRps / 2800);
  return Math.min(28, Math.max(1, needed));
}

/**
 * Calculates target core allocation for Vertical Auto-Scaling based on origin load.
 * When origin traffic is 0, cores drop to 0 (Standby).
 */
export function calculateTargetCores(originRps: number): number {
  if (originRps <= 0) return 0;
  if (originRps > 65000) return 64;
  if (originRps > 30000) return 32;
  if (originRps > 10000) return 16;
  return 8;
}

/**
 * Calculates CPU load, RAM allocation, latency percentiles, and system health.
 */
export function calculateClusterMetrics(
  originIngressRps: number,
  nodeCount: number,
  coresPerNode: number,
  scalingMode: ScalingMode,
  chaosActive: boolean
): {
  avgCpu: number;
  avgRam: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errorRatePercent: number;
  health: SystemHealth;
} {
  // If zero origin traffic or horizontal cluster scaled to zero:
  if (originIngressRps <= 0 || (scalingMode === "HORIZONTAL" && nodeCount <= 0)) {
    return {
      avgCpu: 0,
      avgRam: 0,
      latencyP50: 0,
      latencyP95: 0,
      latencyP99: 0,
      errorRatePercent: 0,
      health: "NOMINAL",
    };
  }

  const isHoriz = scalingMode === "HORIZONTAL";
  const totalCapacity = isHoriz
    ? Math.max(1, nodeCount) * POD_CAPACITY_RPS
    : 4 * Math.max(1, coresPerNode) * CORE_CAPACITY_RPS;

  const loadRatio = originIngressRps / Math.max(totalCapacity, 1);
  let avgCpu = Math.min(100, Math.round(loadRatio * 75 + 10));
  let avgRam = Math.min(100, Math.round(30 + loadRatio * 40));

  let latencyP50 = 10;
  let latencyP95 = 20;
  let latencyP99 = 32;
  let errorRatePercent = 0.0;
  let health: SystemHealth = "NOMINAL";

  if (chaosActive) {
    avgCpu = Math.min(100, avgCpu + 40);
    latencyP50 = 65;
    latencyP95 = 140;
    latencyP99 = 340;
    errorRatePercent = 5.25;
    health = "CRITICAL";
  } else if (avgCpu > 85) {
    const excess = avgCpu - 85;
    latencyP50 += Math.round(excess * 2);
    latencyP95 += Math.round(excess * 5);
    latencyP99 += Math.round(excess * 12);
    errorRatePercent = Number(Math.min(15, excess * 0.3).toFixed(2));
    health = "DEGRADED";
  }

  return {
    avgCpu,
    avgRam,
    latencyP50,
    latencyP95,
    latencyP99,
    errorRatePercent,
    health,
  };
}

/**
 * Calculates the line dash animation offset for conduit wires.
 */
export function calculateConduitDashOffset(trafficRps: number, timestamp: number): number {
  if (trafficRps <= 0) return 0;
  const mult = Math.max(0.1, trafficRps / BASE_TRAFFIC_RPS);
  return -(timestamp / 15) * mult;
}

/**
 * Calculates conduit wire thickness based on traffic.
 */
export function calculateConduitWidth(trafficRps: number): number {
  if (trafficRps <= 0) return 1.0;
  const mult = Math.max(0.1, trafficRps / BASE_TRAFFIC_RPS);
  return 1.2 + Math.min(mult * 0.7, 3.5);
}

/**
 * Calculates component rotation RPM or pulsation period.
 */
export function calculateComponentPeriod(trafficRps: number, basePeriodMs: number, minPeriodMs: number): number {
  if (trafficRps <= 0) return 999999;
  const mult = Math.max(0.1, trafficRps / BASE_TRAFFIC_RPS);
  return Math.max(minPeriodMs, Math.round(basePeriodMs / mult));
}
