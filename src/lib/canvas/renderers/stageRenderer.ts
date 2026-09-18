import type { RectBounds } from "../../simulation/types";

export function drawComputeStageFrame(
  ctx: CanvasRenderingContext2D,
  stage: RectBounds,
  isHoriz: boolean,
  nodeCount: number,
  coresPerTower: number
): void {
  ctx.save();
  const stageBorderColor = isHoriz ? "rgba(0, 240, 255, 0.35)" : "rgba(245, 158, 11, 0.4)";
  const stageBgColor = isHoriz ? "rgba(0, 240, 255, 0.02)" : "rgba(245, 158, 11, 0.02)";

  ctx.fillStyle = stageBgColor;
  ctx.strokeStyle = stageBorderColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(stage.x, stage.y, stage.w, stage.h, 20);
  ctx.fill();
  ctx.stroke();

  // Stage Title & Live Readout
  ctx.fillStyle = isHoriz ? "#00f0ff" : "#f59e0b";
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.textAlign = "left";
  const titleText = isHoriz
    ? nodeCount === 0
      ? "HORIZONTAL CLUSTER · SCALE-TO-ZERO (0 PODS ACTIVE)"
      : `HORIZONTAL AUTO-SCALING CLUSTER · ${nodeCount} PODS ACTIVE`
    : coresPerTower === 0
      ? "VERTICAL SCALING · SLEEP STATE (0 CORES)"
      : `VERTICAL SCALING UPGRADES · ${coresPerTower} CORES PER TOWER`;
  ctx.fillText(titleText, stage.x + 16, stage.y + 24);
  ctx.restore();
}
