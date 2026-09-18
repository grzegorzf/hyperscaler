import type { CdnPoP } from "../../simulation/types";
import { BASE_TRAFFIC_RPS, calculateComponentPeriod } from "../../simulation/physics";

export function drawCdnPops(
  ctx: CanvasRenderingContext2D,
  cdnPops: CdnPoP[],
  trafficRps: number,
  edgeCacheHitRate: number,
  timestamp: number
): void {
  const mult = Math.max(0.2, trafficRps / BASE_TRAFFIC_RPS);
  const radarPeriod = calculateComponentPeriod(trafficRps, 1600, 300);
  const pulseProgress = (timestamp % radarPeriod) / radarPeriod;

  cdnPops.forEach((cdn) => {
    ctx.save();
    ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = 10 + mult * 2;

    ctx.beginPath();
    ctx.arc(cdn.x, cdn.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Expanding radar ring
    ctx.strokeStyle = `rgba(16, 185, 129, ${1 - pulseProgress})`;
    ctx.beginPath();
    ctx.arc(cdn.x, cdn.y, 18 + pulseProgress * 24, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(cdn.label, cdn.x, cdn.y + 3);

    ctx.fillStyle = "#10b981";
    ctx.font = "8px ui-monospace, monospace";
    ctx.fillText(`${Math.round(edgeCacheHitRate * 100)}% HIT`, cdn.x, cdn.y + 28);
    ctx.restore();
  });
}
