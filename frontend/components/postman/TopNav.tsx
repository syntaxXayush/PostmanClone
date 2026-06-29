'use client';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Moon, Sun, Search, Settings, ChevronDown, Globe, Layers, HelpCircle, Bell, Plus,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEnvironmentsStore, useSettingsStore, useTabsStore } from '@/store';

interface Props { onOpenSettings: () => void }

export default function TopNav({ onOpenSettings }: Props) {
  const { theme, setTheme } = useTheme();
  const environments = useEnvironmentsStore((s) => s.environments);
  const selectedId = useEnvironmentsStore((s) => s.selectedId);
  const setSelected = useEnvironmentsStore((s) => s.setSelected);
  const workspace = useSettingsStore((s) => s.workspace);
  const newTab = useTabsStore((s) => s.newTab);
  const selectedEnv = environments.find((e) => e.id === selectedId);

  return (
    <div className="h-11 border-b border-border bg-card/60 backdrop-blur flex items-center px-2 gap-1.5 shrink-0">
      <div className="flex items-center gap-2 pl-1 pr-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-sm">
          <Layers className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-semibold text-[13px] tracking-tight">Postman</span>
      </div>
      <div className="h-5 w-px bg-border" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[13px] font-normal px-2">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            {workspace}
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuItem>{workspace}</DropdownMenuItem>
          <DropdownMenuItem disabled>Team Workspace (Soon)</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>Create Workspace... (Soon)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={newTab} aria-label="New request">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">New request <span className="opacity-60 ml-1">⌘ T</span></TooltipContent>
      </Tooltip>

      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Postman"
            className="h-7 pl-8 pr-16 text-[13px] bg-muted/40 border-border/60 focus-visible:ring-1 focus-visible:ring-orange-500/50"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-[12px] font-normal min-w-[150px] justify-between border-border/70"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                {selectedEnv?.name ?? 'No Environment'}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Environments</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSelected(null)}>
              <Globe className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> No Environment
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {environments.map((e) => (
              <DropdownMenuItem key={e.id} onClick={() => setSelected(e.id)}>
                <Globe className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                <span className="flex-1">{e.name}</span>
                <span className="text-[10px] text-muted-foreground">{e.variables.length} vars</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Notifications">
              <Bell className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Notifications</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Help">
              <HelpCircle className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Help & Resources</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onOpenSettings} aria-label="Settings">
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Settings <span className="opacity-60 ml-1">⌘ ,</span></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="w-3.5 h-3.5 dark:hidden" />
              <Moon className="w-3.5 h-3.5 hidden dark:block" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Toggle theme</TooltipContent>
        </Tooltip>
        <Avatar className="h-6 w-6 ml-1 ring-1 ring-border">
          <AvatarFallback className="text-[9px] bg-orange-500 text-white font-medium">PM</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
