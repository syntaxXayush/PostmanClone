'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEnvironmentsStore } from '@/store';
import { toast } from 'sonner';

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function NewEnvironmentModal({ open, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const addEnvironment = useEnvironmentsStore((s) => s.addEnvironment);
  const submit = () => {
    if (!name.trim()) return;
    addEnvironment(name.trim());
    toast.success(`Environment "${name}" created`);
    setName('');
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new environment</DialogTitle>
          <DialogDescription>Environments store variables you can reuse across requests.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">Environment name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Staging" autoFocus onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-orange-500 hover:bg-orange-600 text-white">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
