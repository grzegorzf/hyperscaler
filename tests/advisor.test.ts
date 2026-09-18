import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateArchitectureInsights } from "../src/lib/simulation/advisor";
import { createInitialState } from "../src/lib/simulation/engine";
import { calculateCloudCosts } from "../src/lib/simulation/cloudCosts";

describe("Smart Cloud Architect Advisory Engine", () => {
  it("detects scale-to-zero dormancy and provides positive FinOps advice", () => {
    const state = { ...createInitialState(), trafficRps: 0, totalNodes: 0, nodes: [] };
    const costs = calculateCloudCosts("AWS", 0, 0.75, "HORIZONTAL", 0);

    const insights = generateArchitectureInsights(state, costs);
    assert.strictEqual(insights.length, 1);
    assert.strictEqual(insights[0].id, "scale-to-zero");
    assert.strictEqual(insights[0].severity, "SUCCESS");
    assert.strictEqual(insights[0].category, "FINOPS");
  });

  it("warns about static monolithic vertical scaling cost traps", () => {
    const state = {
      ...createInitialState(),
      scalingMode: "VERTICAL" as const,
      trafficRps: 75000,
      nodes: Array.from({ length: 4 }, (_, i) => ({
        id: i + 1,
        name: `tower-${i + 1}`,
        role: "SUPER_NODE" as const,
        cpuCores: 64,
        ramGb: 256,
        cpuUtilization: 45,
        ramUtilization: 50,
        requestsHandledPerSec: 1000,
        status: "HEALTHY" as const,
      })),
    };
    const costs = calculateCloudCosts("AWS", 75000, 0.65, "VERTICAL", 4, 64);

    const insights = generateArchitectureInsights(state, costs);
    const verticalInsight = insights.find((i) => i.id === "vertical-cost-trap");
    assert.ok(verticalInsight, "Should detect vertical monolith scaling trap");
    assert.strictEqual(verticalInsight.category, "ARCHITECTURE");
    assert.strictEqual(verticalInsight.severity, "WARNING");
  });

  it("warns when edge cache hit rate is below 50% under heavy traffic", () => {
    const state = { ...createInitialState(), trafficRps: 50000, edgeCacheHitRate: 0.15 };
    const costs = calculateCloudCosts("AWS", 50000, 0.15, "HORIZONTAL", 16);

    const insights = generateArchitectureInsights(state, costs);
    const cacheStarvation = insights.find((i) => i.id === "cache-starvation");
    assert.ok(cacheStarvation, "Should flag cache starvation warning");
    assert.strictEqual(cacheStarvation.severity, "CRITICAL");
  });

  it("flags active Chaos Monkey fault injection", () => {
    const state = { ...createInitialState(), chaosActive: true, errorRatePercent: 5.25 };
    const costs = calculateCloudCosts("AWS", 25000, 0.75, "HORIZONTAL", 8);

    const insights = generateArchitectureInsights(state, costs);
    const chaosInsight = insights.find((i) => i.id === "chaos-active");
    assert.ok(chaosInsight, "Should detect chaos monkey activity");
    assert.strictEqual(chaosInsight.category, "RELIABILITY");
    assert.strictEqual(chaosInsight.severity, "CRITICAL");
  });

  it("provides nominal operational assessment when healthy", () => {
    const state = createInitialState();
    const costs = calculateCloudCosts("AWS", 25000, 0.75, "HORIZONTAL", 8);

    const insights = generateArchitectureInsights(state, costs);
    assert.ok(insights.length > 0);
  });
});
