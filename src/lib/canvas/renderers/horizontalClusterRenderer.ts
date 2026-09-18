import type { RectBounds, ServerNode } from "../../simulation/types";
import { BASE_TRAFFIC_RPS } from "../../simulation/physics";

export function drawHorizontalCluster(
  ctx: CanvasRenderingContext2D,
  stage: RectBounds,
  nodes: ServerNode[],
  trafficRps: number,
  chaosActive: boolean,
  nodeFlashes: number[],
  timestamp: number
): void {
  if (nodes.length === 0) {
    ctx.save();
    const boxW = Math.min(stage.w - 40, 340);
    const boxH = 88;
    const boxX = stage.x + (stage.w - boxW) / 2;
    const boxY = stage.y + (stage.h - boxH) / 2 + 10;

    // Glowing standby container
    ctx.fillStyle = "rgba(10, 25, 45, 0.75)";
    ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Pulsing text
    const pulse = Math.sin(timestamp / 300) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(0, 240, 255, ${pulse})`;
    ctx.font = "bold 12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("STANDBY · SCALE-TO-ZERO", boxX + boxW / 2, boxY + 32);

    ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("0 ACTIVE PODS · READY TO PROVISION", boxX + boxW / 2, boxY + 52);

    ctx.fillStyle = "#10b981";
    ctx.font = "bold 9px ui-monospace, monospace";
    ctx.fillText("COMPUTE BURN RATE: $0.00 / HR", boxX + boxW / 2, boxY + 70);

    ctx.restore();
    return;
  }

  const mult = Math.max(0.2, trafficRps / BASE_TRAFFIC_RPS);
  const total = Math.max(nodes.length, 3);
  const cols = total > 16 ? 5 : total > 9 ? 4 : 3;
  const rows = Math.ceil(total / cols);
  const colWidth = (stage.w - 40) / cols;
  const rowHeight = (stage.h - 50) / Math.max(rows, 1);

  ctx.save();
  nodes.forEach((node, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const nodeX = stage.x + 24 + col * colWidth + colWidth / 2;
    const nodeY = stage.y + 48 + row * rowHeight + rowHeight / 2;

    const flash = nodeFlashes[idx] || 0;
    if (flash > 0) {
      nodeFlashes[idx] = Math.max(0, flash - 0.08);
    }

    const cpu = node.cpuUtilization;
    const isOverloaded = cpu > 85 || node.status === "OVERLOADED" || chaosActive;
    const isWarm = cpu > 65;
    const nodeColor = isOverloaded ? "#ef4444" : isWarm ? "#f59e0b" : "#00f0ff";

    // Blade Box Dimensions
    const bladeW = Math.min(colWidth - 12, 54);
    const bladeH = Math.min(rowHeight - 12, 38);

    ctx.fillStyle = isOverloaded
      ? "rgba(239, 68, 68, 0.25)"
      : flash > 0
      ? "rgba(0, 240, 255, 0.3)"
      : "rgba(12, 22, 38, 0.9)";
    ctx.strokeStyle = nodeColor;
    ctx.lineWidth = flash > 0 ? 2.5 : 1.5;
    ctx.shadowColor = nodeColor;
    ctx.shadowBlur = flash > 0 ? 14 : isOverloaded ? 12 : 5;

    ctx.beginPath();
    ctx.roundRect(nodeX - bladeW / 2, nodeY - bladeH / 2, bladeW, bladeH, 5);
    ctx.fill();
    ctx.stroke();

    // Dynamic Live CPU Meter Bar on each blade
    const barW = bladeW - 12;
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(nodeX - bladeW / 2 + 6, nodeY + 4, barW, 4);

    ctx.fillStyle = nodeColor;
    ctx.fillRect(nodeX - bladeW / 2 + 6, nodeY + 4, barW * (cpu / 100), 4);

    // Blinking Activity LED (blinks faster with high traffic)
    const blinkRate = Math.max(60, Math.round(180 / mult));
    const isBlinking = Math.sin(timestamp / blinkRate + idx) > 0;
    ctx.fillStyle = isBlinking ? nodeColor : "rgba(100, 116, 139, 0.3)";
    ctx.beginPath();
    ctx.arc(nodeX + bladeW / 2 - 8, nodeY - bladeH / 2 + 8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Pod ID & CPU %
    ctx.fillStyle = "#ffffff";
    ctx.font = "8px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`P${node.id}`, nodeX, nodeY - 3);

    ctx.fillStyle = nodeColor;
    ctx.font = "bold 7px ui-monospace, monospace";
    ctx.fillText(`${cpu}%`, nodeX, nodeY + bladeH / 2 + 9);
  });
  ctx.restore();
}
