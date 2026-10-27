import type { Report } from '../types/monitor';
import { request } from './client';

export const reportsApi = {
  report: (range: string, monitorId?: string) => {
    const query = new URLSearchParams({ range });
    if (monitorId) query.set('monitorId', monitorId);
    return request<Report>(`/api/reports?${query}`);
  },
};
