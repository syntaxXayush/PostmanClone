'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSettingsStore } from '@/store';
import { useTheme } from 'next-themes';

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function SettingsModal({ open, onOpenChange }: Props) {
  const workspace = useSettingsStore((s) => s.workspace);
  const sendOnEnter = useSettingsStore((s) => s.sendOnEnter);
  const wrapLines = useSettingsStore((s) => s.wrapLines);
  const setSetting = useSettingsStore((s) => s.setSetting);
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize the application to your preferences.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general" className="mt-2">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Workspace name</Label>
              <Input value={workspace} onChange={(e) => setSetting('workspace', e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Send on Enter</Label>
                <p className="text-xs text-muted-foreground">Send request when pressing Enter in URL field.</p>
              </div>
              <Switch checked={sendOnEnter} onCheckedChange={(v) => setSetting('sendOnEnter', v)} />
            </div>
          </TabsContent>
          <TabsContent value="appearance" className="space-y-5 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark mode</Label>
                <p className="text-xs text-muted-foreground">Use a dark theme similar to Postman desktop.</p>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')} />
            </div>
          </TabsContent>
          <TabsContent value="editor" className="space-y-5 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Wrap lines</Label>
                <p className="text-xs text-muted-foreground">Wrap long lines in body / response editors.</p>
              </div>
              <Switch checked={wrapLines} onCheckedChange={(v) => setSetting('wrapLines', v)} />
            </div>
          </TabsContent>
          <TabsContent value="shortcuts" className="pt-4">
            <div className="divide-y divide-border text-sm">
              {[
                ['New Request', '⌘ T'],
                ['Settings', '⌘ ,'],
                ['Send Request', '⌘ Enter'],
                ['Save Request', '⌘ S'],
                ['Close Tab', '⌘ W'],
                ['Switch Tab', '⌘ 1–9'],
              ].map(([label, keys]) => (
                <div key={label} className="flex items-center justify-between py-2">
                  <span>{label}</span>
                  <kbd className="text-xs bg-muted px-2 py-0.5 rounded border border-border">{keys}</kbd>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
