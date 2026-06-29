'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { newRequest } from '@/lib/seed/mockData';
import {
  collectionsApi,
  foldersApi,
  requestsApi,
  environmentsApi,
  historyApi,
  settingsApi,
  type BackendCollection,
  type BackendEnvironment,
  type BackendHistoryEntry,
} from '@/services/api/apiClient';
import { toast } from 'sonner';
import type {
  ApiRequest,
  ApiResponse,
  Collection,
  Environment,
  EnvironmentVariable,
  HistoryEntry,
  RequestTab,
} from '@/types';

// ─── Mapping helpers ──────────────────────────────────────────────────────────
// Backend uses `uuid` as public identifier; frontend uses `id`.
// We map backend responses → frontend shapes here and nowhere else.

function mapBackendRequest(r: BackendCollection['requests'][number]): ApiRequest {
  return {
    id: r.uuid,
    name: r.name,
    method: r.method as ApiRequest['method'],
    url: r.url,
    params: (r.params ?? []).map((p) => ({ id: uuid(), key: p.key, value: p.value, enabled: p.enabled, description: '' })),
    headers: (r.headers ?? []).map((h) => ({ id: uuid(), key: h.key, value: h.value, enabled: h.enabled, description: '' })),
    auth: {
      type: (r.auth?.type ?? 'none') as ApiRequest['auth']['type'],
      bearerToken: r.auth?.token ?? '',
      basicUser: r.auth?.username ?? '',
      basicPass: r.auth?.password ?? '',
    },
    body: {
      mode: (r.body_type ?? 'none') as ApiRequest['body']['mode'],
      raw: r.raw_body ?? '',
      rawType: 'json',
      formData: [],
      urlencoded: [],
    },
    scripts: r.scripts ?? '',
    tests: r.tests ?? '',
    settings: { followRedirects: r.follow_redirects ?? true, timeout: r.timeout ?? 30000 },
  };
}

function mapBackendCollection(c: BackendCollection): Collection {
  return {
    id: c.uuid,
    name: c.name,
    expanded: c.expanded,
    folders: (c.folders ?? []).map((f) => ({
      id: f.uuid,
      name: f.name,
      expanded: f.expanded,
      requests: [],
    })),
    requests: (c.requests ?? []).map(mapBackendRequest),
  };
}

function mapBackendEnvironment(e: BackendEnvironment): Environment {
  return {
    id: e.uuid,
    name: e.name,
    variables: e.variables.map((v) => ({
      id: v.uuid,
      key: v.key,
      value: v.value,
      enabled: v.enabled,
    })),
  };
}

function mapBackendHistory(h: BackendHistoryEntry): HistoryEntry {
  return {
    id: h.uuid,
    method: h.method as HistoryEntry['method'],
    url: h.url,
    status: h.status_code,
    responseTime: h.response_time_ms,
    timestamp: h.created_at,
  };
}

function mapRequestToPayload(req: ApiRequest) {
  return {
    name: req.name,
    method: req.method,
    url: req.url,
    headers: req.headers.filter((h) => h.key).map((h) => ({ key: h.key, value: h.value, enabled: h.enabled })),
    params: req.params.filter((p) => p.key).map((p) => ({ key: p.key, value: p.value, enabled: p.enabled })),
    auth: req.auth.type === 'bearer'
      ? { type: 'bearer', token: req.auth.bearerToken ?? '' }
      : req.auth.type === 'basic'
      ? { type: 'basic', username: req.auth.basicUser ?? '', password: req.auth.basicPass ?? '' }
      : { type: 'none' },
    body_type: req.body?.mode ?? 'none',
    raw_body: req.body?.raw || null,
    scripts: req.scripts || null,
    tests: req.tests || null,
    timeout: req.settings?.timeout ?? 30000,
    follow_redirects: req.settings?.followRedirects ?? true,
    verify_ssl: true,
  };
}

// ─── Collections Store ────────────────────────────────────────────────────────

