'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Send, Save, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { METHODS, METHOD_COLORS } from '@/lib/seed/mockData';
import KeyValueTable from './KeyValueTable';
import MonacoEditor from './MonacoBody';
import SaveRequestDialog from './modals/SaveRequestDialog';
import { useTabsStore, useEnvironmentsStore, useHistoryStore, useSettingsStore } from '@/store';
import { requestService, resolveVars } from '@/services/api/requestService';
import { toast } from 'sonner';
import type { BodyMode, HttpMethod, RawBodyType, RequestTab } from '@/types';

interface Props {
  tab: RequestTab;
}

const SUB_TABS = ['params', 'authorization', 'headers', 'body', 'scripts', 'tests', 'settings'] as const;

export default function RequestBuilder({ tab }: Props) {
  const updateTab = useTabsStore((s) => s.updateTab);
  const setLoading = useTabsStore((s) => s.setLoading);
  const setResponse = useTabsStore((s) => s.setResponse);
  const markClean = useTabsStore((s) => s.markClean);
  const currentVars = useEnvironmentsStore((s) => s.currentVars);
  const selectedEnvId = useEnvironmentsStore((s) => s.selectedId);
  const addHistory = useHistoryStore((s) => s.addHistory);
  const sendOnEnter = useSettingsStore((s) => s.sendOnEnter);

  const [subTab, setSubTab] = useState<string>('params');
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveAs, setSaveAs] = useState(false);

  const send = useCallback(async () => {
    if (!tab.url) {
      toast.error('Please enter a URL');
      return;
    }
    setLoading(tab.id, true);
    const toastId = toast.loading(`Sending ${tab.method} request...`);
    try {
      const res = await requestService.sendRequest(tab, {}, selectedEnvId);
      setResponse(tab.id, res);
      // Update history list locally — backend already persisted it via the runner
      addHistory({
        method: tab.method,
        url: tab.url,
        status: res.status,
        responseTime: res.time,
        timestamp: new Date().toISOString(),
      });
      if (res.error) {
        toast.error(res.message || 'Request failed', { id: toastId });
      } else {
        toast.success(`${res.status} ${res.statusText} • ${res.time}ms`, { id: toastId });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setResponse(tab.id, {
        error: true,
        message,
        status: 0,
        statusText: 'Error',
        time: 0,
        size: 0,
        headers: {},
        cookies: [],
        body: { error: message },
      });
      toast.error(`Request failed: ${message}`, { id: toastId });
    }
  }, [tab, setLoading, currentVars, selectedEnvId, setResponse, addHistory]);

  const save = useCallback(() => {
    if (tab.collectionId) {
      markClean(tab.id);
      toast.success('Request saved');
    } else {
      setSaveAs(false);
      setSaveOpen(true);
    }
  }, [tab.collectionId, tab.id, markClean]);

  const openSaveAs = useCallback(() => {
    setSaveAs(true);
    setSaveOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      } else if (meta && e.key === 'Enter') {
        e.preventDefault();
        send();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, send]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 p-3 border-b border-border shrink-0">
        <Select
          value={tab.method}
          onValueChange={(v) => updateTab(tab.id, { method: v as HttpMethod })}
        >
          <SelectTrigger className="w-[110px] h-9 font-bold border-border/70">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                <span className={cn('font-bold', METHOD_COLORS[m])}>{m}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={tab.url}
          onChange={(e) => updateTab(tab.id, { url: e.target.value })}
          placeholder="Enter URL or paste text"
          className="h-9 font-mono text-sm flex-1 bg-muted/20 border-border/70 focus-visible:ring-1 focus-visible:ring-orange-500/40"
          onKeyDown={(e) => sendOnEnter && e.key === 'Enter' && send()}
        />
        <Button
          onClick={send}
          disabled={tab.loading}
          className="h-9 px-5 bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
        >
          {tab.loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5 mr-1.5" /> Send
            </>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 gap-1 border-border/70">
              <Save className="w-3.5 h-3.5" /> Save
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={save}>
              <Save className="w-3.5 h-3.5 mr-2" /> Save
              <span className="ml-auto text-[10px] text-muted-foreground">⌘S</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openSaveAs}>
              <Save className="w-3.5 h-3.5 mr-2" /> Save As...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="h-9 rounded-none bg-transparent border-b border-border w-full justify-start gap-0 px-3 shrink-0">
          {SUB_TABS.map((k) => (
            <TabsTrigger
              key={k}
              value={k}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none h-9 px-3 text-xs capitalize text-muted-foreground data-[state=active]:text-foreground transition-colors"
            >
              {k}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 min-h-0 overflow-auto p-3">
          <TabsContent value="params" className="mt-0">
            <p className="text-xs text-muted-foreground mb-2">Query Params</p>
            <KeyValueTable rows={tab.params} onChange={(rows) => updateTab(tab.id, { params: rows })} />
          </TabsContent>

          <TabsContent value="authorization" className="mt-0 space-y-4">
            <div>
              <Label className="text-xs">Type</Label>
              <Select
                value={tab.auth.type}
                onValueChange={(v) =>
                  updateTab(tab.id, { auth: { ...tab.auth, type: v as typeof tab.auth.type } })
                }
              >
                <SelectTrigger className="w-[220px] mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {tab.auth.type === 'bearer' && (
              <div className="max-w-md">
                <Label className="text-xs">Token</Label>
                <Input
                  className="mt-1.5 font-mono"
                  value={tab.auth.bearerToken ?? ''}
                  onChange={(e) =>
                    updateTab(tab.id, { auth: { ...tab.auth, bearerToken: e.target.value } })
                  }
                  placeholder="e.g. eyJhbGciOi..."
                />
              </div>
            )}
            {tab.auth.type === 'basic' && (
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <div>
                  <Label className="text-xs">Username</Label>
                  <Input
                    className="mt-1.5"
                    value={tab.auth.basicUser ?? ''}
                    onChange={(e) =>
                      updateTab(tab.id, { auth: { ...tab.auth, basicUser: e.target.value } })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Password</Label>
                  <Input
                    type="password"
                    className="mt-1.5"
                    value={tab.auth.basicPass ?? ''}
                    onChange={(e) =>
                      updateTab(tab.id, { auth: { ...tab.auth, basicPass: e.target.value } })
                    }
                  />
                </div>
              </div>
            )}
            {tab.auth.type === 'none' && (
              <div className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
                This request does not use any authorization.
              </div>
            )}
          </TabsContent>

          <TabsContent value="headers" className="mt-0">
            <p className="text-xs text-muted-foreground mb-2">Headers</p>
            <KeyValueTable rows={tab.headers} onChange={(rows) => updateTab(tab.id, { headers: rows })} />
          </TabsContent>

          <TabsContent value="body" className="mt-0 space-y-3">
            <RadioGroup
              value={tab.body.mode}
              onValueChange={(v) =>
                updateTab(tab.id, { body: { ...tab.body, mode: v as BodyMode } })
              }
              className="flex flex-wrap gap-4"
            >
              {(['none', 'form-data', 'x-www-form-urlencoded', 'raw'] as BodyMode[]).map((m) => (
                <div key={m} className="flex items-center gap-1.5">
                  <RadioGroupItem value={m} id={`body-${m}`} />
                  <Label htmlFor={`body-${m}`} className="text-xs cursor-pointer">
                    {m}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {tab.body.mode === 'raw' && (
              <>
                <Select
                  value={tab.body.rawType}
                  onValueChange={(v) =>
                    updateTab(tab.id, { body: { ...tab.body, rawType: v as RawBodyType } })
                  }
                >
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
                <div className="h-[260px] border border-border rounded-md overflow-hidden">
                  <MonacoEditor
                    language={tab.body.rawType === 'json' ? 'json' : tab.body.rawType}
                    value={tab.body.raw || ''}
                    onChange={(v) => updateTab(tab.id, { body: { ...tab.body, raw: v } })}
                  />
                </div>
              </>
            )}
            {tab.body.mode === 'form-data' && (
              <KeyValueTable
                rows={tab.body.formData}
                onChange={(rows) => updateTab(tab.id, { body: { ...tab.body, formData: rows } })}
              />
            )}
            {tab.body.mode === 'x-www-form-urlencoded' && (
              <KeyValueTable
                rows={tab.body.urlencoded}
                onChange={(rows) => updateTab(tab.id, { body: { ...tab.body, urlencoded: rows } })}
              />
            )}
            {tab.body.mode === 'none' && (
              <div className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
                This request does not have a body.
              </div>
            )}
          </TabsContent>

          <TabsContent value="scripts" className="mt-0">
            <p className="text-xs text-muted-foreground mb-2">
              Pre-request Script (runs before the request is sent)
            </p>
            <div className="h-[260px] border border-border rounded-md overflow-hidden">
              <MonacoEditor
                language="javascript"
                value={tab.scripts || ''}
                onChange={(v) => updateTab(tab.id, { scripts: v })}
              />
            </div>
          </TabsContent>

          <TabsContent value="tests" className="mt-0">
            <p className="text-xs text-muted-foreground mb-2">Tests (run after response is received)</p>
            <div className="h-[260px] border border-border rounded-md overflow-hidden">
              <MonacoEditor
                language="javascript"
                value={tab.tests || ''}
                onChange={(v) => updateTab(tab.id, { tests: v })}
              />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0 space-y-4 max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Follow redirects</Label>
                <p className="text-xs text-muted-foreground">Auto-follow 3xx redirects.</p>
              </div>
            </div>
            <div>
              <Label className="text-xs">Request timeout (ms)</Label>
              <Input
                type="number"
                className="mt-1.5"
                value={tab.settings.timeout}
                onChange={(e) =>
                  updateTab(tab.id, {
                    settings: { ...tab.settings, timeout: +e.target.value },
                  })
                }
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <SaveRequestDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        request={tab}
        onSaved={({ name, collectionId, folderId }) => {
          updateTab(tab.id, { name, collectionId, folderId, dirty: false });
          if (!saveAs) toast.success('Request saved');
        }}
      />
    </div>
  );
}
