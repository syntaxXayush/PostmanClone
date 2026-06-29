'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollectionsStore } from '@/store';
import type { ApiRequest } from '@/types';
import { Layers, Folder } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: ApiRequest;
  onSaved: (info: { name: string; collectionId: string; folderId?: string }) => void;
}

export default function SaveRequestDialog({ open, onOpenChange, request, onSaved }: Props) {
  const collections = useCollectionsStore((s) => s.collections);
  const addRequestToCollection = useCollectionsStore((s) => s.addRequestToCollection);
  const [name, setName] = useState(request.name);
  const [target, setTarget] = useState<string>('');

  useEffect(() => {
    if (open) {
      setName(request.name);
      const first = collections[0];
      setTarget(first ? `c:${first.id}` : '');
    }
  }, [open, request.name, collections]);

  const submit = () => {
    if (!name.trim() || !target) return;
    const [scope, ...rest] = target.split(':');
    const id = rest.join(':');
    if (scope === 'c') {
      addRequestToCollection(id, { ...request, name: name.trim() });
      onSaved({ name: name.trim(), collectionId: id });
      toast.success(`Saved to collection`);
    } else if (scope === 'f') {
      const [collectionId, folderId] = id.split('|');
      addRequestToCollection(collectionId, { ...request, name: name.trim() }, folderId);
      onSaved({ name: name.trim(), collectionId, folderId });
      toast.success(`Saved to folder`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Request</DialogTitle>
          <DialogDescription>Save the current request to a collection or folder.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Request name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Save to</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue placeholder="Choose a collection" /></SelectTrigger>
              <SelectContent>
                {collections.map((c) => (
                  <div key={c.id}>
                    <SelectItem value={`c:${c.id}`}>
                      <span className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-orange-500" /> {c.name}
                      </span>
                    </SelectItem>
                    {c.folders.map((f) => (
                      <SelectItem key={f.id} value={`f:${c.id}|${f.id}`}>
                        <span className="flex items-center gap-2 pl-3">
                          <Folder className="w-3.5 h-3.5 text-amber-500" /> {c.name} / {f.name}
                        </span>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-orange-500 hover:bg-orange-600 text-white">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
