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
const AVG_PAYLOAD_KB = 3.5; // Realistic 3.5 KB avg compressed response

/**
 * Calculates real-world cloud infrastructure costs for AWS, GCP, and Azure.
 * Features true scale-to-zero ($0 at 0 traffic) and realistic enterprise tiering.
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

  // True Scale-To-Zero: If traffic is 0 or all nodes have descaled to 0, costs are literally $0.00
  if (trafficRps <= 0 || (scalingMode === "HORIZONTAL" && nodeCount <= 0)) {
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

  // Traffic volume metrics
  // In realistic web services with diurnal traffic curves, average monthly RPS is ~1.5% of peak burst
  const totalMonthlyRequests = Math.round(safeTraffic * SECONDS_PER_MONTH * 0.015);
  const monthlyRequestsBillion = Number((totalMonthlyRequests / 1_000_000_000).toFixed(2));

  // Egress bandwidth (in Gigabytes)
  const monthlyTotalGb = Math.round((totalMonthlyRequests * AVG_PAYLOAD_KB) / (1024 * 1024));
  const originEgressGb = Math.round(monthlyTotalGb * (1 - hitRate));
  const originRps = Math.round(safeTraffic * (1 - hitRate));

  // 1. Elastic Compute Cost
  let computeMonthly = 0;
  let computeLabel = "";

  if (scalingMode === "HORIZONTAL") {
    if (provider === "AWS") {
      // EKS Auto Mode / Fargate Pods: ~$0.045/hr (~$32.90/mo per pod)
      computeMonthly = nodeCount * 32.90;
      computeLabel = `EKS Auto Mode (${nodeCount}x Pods)`;
    } else if (provider === "GCP") {
      // GKE Autopilot Pods: ~$0.040/hr (~$29.30/mo per pod)
      computeMonthly = nodeCount * 29.30;
      computeLabel = `GKE Autopilot (${nodeCount}x Pods)`;
    } else {
      // Azure Container Apps / AKS Virtual Nodes: ~$0.046/hr (~$33.70/mo per pod)
      computeMonthly = nodeCount * 33.70;
      computeLabel = `AKS Virtual Nodes (${nodeCount}x Pods)`;
    }
  } else {
    // Vertical Monolith (4 units)
    if (coresPerTower <= 0) {
      computeMonthly = 0;
      computeLabel = "Standby (0 Cores Active)";
    } else {
      let hourlyPerTower = 0.08; // 8C
      if (coresPerTower >= 64) hourlyPerTower = 0.64;
      else if (coresPerTower >= 32) hourlyPerTower = 0.32;
      else if (coresPerTower >= 16) hourlyPerTower = 0.16;

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
    // CloudFront enterprise tiered egress (~$0.012/GB) + $0.15/1M HTTPS requests
    const egressCost = monthlyTotalGb * 0.012;
    const reqCost = (totalMonthlyRequests / 1_000_000) * 0.15;
    cdnMonthly = egressCost + reqCost;
    cdnLabel = `CloudFront (0.012/GB)`;
  } else if (provider === "GCP") {
    // Cloud CDN high-volume egress (~$0.011/GB) + lookup discount
    const egressCost = monthlyTotalGb * 0.011;
    const reqCost = (totalMonthlyRequests / 1_000_000) * 0.14;
    const fillCost = originEgressGb * 0.005;
    cdnMonthly = egressCost + reqCost + fillCost;
    cdnLabel = `Google Cloud CDN (0.011/GB)`;
  } else {
    // Azure Front Door enterprise tier (~$0.014/GB) + request fees
    const egressCost = monthlyTotalGb * 0.014;
    const reqCost = (totalMonthlyRequests / 1_000_000) * 0.16;
    const fillCost = originEgressGb * 0.006;
    cdnMonthly = egressCost + reqCost + fillCost;
    cdnLabel = `Azure Front Door (0.014/GB)`;
  }

  // 3. Load Balancing Cost
  let loadBalancerMonthly = 0;
  let loadBalancerLabel = "";

  if (originRps <= 0) {
    loadBalancerMonthly = 0;
    loadBalancerLabel = "Standby (0 LCUs)";
  } else if (provider === "AWS") {
    // ALB dynamic LCUs (~1 LCU per 800 origin RPS @ $0.008/LCU-hr)
    const lcus = Math.max(1, originRps / 800);
    loadBalancerMonthly = lcus * 0.008 * HOURS_PER_MONTH;
    loadBalancerLabel = `2x ALB (${Math.round(lcus)} LCUs)`;
  } else if (provider === "GCP") {
    // Global ALB: billed per GB processed to origin
    const lbDataCost = originEgressGb * 0.006;
    loadBalancerMonthly = Math.max(8, lbDataCost);
    loadBalancerLabel = `Global External ALB`;
  } else {
    // Azure App Gateway Capacity Units
    const cus = Math.max(1, originRps / 900);
    loadBalancerMonthly = cus * 0.008 * HOURS_PER_MONTH;
    loadBalancerLabel = `App Gateway (${Math.round(cus)} CUs)`;
  }

  const monthlyTotal = Math.round(computeMonthly + cdnMonthly + loadBalancerMonthly);
  const hourlyBurnRate = Number((monthlyTotal / HOURS_PER_MONTH).toFixed(2));
  const costPerMillionRequests = Number(
    ((monthlyTotal / Math.max(1, totalMonthlyRequests / 1_000_000))).toFixed(3)
  );

  // Baseline cost without Edge CDN (100% traffic hits origin servers and direct internet egress)
  const fullTrafficPods = Math.min(28, Math.max(1, Math.ceil(safeTraffic / 2800)));
  const noCacheCompute = scalingMode === "HORIZONTAL"
    ? fullTrafficPods * 31.0 + 73.0
    : computeMonthly * 2.5;
  // Direct origin internet egress without CDN volume tiering (~$0.085/GB)
  const noCacheOriginEgress = monthlyTotalGb * 0.085;
  const noCacheLb = (safeTraffic / 800) * 0.008 * HOURS_PER_MONTH;
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
