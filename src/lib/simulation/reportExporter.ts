import type { ClusterState } from "./types";
import type { MultiCloudComparison } from "./cloudArbitrage";
import type { CarbonMetrics } from "./carbonFootprint";
import type { ArchitectureInsight } from "./advisor";

/**
 * Generates an executive Architecture Specification and FinOps Report
 * in GitHub-flavored Markdown.
 */
export function generateArchitectureReportMarkdown(
  state: ClusterState,
  arbitrage: MultiCloudComparison,
  carbon: CarbonMetrics,
  insights: ArchitectureInsight[]
): string {
  const dateStr = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
  const isHoriz = state.scalingMode === "HORIZONTAL";

  return `# Hyperscaler Architecture Specification & FinOps Report
*Generated on ${dateStr} via Hyperscaler 3D Holographic Cluster Engine*

---

## 1. Executive Summary

| Parameter | Current Value | Notes |
|---|---|---|
| **Simulated Ingress Traffic** | **${state.trafficRps.toLocaleString()} req/s** | Peak ingress rate |
| **Edge CDN Cache Absorption** | **${Math.round(state.edgeCacheHitRate * 100)}%** | Offloaded at PoP level |
| **Origin Backend Ingress** | **${state.originIngressRps.toLocaleString()} req/s** | Serviced by origin compute |
| **Active Scaling Architecture** | **${isHoriz ? `Horizontal Cluster (${state.totalNodes} Pods)` : `Vertical Monolith (${state.nodes[0]?.cpuCores || 16} Cores/Tower)`}** | ${state.autoScalingEnabled ? "Autoscaling ON" : "Manual Static"} |
| **System Reliability Health** | **${state.systemHealth}** | Error rate: ${state.errorRatePercent}% |
| **P50 / P99 Latency** | **${state.latencyP50Ms}ms / ${state.latencyP99Ms}ms** | Latency profile |

---

## 2. Multi-Cloud Cost Arbitrage & Bill Comparison

Comprehensive cost comparison across the Big Three cloud hyperscalers for this architecture:

| Cost Component | Amazon Web Services (AWS) | Google Cloud Platform (GCP) | Microsoft Azure |
|---|---|---|---|
${arbitrage.items
  .map(
    (item) =>
      `| **${item.provider} Total** | **$${item.costs.monthlyTotal.toLocaleString()} / mo** ($${item.costs.hourlyBurnRate.toFixed(2)}/hr) | Compute: $${item.costs.computeMonthly.toLocaleString()} | CDN: $${item.costs.cdnMonthly.toLocaleString()} | LB: $${item.costs.loadBalancerMonthly.toLocaleString()} |`
  )
  .join("\n")}

### Key FinOps Takeaways:
- **Optimal Cloud Provider**: **${arbitrage.cheapestProvider}**
- **Monthly Arbitrage Savings**: **$${arbitrage.maxMonthlySavings.toLocaleString()} / month** compared to ${arbitrage.mostExpensiveProvider}.
- **Recommendation**: ${arbitrage.recommendation}

---

## 3. Committed Use Discounts (1-Year & 3-Year Projections)

Modeling reserved instances and savings plans on baseline compute:

| Provider | On-Demand Total | 1-Yr Commit (~30% Compute Disc.) | 3-Yr Commit (~45% Compute Disc.) | Annual Savings (3-Yr) |
|---|---|---|---|---|
${arbitrage.items
  .map(
    (item) =>
      `| **${item.provider}** | $${item.costs.monthlyTotal.toLocaleString()}/mo | $${item.committedDiscounts.oneYearCommitMonthly.toLocaleString()}/mo | $${item.committedDiscounts.threeYearCommitMonthly.toLocaleString()}/mo | **$${item.committedDiscounts.threeYearAnnualSavings.toLocaleString()} / yr** |`
  )
  .join("\n")}

---

## 4. Green Cloud & Sustainability (ESG Assessment)

Evaluated under Cloud Carbon Footprint standards (Scope 2 & Scope 3):

- **Monthly Operational Footprint**: **${carbon.monthlyKgCo2e.toLocaleString()} kg CO₂e** (~${carbon.monthlyKwh.toLocaleString()} kWh)
- **Carbon Avoidance via Edge Caching**: **-${carbon.edgeSavingsKgCo2e.toLocaleString()} kg CO₂e / month**
- **Tree Absorption Equivalent**: **${carbon.treesEquivalent} mature trees** required to offset annual footprint
- **Infrastructure Eco Score**: **${carbon.ecoScore}** (*${carbon.ecoScoreLabel}*)
- **Data Center PUE Factor**: **${carbon.pueFactor}**

---

## 5. Senior Cloud Architect Advisory Notes

${insights
  .map(
    (ins, i) => `### 5.${i + 1} [${ins.severity}] ${ins.title}
- **Category**: ${ins.category}
- **Assessment**: ${ins.message}
${ins.actionRecommendation ? `- **Action Plan**: ${ins.actionRecommendation}` : ""}`
  )
  .join("\n\n")}

---
*Report generated automatically by Hyperscaler — Cloud Architecture & Distributed Systems Simulator.*
`;
}

/**
 * Triggers a browser file download of the text content.
 */
export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