interface CollectionsState {
  collections: Collection[];
  query: string;
  loading: boolean;
  setQuery: (q: string) => void;
  loadCollections: () => Promise<void>;
  addCollection: (name: string) => Promise<void>;
  renameCollection: (id: string, name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  toggleCollection: (id: string) => void;
  toggleFolder: (collectionId: string, folderId: string) => void;
  addFolder: (collectionId: string, name: string) => Promise<void>;
  addRequestToCollection: (collectionId: string, request: ApiRequest, folderId?: string) => Promise<void>;
  updateRequestInCollection: (collectionId: string, requestId: string, request: ApiRequest, folderId?: string) => Promise<void>;
  deleteRequest: (collectionId: string, requestId: string, folderId?: string) => Promise<void>;
  renameRequest: (collectionId: string, requestId: string, name: string, folderId?: string) => Promise<void>;
}

export const useCollectionsStore = create<CollectionsState>()((set, get) => ({
  collections: [],
  query: '',
  loading: false,

  setQuery: (q) => set({ query: q }),

  loadCollections: async () => {
    set({ loading: true });
    try {
      const data = await collectionsApi.getAll();
      set({ collections: data.map(mapBackendCollection) });
    } catch (e) {
      toast.error('Failed to load collections');
    } finally {
      set({ loading: false });
    }
  },

  addCollection: async (name) => {
    try {
      const data = await collectionsApi.create(name);
      set((s) => ({ collections: [...s.collections, mapBackendCollection(data)] }));
      toast.success(`Collection "${name}" created`);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to create collection');
    }
  },

  renameCollection: async (id, name) => {
    try {
      const data = await collectionsApi.update(id, name);
      set((s) => ({
        collections: s.collections.map((c) =>
          c.id === id ? { ...c, name: data.name } : c
        ),
      }));
    } catch (e) {
      toast.error((e as Error).message || 'Failed to rename collection');
    }
  },

  deleteCollection: async (id) => {
    try {
      await collectionsApi.delete(id);
      set((s) => ({ collections: s.collections.filter((c) => c.id !== id) }));
      toast.success('Collection deleted');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete collection');
    }
  },

  toggleCollection: (id) =>
    set((s) => ({
      collections: s.collections.map((c) =>
        c.id === id ? { ...c, expanded: !c.expanded } : c
      ),
    })),

  toggleFolder: (collectionId, folderId) =>
    set((s) => ({
      collections: s.collections.map((c) =>
        c.id !== collectionId
          ? c
          : {
              ...c,
              folders: c.folders.map((f) =>
                f.id === folderId ? { ...f, expanded: !f.expanded } : f
              ),
            }
      ),
    })),

  addFolder: async (collectionId, name) => {
    try {
      const data = await foldersApi.create(collectionId, name);
      set((s) => ({
        collections: s.collections.map((c) =>
          c.id !== collectionId
            ? c
            : {
                ...c,
                folders: [
                  ...c.folders,
                  { id: data.uuid, name: data.name, expanded: data.expanded, requests: [] },
                ],
              }
        ),
      }));
    } catch (e) {
      toast.error((e as Error).message || 'Failed to create folder');
    }
  },

  addRequestToCollection: async (collectionId, request, folderId) => {
    try {
      const payload = {
        ...mapRequestToPayload(request),
        collection_uuid: collectionId,
        folder_uuid: folderId,
      };
      const data = await requestsApi.create(payload);
      const mapped = mapBackendRequest(data as any);

      set((s) => ({
        collections: s.collections.map((c) => {
          if (c.id !== collectionId) return c;
          if (folderId) {
            return {
              ...c,
              folders: c.folders.map((f) =>
                f.id === folderId ? { ...f, requests: [...f.requests, mapped] } : f
              ),
            };
          }
          return { ...c, requests: [...c.requests, mapped] };
        }),
      }));
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save request');
      throw e;
    }
  },

  updateRequestInCollection: async (collectionId, requestId, request, folderId) => {
    try {
      const data = await requestsApi.update(requestId, mapRequestToPayload(request));
      const mapped = mapBackendRequest(data as any);

      set((s) => ({
        collections: s.collections.map((c) => {
          if (c.id !== collectionId) return c;
          if (folderId) {
            return {
              ...c,
              folders: c.folders.map((f) =>
                f.id === folderId
                  ? { ...f, requests: f.requests.map((r) => (r.id === requestId ? mapped : r)) }
                  : f
              ),
            };
          }
          return { ...c, requests: c.requests.map((r) => (r.id === requestId ? mapped : r)) };
        }),
      }));
    } catch (e) {
      toast.error((e as Error).message || 'Failed to update request');
    }
  },

  deleteRequest: async (collectionId, requestId, folderId) => {
    try {
      await requestsApi.delete(requestId);
      set((s) => ({
        collections: s.collections.map((c) => {
          if (c.id !== collectionId) return c;
          if (folderId) {
            return {
              ...c,
              folders: c.folders.map((f) =>
                f.id === folderId
                  ? { ...f, requests: f.requests.filter((r) => r.id !== requestId) }
                  : f
              ),
            };
          }
          return { ...c, requests: c.requests.filter((r) => r.id !== requestId) };
        }),
      }));
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete request');
    }
  },

  renameRequest: async (collectionId, requestId, name, folderId) => {
    try {
      await requestsApi.update(requestId, { name });
      set((s) => ({
        collections: s.collections.map((c) => {
          if (c.id !== collectionId) return c;
          if (folderId) {
            return {
              ...c,
              folders: c.folders.map((f) =>
                f.id === folderId
                  ? { ...f, requests: f.requests.map((r) => (r.id === requestId ? { ...r, name } : r)) }
                  : f
              ),
            };
          }
          return { ...c, requests: c.requests.map((r) => (r.id === requestId ? { ...r, name } : r)) };
        }),
      }));
    } catch (e) {
      toast.error((e as Error).message || 'Failed to rename request');
    }
  },
}));

// ─── History Store ────────────────────────────────────────────────────────────

interface HistoryState {
  history: HistoryEntry[];
  loadHistory: () => Promise<void>;
  addHistory: (entry: Omit<HistoryEntry, 'id'>) => void; // kept for optimistic UI after execute
  clearHistory: () => Promise<void>;
  removeHistory: (id: string) => void;
}

export const useHistoryStore = create<HistoryState>()((set) => ({
  history: [],

  loadHistory: async () => {
    try {
      const data = await historyApi.getRecent(100);
      set({ history: data.map(mapBackendHistory) });
    } catch {
      // History load failure is non-fatal
    }
  },

  // Called by RequestBuilder immediately after execute — backend persists it, 
  // but we update the local list instantly for snappy UX (history is append-only).
  addHistory: (entry) =>
    set((s) => ({ history: [{ id: uuid(), ...entry }, ...s.history].slice(0, 100) })),

  clearHistory: async () => {
    try {
      await historyApi.clear();
      set({ history: [] });
      toast.success('History cleared');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to clear history');
    }
  },

  removeHistory: (id) =>
    set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
}));

// ─── Environments Store ───────────────────────────────────────────────────────

interface EnvironmentsState {
  environments: Environment[];
  selectedId: string | null;
  setSelected: (id: string | null) => void;
  loadEnvironments: () => Promise<void>;
  addEnvironment: (name: string) => Promise<void>;
  renameEnvironment: (id: string, name: string) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setVariables: (id: string, vars: EnvironmentVariable[]) => Promise<void>;
  currentVars: () => Record<string, string>;
}

export const useEnvironmentsStore = create<EnvironmentsState>()(
  persist(
    (set, get) => ({
      environments: [],
      selectedId: null,

      setSelected: (id) => set({ selectedId: id }),

      loadEnvironments: async () => {
        try {
          const data = await environmentsApi.getAll();
          const mapped = data.map(mapBackendEnvironment);
          set((s) => ({
            environments: mapped,
            // Preserve selection if still valid, else pick first
            selectedId: mapped.find((e) => e.id === s.selectedId)?.id ?? mapped[0]?.id ?? null,
          }));
        } catch {
          // Non-fatal
        }
      },

      addEnvironment: async (name) => {
        try {
          const data = await environmentsApi.create(name, []);
          const mapped = mapBackendEnvironment(data);
          set((s) => ({ environments: [...s.environments, mapped], selectedId: mapped.id }));
          toast.success(`Environment "${name}" created`);
        } catch (e) {
          toast.error((e as Error).message || 'Failed to create environment');
        }
      },

      renameEnvironment: async (id, name) => {
        try {
          await environmentsApi.update(id, name);
          set((s) => ({
            environments: s.environments.map((e) => (e.id === id ? { ...e, name } : e)),
          }));
        } catch (e) {
          toast.error((e as Error).message || 'Failed to rename environment');
        }
      },

      deleteEnvironment: async (id) => {
        try {
          await environmentsApi.delete(id);
          set((s) => ({
            environments: s.environments.filter((e) => e.id !== id),
            selectedId: s.selectedId === id ? null : s.selectedId,
          }));
          toast.success('Environment deleted');
        } catch (e) {
          toast.error((e as Error).message || 'Failed to delete environment');
        }
      },

      setVariables: async (id, vars) => {
        // Rebuild the environment by deleting and re-creating variables via the backend
        // The simplest approach: optimistic local update, then backend sync
        set((s) => ({
          environments: s.environments.map((e) => (e.id === id ? { ...e, variables: vars } : e)),
        }));
        // Sync to backend — recreate environment with updated vars
        try {
          const env = get().environments.find((e) => e.id === id);
          if (!env) return;
          // Delete and recreate is heavy; instead update name which preserves the env
          // then the variables table would need its own endpoints.
          // For now: persist locally; a future VariablesAPI endpoint can be added.
          // The backend environment CRUD already saves variables on create.
          // Best approach here: delete the old environment + create a new one with same name.
          await environmentsApi.delete(id);
          const created = await environmentsApi.create(env.name, vars.map((v) => ({
            key: v.key, value: v.value, enabled: v.enabled,
          })));
          const mapped = mapBackendEnvironment(created);
          set((s) => ({
            environments: s.environments.map((e) => (e.id === id ? mapped : e)),
            selectedId: s.selectedId === id ? mapped.id : s.selectedId,
          }));
        } catch {
          // If backend sync fails, local state remains
        }
      },

      currentVars: () => {
        const s = get();
        const env = s.environments.find((e) => e.id === s.selectedId);
        if (!env) return {};
        const obj: Record<string, string> = {};
        env.variables.forEach((v) => { if (v.enabled) obj[v.key] = v.value; });
        return obj;
      },
    }),
    // Persist only selectedId so the user's active environment is remembered across refreshes
    { name: 'pm-selected-env', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ selectedId: s.selectedId }) }
  )
);

