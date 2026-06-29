// Domain types for the Postman Clone (frontend only).

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface KeyValueRow {
  id: string;
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export type AuthType = 'none' | 'bearer' | 'basic';

export interface AuthConfig {
  type: AuthType;
  bearerToken?: string;
  basicUser?: string;
  basicPass?: string;
}

export type BodyMode = 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded';
export type RawBodyType = 'json' | 'text' | 'xml' | 'html';

export interface RequestBodyConfig {
  mode: BodyMode;
  raw: string;
  rawType: RawBodyType;
  formData: KeyValueRow[];
  urlencoded: KeyValueRow[];
}

export interface RequestSettings {
  followRedirects: boolean;
  timeout: number;
}

export interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  auth: AuthConfig;
  body: RequestBodyConfig;
  scripts: string;
  tests: string;
  settings: RequestSettings;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  time: number;
  size: number;
  headers: Record<string, string>;
  cookies: Array<{ name: string; value: string; domain?: string; path?: string }>;
  body: unknown;
  error?: boolean;
  message?: string;
}

export interface RequestFolder {
  id: string;
  name: string;
  expanded: boolean;
  requests: ApiRequest[];
}

export interface Collection {
  id: string;
  name: string;
  expanded: boolean;
  folders: RequestFolder[];
  requests: ApiRequest[];
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

export interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  responseTime: number;
  timestamp: string;
}

export interface RequestTab extends ApiRequest {
  dirty: boolean;
  response: ApiResponse | null;
  loading: boolean;
  // when known, where this tab is saved
  collectionId?: string;
  folderId?: string;
}
