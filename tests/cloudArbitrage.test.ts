import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getMultiCloudComparison } from "../src/lib/simulation/cloudArbitrage";

describe("Multi-Cloud Arbitrage & Comparison Engine", () => {
  it("evaluates side-by-side costs across AWS, GCP, and Azure", () => {
    const comparison = getMultiCloudComparison(25000, 0.75, "HORIZONTAL", 8);

    assert.strictEqual(comparison.items.length, 3);
    const providers = comparison.items.map((i) => i.provider);
    assert.ok(providers.includes("AWS"));
    assert.ok(providers.includes("GCP"));
    assert.ok(providers.includes("AZURE"));

    // Ensure all items have valid computed values
    comparison.items.forEach((item) => {
      assert.ok(item.costs.monthlyTotal > 0);
      assert.ok(item.committedDiscounts.oneYearCommitMonthly <= item.costs.monthlyTotal);
      assert.ok(item.committedDiscounts.threeYearCommitMonthly <= item.committedDiscounts.oneYearCommitMonthly);
    });

    assert.ok(comparison.cheapestProvider);
    assert.ok(comparison.mostExpensiveProvider);
    assert.ok(comparison.maxMonthlySavings >= 0);
    assert.ok(comparison.recommendation.length > 10);
  });

  it("handles scale-to-zero at zero traffic with $0 delta", () => {
    const zeroComparison = getMultiCloudComparison(0, 0.75, "HORIZONTAL", 0);

    zeroComparison.items.forEach((item) => {
      assert.strictEqual(item.costs.monthlyTotal, 0);
      assert.strictEqual(item.committedDiscounts.oneYearCommitMonthly, 0);
      assert.strictEqual(item.committedDiscounts.threeYearCommitMonthly, 0);
      assert.strictEqual(item.deltaVsCheapestMonthly, 0);
    });

    assert.strictEqual(zeroComparison.maxMonthlySavings, 0);
    assert.ok(zeroComparison.recommendation.includes("scale-to-zero"));
  });

  it("calculates annual savings from 1-year and 3-year commitments", () => {
    const comp = getMultiCloudComparison(50000, 0.80, "HORIZONTAL", 14);
    const aws = comp.items.find((i) => i.provider === "AWS");
    assert.ok(aws);

    assert.ok(aws.committedDiscounts.oneYearAnnualSavings > 0);
    assert.ok(aws.committedDiscounts.threeYearAnnualSavings > aws.committedDiscounts.oneYearAnnualSavings);
  });
});
