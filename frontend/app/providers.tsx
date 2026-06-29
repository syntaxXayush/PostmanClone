'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useCollectionsStore, useEnvironmentsStore, useHistoryStore } from '@/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false },
  },
});

// Loads all remote data once on app boot
function DataInitializer() {
  const loadCollections = useCollectionsStore((s) => s.loadCollections);
  const loadEnvironments = useEnvironmentsStore((s) => s.loadEnvironments);
  const loadHistory = useHistoryStore((s) => s.loadHistory);

  useEffect(() => {
    loadCollections();
    loadEnvironments();
    loadHistory();
  }, [loadCollections, loadEnvironments, loadHistory]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="pm-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <DataInitializer />
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
