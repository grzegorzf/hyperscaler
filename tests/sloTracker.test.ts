import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSloMetrics,
  appendHistorySample,
  generateSparklineSvgPath,
} from "../src/lib/simulation/sloTracker";

describe("SLO Tracker & Observability Sparklines", () => {
  it("calculates healthy SLO metrics under nominal operations", () => {
    const slo = calculateSloMetrics(0.0, 12, false);
    assert.strictEqual(slo.targetSloPercent, 99.99);
    assert.strictEqual(slo.status, "HEALTHY");
    assert.strictEqual(slo.burnRateMultiplier, 1.0);
    assert.strictEqual(slo.remainingBudgetMinutes, 4.32);
    assert.ok(slo.availabilityScore >= 99.99);
  });

  it("accelerates error budget burn under chaos or high error rates", () => {
    const sloChaos = calculateSloMetrics(5.25, 340, true);
    assert.strictEqual(sloChaos.status, "CRITICAL");
    assert.strictEqual(sloChaos.burnRateMultiplier, 14.4);
    assert.ok(sloChaos.remainingBudgetMinutes < 2.0);
  });

  it("manages a rolling history buffer up to max capacity", () => {
    let history = [10, 20, 30];
    history = appendHistorySample(history, 40, 4);
    assert.deepStrictEqual(history, [10, 20, 30, 40]);

    // Appending beyond capacity drops the oldest sample
    history = appendHistorySample(history, 50, 4);
    assert.deepStrictEqual(history, [20, 30, 40, 50]);
  });

  it("generates valid SVG sparkline paths", () => {
    const data = [10, 25, 15, 30, 45, 20];
    const path = generateSparklineSvgPath(data, 100, 30);
    assert.ok(path.startsWith("M "));
    assert.ok(path.includes(" L "));

    // Edge case: empty or 1 item returns bottom flatline
    const emptyPath = generateSparklineSvgPath([], 100, 30);
    assert.strictEqual(emptyPath, "M 0,30 L 100,30");
  });
});
