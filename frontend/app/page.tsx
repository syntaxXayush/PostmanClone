'use client';

import { useEffect, useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TopNav from '@/components/postman/TopNav';
import Sidebar from '@/components/postman/Sidebar';
import RequestTabs from '@/components/postman/RequestTabs';
import RequestBuilder from '@/components/postman/RequestBuilder';
import ResponseViewer from '@/components/postman/ResponseViewer';
import EmptyState from '@/components/postman/EmptyState';
import SettingsModal from '@/components/postman/modals/SettingsModal';
import { useTabsStore } from '@/store';

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const newTab = useTabsStore((s) => s.newTab);
  const activeTab = tabs.find((t) => t.id === activeId) ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcuts (placeholders): Cmd/Ctrl+T new tab, Cmd/Ctrl+, settings
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 't') {
        e.preventDefault();
        newTab();
      } else if (meta && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [newTab]);

  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col">
        <div className="h-11 border-b border-border bg-card/60 animate-pulse" />
        <div className="flex-1 flex">
          <div className="w-[240px] border-r border-border bg-card/30 animate-pulse" />
          <div className="flex-1 bg-muted/10 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground select-none">
      <TopNav onOpenSettings={() => setSettingsOpen(true)} />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={20} minSize={14} maxSize={35} className="min-w-[240px]">
          <Sidebar />
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border hover:bg-orange-500/40 transition-colors" />
        <ResizablePanel defaultSize={80} minSize={50}>
          <div className="flex flex-col h-full">
            <RequestTabs />
            {activeTab ? (
              <ResizablePanelGroup direction="vertical" className="flex-1">
                <ResizablePanel defaultSize={55} minSize={20}>
                  <RequestBuilder tab={activeTab} />
                </ResizablePanel>
                <ResizableHandle className="h-px bg-border hover:bg-orange-500/40 transition-colors" />
                <ResizablePanel defaultSize={45} minSize={20}>
                  <ResponseViewer tab={activeTab} />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <EmptyState onNew={newTab} />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Status bar */}
      <div className="h-6 border-t border-border bg-card/50 flex items-center px-3 text-[11px] text-muted-foreground gap-4 shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Connected to mock service
        </span>
        <span className="ml-auto">Postman Clone v1.0.0</span>
      </div>
    </div>
  );
}
