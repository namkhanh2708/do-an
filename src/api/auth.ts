import { request } from './client';

// Tạo tài khoản hoặc xác thực thông tin đăng nhập qua backend.
export const authApi = {
  register: (username: string, password: string) =>
    request<{ username: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<{ username: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};
