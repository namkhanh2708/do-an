import type { ApiHealth } from '../types/monitor';
import { request } from './client';

export const healthApi = {
  health: () => request<ApiHealth>('/api/health'),
};
