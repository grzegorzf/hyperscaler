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
const AVG_PAYLOAD_KB = 20; // 20 KB avg response size (APIs + assets)

/**
 * Calculates real-world cloud infrastructure costs for AWS, GCP, and Azure
 * based on current active traffic, scaling mode, node allocation, and CDN caching ratio.
 */
export function calculateCloudCosts(
  provider: CloudProvider,
  trafficRps: number,
  edgeCacheHitRate: number,
  scalingMode: ScalingMode,
  nodeCount: number,
  coresPerTower = 16
): CloudCostBreakdown {
  const safeTraffic = Math.max(100, trafficRps);
  const hitRate = Math.max(0, Math.min(0.99, edgeCacheHitRate));

  const totalMonthlyRequests = safeTraffic * SECONDS_PER_MONTH;
  const monthlyRequestsBillion = Number((totalMonthlyRequests / 1_000_000_000).toFixed(2));

  // Bandwidth in Gigabytes (20 KB per request)
  const monthlyTotalGb = Math.round((totalMonthlyRequests * AVG_PAYLOAD_KB) / (1024 * 1024));
  const edgeAbsorbedGb = monthlyTotalGb * hitRate;
  const originEgressGb = monthlyTotalGb * (1 - hitRate);
  const originRps = safeTraffic * (1 - hitRate);

  // 1. Compute Cost
  let computeMonthly = 0;
  let computeLabel = "";

  if (scalingMode === "HORIZONTAL") {
    // Pod count: 1 pod = 4 vCPU, 16 GB RAM
    if (provider === "AWS") {
      const eksFee = 73.2; // $0.10/hr
      const ec2Cost = nodeCount * 140.54; // m6i.xlarge ($0.192/hr)
      computeMonthly = eksFee + ec2Cost;
      computeLabel = `EKS + ${nodeCount}x m6i.xlarge Pods`;
    } else if (provider === "GCP") {
      // 1 zonal GKE cluster management free tier
      const gceCost = nodeCount * 120.78; // c3-standard-4 ($0.165/hr)
      computeMonthly = gceCost;
      computeLabel = `GKE + ${nodeCount}x c3-standard-4 Nodes`;
    } else {
      // Azure AKS Free management tier
      const vmCost = nodeCount * 140.54; // Standard_D4s_v5 ($0.192/hr)
      computeMonthly = vmCost;
      computeLabel = `AKS + ${nodeCount}x D4s_v5 Nodes`;
    }
  } else {
    // Vertical Monolith (4 units)
    if (provider === "AWS") {
      let hourlyPerTower = 0.384; // 8C
      if (coresPerTower >= 64) hourlyPerTower = 3.072;
      else if (coresPerTower >= 32) hourlyPerTower = 1.536;
      else if (coresPerTower >= 16) hourlyPerTower = 0.768;

      computeMonthly = 4 * hourlyPerTower * HOURS_PER_MONTH;
      computeLabel = `4x AWS m6i.${coresPerTower >= 64 ? "16xlarge" : coresPerTower >= 32 ? "8xlarge" : coresPerTower >= 16 ? "4xlarge" : "2xlarge"}`;
    } else if (provider === "GCP") {
      let hourlyPerTower = 0.33; // 8C
      if (coresPerTower >= 64) hourlyPerTower = 2.64;
      else if (coresPerTower >= 32) hourlyPerTower = 1.32;
      else if (coresPerTower >= 16) hourlyPerTower = 0.66;

      computeMonthly = 4 * hourlyPerTower * HOURS_PER_MONTH;
      computeLabel = `4x GCP c3-standard-${coresPerTower}`;
    } else {
      let hourlyPerTower = 0.384;
      if (coresPerTower >= 64) hourlyPerTower = 3.072;
      else if (coresPerTower >= 32) hourlyPerTower = 1.536;
      else if (coresPerTower >= 16) hourlyPerTower = 0.768;

      computeMonthly = 4 * hourlyPerTower * HOURS_PER_MONTH;
      computeLabel = `4x Azure Standard_D${coresPerTower}s_v5`;
    }
  }

  // 2. Edge CDN & Egress Cost
  let cdnMonthly = 0;
  let cdnLabel = "";

  if (provider === "AWS") {
    // CloudFront request pricing: $0.75 per 1M requests
    const requestCost = (totalMonthlyRequests / 1_000_000) * 0.75;
    // Tiered egress: ~$0.042/GB blended
    const egressCost = monthlyTotalGb * 0.042;
    // EC2 to CloudFront origin transfer is $0.00 free!
    cdnMonthly = requestCost + egressCost;
    cdnLabel = `CloudFront (0.042/GB + reqs)`;
  } else if (provider === "GCP") {
    // Cloud CDN: $0.75 per 1M lookups + ~$0.038/GB cache egress
    const lookupCost = (totalMonthlyRequests / 1_000_000) * 0.75;
    const egressCost = monthlyTotalGb * 0.038;
    // Cache fill discount: $0.01/GB
    const fillCost = originEgressGb * 0.01;
    cdnMonthly = lookupCost + egressCost + fillCost;
    cdnLabel = `Google Cloud CDN (0.038/GB)`;
  } else {
    // Azure Front Door Standard: $35 base + $0.90 per 1M req + $0.045/GB
    const baseFee = 35.0;
    const reqCost = (totalMonthlyRequests / 1_000_000) * 0.9;
    const egressCost = monthlyTotalGb * 0.045;
    const originFetchCost = originEgressGb * 0.015;
    cdnMonthly = baseFee + reqCost + egressCost + originFetchCost;
    cdnLabel = `Azure Front Door (0.045/GB)`;
  }

  // 3. Load Balancing Cost
  let loadBalancerMonthly = 0;
  let loadBalancerLabel = "";

  if (provider === "AWS") {
    // 2 ALBs: $0.0225/hr base ($32.94) + LCU hours ($0.008/LCU-hr, ~1 LCU per 400 origin RPS)
    const albBase = 2 * 0.0225 * HOURS_PER_MONTH;
    const lcus = Math.max(1, originRps / 400);
    const lcuCost = lcus * 0.008 * HOURS_PER_MONTH;
    loadBalancerMonthly = albBase + lcuCost;
    loadBalancerLabel = `2x ALB (${Math.round(lcus)} LCUs)`;
  } else if (provider === "GCP") {
    // Global App Load Balancer: $0.025/hr base ($18.30) + $0.008 per GB processed to origin
    const lbBase = 0.025 * HOURS_PER_MONTH;
    const lbDataCost = originEgressGb * 0.008;
    loadBalancerMonthly = lbBase + lbDataCost;
    loadBalancerLabel = `Global External ALB`;
  } else {
    // Azure App Gateway v2: $0.246/hr base ($180.07) + Capacity Units ($0.008/CU-hr)
    const base = 0.246 * HOURS_PER_MONTH;
    const cus = Math.max(1, originRps / 500);
    const cuCost = cus * 0.008 * HOURS_PER_MONTH;
    loadBalancerMonthly = base + cuCost;
    loadBalancerLabel = `App Gateway v2 (${Math.round(cus)} CUs)`;
  }

  const monthlyTotal = Math.round(computeMonthly + cdnMonthly + loadBalancerMonthly);
  const hourlyBurnRate = Number((monthlyTotal / HOURS_PER_MONTH).toFixed(2));
  const costPerMillionRequests = Number(
    ((monthlyTotal / (totalMonthlyRequests / 1_000_000))).toFixed(3)
  );

  // Baseline cost if running completely WITHOUT Edge CDN (0% cache hit, 100% hits origin compute & direct internet egress)
  const fullTrafficPods = Math.min(28, Math.max(nodeCount, Math.round((safeTraffic / 25000) * 5 + 3)));
  const noCacheCompute = scalingMode === "HORIZONTAL"
    ? (provider === "AWS" ? 73.2 + fullTrafficPods * 140.54 : fullTrafficPods * 125)
    : computeMonthly * 1.5;
  // Direct public origin egress without CDN volume tiering (~$0.085/GB)
  const noCacheOriginEgress = monthlyTotalGb * 0.085;
  // Load balancers handling 100% of global traffic
  const noCacheLb = (safeTraffic / 400) * 0.008 * HOURS_PER_MONTH + 35;
  const noCacheBaselineTotal = Math.round(noCacheCompute + noCacheOriginEgress + noCacheLb);
  const edgeSavingsMonthly = Math.max(0, Math.round(noCacheBaselineTotal - monthlyTotal));

  const providerNames: Record<CloudProvider, string> = {
    AWS: "Amazon Web Services",
    GCP: "Google Cloud Platform",
    AZURE: "Microsoft Azure",
  };

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
