import type { Incident } from '../types/monitor';
import { request } from './client';

export const incidentsApi = {
  incidents: (range: string) =>
    request<Incident[]>(`/api/incidents?range=${encodeURIComponent(range)}`),
};
