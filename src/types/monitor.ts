export type MonitorStatus = 'UP' | 'DOWN' | 'SLOW' | 'UNKNOWN';

export interface Monitor {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  intervalSeconds: number;
  slowThresholdMs: number;
  notificationEmail: string;
  status: MonitorStatus;
  lastCheckedAt: string | null;
  lastResponseTimeMs: number | null;
  lastHttpStatus: number | null;
  lastError: string;
  createdAt: string;
}

export interface HealthCheck {
  id: string;
  monitorId: string;
  status: Exclude<MonitorStatus, 'UNKNOWN'>;
  responseTimeMs: number | null;
  httpStatus: number | null;
  error: string;
  checkedAt: string;
}

export interface Incident {
  id: string;
  monitorId: string;
  monitorName: string;
  monitorUrl: string;
  startedAt: string;
  resolvedAt: string | null;
  status: 'OPEN' | 'RESOLVED';
  durationMs: number | null;
}

export interface ReportMonitor extends Monitor {
  uptimePercent: number | null;
  averageResponseTimeMs: number | null;
  checks: number;
  incidents: number;
}

export interface Report {
  summary: {
    totalMonitors: number;
    up: number;
    slow: number;
    down: number;
    uptimePercent: number | null;
    averageResponseTimeMs: number | null;
    totalChecks: number;
    incidentCount: number;
    meanRecoveryTimeMs: number | null;
  };
  series: { timestamp: string; averageResponseTimeMs: number | null }[];
  monitors: ReportMonitor[];
}

export interface ApiHealth {
  status: string;
  storage: 'mongodb' | 'memory';
  email: boolean;
}

export type MonitorInput = Pick<
  Monitor,
  'name' | 'url' | 'enabled' | 'intervalSeconds' | 'slowThresholdMs' | 'notificationEmail'
>;
