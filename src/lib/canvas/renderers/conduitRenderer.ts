import type { SimulationLayout } from "../../simulation/types";
import { calculateConduitDashOffset, calculateConduitWidth } from "../../simulation/physics";

export function drawConduits(
  ctx: CanvasRenderingContext2D,
  layout: SimulationLayout,
  trafficRps: number,
  isHoriz: boolean
): void {
  ctx.save();
  const mult = Math.max(0.2, trafficRps / 25000);
  const conduitWidth = calculateConduitWidth(trafficRps);
  const dashOffset = calculateConduitDashOffset(trafficRps, Date.now());

  // 1. Clients -> Edge CDN PoPs
  layout.cdnPops.forEach((cdn) => {
    // Faint base glow
    ctx.lineWidth = conduitWidth;
    ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
    ctx.shadowColor = "rgba(0, 240, 255, 0.5)";
    ctx.shadowBlur = 6 + mult * 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(layout.clients.x, layout.clients.y);
    ctx.bezierCurveTo(
      (layout.clients.x + cdn.x) / 2,
      layout.clients.y - 20,
      (layout.clients.x + cdn.x) / 2,
      cdn.y,
      cdn.x,
      cdn.y
    );
    ctx.stroke();

    // Animated electric pulse
    ctx.strokeStyle = "rgba(0, 240, 255, 0.85)";
    ctx.lineWidth = conduitWidth * 1.3;
    ctx.setLineDash([8, 12]);
    ctx.lineDashOffset = dashOffset;
    ctx.stroke();

    // 2. Edge CDN PoPs -> Load Balancers
    layout.loadBalancers.forEach((lb) => {
      ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
      ctx.lineWidth = conduitWidth;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(cdn.x, cdn.y);
      ctx.bezierCurveTo(
        (cdn.x + lb.x) / 2,
        cdn.y,
        (cdn.x + lb.x) / 2,
        lb.y,
        lb.x,
        lb.y
      );
      ctx.stroke();

      ctx.strokeStyle = "rgba(245, 158, 11, 0.85)";
      ctx.lineWidth = conduitWidth * 1.3;
      ctx.setLineDash([8, 12]);
      ctx.lineDashOffset = dashOffset;
      ctx.stroke();
    });
  });

  // 3. Load Balancers -> Compute Stage
  const cs = layout.computeStage;
  layout.loadBalancers.forEach((lb) => {
    const strokeColor = isHoriz ? "rgba(0, 240, 255, 0.3)" : "rgba(245, 158, 11, 0.3)";
    const pulseColor = isHoriz ? "rgba(0, 240, 255, 0.9)" : "rgba(245, 158, 11, 0.9)";

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = conduitWidth;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(lb.x, lb.y);
    ctx.bezierCurveTo(
      (lb.x + cs.cx) / 2,
      lb.y,
      (lb.x + cs.cx) / 2,
      cs.cy,
      cs.x,
      cs.cy
    );
    ctx.stroke();

    ctx.strokeStyle = pulseColor;
    ctx.lineWidth = conduitWidth * 1.4;
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = dashOffset;
    ctx.stroke();
  });

  ctx.restore();
}
