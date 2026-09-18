import type { Point2D } from "../../simulation/types";
import { BASE_TRAFFIC_RPS } from "../../simulation/physics";

export function drawUserSwarm(
  ctx: CanvasRenderingContext2D,
  clientPos: Point2D,
  trafficRps: number,
  timestamp: number
): void {
  const mult = Math.max(0.2, trafficRps / BASE_TRAFFIC_RPS);
  const cx = clientPos.x;
  const cy = clientPos.y;

  // Radiance pulse frequency scales with traffic
  const pulseFreq = 120 / Math.max(mult, 0.5);
  const emitterPulse = Math.sin(timestamp / pulseFreq) * 4;
  const radius = 36 + emitterPulse;

  ctx.save();
  ctx.fillStyle = "rgba(0, 240, 255, 0.12)";
  ctx.strokeStyle = "#00f0ff";
  ctx.lineWidth = 2.2;
  ctx.shadowColor = "#00f0ff";
  ctx.shadowBlur = 14 + mult * 3;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Typography readouts
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText("USER SWARM", cx, cy - 4);

  ctx.fillStyle = "#00f0ff";
  ctx.font = "bold 9px ui-monospace, monospace";
  ctx.fillText(`${(trafficRps / 1000).toFixed(0)}K REQ/S`, cx, cy + 10);

  ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
  ctx.font = "8px ui-monospace, monospace";
  ctx.fillText(`TRAFFIC: x${mult.toFixed(1)}`, cx, cy + 50);

  ctx.restore();
}
