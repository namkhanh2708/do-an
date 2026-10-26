import type {
  ApiHealth,
  HealthCheck,
  Incident,
  Monitor,
  MonitorInput,
  Report,
} from './types/monitor';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || `Yêu cầu thất bại (HTTP ${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<ApiHealth>('/api/health'),
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
  incidents: (range: string) =>
    request<Incident[]>(`/api/incidents?range=${encodeURIComponent(range)}`),
  report: (range: string, monitorId?: string) => {
    const query = new URLSearchParams({ range });
    if (monitorId) query.set('monitorId', monitorId);
    return request<Report>(`/api/reports?${query}`);
  },
};
