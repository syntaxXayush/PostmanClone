'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEnvironmentsStore } from '@/store';
import KeyValueTable from '../KeyValueTable';
import type { Environment, EnvironmentVariable, KeyValueRow } from '@/types';
import { toast } from 'sonner';

interface Props { 
  open: boolean; 
  onOpenChange: (v: boolean) => void;
  environment: Environment | null;
}

export default function EditEnvironmentModal({ open, onOpenChange, environment }: Props) {
  const [rows, setRows] = useState<KeyValueRow[]>([]);
  const setVariables = useEnvironmentsStore((s) => s.setVariables);

  useEffect(() => {
    if (open && environment) {
      // Map EnvironmentVariable to KeyValueRow for the table
      const initialRows: KeyValueRow[] = environment.variables.map(v => ({
        id: v.id,
        key: v.key,
        value: v.value,
        enabled: v.enabled,
        description: ''
      }));
      setRows(initialRows.length ? initialRows : [{ id: 'empty', key: '', value: '', enabled: true }]);
    }
  }, [open, environment]);

  const submit = async () => {
    if (!environment) return;
    
    // Map back to EnvironmentVariable
    const vars: EnvironmentVariable[] = rows
      .filter(r => r.key.trim() !== '')
      .map(r => ({
        id: r.id,
        key: r.key,
        value: r.value,
        enabled: r.enabled
      }));
      
    try {
      await setVariables(environment.id, vars);
      toast.success(`Variables saved for ${environment.name}`);
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed to save variables');
    }
  };

  if (!environment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Environment: {environment.name}</DialogTitle>
          <DialogDescription>Add or modify variables for this environment.</DialogDescription>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <KeyValueTable 
            rows={rows} 
            onChange={setRows} 
            placeholderKey="Variable Name" 
            placeholderValue="Initial Value"
            showDescription={false}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-orange-500 hover:bg-orange-600 text-white">Save Variables</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
