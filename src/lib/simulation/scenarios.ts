import type { ScalingMode } from "./types";

export type ScenarioId =
  | "STEADY_STATE"
  | "BLACK_FRIDAY"
  | "CACHE_BYPASS_DDOS"
  | "SCALE_TO_ZERO"
  | "LEGACY_MONOLITH"
  | "AZ_FAILOVER_CHAOS";

export interface ArchitectureScenario {
  id: ScenarioId;
  name: string;
  subtitle: string;
  description: string;
  trafficMultiplier: number;
  trafficRps: number;
  edgeCacheHitRate: number;
  scalingMode: ScalingMode;
  autoScalingEnabled: boolean;
  chaosActive: boolean;
  manualPods?: number;
  manualCores?: number;
  badgeColor: string;
  educationalTakeaway: string;
}

export const ARCHITECTURE_SCENARIOS: ArchitectureScenario[] = [
  {
    id: "STEADY_STATE",
    name: "Steady-State Production",
    subtitle: "Balanced 25k req/s with 75% Edge Caching",
    description: "Standard daytime enterprise workload. CDN absorbs 75% of traffic while 8 elastic pods handle origin API compute with sub-15ms latency.",
    trafficMultiplier: 1.0,
    trafficRps: 25000,
    edgeCacheHitRate: 0.75,
    scalingMode: "HORIZONTAL",
    autoScalingEnabled: true,
    chaosActive: false,
    manualPods: 8,
    badgeColor: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
    educationalTakeaway: "A 75% cache ratio reduces origin compute requirements by 4x, keeping monthly cloud spend predictable.",
  },
  {
    id: "BLACK_FRIDAY",
    name: "Black Friday Flash Surge",
    subtitle: "5.0x Traffic Storm with 96% Edge Absorption",
    description: "Peak e-commerce shopping storm (125k req/s). Aggressive cache rules shield origin servers from melting while edge nodes handle 120,000 req/s.",
    trafficMultiplier: 5.0,
    trafficRps: 125000,
    edgeCacheHitRate: 0.96,
    scalingMode: "HORIZONTAL",
    autoScalingEnabled: true,
    chaosActive: false,
    badgeColor: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    educationalTakeaway: "Serving 96% from cache prevents an origin blackout and saves over $20,000/mo in compute and load balancer LCUs.",
  },
  {
    id: "CACHE_BYPASS_DDOS",
    name: "Cache-Bust DDoS Attack",
    subtitle: "4.5x Traffic Storm with 0% Cache Hit Rate",
    description: "Adversarial traffic storm utilizing randomized query strings to bypass CDN edge caches. 100% of packets flood origin load balancers and compute nodes.",
    trafficMultiplier: 4.5,
    trafficRps: 112500,
    edgeCacheHitRate: 0.0,
    scalingMode: "HORIZONTAL",
    autoScalingEnabled: true,
    chaosActive: false,
    badgeColor: "text-rose-400 border-rose-500/40 bg-rose-500/10",
    educationalTakeaway: "Without edge cache shielding, origin servers hit 100% CPU saturation, P99 latency triples, and cloud egress costs explode.",
  },
  {
    id: "SCALE_TO_ZERO",
    name: "Midnight Dormancy (Scale-to-Zero)",
    subtitle: "0 Traffic with $0.00 Serverless Idle Spend",
    description: "Complete traffic stoppage during off-peak hours. Autoscaler deprovisions all active pods down to 0, demonstrating true serverless scale-to-zero economics.",
    trafficMultiplier: 0.0,
    trafficRps: 0,
    edgeCacheHitRate: 0.75,
    scalingMode: "HORIZONTAL",
    autoScalingEnabled: true,
    chaosActive: false,
    badgeColor: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    educationalTakeaway: "Scale-to-zero eliminates idle container overhead, dropping compute and load balancer costs to exactly $0.00/hr.",
  },
  {
    id: "LEGACY_MONOLITH",
    name: "Legacy Monolith Cost Trap",
    subtitle: "3.0x Traffic on Static 64-Core Monolith Towers",
    description: "Traditional enterprise pattern using static vertical scaling. Four massive 64-core monoliths run 24/7, accumulating steep static hardware charges.",
    trafficMultiplier: 3.0,
    trafficRps: 75000,
    edgeCacheHitRate: 0.65,
    scalingMode: "VERTICAL",
    autoScalingEnabled: false,
    chaosActive: false,
    manualCores: 64,
    badgeColor: "text-purple-400 border-purple-500/40 bg-purple-500/10",
    educationalTakeaway: "Vertical scaling lacks elasticity; static 64-core instances cost over $8,900/mo regardless of whether demand fluctuates.",
  },
  {
    id: "AZ_FAILOVER_CHAOS",
    name: "Availability Zone Outage (Chaos)",
    subtitle: "2.0x Traffic with Active Fault Injection",
    description: "Chaos Monkey simulates an Availability Zone network partition and node degradation. Demonstrates how health checks route traffic away from failing nodes.",
    trafficMultiplier: 2.0,
    trafficRps: 50000,
    edgeCacheHitRate: 0.70,
    scalingMode: "HORIZONTAL",
    autoScalingEnabled: true,
    chaosActive: true,
    badgeColor: "text-orange-400 border-orange-500/40 bg-orange-500/10",
    educationalTakeaway: "Resilient multi-node clusters remain operational during node failure, but elevated latencies quickly burn reliability error budgets.",
  },
];

export function getScenarioList(): ArchitectureScenario[] {
  return ARCHITECTURE_SCENARIOS;
}

export function getScenarioById(id: ScenarioId): ArchitectureScenario | undefined {
  return ARCHITECTURE_SCENARIOS.find((s) => s.id === id);
}
