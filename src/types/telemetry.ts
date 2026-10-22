export type NavTab = 
  | 'overview' 
  | 'services' 
  | 'incidents' 
  | 'metrics' 
  | 'logs' 
  | 'traces' 
  | 'slo-tracking';

export type ServiceStatus = 'operational' | 'degraded' | 'critical';

export interface ServiceItem {
  id: string;
  name: string;
  key: string;
  region: string;
  status: ServiceStatus;
  statusBadge: string;
  statusBadgeClass: string;
  desc: string;
  meshTag: string;
  pods: string;
  uptime30d: string;
  p50: string;
  p90: string;
  p99: string;
  cacheHitRatio?: string;
  cacheHitDelta?: string;
  errorRate4xx?: string;
  errorRate5xx?: string;
  rpsThroughput?: string;
  nodes: string;
  memFootprint: string;
  sloBurn: string;
  canaryTag: string;
  historyTicks: ('primary' | 'tertiary' | 'error')[];
  latencyTrend: number[];
  iopsLoad?: string;
  burstBucket?: string;
  queueBacklog?: number;
  deadLetter?: number;
  engine?: string;
  tokenVerification?: string;
}

export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'RESOLVED';

export interface IncidentEvent {
  time: string;
  title: string;
  desc: string;
  type: 'action' | 'alert' | 'system';
}

export interface IncidentItem {
  id: string;
  key: string;
  title: string;
  summary: string;
  severity: IncidentSeverity;
  severityLabel: string;
  region: string;
  service: string;
  serviceKey: string;
  assignee: string;
  assigneeAvatar?: string;
  triggeredAt: string;
  elapsedSeconds: number;
  status: 'investigating' | 'mitigated' | 'resolved';
  peakP99: string;
  currentP99: string;
  baselineP99: string;
  timeline: IncidentEvent[];
  trafficAffected: string;
  failedRequests10m: string;
  autoMitigation: string;
  runbookOutput: string[];
  postMortemStatus?: 'published' | 'drafted' | 'none';
  duration?: string;
  rootCause?: string;
  resolvedAt?: string;
  acknowledged?: boolean;
}

export interface EdgeProbeNode {
  id: string;
  name: string;
  region: string;
  node: string;
  weight: number;
  latencyMs: number;
  lossPercent: number;
  status: 'optimal' | 'moderate' | 'elevated' | 'critical';
  notes?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  service: string;
  pod: string;
  traceId: string;
  message: string;
  status?: number;
  durationMs?: number;
}

export interface TraceSpan {
  id: string;
  service: string;
  operation: string;
  startTimeMs: number;
  durationMs: number;
  status: 'ok' | 'error' | 'warn';
  httpStatus: number;
  tags: Record<string, string>;
}

export interface DistributedTrace {
  id: string;
  traceId: string;
  endpoint: string;
  method: string;
  timestamp: string;
  durationMs: number;
  status: 'ok' | 'degraded' | 'error';
  statusCode: number;
  spans: TraceSpan[];
}
