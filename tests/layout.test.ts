import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeLayout, getComputeNodeTarget } from "../src/lib/simulation/layout";

describe("Layout & Topology Geometry", () => {
  it("computes left-to-right holographic topology flow", () => {
    const layout = computeLayout(1440, 900);

    // 1. Table platform exists
    assert.ok(layout.table.w > 500);
    assert.ok(layout.table.h > 400);

    // 2. Client Swarm is on left
    assert.ok(layout.clients.x < layout.cdnPops[0].x);

    // 3. CDN PoPs are between Clients and Load Balancers
    layout.cdnPops.forEach((cdn) => {
      assert.ok(cdn.x > layout.clients.x, "CDN must be to the right of Clients");
      assert.ok(cdn.x < layout.loadBalancers[0].x, "CDN must be to the left of Load Balancers");
    });

    // 4. Load Balancers are to the left of Compute Stage
    layout.loadBalancers.forEach((lb) => {
      assert.ok(lb.x < layout.computeStage.x, "LB must be to the left of Compute Stage");
    });

    // 5. Compute Stage is spacious
    assert.ok(layout.computeStage.w > 300);
    assert.ok(layout.computeStage.h > 300);
  });

  it("handles various screen sizes adaptively", () => {
    const small = computeLayout(800, 600);
    const large = computeLayout(2560, 1440);

    assert.ok(small.table.w < large.table.w);
    assert.ok(small.table.h < large.table.h);
    assert.ok(small.computeStage.w <= 1400 * 0.36);
    assert.ok(large.table.w <= 1400, "Table width caps at 1400px maximum");
  });

  it("calculates valid node targets within compute stage bounds for horizontal pods", () => {
    const layout = computeLayout(1440, 900);
    const cs = layout.computeStage;
    const totalPods = 16;

    for (let i = 0; i < totalPods; i++) {
      const target = getComputeNodeTarget(layout, true, i, totalPods);

      assert.ok(
        target.x >= cs.x && target.x <= cs.x + cs.w,
        `Pod ${i} x coordinate (${target.x}) must be within compute stage [${cs.x}, ${cs.x + cs.w}]`
      );
      assert.ok(
        target.y >= cs.y && target.y <= cs.y + cs.h,
        `Pod ${i} y coordinate (${target.y}) must be within compute stage [${cs.y}, ${cs.y + cs.h}]`
      );
    }
  });

  it("calculates valid node targets within compute stage bounds for vertical towers", () => {
    const layout = computeLayout(1440, 900);
    const cs = layout.computeStage;
    const totalTowers = 4;

    for (let i = 0; i < totalTowers; i++) {
      const target = getComputeNodeTarget(layout, false, i, totalTowers);

      assert.ok(
        target.x >= cs.x && target.x <= cs.x + cs.w,
        `Tower ${i} x coordinate (${target.x}) must be within compute stage [${cs.x}, ${cs.x + cs.w}]`
      );
      assert.ok(
        target.y >= cs.y && target.y <= cs.y + cs.h,
        `Tower ${i} y coordinate (${target.y}) must be within compute stage [${cs.y}, ${cs.y + cs.h}]`
      );
    }
  });
});
