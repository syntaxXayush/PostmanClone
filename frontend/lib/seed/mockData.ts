// Seed data for the Postman Clone
import { v4 as uuid } from 'uuid';
import type {
  ApiRequest,
  Collection,
  Environment,
  HistoryEntry,
  HttpMethod,
  KeyValueRow,
  RequestBodyConfig,
  AuthConfig,
} from '@/types';

export const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-emerald-500',
  POST: 'text-amber-500',
  PUT: 'text-sky-500',
  PATCH: 'text-violet-500',
  DELETE: 'text-red-500',
  HEAD: 'text-zinc-400',
  OPTIONS: 'text-zinc-400',
};

export const METHOD_BG: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  POST: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  PUT: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
  PATCH: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
  DELETE: 'bg-red-500/10 text-red-500 border-red-500/30',
  HEAD: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  OPTIONS: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
};

const makeRow = (key = '', value = '', description = '', enabled = true): KeyValueRow => ({
  id: uuid(),
  key,
  value,
  description,
  enabled,
});

const defaultBody = (): RequestBodyConfig => ({
  mode: 'none',
  raw: '',
  rawType: 'json',
  formData: [makeRow()],
  urlencoded: [makeRow()],
});

const defaultAuth = (): AuthConfig => ({ type: 'none', bearerToken: '', basicUser: '', basicPass: '' });

export const newRequest = (overrides: Partial<ApiRequest> = {}): ApiRequest => ({
  id: uuid(),
  name: overrides.name ?? 'Untitled Request',
  method: overrides.method ?? 'GET',
  url: overrides.url ?? '',
  params: overrides.params ?? [makeRow()],
  headers: overrides.headers ?? [makeRow('Accept', 'application/json', '', true), makeRow()],
  auth: overrides.auth ?? defaultAuth(),
  body: overrides.body ?? defaultBody(),
  scripts: overrides.scripts ?? '// pre-request script\n',
  tests:
    overrides.tests ??
    '// tests\npm.test("Status code is 200", () => pm.response.to.have.status(200));\n',
  settings: overrides.settings ?? { followRedirects: true, timeout: 30000 },
});

const req = (name: string, method: HttpMethod, url: string, extras: Partial<ApiRequest> = {}): ApiRequest =>
  newRequest({ name, method, url, ...extras });

const jsonBody = (obj: unknown): RequestBodyConfig => ({
  ...defaultBody(),
  mode: 'raw',
  rawType: 'json',
  raw: JSON.stringify(obj, null, 2),
});

export const seedCollections: Collection[] = [
  {
    id: uuid(),
    name: 'User API',
    expanded: true,
    folders: [
      {
        id: uuid(),
        name: 'Users',
        expanded: true,
        requests: [
          req('Get Users', 'GET', '{{base_url}}/users'),
          req('Get User by ID', 'GET', '{{base_url}}/users/1'),
          req('Create User', 'POST', '{{base_url}}/users', {
            body: jsonBody({ name: 'John', email: 'john@example.com' }),
          }),
          req('Patch User', 'PATCH', '{{base_url}}/users/1', {
            body: jsonBody({ email: 'new@example.com' }),
          }),
        ],
      },
    ],
    requests: [],
  },
  {
    id: uuid(),
    name: 'JSONPlaceholder',
    expanded: true,
    folders: [
      {
        id: uuid(),
        name: 'Posts',
        expanded: false,
        requests: [
          req('Get Posts', 'GET', 'https://jsonplaceholder.typicode.com/posts'),
          req('Get Comments', 'GET', 'https://jsonplaceholder.typicode.com/comments'),
          req('Update Post', 'PUT', 'https://jsonplaceholder.typicode.com/posts/1', {
            body: jsonBody({ id: 1, title: 'updated', body: 'new body', userId: 1 }),
          }),
          req('Delete Post', 'DELETE', 'https://jsonplaceholder.typicode.com/posts/1'),
        ],
      },
    ],
    requests: [],
  },
  {
    id: uuid(),
    name: 'HTTPBin Testing',
    expanded: false,
    folders: [],
    requests: [
      req('HTTPBin Delay', 'GET', 'https://httpbin.org/delay/2'),
      req('HTTPBin Headers', 'GET', 'https://httpbin.org/headers'),
      req('HTTPBin Echo', 'POST', 'https://httpbin.org/anything', {
        body: jsonBody({ hello: 'world' }),
      }),
    ],
  },
];

export const seedEnvironments: Environment[] = [
  {
    id: uuid(),
    name: 'Development',
    variables: [
      { id: uuid(), key: 'base_url', value: 'https://jsonplaceholder.typicode.com', enabled: true },
      { id: uuid(), key: 'token', value: 'dev-token-12345', enabled: true },
      { id: uuid(), key: 'api_version', value: 'v1', enabled: true },
    ],
  },
  {
    id: uuid(),
    name: 'Production',
    variables: [
      { id: uuid(), key: 'base_url', value: 'https://api.example.com', enabled: true },
      { id: uuid(), key: 'token', value: 'prod-token-xxx', enabled: true },
      { id: uuid(), key: 'api_version', value: 'v2', enabled: true },
    ],
  },
];

const histEntry = (method: HttpMethod, url: string, status: number, ms: number): HistoryEntry => ({
  id: uuid(),
  method,
  url,
  status,
  responseTime: ms,
  timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 3)).toISOString(),
});

export const seedHistory: HistoryEntry[] = [
  histEntry('GET', 'https://jsonplaceholder.typicode.com/posts', 200, 124),
  histEntry('GET', 'https://jsonplaceholder.typicode.com/posts/1', 200, 88),
  histEntry('POST', 'https://jsonplaceholder.typicode.com/posts', 201, 211),
  histEntry('PUT', 'https://jsonplaceholder.typicode.com/posts/1', 200, 165),
  histEntry('DELETE', 'https://jsonplaceholder.typicode.com/posts/1', 200, 142),
  histEntry('GET', 'https://jsonplaceholder.typicode.com/users', 200, 96),
  histEntry('GET', 'https://jsonplaceholder.typicode.com/comments', 200, 178),
  histEntry('GET', 'https://httpbin.org/headers', 200, 322),
  histEntry('POST', 'https://httpbin.org/anything', 200, 244),
  histEntry('GET', 'https://httpbin.org/delay/2', 200, 2100),
  histEntry('GET', 'https://api.github.com/users/octocat', 200, 312),
  histEntry('GET', 'https://api.github.com/repos/torvalds/linux', 200, 287),
  histEntry('PATCH', 'https://jsonplaceholder.typicode.com/posts/1', 200, 134),
  histEntry('GET', 'https://jsonplaceholder.typicode.com/todos/1', 404, 78),
  histEntry('GET', 'https://jsonplaceholder.typicode.com/albums', 200, 102),
];
