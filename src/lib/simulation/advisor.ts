import type { ClusterState } from "./types";
import type { CloudCostBreakdown } from "./cloudCosts";

export type InsightCategory = "FINOPS" | "PERFORMANCE" | "RELIABILITY" | "ARCHITECTURE";
export type InsightSeverity = "SUCCESS" | "INFO" | "WARNING" | "CRITICAL";

export interface ArchitectureInsight {
  id: string;
  title: string;
  message: string;
  category: InsightCategory;
  severity: InsightSeverity;
  actionRecommendation?: string;
  metricBadge?: string;
}

/**
 * Expert Cloud Architecture Advisory Engine.
 * Evaluates live telemetry, autoscaling behavior, and cloud economics
 * to generate actionable FinOps and reliability recommendations.
 */
export function generateArchitectureInsights(
  state: ClusterState,
  costs: CloudCostBreakdown
): ArchitectureInsight[] {
  const insights: ArchitectureInsight[] = [];

  // 1. Scale-to-Zero Verification
  if (state.trafficRps <= 0) {
    insights.push({
      id: "scale-to-zero",
      title: "Scale-to-Zero Dormancy Active",
      message: "Zero ingress traffic detected. All pods have descaled to 0. Operational burn rate is $0.00/hr.",
      category: "FINOPS",
      severity: "SUCCESS",
      actionRecommendation: "Ideal for staging or intermittent workloads to eliminate idle server spend.",
      metricBadge: "$0.00 / hr",
    });
    return insights;
  }

  // 2. Monolith vs Mesh Trap
  if (state.scalingMode === "VERTICAL" && state.trafficRps >= 25000) {
    const cores = state.nodes[0]?.cpuCores || 16;
    insights.push({
      id: "vertical-cost-trap",
      title: "Monolithic Vertical Scaling Overhead",
      message: `Running 4x ${cores}-core monolith towers costs $${costs.computeMonthly.toLocaleString()}/mo in static compute allocations.`,
      category: "ARCHITECTURE",
      severity: "WARNING",
      actionRecommendation: "Switch to Horizontal Autoscaling to dynamically scale granular 4-vCPU pods and reduce compute spend by up to 65%.",
      metricBadge: `4x ${cores}C Monolith`,
    });
  }

  // 3. Cache Starvation Warning
  if (state.edgeCacheHitRate < 0.50 && state.trafficRps >= 15000) {
    insights.push({
      id: "cache-starvation",
      title: "Low Edge Cache Shielding (<50%)",
      message: `${Math.round((1 - state.edgeCacheHitRate) * 100)}% of traffic is hitting origin directly, causing elevated load balancer LCUs and pod strain.`,
      category: "PERFORMANCE",
      severity: "CRITICAL",
      actionRecommendation: "Implement aggressive Edge CDN caching for static assets & stale-while-revalidate for API responses.",
      metricBadge: `${Math.round(state.edgeCacheHitRate * 100)}% Hit Rate`,
    });
  }

  // 4. Aggressive Edge Cache Savings
  if (state.edgeCacheHitRate >= 0.85 && state.trafficRps >= 15000) {
    insights.push({
      id: "high-cache-savings",
      title: "Edge CDN Offload Optimizing Spend",
      message: `Edge CDN is absorbing ${Math.round(state.edgeCacheHitRate * 100)}% of requests, protecting backend compute and keeping P50 latency low.`,
      category: "FINOPS",
      severity: "SUCCESS",
      actionRecommendation: `Saving ~$${costs.edgeSavingsMonthly.toLocaleString()}/mo compared to serving directly from origin infrastructure.`,
      metricBadge: `-$${costs.edgeSavingsMonthly.toLocaleString()}/mo`,
    });
  }

  // 5. Chaos Monkey Fault Injection Active
  if (state.chaosActive) {
    insights.push({
      id: "chaos-active",
      title: "Chaos Monkey Fault Injection In Progress",
      message: "Synthetic latency spikes and node packet drops are active. Error rate is elevated.",
      category: "RELIABILITY",
      severity: "CRITICAL",
      actionRecommendation: "Verify that load balancer health checks and pod replicas properly absorb degraded instances.",
      metricBadge: `${state.errorRatePercent}% Error Rate`,
    });
  }

  // 6. Compute Saturation
  if (state.averageCpuPercent > 85 && !state.autoScalingEnabled) {
    insights.push({
      id: "compute-saturation",
      title: "Node Saturation with Autoscaling Disabled",
      message: `Cluster average CPU utilization is ${state.averageCpuPercent}%, but autoscaling is disabled. Risk of cascade failure.`,
      category: "RELIABILITY",
      severity: "WARNING",
      actionRecommendation: "Enable Autoscaling or manually provision additional pods to alleviate thermal pressure.",
      metricBadge: `${state.averageCpuPercent}% CPU`,
    });
  }

  // 7. Healthy Baseline
  if (insights.length === 0) {
    insights.push({
      id: "nominal-operations",
      title: "Cluster Operating Nominally",
      message: `Balanced traffic flow (${state.trafficRps.toLocaleString()} req/s) with sub-15ms P50 latency and NOMINAL system health.`,
      category: "ARCHITECTURE",
      severity: "INFO",
      actionRecommendation: "Continue monitoring telemetry and CDN absorption ratios.",
      metricBadge: "NOMINAL",
    });
  }

  return insights;
}
