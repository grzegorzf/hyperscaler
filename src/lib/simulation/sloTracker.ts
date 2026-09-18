export interface SloMetrics {
  targetSloPercent: number; // 99.99
  monthlyBudgetMinutes: number; // 4.32 min
  remainingBudgetMinutes: number;
  burnRateMultiplier: number; // 1.0x = steady, 14.4x = fast burn
  status: "HEALTHY" | "BURNING" | "CRITICAL";
  availabilityScore: number; // Current simulated availability e.g. 99.995%
}

export interface MetricSample {
  timestamp: number;
  clientRps: number;
  originRps: number;
  p99LatencyMs: number;
  hourlyBurnRate: number;
}

const TOTAL_SLO_BUDGET_MINUTES = 4.32; // 99.99% SLA across 732 hrs (43,920 mins) = 4.32 mins error budget

/**
 * Calculates real-time SRE Service Level Objective (SLO) error budget burn
 * and reliability health based on current cluster error rates and latency spikes.
 */
export function calculateSloMetrics(
  errorRatePercent: number,
  p99LatencyMs: number,
  chaosActive: boolean
): SloMetrics {
  // If chaos is active or error rate is high, burn rate accelerates
  let burnRateMultiplier = 1.0;
  if (chaosActive || errorRatePercent > 3.0) {
    burnRateMultiplier = 14.4; // Burns 100% of 30-day budget in ~2 days
  } else if (errorRatePercent > 0.5 || p99LatencyMs > 100) {
    burnRateMultiplier = 4.2;
  } else if (errorRatePercent > 0.05) {
    burnRateMultiplier = 1.8;
  }

  // Simulated remaining budget based on severity
  let remainingBudgetMinutes = TOTAL_SLO_BUDGET_MINUTES;
  if (chaosActive) {
    remainingBudgetMinutes = 1.15;
  } else if (errorRatePercent > 2.0) {
    remainingBudgetMinutes = 2.45;
  } else if (errorRatePercent > 0) {
    remainingBudgetMinutes = 3.80;
  }

  const availabilityScore = Number(
    Math.max(94.5, 100 - errorRatePercent * 0.95).toFixed(3)
  );

  let status: SloMetrics["status"] = "HEALTHY";
  if (burnRateMultiplier >= 10.0) {
    status = "CRITICAL";
  } else if (burnRateMultiplier > 2.0) {
    status = "BURNING";
  }

  return {
    targetSloPercent: 99.99,
    monthlyBudgetMinutes: TOTAL_SLO_BUDGET_MINUTES,
    remainingBudgetMinutes: Number(remainingBudgetMinutes.toFixed(2)),
    burnRateMultiplier: Number(burnRateMultiplier.toFixed(1)),
    status,
    availabilityScore,
  };
}

/**
 * Appends a new numeric sample into a fixed-size rolling ring buffer.
 */
export function appendHistorySample(
  history: number[],
  newValue: number,
  maxSamples = 24
): number[] {
  const current = history.length >= maxSamples ? history.slice(1) : [...history];
  current.push(newValue);
  return current;
}

/**
 * Generates an SVG polyline/path string for smooth data sparkline rendering.
 */
export function generateSparklineSvgPath(
  data: number[],
  width: number,
  height: number
): string {
  if (!data || data.length < 2) return `M 0,${height} L ${width},${height}`;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M ${points.join(" L ")}`;
}
