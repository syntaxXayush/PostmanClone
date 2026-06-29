'use client';
import type { KeyValueRow } from '@/types';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { Button } from '@/components/ui/button';

interface Props {
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
  placeholderKey?: string;
  placeholderValue?: string;
  showDescription?: boolean;
}

const emptyRow = (): KeyValueRow => ({ id: uuid(), key: '', value: '', description: '', enabled: true });

export default function KeyValueTable({
  rows,
  onChange,
  placeholderKey = 'Key',
  placeholderValue = 'Value',
  showDescription = true,
}: Props) {
  const update = (id: string, patch: Partial<KeyValueRow>) => {
    let next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    if (next.length === 0 || (next[next.length - 1].key || next[next.length - 1].value)) {
      next = [...next, emptyRow()];
    }
    onChange(next);
  };
  const remove = (id: string) => {
    let next = rows.filter((r) => r.id !== id);
    if (next.length === 0) next = [emptyRow()];
    onChange(next);
  };
  const addRow = () => onChange([...rows, emptyRow()]);

  return (
    <div className="border border-border rounded-md overflow-hidden bg-background">
      <div className="grid grid-cols-[28px_36px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_36px] bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
        <div className="p-2" />
        <div className="p-2" />
        <div className="p-2">{placeholderKey}</div>
        <div className="p-2">{placeholderValue}</div>
        {showDescription ? <div className="p-2">Description</div> : <div className="p-2" />}
        <div className="p-2" />
      </div>
      {rows.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-[28px_36px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_36px] border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors group"
        >
          <div className="flex items-center justify-center text-muted-foreground/40 group-hover:text-muted-foreground transition-colors cursor-grab">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center justify-center">
            <Checkbox checked={r.enabled} onCheckedChange={(v) => update(r.id, { enabled: !!v })} />
          </div>
          <Input
            value={r.key}
            onChange={(e) => update(r.id, { key: e.target.value })}
            placeholder={placeholderKey}
            className="border-0 rounded-none h-8 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[13px]"
          />
          <Input
            value={r.value}
            onChange={(e) => update(r.id, { value: e.target.value })}
            placeholder={placeholderValue}
            className="border-0 rounded-none h-8 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[13px] border-l border-border/60"
          />
          {showDescription ? (
            <Input
              value={r.description ?? ''}
              onChange={(e) => update(r.id, { description: e.target.value })}
              placeholder="Description"
              className="border-0 rounded-none h-8 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[13px] border-l border-border/60"
            />
          ) : (
            <div />
          )}
          <button
            onClick={() => remove(r.id)}
            className="flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove row"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="p-1.5 bg-muted/20">
        <Button variant="ghost" size="sm" onClick={addRow} className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
          <Plus className="w-3 h-3" /> Add row
        </Button>
      </div>
    </div>
  );
}
