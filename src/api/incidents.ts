import type { Incident } from '../types/monitor';
import { request } from './client';

// API truy vấn lịch sử sự cố theo khoảng thời gian.
export const incidentsApi = {
  incidents: (range: string) =>
    request<Incident[]>(`/api/incidents?range=${encodeURIComponent(range)}`),
};
