import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateCarbonFootprint } from "../src/lib/simulation/carbonFootprint";

describe("Green Cloud Carbon Footprint & ESG Engine", () => {
  it("evaluates to Net Zero at 0 traffic (scale-to-zero)", () => {
    const zero = calculateCarbonFootprint(0, 0.75, "HORIZONTAL", 0);
    assert.strictEqual(zero.monthlyKgCo2e, 0);
    assert.strictEqual(zero.monthlyKwh, 0);
    assert.strictEqual(zero.treesEquivalent, 0);
    assert.strictEqual(zero.ecoScore, "A+");
    assert.ok(zero.ecoScoreLabel.includes("Net Zero"));
  });

  it("calculates realistic monthly carbon emissions for 8 horizontal pods", () => {
    // 25,000 req/s, 75% cache, 8 pods, ~5,655 GB
    const carbon = calculateCarbonFootprint(25000, 0.75, "HORIZONTAL", 8, 16, 5655);

    assert.ok(carbon.monthlyKgCo2e > 0);
    assert.ok(carbon.monthlyKwh > 0);
    assert.ok(carbon.edgeSavingsKgCo2e > 0, "Edge cache must show carbon avoidance");
    assert.ok(carbon.treesEquivalent > 0);
    assert.strictEqual(carbon.ecoScore, "A");
  });

  it("penalizes static vertical monoliths in eco scoring", () => {
    const monolith = calculateCarbonFootprint(75000, 0.20, "VERTICAL", 4, 64, 50000);
    assert.strictEqual(monolith.ecoScore, "D");
    assert.ok(monolith.monthlyKgCo2e > 500);
  });
});
