import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateCloudCosts } from "../src/lib/simulation/cloudCosts";

describe("Multi-Cloud Cost Modeling", () => {
  it("evaluates to exactly $0.00 across all cloud providers at zero traffic", () => {
    ["AWS", "GCP", "AZURE"].forEach((provider) => {
      const zeroCost = calculateCloudCosts(provider as any, 0, 0.75, "HORIZONTAL", 0);
      assert.strictEqual(zeroCost.monthlyTotal, 0, `${provider} total must be $0 at 0 traffic`);
      assert.strictEqual(zeroCost.hourlyBurnRate, 0, `${provider} hourly burn rate must be $0`);
      assert.strictEqual(zeroCost.computeMonthly, 0, `${provider} compute must be $0`);
      assert.strictEqual(zeroCost.cdnMonthly, 0, `${provider} CDN must be $0`);
      assert.strictEqual(zeroCost.loadBalancerMonthly, 0, `${provider} LB must be $0`);
      assert.strictEqual(zeroCost.edgeSavingsMonthly, 0);
      assert.strictEqual(zeroCost.monthlyTotalGb, 0);
    });
  });

  it("calculates realistic AWS operational bills", () => {
    // 25,000 req/s with 75% cache hit rate and 8 pods
    const cost = calculateCloudCosts("AWS", 25000, 0.75, "HORIZONTAL", 8);

    assert.strictEqual(cost.provider, "AWS");
    assert.strictEqual(cost.providerName, "Amazon Web Services");
    assert.ok(
      cost.monthlyTotal >= 350 && cost.monthlyTotal <= 950,
      `Monthly total should be realistic (~$500-$700), got ${cost.monthlyTotal}`
    );
    assert.ok(cost.hourlyBurnRate > 0, "Hourly burn rate should be positive");
    assert.ok(
      cost.computeMonthly >= 200 && cost.computeMonthly <= 500,
      `Compute should account for EKS + nodes, got ${cost.computeMonthly}`
    );
    assert.ok(cost.cdnMonthly > 0, "CDN request & egress costs must be present");
    assert.ok(cost.edgeSavingsMonthly > 0, "CDN caching must show significant dollar savings");
    assert.ok(cost.computeLabel.includes("EKS"));
    assert.ok(cost.cdnLabel.includes("CloudFront"));
  });

  it("calculates GCP and Azure cost breakdowns with provider-specific services", () => {
    const gcp = calculateCloudCosts("GCP", 25000, 0.75, "HORIZONTAL", 8);
    assert.strictEqual(gcp.provider, "GCP");
    assert.ok(gcp.computeLabel.includes("GKE"));
    assert.ok(gcp.cdnLabel.includes("Google Cloud CDN"));

    const azure = calculateCloudCosts("AZURE", 25000, 0.75, "HORIZONTAL", 8);
    assert.strictEqual(azure.provider, "AZURE");
    assert.ok(azure.computeLabel.includes("AKS"));
    assert.ok(azure.cdnLabel.includes("Azure Front Door"));
    assert.ok(azure.loadBalancerLabel.includes("App Gateway"));
  });

  it("demonstrates massive savings from edge cache offloading", () => {
    // High cache hit (90%)
    const highCache = calculateCloudCosts("AWS", 50000, 0.90, "HORIZONTAL", 12);
    // Low cache hit (10%)
    const lowCache = calculateCloudCosts("AWS", 50000, 0.10, "HORIZONTAL", 12);

    // High cache should save much more money from edge offload
    assert.ok(highCache.edgeSavingsMonthly > lowCache.edgeSavingsMonthly);
    // Origin load balancer cost should be lower when cache hit is high
    assert.ok(highCache.loadBalancerMonthly < lowCache.loadBalancerMonthly);
  });

  it("scales vertical computing tiers dynamically", () => {
    const cost8C = calculateCloudCosts("AWS", 25000, 0.75, "VERTICAL", 4, 8);
    const cost64C = calculateCloudCosts("AWS", 25000, 0.75, "VERTICAL", 4, 64);

    assert.ok(cost64C.computeMonthly > cost8C.computeMonthly, "64 cores tier must cost more than 8 cores");
    assert.ok(cost64C.computeLabel.includes("16xlarge"));
    assert.ok(cost8C.computeLabel.includes("2xlarge"));
  });

  it("scales costs monotonically with traffic spikes", () => {
    const normal = calculateCloudCosts("GCP", 25000, 0.75, "HORIZONTAL", 8);
    const storm = calculateCloudCosts("GCP", 125000, 0.75, "HORIZONTAL", 28);

    assert.ok(storm.monthlyTotal > normal.monthlyTotal, "5x traffic storm must increase total cost");
    assert.ok(storm.hourlyBurnRate > normal.hourlyBurnRate);
    assert.ok(storm.monthlyTotalGb > normal.monthlyTotalGb);
  });
});
