import { test, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateOriginTraffic,
  calculateTargetParticlePool,
  calculateParticleVelocity,
  calculateTargetPods,
  calculateTargetCores,
  calculateClusterMetrics,
  calculateConduitDashOffset,
  calculateConduitWidth,
  calculateComponentPeriod,
  BASE_TRAFFIC_RPS,
} from "../src/lib/simulation/physics";

describe("Physics & Queuing Math", () => {
  it("calculates absorbed and origin traffic accurately", () => {
    // 25,000 req/s with 75% cache hit rate
    const result = calculateOriginTraffic(25000, 0.75);
    assert.strictEqual(result.absorbedRps, 18750);
    assert.strictEqual(result.originRps, 6250);

    // 100% cache hit rate
    const fullCache = calculateOriginTraffic(50000, 1.0);
    assert.strictEqual(fullCache.absorbedRps, 50000);
    assert.strictEqual(fullCache.originRps, 0);

    // 0% cache hit rate
    const zeroCache = calculateOriginTraffic(10000, 0.0);
    assert.strictEqual(zeroCache.absorbedRps, 0);
    assert.strictEqual(zeroCache.originRps, 10000);

    // Clamps negative rates safely
    const clampedNeg = calculateOriginTraffic(-500, -0.5);
    assert.strictEqual(clampedNeg.absorbedRps, 0);
    assert.strictEqual(clampedNeg.originRps, 0);
  });

  it("scales particle pool directly with traffic volume", () => {
    // 0 traffic -> 0 particles (scale to zero)
    assert.strictEqual(calculateTargetParticlePool(0), 0);

    // Min bound (0.2x traffic ~5k RPS) -> 4 particles (calm trickle)
    const minPool = calculateTargetParticlePool(5000);
    assert.strictEqual(minPool, 4);

    // Baseline (1.0x traffic = 25k RPS) -> 22 particles (clean rhythmic stream)
    const basePool = calculateTargetParticlePool(25000);
    assert.strictEqual(basePool, 22);

    // High traffic (5.0x traffic = 125k RPS) -> 142 particles (laser storm)
    const highPool = calculateTargetParticlePool(125000);
    assert.strictEqual(highPool, 142);

    // Particle pool is strictly increasing with traffic
    assert.ok(highPool > basePool);
    assert.ok(basePool > minPool);
  });

  it("scales particle velocity with traffic intensity", () => {
    assert.strictEqual(calculateParticleVelocity(0), 0, "Velocity should be 0 when traffic is 0");
    const lowV = calculateParticleVelocity(5000);
    const midV = calculateParticleVelocity(25000);
    const highV = calculateParticleVelocity(125000);

    assert.ok(midV > lowV, "Velocity at 25k RPS must be greater than at 5k RPS");
    assert.ok(highV > midV, "Velocity at 125k RPS must be greater than at 25k RPS");
  });

  it("determines horizontal pod targets dynamically with scale-to-zero [0, 28]", () => {
    assert.strictEqual(calculateTargetPods(0), 0, "Zero origin traffic scales to 0 pods");
    assert.strictEqual(calculateTargetPods(1000), 1, "Light load provisions 1 pod");
    assert.strictEqual(calculateTargetPods(6250), 3, "6,250 origin RPS provisions 3 pods");
    assert.strictEqual(calculateTargetPods(25000), 9, "25,000 origin RPS provisions 9 pods");
    assert.strictEqual(calculateTargetPods(500000), 28, "Pods should cap at maximum 28");
  });

  it("determines vertical core tiers with scale-to-zero [0, 8, 16, 32, 64]", () => {
    assert.strictEqual(calculateTargetCores(0), 0); // 0 cores standby
    assert.strictEqual(calculateTargetCores(5000), 8); // <= 10k origin RPS
    assert.strictEqual(calculateTargetCores(20000), 16); // > 10k origin RPS
    assert.strictEqual(calculateTargetCores(40000), 32); // > 30k origin RPS
    assert.strictEqual(calculateTargetCores(80000), 64); // > 65k origin RPS
  });

  it("calculates cluster metrics, latencies, and health statuses", () => {
    // Nominal load (6,250 origin RPS across 8 pods with 24k capacity)
    const nominal = calculateClusterMetrics(6250, 8, 4, "HORIZONTAL", false);
    assert.strictEqual(nominal.health, "NOMINAL");
    assert.ok(nominal.avgCpu < 50);
    assert.strictEqual(nominal.errorRatePercent, 0.0);
    assert.strictEqual(nominal.latencyP50, 10);

    // High load (30,000 origin RPS across 8 pods = overload)
    const overloaded = calculateClusterMetrics(30000, 8, 4, "HORIZONTAL", false);
    assert.strictEqual(overloaded.health, "DEGRADED");
    assert.ok(overloaded.avgCpu > 85);
    assert.ok(overloaded.latencyP99 > 32);
    assert.ok(overloaded.errorRatePercent > 0);

    // Chaos monkey mode
    const chaos = calculateClusterMetrics(6250, 8, 4, "HORIZONTAL", true);
    assert.strictEqual(chaos.health, "CRITICAL");
    assert.strictEqual(chaos.errorRatePercent, 5.25);
    assert.strictEqual(chaos.latencyP99, 340);
  });

  it("calculates conduit dash offsets and widths", () => {
    const widthLow = calculateConduitWidth(5000);
    const widthHigh = calculateConduitWidth(125000);
    assert.ok(widthHigh > widthLow);

    const offset1 = calculateConduitDashOffset(25000, 1000);
    const offset2 = calculateConduitDashOffset(25000, 2000);
    assert.notStrictEqual(offset1, offset2);
  });

  it("calculates animation periods with traffic acceleration", () => {
    const basePeriod = calculateComponentPeriod(25000, 1600, 300);
    const fastPeriod = calculateComponentPeriod(125000, 1600, 300);

    assert.ok(fastPeriod < basePeriod, "Higher traffic should yield faster pulse/rotation period");
    assert.ok(fastPeriod >= 300, "Should respect minimum period limit");
  });
});
