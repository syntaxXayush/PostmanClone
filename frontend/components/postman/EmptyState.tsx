'use client';
import { motion } from 'framer-motion';
import { Rocket, Users, FileText, Server, Activity, GitMerge, Plus, Layers, Globe, History as HistoryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props { onNew: () => void }

const features = [
  { icon: Users, title: 'Team Workspaces', desc: 'Collaborate on collections in real time.' },
  { icon: FileText, title: 'Documentation', desc: 'Auto-generate beautiful API docs.' },
  { icon: Server, title: 'Mock Servers', desc: 'Spin up a mock server in seconds.' },
  { icon: Activity, title: 'Monitors', desc: 'Schedule and monitor request health.' },
  { icon: GitMerge, title: 'Collaboration', desc: 'Comment, review, version your APIs.' },
];

const quick = [
  { icon: Plus, label: 'New Request', shortcut: '⌘T' },
  { icon: Layers, label: 'New Collection' },
  { icon: Globe, label: 'New Environment' },
  { icon: HistoryIcon, label: 'Open History' },
];

export default function EmptyState({ onNew }: Props) {
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg mb-4">
            <Rocket className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">Build, test, and document your APIs</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            A Postman-style workspace for crafting requests, running collections and inspecting responses.
          </p>
          <Button onClick={onNew} className="mt-5 bg-orange-500 hover:bg-orange-600 text-white shadow gap-1.5">
            <Plus className="w-4 h-4" /> New Request
          </Button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          {quick.map((q, i) => (
            <motion.button
              key={q.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              onClick={q.label === 'New Request' ? onNew : undefined}
              className="border border-border rounded-lg p-3 bg-card/30 hover:bg-card/70 hover:border-orange-500/40 transition-all text-left flex items-center gap-2 group"
            >
              <q.icon className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm flex-1">{q.label}</span>
              {q.shortcut && <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">{q.shortcut}</kbd>}
            </motion.button>
          ))}
        </div>

        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">Coming Soon</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="border border-border rounded-lg p-4 bg-card/30 hover:bg-card/60 hover:border-border transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-muted/60 flex items-center justify-center">
                  <it.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{it.title}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">Soon</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{it.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
