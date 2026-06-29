'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X, Circle } from 'lucide-react';
import { useTabsStore } from '@/store';
import { METHOD_COLORS } from '@/lib/seed/mockData';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function RequestTabs() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const setActive = useTabsStore((s) => s.setActive);
  const closeTab = useTabsStore((s) => s.closeTab);
  const newTab = useTabsStore((s) => s.newTab);

  return (
    <div className="h-9 flex items-stretch border-b border-border bg-card/30">
      <ScrollArea className="flex-1">
        <div className="flex h-9 items-stretch">
          <AnimatePresence initial={false}>
            {tabs.map((t) => {
              const active = activeId === t.id;
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => setActive(t.id)}
                  className={cn(
                    'group relative flex items-center gap-2 pl-3 pr-1 border-r border-border cursor-pointer min-w-[180px] max-w-[240px] text-[12px]',
                    active
                      ? 'bg-background text-foreground'
                      : 'bg-card/40 hover:bg-muted/40 text-muted-foreground'
                  )}
                >
                  {active && <span className="absolute top-0 left-0 right-0 h-[2px] bg-orange-500" />}
                  <span className={cn('font-bold text-[10px] shrink-0', METHOD_COLORS[t.method])}>{t.method}</span>
                  <span className="truncate flex-1">{t.name || 'Untitled'}</span>
                  {t.dirty && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Circle className="w-2 h-2 fill-current text-orange-500 shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Unsaved changes</TooltipContent>
                    </Tooltip>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5 transition-opacity"
                    aria-label="Close tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none shrink-0 text-muted-foreground hover:text-foreground"
                onClick={newTab}
                aria-label="New tab"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">New Request <span className="opacity-60 ml-1">⌘ T</span></TooltipContent>
          </Tooltip>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
