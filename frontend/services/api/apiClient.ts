// Centralized API client for Postman Clone backend (FastAPI).
// All communication with the backend goes through this module.

const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1';

// ─── Error ───────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  public status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function http<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new ApiError('Cannot reach the backend. Is it running on http://localhost:8000?');
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(`Server returned non-JSON response (${response.status})`, response.status);
  }

  if (!response.ok) {
    // Backend returns { detail: string } on error
    const message: string =
      typeof data?.detail === 'string'
        ? data.detail
        : typeof data?.message === 'string'
        ? data.message
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  // All successful backend responses are wrapped in { success: true, data: T }
  return data?.data as T;
}

// ─── Typed backend DTOs ───────────────────────────────────────────────────────

export interface BackendFolder {
  uuid: string;
  name: string;
  expanded: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendRequest {
  uuid: string;
  name: string;
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  params: { key: string; value: string; enabled: boolean }[];
  auth: Record<string, string>;
  body_type: string;
  raw_body: string | null;
  scripts: string | null;
  tests: string | null;
  timeout: number;
  follow_redirects: boolean;
  verify_ssl: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendCollection {
  uuid: string;
  name: string;
  expanded: boolean;
  folders: BackendFolder[];
  requests: BackendRequest[];
  created_at: string;
  updated_at: string;
}

export interface BackendEnvironmentVariable {
  uuid: string;
  key: string;
  value: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendEnvironment {
  uuid: string;
  name: string;
  variables: BackendEnvironmentVariable[];
  created_at: string;
  updated_at: string;
}

export interface BackendHistoryEntry {
  uuid: string;
  method: string;
  url: string;
  status_code: number;
  response_time_ms: number;
  response_size: number;
  request_headers: Record<string, string>;
  response_headers: Record<string, string>;
  response_body: string | null;
  environment_uuid: string | null;
  created_at: string;
  updated_at: string;
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const collectionsApi = {
  getAll: () => http<BackendCollection[]>('/collections/'),
  get: (uuid: string) => http<BackendCollection>(`/collections/${uuid}`),
  create: (name: string) => http<BackendCollection>('/collections/', { method: 'POST', body: JSON.stringify({ name }) }),
  update: (uuid: string, name: string) =>
    http<BackendCollection>(`/collections/${uuid}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  delete: (uuid: string) => http<null>(`/collections/${uuid}`, { method: 'DELETE' }),
};

export const foldersApi = {
  create: (collectionUuid: string, name: string) =>
    http<BackendFolder>('/folders/', {
      method: 'POST',
      body: JSON.stringify({ collection_uuid: collectionUuid, name }),
    }),
  update: (uuid: string, name: string) =>
    http<BackendFolder>(`/folders/${uuid}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  delete: (uuid: string) => http<null>(`/folders/${uuid}`, { method: 'DELETE' }),
};

export const requestsApi = {
  get: (uuid: string) => http<BackendRequest>(`/requests/${uuid}`),
  create: (payload: {
    name: string;
    method: string;
    url: string;
    collection_uuid?: string;
    folder_uuid?: string;
    headers?: any[];
    params?: any[];
    auth?: any;
    body_type?: string;
    raw_body?: string | null;
    scripts?: string | null;
    tests?: string | null;
    timeout?: number;
    follow_redirects?: boolean;
    verify_ssl?: boolean;
  }) => http<BackendRequest>('/requests/', { method: 'POST', body: JSON.stringify(payload) }),
  update: (uuid: string, payload: Partial<{
    name: string; method: string; url: string; headers: any[]; params: any[];
    auth: any; body_type: string; raw_body: string | null;
    scripts: string | null; tests: string | null;
    timeout: number; follow_redirects: boolean; verify_ssl: boolean;
  }>) => http<BackendRequest>(`/requests/${uuid}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  delete: (uuid: string) => http<null>(`/requests/${uuid}`, { method: 'DELETE' }),
};

export const environmentsApi = {
  getAll: () => http<BackendEnvironment[]>('/environments/'),
  get: (uuid: string) => http<BackendEnvironment>(`/environments/${uuid}`),
  create: (name: string, variables: { key: string; value: string; enabled: boolean }[]) =>
    http<BackendEnvironment>('/environments/', { method: 'POST', body: JSON.stringify({ name, variables }) }),
  update: (uuid: string, name: string) =>
    http<BackendEnvironment>(`/environments/${uuid}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  delete: (uuid: string) => http<null>(`/environments/${uuid}`, { method: 'DELETE' }),
};

export const historyApi = {
  getRecent: (limit = 50) => http<BackendHistoryEntry[]>(`/history/?limit=${limit}`),
  clear: () => http<null>('/history/', { method: 'DELETE' }),
};

export const settingsApi = {
  get: (key: string, defaultVal?: any) =>
    http<any>(`/settings/${key}`).catch(() => defaultVal),
  set: (key: string, value: any) =>
    http<any>(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
};

export const runnerApi = {
  execute: (requestData: {
    name: string;
    method: string;
    url: string;
    headers?: any[];
    params?: any[];
    auth?: any;
    body_type?: string;
    raw_body?: string | null;
    timeout?: number;
    follow_redirects?: boolean;
    verify_ssl?: boolean;
  }, environmentUuid?: string | null) =>
    http<BackendHistoryEntry>(
      `/runner/execute${environmentUuid ? `?environment_uuid=${environmentUuid}` : ''}`,
      { method: 'POST', body: JSON.stringify(requestData) }
    ),
};
