import type { Report } from '../types/monitor';
import type { TimeRange } from '../types/app';

export const emptyReport: Report = {
  summary: {
    totalMonitors: 0,
    up: 0,
    slow: 0,
    down: 0,
    uptimePercent: null,
    averageResponseTimeMs: null,
    totalChecks: 0,
    incidentCount: 0,
    meanRecoveryTimeMs: null,
  },
  series: [],
  monitors: [],
};

export const rangeLabels: Record<TimeRange, string> = {
  '1d': '24 giờ qua',
  '7d': '7 ngày qua',
  '30d': '30 ngày qua',
};
