import type { LoadBalancerNode } from "../../simulation/types";
import { BASE_TRAFFIC_RPS, calculateComponentPeriod } from "../../simulation/physics";

export function drawLoadBalancers(
  ctx: CanvasRenderingContext2D,
  loadBalancers: LoadBalancerNode[],
  trafficRps: number,
  timestamp: number
): void {
  const mult = Math.max(0.2, trafficRps / BASE_TRAFFIC_RPS);
  const lbPeriod = calculateComponentPeriod(trafficRps, 2800, 400);
  const lbRot = ((timestamp % lbPeriod) / lbPeriod) * Math.PI * 2;

  loadBalancers.forEach((lb) => {
    ctx.save();
    ctx.fillStyle = "rgba(245, 158, 11, 0.18)";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 14 + mult * 2;

    ctx.beginPath();
    ctx.arc(lb.x, lb.y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fast spinning internal ring
    ctx.strokeStyle = "rgba(245, 158, 11, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lb.x, lb.y, 14, lbRot, lbRot + Math.PI * 1.3);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(lb.label, lb.x, lb.y + 3);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "8px ui-monospace, monospace";
    ctx.fillText("LOAD BALANCER", lb.x, lb.y + 34);
    ctx.restore();
  });
}
