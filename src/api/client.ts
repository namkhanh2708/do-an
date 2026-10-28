export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Gửi yêu cầu JSON và chuyển phản hồi lỗi thành thông báo có thể hiển thị.
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new ApiError(body?.error || `Yêu cầu thất bại (HTTP ${response.status}).`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
