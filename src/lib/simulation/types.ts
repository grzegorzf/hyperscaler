export type NodeStatus = "HEALTHY" | "DRAINING" | "OVERLOADED" | "FAILED";
export type NodeRole = "POD" | "SUPER_NODE";
export type ScalingMode = "HORIZONTAL" | "VERTICAL";
export type SystemHealth = "NOMINAL" | "DEGRADED" | "CRITICAL";

export interface ServerNode {
  id: number;
  name: string;
  role: NodeRole;
  cpuCores: number;
  ramGb: number;
  cpuUtilization: number;
  ramUtilization: number;
  requestsHandledPerSec: number;
  status: NodeStatus;
}

export interface ClusterState {
  timestamp: number;
  trafficRps: number;
  edgeCacheHitRate: number;
  edgeAbsorbedRps: number;
  originIngressRps: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  errorRatePercent: number;
  scalingMode: ScalingMode;
  autoScalingEnabled: boolean;
  chaosActive: boolean;
  systemHealth: SystemHealth;
  totalNodes: number;
  averageCpuPercent: number;
  averageRamPercent: number;
  nodes: ServerNode[];
}

export interface ConduitParticle {
  stage: number; // 0: client->cdn, 10: cdn bounce (hit), 1: cdn->lb, 2: lb->node
  progress: number;
  speed: number;
  type: "hit" | "miss" | "error";
  color: string;
  startX: number;
  startY: number;
  targetCdnIdx: number;
  targetNodeIdx: number;
  currX: number;
  currY: number;
  prevX: number;
  prevY: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface CdnPoP extends Point2D {
  label: string;
}

export interface LoadBalancerNode extends Point2D {
  label: string;
}

export interface RectBounds extends Point2D {
  w: number;
  h: number;
  cx: number;
  cy: number;
}

export interface SimulationLayout {
  table: RectBounds;
  clients: Point2D;
  cdnPops: CdnPoP[];
  loadBalancers: LoadBalancerNode[];
  computeStage: RectBounds;
}
