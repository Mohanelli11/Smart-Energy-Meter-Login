import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Shape of every error body returned by the API. */
export interface ApiErrorBody {
  error: { code: string; message: string };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Turn any thrown value into an ApiError with a user-presentable message. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (axios.isAxiosError(err)) {
    const res = (err as AxiosError<ApiErrorBody>).response;
    if (res) {
      const retry = Number(res.headers?.['retry-after']);
      return new ApiError(res.status, res.data?.error?.code ?? 'error', res.data?.error?.message ?? 'Something went wrong. Please try again.', Number.isFinite(retry) ? retry : undefined);
    }
    return new ApiError(0, 'network', 'Cannot reach the server. Check your connection and try again.');
  }
  return new ApiError(0, 'unknown', 'Something went wrong. Please try again.');
}

/**
 * Tokens live in httpOnly cookies set by the server, so no credential is ever readable
 * from JavaScript. `withCredentials` makes the browser send them with each request.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000,
});

type SessionKind = 'user' | 'meter';

/** Fired when a session can no longer be refreshed, so the UI can send the person to sign in. */
export const SESSION_EXPIRED_EVENT = 'motech:session-expired';

const refreshInFlight: Partial<Record<SessionKind, Promise<boolean>>> = {};

function kindForUrl(url = ''): SessionKind {
  return url.startsWith('/meters/me') ? 'meter' : 'user';
}

function refresh(kind: SessionKind): Promise<boolean> {
  // Single-flight: concurrent 401s share one refresh so tokens aren't rotated twice.
  refreshInFlight[kind] ??= apiClient
    .post('/auth/refresh', { kind })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      delete refreshInFlight[kind];
    });
  return refreshInFlight[kind]!;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const url = original?.url ?? '';
    const isAuthCall = url.startsWith('/auth/');

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      const kind = kindForUrl(url);
      if (await refresh(kind)) return apiClient(original);
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { kind } }));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
