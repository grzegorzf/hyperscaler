import type { ScalingMode } from "./types";
import type { CloudCostBreakdown, CloudProvider } from "./cloudCosts";
import { calculateCloudCosts } from "./cloudCosts";

export interface CommittedDiscount {
  oneYearCommitMonthly: number;
  threeYearCommitMonthly: number;
  oneYearAnnualSavings: number;
  threeYearAnnualSavings: number;
}

export interface ProviderComparisonItem {
  provider: CloudProvider;
  costs: CloudCostBreakdown;
  committedDiscounts: CommittedDiscount;
  isCheapest: boolean;
  deltaVsCheapestMonthly: number;
}

export interface MultiCloudComparison {
  items: ProviderComparisonItem[];
  cheapestProvider: CloudProvider;
  mostExpensiveProvider: CloudProvider;
  maxMonthlySavings: number;
  recommendation: string;
}

/**
 * Calculates side-by-side cost breakdown across AWS, GCP, and Azure,
 * identifying the most cost-effective cloud for the active traffic tier
 * and modeling 1-year (30%) and 3-year (45%) committed use savings.
 */
export function getMultiCloudComparison(
  trafficRps: number,
  edgeCacheHitRate: number,
  scalingMode: ScalingMode,
  nodeCount: number,
  coresPerTower = 16
): MultiCloudComparison {
  const providers: CloudProvider[] = ["AWS", "GCP", "AZURE"];

  const costMap = providers.map((provider) => {
    const costs = calculateCloudCosts(
      provider,
      trafficRps,
      edgeCacheHitRate,
      scalingMode,
      nodeCount,
      coresPerTower
    );

    // Compute discounts: 1-Year (~30% compute discount), 3-Year (~45% compute discount)
    const compute = costs.computeMonthly;
    const nonCompute = costs.cdnMonthly + costs.loadBalancerMonthly;

    const oneYearCompute = Math.round(compute * 0.70);
    const threeYearCompute = Math.round(compute * 0.55);

    const oneYearCommitMonthly = oneYearCompute + nonCompute;
    const threeYearCommitMonthly = threeYearCompute + nonCompute;

    const oneYearAnnualSavings = Math.round((costs.monthlyTotal - oneYearCommitMonthly) * 12);
    const threeYearAnnualSavings = Math.round((costs.monthlyTotal - threeYearCommitMonthly) * 12);

    return {
      provider,
      costs,
      committedDiscounts: {
        oneYearCommitMonthly,
        threeYearCommitMonthly,
        oneYearAnnualSavings: Math.max(0, oneYearAnnualSavings),
        threeYearAnnualSavings: Math.max(0, threeYearAnnualSavings),
      },
    };
  });

  // Sort to find cheapest and most expensive
  const sorted = [...costMap].sort((a, b) => a.costs.monthlyTotal - b.costs.monthlyTotal);
  const cheapest = sorted[0];
  const mostExpensive = sorted[sorted.length - 1];
  const maxMonthlySavings = Math.max(0, mostExpensive.costs.monthlyTotal - cheapest.costs.monthlyTotal);

  const items: ProviderComparisonItem[] = costMap.map((entry) => ({
    ...entry,
    isCheapest: entry.provider === cheapest.provider,
    deltaVsCheapestMonthly: entry.costs.monthlyTotal - cheapest.costs.monthlyTotal,
  }));

  let recommendation = "";
  if (trafficRps <= 0) {
    recommendation = "All cloud providers achieve $0.00 idle cost via scale-to-zero serverless architecture.";
  } else if (cheapest.provider === "GCP") {
    recommendation = `Google Cloud Platform is optimal for this configuration, saving $${maxMonthlySavings.toLocaleString()}/mo over ${mostExpensive.provider} through zero GKE cluster management fees and lower CDN egress.`;
  } else if (cheapest.provider === "AWS") {
    recommendation = `Amazon Web Services is optimal for this configuration, saving $${maxMonthlySavings.toLocaleString()}/mo over ${mostExpensive.provider} through efficient EKS Auto Mode pod packing and CloudFront edge rates.`;
  } else {
    recommendation = `Microsoft Azure is optimal for this configuration, saving $${maxMonthlySavings.toLocaleString()}/mo over ${mostExpensive.provider} through zero AKS cluster fees and Front Door edge routing.`;
  }

  return {
    items,
    cheapestProvider: cheapest.provider,
    mostExpensiveProvider: mostExpensive.provider,
    maxMonthlySavings,
    recommendation,
  };
}
