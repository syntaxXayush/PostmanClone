'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCollectionsStore } from '@/store';
import { toast } from 'sonner';

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function NewCollectionModal({ open, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const addCollection = useCollectionsStore((s) => s.addCollection);
  const submit = async () => {
    if (!name.trim()) return;
    await addCollection(name.trim());
    setName('');
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new collection</DialogTitle>
          <DialogDescription>Organize related requests into a collection.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">Collection name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Payments API" autoFocus onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-orange-500 hover:bg-orange-600 text-white">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
