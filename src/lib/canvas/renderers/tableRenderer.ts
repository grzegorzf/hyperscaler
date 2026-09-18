import type { RectBounds } from "../../simulation/types";

export function drawTabletop(
  ctx: CanvasRenderingContext2D,
  table: RectBounds,
  isHighLoad: boolean
): void {
  ctx.save();
  const bgGrad = ctx.createRadialGradient(table.cx, table.cy, 60, table.cx, table.cy, table.w * 0.65);
  bgGrad.addColorStop(0, "rgba(0, 240, 255, 0.08)");
  bgGrad.addColorStop(0.45, "rgba(10, 20, 35, 0.75)");
  bgGrad.addColorStop(1, "rgba(5, 9, 15, 0.95)");

  ctx.fillStyle = bgGrad;
  ctx.strokeStyle = isHighLoad ? "rgba(245, 158, 11, 0.45)" : "rgba(0, 240, 255, 0.35)";
  ctx.lineWidth = 2.5;
  ctx.shadowColor = isHighLoad ? "rgba(245, 158, 11, 0.5)" : "rgba(0, 240, 255, 0.4)";
  ctx.shadowBlur = 24;

  ctx.beginPath();
  ctx.roundRect(table.x, table.y, table.w, table.h, 32);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawPerspectiveGrid(
  ctx: CanvasRenderingContext2D,
  table: RectBounds
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
  ctx.lineWidth = 1;
  const gridStep = 45;

  for (let x = table.x; x <= table.x + table.w; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, table.y);
    ctx.lineTo(x, table.y + table.h);
    ctx.stroke();
  }
  for (let y = table.y; y <= table.y + table.h; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(table.x, y);
    ctx.lineTo(table.x + table.w, y);
    ctx.stroke();
  }
  ctx.restore();
}
