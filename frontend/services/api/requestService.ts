// Real request service — delegates execution entirely to the FastAPI backend.
// The frontend never resolves variables or constructs the raw HTTP request.
import type { ApiRequest, ApiResponse } from '@/types';
import { runnerApi, ApiError, type BackendHistoryEntry } from './apiClient';

function backendHistoryToApiResponse(h: BackendHistoryEntry): ApiResponse {
  let parsedBody: unknown = h.response_body;
  if (typeof h.response_body === 'string' && h.response_body) {
    try {
      parsedBody = JSON.parse(h.response_body);
    } catch {
      parsedBody = h.response_body;
    }
  }

  const statusText = httpStatusText(h.status_code);

  return {
    status: h.status_code,
    statusText,
    time: h.response_time_ms,
    size: h.response_size,
    headers: h.response_headers as Record<string, string>,
    cookies: [],
    body: parsedBody,
  };
}

function httpStatusText(code: number): string {
  const map: Record<number, string> = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable Entity',
    429: 'Too Many Requests', 500: 'Internal Server Error',
    502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout',
  };
  return map[code] ?? String(code);
}

function mapAuthToBackend(auth: ApiRequest['auth']): Record<string, string> {
  if (!auth || auth.type === 'none') return { type: 'none' };
  if (auth.type === 'bearer') return { type: 'bearer', token: auth.bearerToken ?? '' };
  if (auth.type === 'basic')
    return { type: 'basic', username: auth.basicUser ?? '', password: auth.basicPass ?? '' };
  return { type: 'none' };
}

export const requestService = {
  async sendRequest(
    request: ApiRequest,
    _envVars: Record<string, string> = {}, // kept for API compat, not used
    selectedEnvUuid?: string | null
  ): Promise<ApiResponse> {
    if (!request.url?.trim()) throw new Error('Request URL is empty.');

    const payload = {
      name: request.name,
      method: request.method,
      url: request.url,
      headers: request.headers
        .filter((h) => h.key)
        .map((h) => ({ key: h.key, value: h.value, enabled: h.enabled })),
      params: request.params
        .filter((p) => p.key)
        .map((p) => ({ key: p.key, value: p.value, enabled: p.enabled })),
      auth: mapAuthToBackend(request.auth),
      body_type: request.body?.mode ?? 'none',
      raw_body: request.body?.raw || null,
      timeout: (request.settings?.timeout ?? 30000),
      follow_redirects: request.settings?.followRedirects ?? true,
      verify_ssl: true,
    };

    try {
      const history = await runnerApi.execute(payload, selectedEnvUuid ?? null);
      return backendHistoryToApiResponse(history);
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          status: err.status || 0,
          statusText: err.status ? httpStatusText(err.status) : 'Error',
          time: 0,
          size: 0,
          headers: {},
          cookies: [],
          body: null,
          error: true,
          message: err.message,
        };
      }
      return {
        status: 0,
        statusText: 'Error',
        time: 0,
        size: 0,
        headers: {},
        cookies: [],
        body: null,
        error: true,
        message: (err as Error).message ?? 'Unknown error',
      };
    }
  },
};

// Legacy export kept for any components using resolveVars directly (no-op now)
export const resolveVars = (str: string) => str;
