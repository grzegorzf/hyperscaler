import type { Point2D, SimulationLayout } from "./types";

export function computeLayout(w: number, h: number): SimulationLayout {
  const isMobile = w < 768;
  const tableCenterX = w * 0.50;
  const tableCenterY = h * 0.50;
  const tableW = Math.min(w * (isMobile ? 0.96 : 0.94), 1400);
  const tableH = Math.min(h * (isMobile ? 0.86 : 0.82), 800);

  if (isMobile) {
    // Proportional mobile layout optimized for portrait aspect ratios
    const csWidth = tableW * 0.40;
    const csCenterX = tableCenterX + tableW * 0.28;
    return {
      table: {
        cx: tableCenterX,
        cy: tableCenterY,
        w: tableW,
        h: tableH,
        x: tableCenterX - tableW / 2,
        y: tableCenterY - tableH / 2,
      },
      clients: {
        x: tableCenterX - tableW * 0.42,
        y: tableCenterY - tableH * 0.16,
      },
      cdnPops: [
        { label: "US-EAST", x: tableCenterX - tableW * 0.24, y: tableCenterY - tableH * 0.24 },
        { label: "EU-WEST", x: tableCenterX - tableW * 0.16, y: tableCenterY - tableH * 0.07 },
        { label: "AP-SOUTH", x: tableCenterX - tableW * 0.10, y: tableCenterY + tableH * 0.12 },
      ],
      loadBalancers: [
        { label: "GLB-1", x: tableCenterX + tableW * 0.03, y: tableCenterY - tableH * 0.10 },
        { label: "ALB-2", x: tableCenterX + tableW * 0.05, y: tableCenterY + tableH * 0.06 },
      ],
      computeStage: {
        cx: csCenterX,
        cy: tableCenterY + tableH * 0.02,
        w: csWidth,
        h: tableH * 0.65,
        x: csCenterX - csWidth / 2,
        y: tableCenterY + tableH * 0.02 - (tableH * 0.65) / 2,
      },
    };
  }

  return {
    table: {
      cx: tableCenterX,
      cy: tableCenterY,
      w: tableW,
      h: tableH,
      x: tableCenterX - tableW / 2,
      y: tableCenterY - tableH / 2,
    },
    // 1. User Devices (Upper Left)
    clients: {
      x: tableCenterX - tableW * 0.38,
      y: tableCenterY - tableH * 0.18,
    },
    // 2. Edge CDN PoPs (Center-Left)
    cdnPops: [
      { label: "US-EAST", x: tableCenterX - tableW * 0.20, y: tableCenterY - tableH * 0.26 },
      { label: "EU-WEST", x: tableCenterX - tableW * 0.12, y: tableCenterY - tableH * 0.10 },
      { label: "AP-SOUTH", x: tableCenterX - tableW * 0.08, y: tableCenterY + tableH * 0.06 },
    ],
    // 3. Load Balancers (Center)
    loadBalancers: [
      { label: "GLB-1", x: tableCenterX + tableW * 0.08, y: tableCenterY - tableH * 0.12 },
      { label: "ALB-2", x: tableCenterX + tableW * 0.10, y: tableCenterY + tableH * 0.04 },
    ],
    // 4. Compute Stage (Right Half - Spacious & Clean)
    computeStage: {
      cx: tableCenterX + tableW * 0.29,
      cy: tableCenterY + tableH * 0.02,
      w: tableW * 0.36,
      h: tableH * 0.62,
      x: tableCenterX + tableW * 0.29 - (tableW * 0.36) / 2,
      y: tableCenterY + tableH * 0.02 - (tableH * 0.62) / 2,
    },
  };
}

export function getComputeNodeTarget(
  layout: SimulationLayout,
  isHorizontal: boolean,
  nodeIdx: number,
  totalNodes: number
): Point2D {
  const cs = layout.computeStage;

  if (isHorizontal) {
    const total = Math.max(totalNodes, 3);
    const cols = total > 16 ? 5 : total > 9 ? 4 : 3;
    const rows = Math.ceil(total / cols);
    const colWidth = (cs.w - 40) / cols;
    const rowHeight = (cs.h - 50) / Math.max(rows, 1);
    const col = nodeIdx % cols;
    const row = Math.floor(nodeIdx / cols);

    return {
      x: cs.x + 24 + col * colWidth + colWidth / 2,
      y: cs.y + 48 + row * rowHeight + rowHeight / 2,
    };
  }

  // Vertical 4-monolith towers
  const count = 4;
  const spacing = (cs.w - 40) / count;
  return {
    x: cs.x + 30 + (nodeIdx % 4) * spacing + spacing / 2,
    y: cs.cy,
  };
}
