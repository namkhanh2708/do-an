import type { HealthCheck, Monitor, MonitorInput } from '../types/monitor';
import { request } from './client';

export const monitorsApi = {
  monitors: () => request<Monitor[]>('/api/monitors'),
  createMonitor: (data: MonitorInput) =>
    request<Monitor>('/api/monitors', { method: 'POST', body: JSON.stringify(data) }),
  updateMonitor: (id: string, data: MonitorInput) =>
    request<Monitor>(`/api/monitors/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteMonitor: (id: string) =>
    request<void>(`/api/monitors/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  checkNow: (id: string) =>
    request<{ monitor: Monitor; check: HealthCheck }>(
      `/api/monitors/${encodeURIComponent(id)}/check`,
      { method: 'POST' },
    ),
  checks: (id: string, range: string) =>
    request<HealthCheck[]>(
      `/api/monitors/${encodeURIComponent(id)}/checks?range=${encodeURIComponent(range)}`,
    ),
};
