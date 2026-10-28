import type { ApiHealth } from '../types/monitor';
import { request } from './client';

// API kiểm tra tình trạng backend và các dịch vụ liên quan.
export const healthApi = {
  health: () => request<ApiHealth>('/api/health'),
};
