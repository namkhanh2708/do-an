import { request } from './client';
import type { Account, UserRole } from '../types/monitor';

// Tạo tài khoản hoặc xác thực thông tin đăng nhập qua backend.
export const authApi = {
  register: (username: string, password: string) =>
    request<{ username: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<Account>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<Account>('/api/auth/me'),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  users: () => request<Account[]>('/api/auth/admin/users'),
  createUser: (username: string, password: string, role: UserRole) =>
    request<Account>('/api/auth/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    }),
  updateUser: (id: string, changes: { role?: UserRole; isActive?: boolean }) =>
    request<Account>(`/api/auth/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),
  deleteUser: (id: string) =>
    request<void>(`/api/auth/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
