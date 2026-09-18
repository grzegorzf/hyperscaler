import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getScenarioList,
  getScenarioById,
  ARCHITECTURE_SCENARIOS,
} from "../src/lib/simulation/scenarios";

describe("Architecture Scenarios Engine", () => {
  it("provides 6 predefined enterprise scenarios", () => {
    const scenarios = getScenarioList();
    assert.strictEqual(scenarios.length, 6);

    const ids = scenarios.map((s) => s.id);
    assert.ok(ids.includes("STEADY_STATE"));
    assert.ok(ids.includes("BLACK_FRIDAY"));
    assert.ok(ids.includes("CACHE_BYPASS_DDOS"));
    assert.ok(ids.includes("SCALE_TO_ZERO"));
    assert.ok(ids.includes("LEGACY_MONOLITH"));
    assert.ok(ids.includes("AZ_FAILOVER_CHAOS"));
  });

  it("retrieves individual scenarios by ID with complete configuration", () => {
    const bf = getScenarioById("BLACK_FRIDAY");
    assert.ok(bf);
    assert.strictEqual(bf.trafficMultiplier, 5.0);
    assert.strictEqual(bf.trafficRps, 125000);
    assert.strictEqual(bf.edgeCacheHitRate, 0.96);
    assert.strictEqual(bf.scalingMode, "HORIZONTAL");

    const zero = getScenarioById("SCALE_TO_ZERO");
    assert.ok(zero);
    assert.strictEqual(zero.trafficMultiplier, 0.0);
    assert.strictEqual(zero.trafficRps, 0);

    const monolith = getScenarioById("LEGACY_MONOLITH");
    assert.ok(monolith);
    assert.strictEqual(monolith.scalingMode, "VERTICAL");
    assert.strictEqual(monolith.manualCores, 64);
  });

  it("returns undefined for unknown scenario ID", () => {
    // @ts-expect-error testing invalid ID
    assert.strictEqual(getScenarioById("INVALID_ID"), undefined);
  });
});
