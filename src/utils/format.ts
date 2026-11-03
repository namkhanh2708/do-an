import type { MonitorStatus } from '../types/monitor';
import type { Language } from '../i18n';

// Chuẩn hóa số liệu và trạng thái để hiển thị nhất quán trong giao diện.
export function formatMs(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : `${Math.round(value)} ms`;
}

export function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : `${value.toFixed(3)}%`;
}

export function formatDate(value: string | null | undefined, language: Language = 'vi') {
  return value
    ? new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : language === 'vi' ? 'Chưa kiểm tra' : 'Not checked';
}

export function formatDuration(value: number | null | undefined, language: Language = 'vi') {
  if (value === null || value === undefined) return '—';
  const totalMilliseconds = Math.max(0, value);
  if (totalMilliseconds < 60_000) return language === 'vi'
    ? `${Math.max(1, Math.round(totalMilliseconds / 1000))} giây`
    : `${Math.max(1, Math.round(totalMilliseconds / 1000))} sec`;
  const totalMinutes = Math.floor(totalMilliseconds / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (language === 'en') {
    if (days) return `${days}d ${hours}h ${minutes}m`;
    if (!hours) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  }
  if (days) return `${days} ngày ${hours} giờ ${minutes} phút`;
  if (!hours) return `${minutes} phút`;
  return `${hours} giờ ${minutes} phút`;
}

export function statusLabel(status: MonitorStatus, language: Language = 'vi') {
  if (language === 'en') {
    return { UP: 'Online', DOWN: 'Offline', SLOW: 'Slow', UNKNOWN: 'No data' }[status];
  }
  return { UP: 'Đang hoạt động', DOWN: 'Mất kết nối', SLOW: 'Phản hồi chậm', UNKNOWN: 'Chưa có dữ liệu' }[status];
}
