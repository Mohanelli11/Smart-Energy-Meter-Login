export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Central API client placeholder.
 * Backend integration will be introduced in Phase 2.
 */
export async function apiRequest<T>(endpoint: string): Promise<ApiResponse<T>> {
  throw new Error(`API endpoint not configured: ${endpoint}`);
}
