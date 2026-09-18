import type { ConduitParticle, SimulationLayout, ClusterState } from "../../simulation/types";
import {
  BASE_TRAFFIC_RPS,
  calculateTargetParticlePool,
  calculateParticleVelocity,
} from "../../simulation/physics";
import { getComputeNodeTarget } from "../../simulation/layout";

export function spawnParticles(
  particles: ConduitParticle[],
  state: ClusterState,
  layout: SimulationLayout
): void {
  const mult = Math.max(0.2, state.trafficRps / BASE_TRAFFIC_RPS);
  const targetParticlePool = calculateTargetParticlePool(state.trafficRps);

  // If traffic decreased, immediately prune excess particles
  if (particles.length > targetParticlePool) {
    particles.splice(0, particles.length - targetParticlePool);
  }

  // Calculate how many particles to spawn this frame
  const neededSpawn = Math.min(
    Math.max(1, Math.ceil((targetParticlePool - particles.length) * 0.2) + Math.ceil(mult * 2)),
    24
  );

  for (let i = 0; i < neededSpawn; i++) {
    if (particles.length >= targetParticlePool) break;

    const isHit = Math.random() < state.edgeCacheHitRate;
    const isError = state.chaosActive && Math.random() < 0.45;
    const type = isError ? "error" : isHit ? "hit" : "miss";
    const color = type === "hit" ? "#00f0ff" : type === "miss" ? "#f59e0b" : "#ef4444";

    const startYOffset = (Math.random() - 0.5) * 60;
    const cdnIdx = Math.floor(Math.random() * layout.cdnPops.length);
    const nodeIdx =
      state.nodes.length > 0 ? Math.floor(Math.random() * state.nodes.length) : 0;

    const speed = calculateParticleVelocity(state.trafficRps, Math.random());

    particles.push({
      stage: 0,
      progress: 0,
      speed,
      type,
      color,
      startX: layout.clients.x,
      startY: layout.clients.y + startYOffset,
      targetCdnIdx: cdnIdx,
      targetNodeIdx: nodeIdx,
      currX: layout.clients.x,
      currY: layout.clients.y + startYOffset,
      prevX: layout.clients.x,
      prevY: layout.clients.y + startYOffset,
    });
  }
}

export function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: ConduitParticle[],
  state: ClusterState,
  layout: SimulationLayout,
  nodeFlashes: number[]
): void {
  const mult = Math.max(0.2, state.trafficRps / BASE_TRAFFIC_RPS);
  const isHoriz = state.scalingMode === "HORIZONTAL";

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.prevX = p.currX;
    p.prevY = p.currY;
    p.progress += p.speed;

    const targetCdn = layout.cdnPops[p.targetCdnIdx] || layout.cdnPops[0];
    const targetLb =
      layout.loadBalancers[p.targetNodeIdx % layout.loadBalancers.length] ||
      layout.loadBalancers[0];

    if (p.stage === 0) {
      // Client -> Edge CDN PoP
      p.currX = p.startX + (targetCdn.x - p.startX) * p.progress;
      p.currY = p.startY + (targetCdn.y - p.startY) * p.progress;

      if (p.progress >= 1) {
        if (p.type === "hit") {
          p.stage = 10; // Cache Hit: bounce back to clients!
          p.progress = 0;
          p.speed = p.speed * 1.5;
        } else {
          p.stage = 1; // Cache Miss: stream to Load Balancer
          p.progress = 0;
        }
      }
    } else if (p.stage === 10) {
      // Cache hit returning to client (5ms latency)
      p.currX = targetCdn.x + (p.startX - targetCdn.x) * p.progress;
      p.currY = targetCdn.y + (p.startY - targetCdn.y) * p.progress;
      if (p.progress >= 1) {
        particles.splice(i, 1);
        continue;
      }
    } else if (p.stage === 1) {
      // CDN PoP -> Load Balancer
      p.currX = targetCdn.x + (targetLb.x - targetCdn.x) * p.progress;
      p.currY = targetCdn.y + (targetLb.y - targetCdn.y) * p.progress;
      if (p.progress >= 1) {
        p.stage = 2; // LB -> Compute Cluster
        p.progress = 0;
      }
    } else if (p.stage === 2) {
      // Load Balancer -> Compute Nodes
      const targetNodeIdx = p.targetNodeIdx % Math.max(state.nodes.length, 1);
      const targetPos = getComputeNodeTarget(
        layout,
        isHoriz,
        targetNodeIdx,
        state.nodes.length
      );

      p.currX = targetLb.x + (targetPos.x - targetLb.x) * p.progress;
      p.currY = targetLb.y + (targetPos.y - targetLb.y) * p.progress;

      if (p.progress >= 1) {
        // Flash node load
        nodeFlashes[targetNodeIdx] = 1.0;
        particles.splice(i, 1);
        continue;
      }
    }

    // Draw Motion Blur Trail if high speed
    if (mult >= 1.5 && (p.prevX !== p.currX || p.prevY !== p.currY)) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p.prevX, p.prevY);
      ctx.lineTo(p.currX, p.currY);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.min(mult * 0.8, 3.2);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }

    // Draw Particle Dot
    ctx.save();
    ctx.beginPath();
    const pRadius = 2.4 + Math.min(mult * 0.35, 1.6);
    ctx.arc(p.currX, p.currY, pRadius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8 + mult * 2;
    ctx.fill();
    ctx.restore();
  }
}
