import type { ScalingMode } from "./types";

export type CloudProvider = "AWS" | "GCP" | "AZURE";

export interface CloudCostBreakdown {
  provider: CloudProvider;
  providerName: string;
  monthlyTotal: number;
  hourlyBurnRate: number;
  costPerMillionRequests: number;
  computeMonthly: number;
  computeLabel: string;
  cdnMonthly: number;
  cdnLabel: string;
  loadBalancerMonthly: number;
  loadBalancerLabel: string;
  edgeSavingsMonthly: number;
  monthlyRequestsBillion: number;
  monthlyTotalGb: number;
}

const HOURS_PER_MONTH = 732; // Average 30.5 days * 24 hrs
const SECONDS_PER_MONTH = HOURS_PER_MONTH * 3600; // 2,635,200 seconds
const AVG_PAYLOAD_KB = 6.0; // 6.0 KB avg response (dynamic JSON APIs + cached web assets)

/**
 * Calculates real-world cloud infrastructure costs for AWS, GCP, and Azure.
 * Features true scale-to-zero ($0 at 0 traffic), realistic baseline operations,
 * and high-fidelity storm surge scaling (10-50x higher under max simulated swarm load).
 */
export function calculateCloudCosts(
  provider: CloudProvider,
  trafficRps: number,
  edgeCacheHitRate: number,
  scalingMode: ScalingMode,
  nodeCount: number,
  coresPerTower = 16
): CloudCostBreakdown {
  const providerNames: Record<CloudProvider, string> = {
    AWS: "Amazon Web Services",
    GCP: "Google Cloud Platform",
    AZURE: "Microsoft Azure",
  };

  // True Scale-To-Zero: If traffic is 0, costs are literally $0.00
  if (trafficRps <= 0) {
    return {
      provider,
      providerName: providerNames[provider],
      monthlyTotal: 0,
      hourlyBurnRate: 0,
      costPerMillionRequests: 0,
      computeMonthly: 0,
      computeLabel: "Dormant (0 Active Pods)",
      cdnMonthly: 0,
      cdnLabel: "Idle (0 GB Egress)",
      loadBalancerMonthly: 0,
      loadBalancerLabel: "Standby (0 LCUs)",
      edgeSavingsMonthly: 0,
      monthlyRequestsBillion: 0,
      monthlyTotalGb: 0,
    };
  }

  const safeTraffic = Math.max(0, trafficRps);
  const hitRate = Math.max(0, Math.min(0.99, edgeCacheHitRate));
  const mult = safeTraffic / 25000;
  const originRps = Math.round(safeTraffic * (1 - hitRate));

  // Storm surge exponent:
  // Normal (1.0x) reflects realistic diurnal production traffic (~1B req/mo).
  // Storm / Swarm (5.0x) expands non-linearly to reflect sustained peak attack/surge volume (~65B req/mo).
  const surgeMultiplier = Math.pow(mult, 1.6);
  const totalMonthlyRequests = Math.round(
    safeTraffic * SECONDS_PER_MONTH * 0.015 * Math.max(1, surgeMultiplier)
  );
  const monthlyRequestsBillion = Number((totalMonthlyRequests / 1_000_000_000).toFixed(2));

  // Egress bandwidth (in Gigabytes)
  const monthlyTotalGb = Math.round((totalMonthlyRequests * AVG_PAYLOAD_KB) / (1024 * 1024));
  const originEgressGb = Math.round(monthlyTotalGb * (1 - hitRate));

  // 1. Elastic Compute Cost
  let computeMonthly = 0;
  let computeLabel = "";

  if (scalingMode === "HORIZONTAL") {
    if (nodeCount <= 0) {
      computeMonthly = 0;
      computeLabel = "Dormant (0 Active Pods)";
    } else if (provider === "AWS") {
      // EKS Auto Mode / Managed Nodes (4 vCPU / 16 GB pods @ $68/mo + $73.20 cluster fee)
      computeMonthly = nodeCount * 68.0 + 73.2;
      computeLabel = `EKS + ${nodeCount}x 4vCPU Pods`;
    } else if (provider === "GCP") {
      // GKE Autopilot Pods (4 vCPU / 16 GB @ $58/mo, free zonal cluster management)
      computeMonthly = nodeCount * 58.0;
      computeLabel = `GKE + ${nodeCount}x 4vCPU Pods`;
    } else {
      // Azure AKS Container Apps / Nodes (4 vCPU / 16 GB @ $62/mo, free tier cluster)
      computeMonthly = nodeCount * 62.0;
      computeLabel = `AKS + ${nodeCount}x 4vCPU Pods`;
    }
  } else {
    // Vertical Monolith (4 units)
    if (coresPerTower <= 0) {
      computeMonthly = 0;
      computeLabel = "Standby (0 Cores Active)";
    } else {
      let hourlyPerTower = 0.384; // 8C (m6i.2xlarge tier)
      if (coresPerTower >= 64) hourlyPerTower = 3.072; // 64C (m6i.16xlarge tier)
      else if (coresPerTower >= 32) hourlyPerTower = 1.536; // 32C (m6i.8xlarge tier)
      else if (coresPerTower >= 16) hourlyPerTower = 0.768; // 16C (m6i.4xlarge tier)

      computeMonthly = 4 * hourlyPerTower * HOURS_PER_MONTH;
      if (provider === "AWS") {
        computeLabel = `4x AWS m6i.${coresPerTower >= 64 ? "16xlarge" : coresPerTower >= 32 ? "8xlarge" : coresPerTower >= 16 ? "4xlarge" : "2xlarge"}`;
      } else if (provider === "GCP") {
        computeLabel = `4x GCP c3-standard-${coresPerTower}`;
      } else {
        computeLabel = `4x Azure Standard_D${coresPerTower}s_v5`;
      }
    }
  }

  // 2. High-Volume Edge CDN & Egress Cost
  let cdnMonthly = 0;
  let cdnLabel = "";

  if (provider === "AWS") {
    // CloudFront enterprise tiered egress ($0.020 - $0.028/GB) + $0.40/1M requests
    const egressRate = mult >= 3.0 ? 0.028 : 0.020;
    const egressCost = monthlyTotalGb * egressRate;
    const reqCost = (totalMonthlyRequests / 1_000_000) * 0.40;
    cdnMonthly = egressCost + reqCost;
    cdnLabel = `CloudFront (${egressRate}/GB + reqs)`;
  } else if (provider === "GCP") {
    // Cloud CDN high-volume egress ($0.018 - $0.026/GB) + $0.35/1M lookups + fill fee
    const egressRate = mult >= 3.0 ? 0.026 : 0.018;
    const egressCost = monthlyTotalGb * egressRate;
    const reqCost = (totalMonthlyRequests / 1_000_000) * 0.35;
    const fillCost = originEgressGb * 0.008;
    cdnMonthly = egressCost + reqCost + fillCost;
    cdnLabel = `Google Cloud CDN (${egressRate}/GB)`;
  } else {
    // Azure Front Door enterprise tier ($0.022 - $0.030/GB) + $0.42/1M requests + base fee
    const egressRate = mult >= 3.0 ? 0.030 : 0.022;
    const egressCost = monthlyTotalGb * egressRate;
    const reqCost = (totalMonthlyRequests / 1_000_000) * 0.42;
    const fillCost = originEgressGb * 0.010;
    cdnMonthly = 35.0 + egressCost + reqCost + fillCost;
    cdnLabel = `Azure Front Door (${egressRate}/GB)`;
  }

  // 3. Load Balancing Cost
  let loadBalancerMonthly = 0;
  let loadBalancerLabel = "";

  if (originRps <= 0) {
    loadBalancerMonthly = 0;
    loadBalancerLabel = "Standby (0 LCUs)";
  } else if (provider === "AWS") {
    // ALB base ($32.94) + dynamic LCUs (~1 LCU per 250 origin RPS @ $0.008/LCU-hr)
    const lcus = Math.max(1, originRps / 250);
    loadBalancerMonthly = 32.94 + lcus * 0.008 * HOURS_PER_MONTH;
    loadBalancerLabel = `2x ALB (${Math.round(lcus)} LCUs)`;
  } else if (provider === "GCP") {
    // Global ALB base ($18.30) + data processed to origin ($0.008/GB)
    const lbDataCost = originEgressGb * 0.008;
    loadBalancerMonthly = 18.30 + lbDataCost;
    loadBalancerLabel = `Global External ALB`;
  } else {
    // Azure App Gateway base ($180) + Capacity Units (~1 CU per 300 origin RPS @ $0.008/CU-hr)
    const cus = Math.max(1, originRps / 300);
    loadBalancerMonthly = 180.0 + cus * 0.008 * HOURS_PER_MONTH;
    loadBalancerLabel = `App Gateway v2 (${Math.round(cus)} CUs)`;
  }

  const monthlyTotal = Math.round(computeMonthly + cdnMonthly + loadBalancerMonthly);
  const hourlyBurnRate = Number((monthlyTotal / HOURS_PER_MONTH).toFixed(2));
  const costPerMillionRequests = Number(
    (monthlyTotal / Math.max(1, totalMonthlyRequests / 1_000_000)).toFixed(3)
  );

  // Baseline cost without Edge CDN (100% traffic hits origin servers, direct egress, and unshielded TLS balancers)
  const fullTrafficPods = Math.min(28, Math.max(1, Math.ceil(safeTraffic / 2500)));
  const noCacheCompute = scalingMode === "HORIZONTAL"
    ? fullTrafficPods * 68.0 + 73.2
    : computeMonthly * 2.5;
  // Direct origin internet egress without CDN volume tiering (~$0.085/GB)
  const noCacheOriginEgress = monthlyTotalGb * 0.085;
  // Load balancers handling 100% unshielded TLS connection handshakes
  const noCacheLcus = Math.max(1, safeTraffic / 25);
  const noCacheLb = 32.94 + Math.min(noCacheLcus, 3500) * 0.008 * HOURS_PER_MONTH;
  const noCacheBaselineTotal = Math.round(noCacheCompute + noCacheOriginEgress + noCacheLb);
  const edgeSavingsMonthly = Math.max(0, Math.round(noCacheBaselineTotal - monthlyTotal));

  return {
    provider,
    providerName: providerNames[provider],
    monthlyTotal,
    hourlyBurnRate,
    costPerMillionRequests,
    computeMonthly: Math.round(computeMonthly),
    computeLabel,
    cdnMonthly: Math.round(cdnMonthly),
    cdnLabel,
    loadBalancerMonthly: Math.round(loadBalancerMonthly),
    loadBalancerLabel,
    edgeSavingsMonthly,
    monthlyRequestsBillion,
    monthlyTotalGb,
  };
}
