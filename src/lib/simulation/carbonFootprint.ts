import type { ScalingMode } from "./types";

export interface CarbonMetrics {
  monthlyKgCo2e: number;
  monthlyKwh: number;
  edgeSavingsKgCo2e: number;
  treesEquivalent: number; // Trees needed per year to offset emissions
  ecoScore: "A+" | "A" | "B" | "C" | "D";
  ecoScoreLabel: string;
  pueFactor: number;
}

const HOURS_PER_MONTH = 732;
const HYPERSCALER_PUE = 1.15; // Industry average for modern hyperscale facilities
const GRID_EMISSIONS_FACTOR_KG_PER_KWH = 0.380; // 380g CO2e / kWh blended global grid factor
const VCPU_WATTS = 4.2; // Avg power per vCPU
const RAM_GB_WATTS = 0.38; // Avg power per GB RAM
const NETWORK_KWH_PER_GB = 0.0018; // Data transmission energy intensity

/**
 * Calculates Green Cloud Sustainability metrics following the Cloud Carbon Footprint methodology.
 * Estimates Scope 2 operational emissions and demonstrates environmental savings from Edge caching.
 */
export function calculateCarbonFootprint(
  trafficRps: number,
  edgeCacheHitRate: number,
  scalingMode: ScalingMode,
  nodeCount: number,
  coresPerTower = 16,
  monthlyTotalGb = 0
): CarbonMetrics {
  if (trafficRps <= 0) {
    return {
      monthlyKgCo2e: 0,
      monthlyKwh: 0,
      edgeSavingsKgCo2e: 0,
      treesEquivalent: 0,
      ecoScore: "A+",
      ecoScoreLabel: "Net Zero (Scale-to-Zero Idle)",
      pueFactor: HYPERSCALER_PUE,
    };
  }

  // 1. Compute Energy Consumption (kWh)
  let totalVcpus = 0;
  let totalRamGb = 0;

  if (scalingMode === "HORIZONTAL") {
    totalVcpus = nodeCount * 4;
    totalRamGb = nodeCount * 16;
  } else {
    totalVcpus = 4 * (coresPerTower || 16);
    totalRamGb = totalVcpus * 4;
  }

  const serverPowerWatts = totalVcpus * VCPU_WATTS + totalRamGb * RAM_GB_WATTS;
  const computeKwhMonthly = (serverPowerWatts / 1000) * HOURS_PER_MONTH * HYPERSCALER_PUE;

  // 2. Network Data Egress Energy (kWh)
  const networkKwhMonthly = monthlyTotalGb * NETWORK_KWH_PER_GB;

  const totalKwh = computeKwhMonthly + networkKwhMonthly;
  const monthlyKgCo2e = Math.round(totalKwh * GRID_EMISSIONS_FACTOR_KG_PER_KWH);

  // 3. Carbon Avoidance via Edge CDN Caching
  // Caching avoids origin compute spin-up and long-distance WAN backhaul
  const rawWithoutCacheKwh = totalKwh * (1 + edgeCacheHitRate * 1.6);
  const rawWithoutCacheCo2 = rawWithoutCacheKwh * GRID_EMISSIONS_FACTOR_KG_PER_KWH;
  const edgeSavingsKgCo2e = Math.max(0, Math.round(rawWithoutCacheCo2 - monthlyKgCo2e));

  // 4. Offset Equivalents (1 mature tree absorbs ~21.7 kg CO2e / year)
  const annualKgCo2e = monthlyKgCo2e * 12;
  const treesEquivalent = Math.max(0, Math.round(annualKgCo2e / 21.7));

  // 5. Eco Score Evaluation
  let ecoScore: CarbonMetrics["ecoScore"] = "B";
  let ecoScoreLabel = "Standard Cloud Efficiency";

  if (edgeCacheHitRate >= 0.90) {
    ecoScore = "A+";
    ecoScoreLabel = "Ultra-Green Edge Optimized";
  } else if (edgeCacheHitRate >= 0.75) {
    ecoScore = "A";
    ecoScoreLabel = "High Edge Efficiency";
  } else if (edgeCacheHitRate >= 0.40) {
    ecoScore = "B";
    ecoScoreLabel = "Moderate Energy Profile";
  } else if (scalingMode === "VERTICAL") {
    ecoScore = "D";
    ecoScoreLabel = "Monolith Energy Inefficiency";
  } else {
    ecoScore = "C";
    ecoScoreLabel = "High Carbon Footprint";
  }

  return {
    monthlyKgCo2e,
    monthlyKwh: Math.round(totalKwh),
    edgeSavingsKgCo2e,
    treesEquivalent,
    ecoScore,
    ecoScoreLabel,
    pueFactor: HYPERSCALER_PUE,
  };
}