// ─── Tabs Store (pure UI — no backend, persisted for UX) ─────────────────────

interface TabsState {
  tabs: RequestTab[];
  activeId: string | null;
  openRequest: (req: ApiRequest, ctx?: { collectionId?: string; folderId?: string }) => void;
  newTab: () => void;
  closeTab: (id: string) => void;
  closeAll: () => void;
  setActive: (id: string) => void;
  updateTab: (id: string, patch: Partial<RequestTab>) => void;
  markClean: (id: string) => void;
  setResponse: (id: string, response: ApiResponse | null) => void;
  setLoading: (id: string, loading: boolean) => void;
  duplicateTab: (id: string) => void;
}

export const useTabsStore = create<TabsState>()((set, get) => ({
  tabs: [],
  activeId: null,

  openRequest: (req, ctx) => {
    const existing = get().tabs.find((t) => t.id === req.id);
    if (existing) { set({ activeId: existing.id }); return; }
    const tab: RequestTab = { ...req, dirty: false, response: null, loading: false, collectionId: ctx?.collectionId, folderId: ctx?.folderId };
    set((s) => ({ tabs: [...s.tabs, tab], activeId: tab.id }));
  },

  newTab: () => {
    const tab: RequestTab = { ...newRequest({ name: 'New Request' }), dirty: true, response: null, loading: false };
    set((s) => ({ tabs: [...s.tabs, tab], activeId: tab.id }));
  },

  closeTab: (id) => {
    const { tabs, activeId } = get();
    const idx = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    let nextActive: string | null = activeId;
    if (activeId === id) {
      nextActive = next[idx]?.id ?? next[idx - 1]?.id ?? next[0]?.id ?? null;
    }
    set({ tabs: next, activeId: nextActive });
  },

  closeAll: () => set({ tabs: [], activeId: null }),
  setActive: (id) => set({ activeId: id }),

  updateTab: (id, patch) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id ? { ...t, ...patch, dirty: patch.dirty !== undefined ? patch.dirty : true } : t
      ),
    })),

  markClean: (id) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, dirty: false } : t)) })),

  setResponse: (id, response) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, response, loading: false } : t)) })),

  setLoading: (id, loading) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, loading } : t)) })),

  duplicateTab: (id) => {
    const tab = get().tabs.find((t) => t.id === id);
    if (!tab) return;
    const copy: RequestTab = { ...tab, id: uuid(), name: `${tab.name} (copy)`, dirty: true, response: null };
    set((s) => ({ tabs: [...s.tabs, copy], activeId: copy.id }));
  },
}));

// ─── Settings Store (lightweight UI prefs, persisted) ────────────────────────

interface SettingsState {
  workspace: string;
  sendOnEnter: boolean;
  wrapLines: boolean;
  setSetting: <K extends keyof Omit<SettingsState, 'setSetting'>>(key: K, value: SettingsState[K]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      workspace: 'My Workspace',
      sendOnEnter: true,
      wrapLines: true,
      setSetting: (k, v) => set({ [k]: v } as Partial<SettingsState>),
    }),
    { name: 'pm-settings', storage: createJSONStorage(() => localStorage) }
  )
);
