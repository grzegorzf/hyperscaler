import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateArchitectureReportMarkdown } from "../src/lib/simulation/reportExporter";
import { createInitialState } from "../src/lib/simulation/engine";
import { getMultiCloudComparison } from "../src/lib/simulation/cloudArbitrage";
import { calculateCarbonFootprint } from "../src/lib/simulation/carbonFootprint";
import { generateArchitectureInsights } from "../src/lib/simulation/advisor";
import { calculateCloudCosts } from "../src/lib/simulation/cloudCosts";

describe("Architecture Spec & FinOps Report Generator", () => {
  it("generates complete Markdown report containing all sections", () => {
    const state = createInitialState();
    const arbitrage = getMultiCloudComparison(25000, 0.75, "HORIZONTAL", 8);
    const carbon = calculateCarbonFootprint(25000, 0.75, "HORIZONTAL", 8, 16, 5655);
    const costs = calculateCloudCosts("AWS", 25000, 0.75, "HORIZONTAL", 8);
    const insights = generateArchitectureInsights(state, costs);

    const markdown = generateArchitectureReportMarkdown(state, arbitrage, carbon, insights);

    assert.ok(markdown.includes("# Hyperscaler Architecture Specification & FinOps Report"));
    assert.ok(markdown.includes("## 1. Executive Summary"));
    assert.ok(markdown.includes("## 2. Multi-Cloud Cost Arbitrage & Bill Comparison"));
    assert.ok(markdown.includes("## 3. Committed Use Discounts"));
    assert.ok(markdown.includes("## 4. Green Cloud & Sustainability"));
    assert.ok(markdown.includes("## 5. Senior Cloud Architect Advisory Notes"));
    assert.ok(markdown.includes("AWS"));
    assert.ok(markdown.includes("GCP"));
    assert.ok(markdown.includes("Microsoft Azure"));
    assert.ok(markdown.includes("kg CO₂e"));
  });
});
