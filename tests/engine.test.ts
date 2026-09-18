import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  stepSimulation,
  applyScalingCommand,
} from "../src/lib/simulation/engine.ts";

describe("Simulation Engine", () => {
  it("initializes with balanced default cluster state", () => {
    const state = createInitialState();

    assert.strictEqual(state.trafficRps, 25000);
    assert.strictEqual(state.edgeCacheHitRate, 0.75);
    assert.strictEqual(state.edgeAbsorbedRps, 18750);
    assert.strictEqual(state.originIngressRps, 6250);
    assert.strictEqual(state.scalingMode, "HORIZONTAL");
    assert.strictEqual(state.autoScalingEnabled, true);
    assert.strictEqual(state.chaosActive, false);
    assert.strictEqual(state.systemHealth, "NOMINAL");
    assert.strictEqual(state.nodes.length, 8);
    assert.strictEqual(state.totalNodes, 8);

    state.nodes.forEach((node, i) => {
      assert.strictEqual(node.id, i + 1);
      assert.strictEqual(node.role, "POD");
      assert.strictEqual(node.status, "HEALTHY");
      assert.strictEqual(node.cpuCores, 4);
      assert.strictEqual(node.ramGb, 16);
    });
  });

  it("gradually scales horizontal pods upwards under traffic surge", () => {
    const initial = createInitialState();
    // Simulate high surge: 125k RPS (target pods = 28)
    const surged = { ...initial, trafficRps: 125000 };

    const step1 = stepSimulation(surged, 16);
    assert.strictEqual(step1.nextState.nodes.length, 9, "Should increment by 1 pod per tick");

    const step2 = stepSimulation(step1.nextState, 16);
    assert.strictEqual(step2.nextState.nodes.length, 10, "Should increment again towards 28");
  });

  it("gradually scales horizontal pods downwards under low traffic", () => {
    const initial = createInitialState();
    // Low traffic: 5k RPS (target pods = 4)
    const lowTraffic = { ...initial, trafficRps: 5000 };

    const step1 = stepSimulation(lowTraffic, 16);
    assert.strictEqual(step1.nextState.nodes.length, 7, "Should decrement by 1 pod per tick");
  });

  it("upgrades vertical core tiers under auto-scaling", () => {
    const initial = createInitialState();
    const verticalInitial = {
      ...initial,
      scalingMode: "VERTICAL" as const,
      nodes: Array.from({ length: 4 }, (_, i) => ({
        id: i + 1,
        name: `vnode-tower-${i + 1}`,
        role: "SUPER_NODE" as const,
        cpuCores: 8,
        ramGb: 32,
        cpuUtilization: 30,
        ramUtilization: 40,
        requestsHandledPerSec: 1000,
        status: "HEALTHY" as const,
      })),
    };

    // Heavy traffic: 125,000 RPS (should jump to 64 cores)
    const highLoad = { ...verticalInitial, trafficRps: 125000 };
    const step = stepSimulation(highLoad, 8);

    assert.strictEqual(step.updatedManualCores, 64);
    assert.strictEqual(step.nextState.nodes.length, 4);
    assert.strictEqual(step.nextState.nodes[0].cpuCores, 64);
    assert.strictEqual(step.nextState.nodes[0].ramGb, 256);
  });

  it("respects manual scaling overrides when auto-scaling is disabled", () => {
    const initial = createInitialState();
    const manualState = {
      ...initial,
      autoScalingEnabled: false,
      trafficRps: 125000,
    };

    const step = stepSimulation(manualState, 16);
    assert.strictEqual(step.nextState.nodes.length, 8, "Node count should not auto-scale");
  });

  it("handles chaos monkey injection across all nodes", () => {
    const initial = createInitialState();
    const chaosState = { ...initial, chaosActive: true };

    const step = stepSimulation(chaosState, 16);
    assert.strictEqual(step.nextState.systemHealth, "CRITICAL");
    assert.strictEqual(step.nextState.errorRatePercent, 5.25);
    step.nextState.nodes.forEach((node) => {
      assert.strictEqual(node.status, "OVERLOADED");
    });
  });

  it("applies manual scaling commands accurately", () => {
    const initial = createInitialState();

    // 1. Switch to VERTICAL mode with 32 cores
    const vert = applyScalingCommand(initial, "VERTICAL", false, 16, undefined, 32);
    assert.strictEqual(vert.nextState.scalingMode, "VERTICAL");
    assert.strictEqual(vert.nextState.nodes.length, 4);
    assert.strictEqual(vert.nextState.nodes[0].role, "SUPER_NODE");
    assert.strictEqual(vert.nextState.nodes[0].cpuCores, 32);
    assert.strictEqual(vert.newManualCores, 32);

    // 2. Switch back to HORIZONTAL mode
    const horiz = applyScalingCommand(vert.nextState, "HORIZONTAL", true, 32);
    assert.strictEqual(horiz.nextState.scalingMode, "HORIZONTAL");
    assert.strictEqual(horiz.nextState.nodes.length, 8);
    assert.strictEqual(horiz.nextState.nodes[0].role, "POD");

    // 3. Manual pod delta +3
    const deltaInc = applyScalingCommand(horiz.nextState, "HORIZONTAL", false, 32, 3);
    assert.strictEqual(deltaInc.nextState.nodes.length, 11);

    // 4. Pod count clamps within [3, 28]
    const clampedMax = applyScalingCommand(horiz.nextState, "HORIZONTAL", false, 32, 50);
    assert.strictEqual(clampedMax.nextState.nodes.length, 28);

    const clampedMin = applyScalingCommand(horiz.nextState, "HORIZONTAL", false, 32, -50);
    assert.strictEqual(clampedMin.nextState.nodes.length, 3);
  });
});
