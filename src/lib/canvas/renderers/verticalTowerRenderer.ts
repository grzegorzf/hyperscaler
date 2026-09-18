import type { RectBounds, ServerNode } from "../../simulation/types";

export function drawVerticalTowers(
  ctx: CanvasRenderingContext2D,
  stage: RectBounds,
  nodes: ServerNode[],
  avgCpuPercent: number,
  chaosActive: boolean,
  timestamp: number
): void {
  const vertNodes = nodes.slice(0, 4);
  const cores = vertNodes[0]?.cpuCores || 0;

  if (cores === 0 || vertNodes.length === 0) {
    ctx.save();
    const boxW = Math.min(stage.w - 40, 340);
    const boxH = 88;
    const boxX = stage.x + (stage.w - boxW) / 2;
    const boxY = stage.y + (stage.h - boxH) / 2 + 10;

    // Glowing standby container
    ctx.fillStyle = "rgba(25, 20, 10, 0.75)";
    ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    const pulse = Math.sin(timestamp / 300) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(245, 158, 11, ${pulse})`;
    ctx.font = "bold 12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("STANDBY · SLEEP STATE (0 CORES)", boxX + boxW / 2, boxY + 32);

    ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("HOT-STANDBY READY FOR TRAFFIC", boxX + boxW / 2, boxY + 52);

    ctx.fillStyle = "#10b981";
    ctx.font = "bold 9px ui-monospace, monospace";
    ctx.fillText("COMPUTE BURN RATE: $0.00 / HR", boxX + boxW / 2, boxY + 70);

    ctx.restore();
    return;
  }

  const count = Math.max(vertNodes.length, 4);
  const spacing = (stage.w - 40) / count;
  const levels = cores >= 64 ? 4 : cores >= 32 ? 3 : cores >= 16 ? 2 : 1;
  const cpu = avgCpuPercent;
  const isOverloaded = cpu > 85 || chaosActive;
  const towerColor = isOverloaded ? "#ef4444" : "#f59e0b";

  ctx.save();
  vertNodes.forEach((node, idx) => {
    const towerX = stage.x + 30 + idx * spacing + spacing / 2;
    const towerBaseY = stage.y + stage.h - 40;

    // Stacking modular core levels
    for (let lvl = 0; lvl < levels; lvl++) {
      const blockY = towerBaseY - lvl * 44;
      const isTop = lvl === levels - 1;

      ctx.fillStyle = isOverloaded ? "rgba(239, 68, 68, 0.25)" : "rgba(24, 18, 10, 0.92)";
      ctx.strokeStyle = towerColor;
      ctx.lineWidth = isTop ? 2.2 : 1.6;
      ctx.shadowColor = towerColor;
      ctx.shadowBlur = isTop ? 14 : 6;

      ctx.beginPath();
      ctx.roundRect(towerX - 26, blockY - 36, 52, 36, 6);
      ctx.fill();
      ctx.stroke();

      // Core matrix lattice glowing with thermal activity
      const plasmaPulse = Math.sin(timestamp / 150 + lvl) * 0.15 + 0.35;
      ctx.fillStyle = isOverloaded
        ? "rgba(239, 68, 68, 0.5)"
        : `rgba(245, 158, 11, ${plasmaPulse})`;
      ctx.fillRect(towerX - 18, blockY - 26, 36, 16);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${lvl === 0 ? "BASE" : `LVL ${lvl + 1}`}`, towerX, blockY - 14);
    }

    // Ascension Upward Indicator
    ctx.fillStyle = towerColor;
    ctx.font = "bold 14px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("▲", towerX, towerBaseY - levels * 44 - 10);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px ui-monospace, monospace";
    ctx.fillText(`${cores} CORES`, towerX, towerBaseY + 16);

    ctx.fillStyle = towerColor;
    ctx.font = "bold 8px ui-monospace, monospace";
    ctx.fillText(`${cpu}% LOAD`, towerX, towerBaseY + 28);
  });
  ctx.restore();
}
