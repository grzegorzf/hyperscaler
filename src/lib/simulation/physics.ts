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
 */
export function calculateTargetParticlePool(trafficRps: number): number {
  const mult = Math.max(0.2, trafficRps / BASE_TRAFFIC_RPS);
  if (mult <= 1.0) {
    // 0.2x -> 6 particles (calm trickle), 1.0x -> 22 particles (clean rhythmic stream)
    return Math.round(6 + (mult - 0.2) * 20);
  }
  // 1.0x -> 22 particles, 2.5x -> 67 particles (busy), 5.0x -> 142 particles (dense torrent)
  return Math.round(22 + (mult - 1.0) * 30);
}

/**
 * Calculates packet particle velocity based on traffic intensity.
 */
export function calculateParticleVelocity(trafficRps: number, randomJitter = 0): number {
  const mult = Math.max(0.2, trafficRps / BASE_TRAFFIC_RPS);
  const base = 0.012 + mult * 0.007;
  const jitterFactor = 0.85 + (randomJitter % 1) * 0.3;
  return base * jitterFactor;
}

/**
 * Calculates target pod count for Horizontal Auto-Scaling.
 */
export function calculateTargetPods(trafficRps: number): number {
  const mult = Math.max(0.2, trafficRps / BASE_TRAFFIC_RPS);
  return Math.max(3, Math.min(28, Math.round(mult * 5 + 3)));
}

/**
 * Calculates target core allocation for Vertical Auto-Scaling.
 */
export function calculateTargetCores(trafficRps: number): number {
  const mult = Math.max(0.2, trafficRps / BASE_TRAFFIC_RPS);
  if (mult >= 4.0) return 64;
  if (mult >= 2.5) return 32;
  if (mult >= 1.5) return 16;
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
  const isHoriz = scalingMode === "HORIZONTAL";
  const totalCapacity = isHoriz
    ? Math.max(1, nodeCount) * POD_CAPACITY_RPS
    : 4 * coresPerNode * CORE_CAPACITY_RPS;

  const loadRatio = originIngressRps / Math.max(totalCapacity, 1);
  let avgCpu = Math.min(100, Math.round(loadRatio * 75 + 15));
  let avgRam = Math.min(100, Math.round(40 + loadRatio * 40));

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
  const mult = Math.max(0.2, trafficRps / BASE_TRAFFIC_RPS);
  return -(timestamp / 15) * mult;
}

/**
 * Calculates conduit wire thickness based on traffic.
 */
export function calculateConduitWidth(trafficRps: number): number {
  const mult = Math.max(0.2, trafficRps / BASE_TRAFFIC_RPS);
  return 1.2 + Math.min(mult * 0.7, 3.5);
}

/**
 * Calculates component rotation RPM or pulsation period.
 */
export function calculateComponentPeriod(trafficRps: number, basePeriodMs: number, minPeriodMs: number): number {
  const mult = Math.max(0.2, trafficRps / BASE_TRAFFIC_RPS);
  return Math.max(minPeriodMs, Math.round(basePeriodMs / mult));
}
