'use client';

import { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import MonacoEditor from './MonacoBody';
import { Inbox, Clock, HardDrive, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import type { RequestTab } from '@/types';

interface Props {
  tab: RequestTab;
}

const RESPONSE_TABS = ['pretty', 'raw', 'preview', 'headers', 'cookies', 'tests', 'console'] as const;

function StatusBadge({ status, statusText }: { status: number; statusText: string }) {
  const color =
    status >= 200 && status < 300
      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
      : status >= 300 && status < 400
        ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
        : status >= 400
          ? 'text-red-500 bg-red-500/10 border-red-500/30'
          : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
  return (
    <span className={cn('px-2 py-0.5 rounded text-[11px] font-semibold border tabular-nums', color)}>
      {status} {statusText}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-9 border-b border-border flex items-center px-3 gap-3 shrink-0">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-14 ml-auto" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        <div className="text-sm">Sending request...</div>
        <div className="w-48 space-y-2">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-3/4" />
          <Skeleton className="h-2 w-5/6" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col h-full items-center justify-center text-muted-foreground gap-3 p-6">
      <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center">
        <Inbox className="w-7 h-7 opacity-50" />
      </div>
      <div className="text-sm font-medium">
        Click <span className="text-orange-500">Send</span> to get a response
      </div>
      <div className="text-xs opacity-70 max-w-xs text-center">
        Responses will appear in this panel. Try a URL like{' '}
        <code className="text-[11px] bg-muted px-1 py-0.5 rounded">https://jsonplaceholder.typicode.com/users</code>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-3 p-6">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <div className="text-sm font-medium text-red-500">Request failed</div>
      <div className="text-xs text-muted-foreground max-w-sm text-center">{message}</div>
    </div>
  );
}

export default function ResponseViewer({ tab }: Props) {
  const [subTab, setSubTab] = useState<string>('pretty');
  const res = tab?.response;

  const prettyBody = useMemo(() => {
    if (!res) return '';
    try {
      return typeof res.body === 'string' ? res.body : JSON.stringify(res.body, null, 2);
    } catch {
      return String(res.body);
    }
  }, [res]);

  if (tab?.loading) return <LoadingState />;
  if (!res) return <EmptyState />;
  if (res.error) return <ErrorState message={res.message ?? 'An unknown error occurred'} />;

  const sizeKb = (res.size / 1024).toFixed(2);

  return (
    <div className="flex flex-col h-full bg-background">
      <Tabs value={subTab} onValueChange={setSubTab} className="flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between border-b border-border px-2 shrink-0">
          <TabsList className="h-9 rounded-none bg-transparent gap-0">
            {RESPONSE_TABS.map((k) => (
              <TabsTrigger
                key={k}
                value={k}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none h-9 px-3 text-xs capitalize text-muted-foreground data-[state=active]:text-foreground transition-colors"
              >
                {k}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-3 text-xs pr-2 shrink-0">
            <StatusBadge status={res.status} statusText={res.statusText} />
            <span className="flex items-center gap-1 text-emerald-500 tabular-nums">
              <Clock className="w-3 h-3" /> {res.time} ms
            </span>
            <span className="flex items-center gap-1 text-sky-500 tabular-nums">
              <HardDrive className="w-3 h-3" /> {sizeKb} KB
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <TabsContent value="pretty" className="h-full m-0">
            <MonacoEditor language="json" value={prettyBody} readOnly />
          </TabsContent>
          <TabsContent value="raw" className="h-full m-0">
            <ScrollArea className="h-full">
              <pre className="text-xs font-mono p-3 whitespace-pre-wrap break-all">{prettyBody}</pre>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="preview" className="h-full m-0 p-3 overflow-auto">
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground border border-dashed border-border rounded-md">
              <WifiOff className="w-8 h-8 opacity-40 mb-2" />
              <div className="text-xs">Preview is only available for HTML responses.</div>
            </div>
          </TabsContent>
          <TabsContent value="headers" className="h-full m-0">
            <ScrollArea className="h-full">
              {Object.keys(res.headers || {}).length === 0 ? (
                <div className="text-xs text-muted-foreground p-6 text-center">No headers in response.</div>
              ) : (
                <div className="divide-y divide-border">
                  {Object.entries(res.headers || {}).map(([k, v]) => (
                    <div
                      key={k}
                      className="grid grid-cols-[200px_1fr] text-xs p-2 hover:bg-muted/40 transition-colors"
                    >
                      <span className="font-medium text-muted-foreground">{k}</span>
                      <span className="font-mono break-all">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="cookies" className="h-full m-0 p-3 overflow-auto">
            {res.cookies && res.cookies.length ? (
              <div className="space-y-2">
                {res.cookies.map((c, i) => (
                  <div key={i} className="text-xs border border-border rounded p-2">
                    <span className="font-medium">{c.name}</span> = {c.value}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
                No cookies received with this response.
              </div>
            )}
          </TabsContent>
          <TabsContent value="tests" className="h-full m-0 p-3 overflow-auto">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 border">PASS</Badge>
                <span>
                  Status code is {res.status >= 200 && res.status < 300 ? '2xx' : res.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge
                  className={cn(
                    'border',
                    res.time < 1000
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  )}
                >
                  {res.time < 1000 ? 'PASS' : 'WARN'}
                </Badge>
                <span>Response time is less than 1000ms ({res.time}ms)</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="console" className="h-full m-0 p-3 overflow-auto">
            <pre className="text-xs font-mono text-muted-foreground leading-relaxed">
              {`[info] Request sent at ${new Date().toISOString()}\n[info] Mock backend responded with ${res.status} ${res.statusText} in ${res.time}ms\n[info] ${Object.keys(res.headers || {}).length} response headers`}
            </pre>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
