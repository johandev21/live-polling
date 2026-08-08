import { ERROR_CODES, errorResponseSchema, type ErrorCode } from './contracts';

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message?: string,
    status = 400,
    details?: unknown,
  ) {
    super(message || code);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type RequestOptions = RequestInit & {
  participantToken?: string | null;
};

const DEFAULT_BASE_URL = 'http://localhost:3000';

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env?.VITE_API_URL;
  return typeof envUrl === 'string' && envUrl.length > 0
    ? envUrl
    : DEFAULT_BASE_URL;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { participantToken, headers: customHeaders, ...restOptions } = options;
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  const headers = new Headers(customHeaders);

  if (
    restOptions.body &&
    typeof restOptions.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (participantToken) {
    headers.set('Authorization', `Bearer ${participantToken}`);
  }

  const response = await fetch(url, {
    credentials: 'include',
    headers,
    ...restOptions,
  });

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(json);
    if (parsed.success) {
      const knownCode = Object.values(ERROR_CODES).includes(
        parsed.data.code as ErrorCode,
      )
        ? (parsed.data.code as ErrorCode)
        : ERROR_CODES.INTERNAL;

      throw new ApiError(
        knownCode,
        parsed.data.message || parsed.data.code,
        response.status,
        json,
      );
    }

    throw new ApiError(
      ERROR_CODES.INTERNAL,
      `Request failed with status ${response.status}`,
      response.status,
      json,
    );
  }

  return json as T;
}

export const apiClient = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return apiFetch<T>(path, { ...options, method: 'GET' });
  },

  post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return apiFetch<T>(path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
      method: 'POST',
    });
  },

  patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return apiFetch<T>(path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
      method: 'PATCH',
    });
  },

  put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return apiFetch<T>(path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
      method: 'PUT',
    });
  },

  delete<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return apiFetch<T>(path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
      method: 'DELETE',
    });
  },
};
