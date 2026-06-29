'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Search,
  History as HistoryIcon,
  Globe,
  Trash2,
  Pencil,
  FolderPlus,
  Layers,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollectionsStore, useHistoryStore, useEnvironmentsStore, useTabsStore } from '@/store';
import { METHOD_COLORS, newRequest } from '@/lib/seed/mockData';
import NewCollectionModal from './modals/NewCollectionModal';
import NewEnvironmentModal from './modals/NewEnvironmentModal';
import EditEnvironmentModal from './modals/EditEnvironmentModal';
import PromptDialog from './modals/PromptDialog';
import ConfirmDialog from './modals/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { ApiRequest, Collection, Environment } from '@/types';

type SidebarView = 'collections' | 'history' | 'env';

interface SidebarTabProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

function SidebarTab({ active, onClick, icon: Icon, label }: SidebarTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 h-9 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors',
        active
          ? 'border-orange-500 text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
      )}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

interface RequestItemProps {
  request: ApiRequest;
  collectionId: string;
  folderId?: string;
  onOpen: (req: ApiRequest, ctx: { collectionId: string; folderId?: string }) => void;
  onRename: (ctx: { collectionId: string; folderId?: string; request: ApiRequest }) => void;
  onDelete: (ctx: { collectionId: string; folderId?: string; request: ApiRequest }) => void;
}

function RequestItem({ request, collectionId, folderId, onOpen, onRename, onDelete }: RequestItemProps) {
  const ctx = { collectionId, folderId, request };
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={() => onOpen(request, { collectionId, folderId })}
          className="w-full flex items-center gap-2 px-2 py-1 text-xs hover:bg-muted/60 rounded text-left group transition-colors"
        >
          <span className={cn('font-bold text-[10px] w-10 shrink-0', METHOD_COLORS[request.method])}>
            {request.method}
          </span>
          <span className="truncate flex-1">{request.name}</span>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onOpen(request, { collectionId, folderId })}>
          <FileText className="w-3.5 h-3.5 mr-2" /> Open
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onRename(ctx)}>
          <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive" onClick={() => onDelete(ctx)}>
          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface FolderRowProps {
  folder: Collection['folders'][number];
  collectionId: string;
  onOpenRequest: (req: ApiRequest, ctx: { collectionId: string; folderId?: string }) => void;
  onRenameRequest: RequestItemProps['onRename'];
  onDeleteRequest: RequestItemProps['onDelete'];
}

function FolderRow({ folder, collectionId, onOpenRequest, onRenameRequest, onDeleteRequest }: FolderRowProps) {
  const toggleFolder = useCollectionsStore((s) => s.toggleFolder);
  return (
    <div>
      <button
        onClick={() => toggleFolder(collectionId, folder.id)}
        className="w-full flex items-center gap-1 px-2 py-1 text-xs hover:bg-muted/60 rounded transition-colors"
      >
        {folder.expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {folder.expanded ? (
          <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
        ) : (
          <Folder className="w-3.5 h-3.5 text-amber-500" />
        )}
        <span className="truncate">{folder.name}</span>
        <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{folder.requests.length}</span>
      </button>
      <AnimatePresence initial={false}>
        {folder.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="ml-4 overflow-hidden"
          >
            {folder.requests.map((r) => (
              <RequestItem
                key={r.id}
                request={r}
                collectionId={collectionId}
                folderId={folder.id}
                onOpen={onOpenRequest}
                onRename={onRenameRequest}
                onDelete={onDeleteRequest}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CollectionRowProps {
  collection: Collection;
  onOpenRequest: (req: ApiRequest, ctx: { collectionId: string; folderId?: string }) => void;
  onRename: (col: Collection) => void;
  onDelete: (col: Collection) => void;
  onAddFolder: (col: Collection) => void;
  onAddRequest: (col: Collection) => void;
  onRenameRequest: RequestItemProps['onRename'];
  onDeleteRequest: RequestItemProps['onDelete'];
}

function CollectionRow({
  collection,
  onOpenRequest,
  onRename,
  onDelete,
  onAddFolder,
  onAddRequest,
  onRenameRequest,
  onDeleteRequest,
}: CollectionRowProps) {
  const toggleCollection = useCollectionsStore((s) => s.toggleCollection);
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div>
          <button
            onClick={() => toggleCollection(collection.id)}
            className="w-full flex items-center gap-1 px-2 py-1.5 text-xs hover:bg-muted/60 rounded font-medium transition-colors"
          >
            {collection.expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            <span className="truncate flex-1 text-left">{collection.name}</span>
          </button>
          <AnimatePresence initial={false}>
            {collection.expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="ml-4 overflow-hidden"
              >
                {collection.folders.map((f) => (
                  <FolderRow
                    key={f.id}
                    folder={f}
                    collectionId={collection.id}
                    onOpenRequest={onOpenRequest}
                    onRenameRequest={onRenameRequest}
                    onDeleteRequest={onDeleteRequest}
                  />
                ))}
                {collection.requests.map((r) => (
                  <RequestItem
                    key={r.id}
                    request={r}
                    collectionId={collection.id}
                    onOpen={onOpenRequest}
                    onRename={onRenameRequest}
                    onDelete={onDeleteRequest}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onRename(collection)}>
          <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onAddFolder(collection)}>
          <FolderPlus className="w-3.5 h-3.5 mr-2" /> Add Folder
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onAddRequest(collection)}>
          <FileText className="w-3.5 h-3.5 mr-2" /> Add Request
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive" onClick={() => onDelete(collection)}>
          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface EnvRowProps {
  env: Environment;
  selected: boolean;
  onSelect: () => void;
  onRename: (env: Environment) => void;
  onEdit: (env: Environment) => void;
  onDelete: (env: Environment) => void;
  onDuplicate: (env: Environment) => void;
}

function EnvRow({ env, selected, onSelect, onRename, onEdit, onDelete, onDuplicate }: EnvRowProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={onSelect}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-muted/60 rounded transition-colors',
            selected && 'bg-muted/80 ring-1 ring-orange-500/20'
          )}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-500" />
          <div className="flex-1 text-left min-w-0">
            <div className="truncate">{env.name}</div>
            <div className="text-[10px] text-muted-foreground">{env.variables.length} variables</div>
          </div>
          {selected && (
            <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-wide">Active</span>
          )}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onEdit.bind(null, env)}>
          <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Variables
        </ContextMenuItem>
        <ContextMenuItem onClick={onRename.bind(null, env)}>
          <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={onDuplicate.bind(null, env)}>
          <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive" onClick={() => onDelete(env)}>
          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

type DialogState =
  | { type: 'renameCollection'; id: string; name: string }
  | { type: 'deleteCollection'; id: string; name: string }
  | { type: 'addFolder'; collectionId: string }
  | { type: 'editEnvironment'; env: Environment }
  | { type: 'renameEnvironment'; id: string; name: string }
  | { type: 'deleteEnvironment'; id: string; name: string }
  | { type: 'renameRequest'; collectionId: string; folderId?: string; requestId: string; name: string }
  | { type: 'deleteRequest'; collectionId: string; folderId?: string; requestId: string; name: string }
  | null;

export default function Sidebar() {
  const [tab, setTab] = useState<SidebarView>('collections');
  const [newColOpen, setNewColOpen] = useState(false);
  const [newEnvOpen, setNewEnvOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);

  const collections = useCollectionsStore((s) => s.collections);
  const query = useCollectionsStore((s) => s.query);
  const setQuery = useCollectionsStore((s) => s.setQuery);
  const renameCollection = useCollectionsStore((s) => s.renameCollection);
  const deleteCollection = useCollectionsStore((s) => s.deleteCollection);
  const addFolder = useCollectionsStore((s) => s.addFolder);
  const addRequestToCollection = useCollectionsStore((s) => s.addRequestToCollection);
  const renameRequest = useCollectionsStore((s) => s.renameRequest);
  const deleteRequest = useCollectionsStore((s) => s.deleteRequest);

  const history = useHistoryStore((s) => s.history);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  const environments = useEnvironmentsStore((s) => s.environments);
  const selectedId = useEnvironmentsStore((s) => s.selectedId);
  const setSelected = useEnvironmentsStore((s) => s.setSelected);
  const renameEnvironment = useEnvironmentsStore((s) => s.renameEnvironment);
  const deleteEnvironment = useEnvironmentsStore((s) => s.deleteEnvironment);
  const addEnvironment = useEnvironmentsStore((s) => s.addEnvironment);

  const openRequest = useTabsStore((s) => s.openRequest);

  const filteredCollections = collections
    .map((c) => {
      if (!query) return c;
      const q = query.toLowerCase();
      return {
        ...c,
        folders: c.folders
          .map((f) => ({
            ...f,
            requests: f.requests.filter(
              (r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q)
            ),
          }))
          .filter((f) => f.requests.length > 0),
        requests: c.requests.filter(
          (r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q)
        ),
      };
    })
    .filter(
      (c) =>
        !query ||
        c.folders.length > 0 ||
        c.requests.length > 0 ||
        c.name.toLowerCase().includes(query.toLowerCase())
    );

  const handlePromptSubmit = (value: string) => {
    if (!dialog) return;
    switch (dialog.type) {
      case 'renameCollection':
        renameCollection(dialog.id, value);
        toast.success('Collection renamed');
        break;
      case 'addFolder':
        addFolder(dialog.collectionId, value);
        toast.success('Folder created');
        break;
      case 'renameEnvironment':
        renameEnvironment(dialog.id, value);
        toast.success('Environment renamed');
        break;
      case 'renameRequest':
        renameRequest(dialog.collectionId, dialog.requestId, value, dialog.folderId);
        toast.success('Request renamed');
        break;
    }
    setDialog(null);
  };

  const handleConfirm = () => {
    if (!dialog) return;
    switch (dialog.type) {
      case 'deleteCollection':
        deleteCollection(dialog.id);
        toast.success('Collection deleted');
        break;
      case 'deleteEnvironment':
        deleteEnvironment(dialog.id);
        toast.success('Environment deleted');
        break;
      case 'deleteRequest':
        deleteRequest(dialog.collectionId, dialog.requestId, dialog.folderId);
        toast.success('Request deleted');
        break;
    }
    setDialog(null);
  };

  const promptOpen =
    dialog?.type === 'renameCollection' ||
    dialog?.type === 'addFolder' ||
    dialog?.type === 'renameEnvironment' ||
    dialog?.type === 'renameRequest';

  const confirmOpen =
    dialog?.type === 'deleteCollection' ||
    dialog?.type === 'deleteEnvironment' ||
    dialog?.type === 'deleteRequest';

  return (
    <div className="flex flex-col h-full bg-card/30">
      <div className="flex border-b border-border shrink-0">
        <SidebarTab active={tab === 'collections'} onClick={() => setTab('collections')} icon={Layers} label="Collections" />
        <SidebarTab active={tab === 'history'} onClick={() => setTab('history')} icon={HistoryIcon} label="History" />
        <SidebarTab active={tab === 'env'} onClick={() => setTab('env')} icon={Globe} label="Environments" />
      </div>

      {tab === 'collections' && (
        <>
          <div className="p-2 flex gap-1.5 items-center border-b border-border shrink-0">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter collections"
                className="h-7 pl-7 text-xs bg-muted/30 border-border/60 focus-visible:ring-1 focus-visible:ring-orange-500/40"
              />
            </div>
            <Button size="icon" variant="outline" className="h-7 w-7 shrink-0" onClick={() => setNewColOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {filteredCollections.length === 0 && (
                <div className="flex flex-col items-center text-center py-10 px-4">
                  <Layers className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {query ? 'No collections match your filter.' : 'No collections yet.'}
                  </p>
                  {!query && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 h-7 text-xs"
                      onClick={() => setNewColOpen(true)}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Create collection
                    </Button>
                  )}
                </div>
              )}
              {filteredCollections.map((c) => (
                <CollectionRow
                  key={c.id}
                  collection={c}
                  onOpenRequest={openRequest}
                  onRename={(col) => setDialog({ type: 'renameCollection', id: col.id, name: col.name })}
                  onDelete={(col) => setDialog({ type: 'deleteCollection', id: col.id, name: col.name })}
                  onAddFolder={(col) => setDialog({ type: 'addFolder', collectionId: col.id })}
                  onAddRequest={(col) => {
                    const req = newRequest({ name: 'New Request' });
                    addRequestToCollection(col.id, req);
                    openRequest(req, { collectionId: col.id });
                    toast.success('Request added to collection');
                  }}
                  onRenameRequest={({ collectionId, folderId, request }) =>
                    setDialog({
                      type: 'renameRequest',
                      collectionId,
                      folderId,
                      requestId: request.id,
                      name: request.name,
                    })
                  }
                  onDeleteRequest={({ collectionId, folderId, request }) =>
                    setDialog({
                      type: 'deleteRequest',
                      collectionId,
                      folderId,
                      requestId: request.id,
                      name: request.name,
                    })
                  }
                />
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {tab === 'history' && (
        <>
          {history.length > 0 && (
            <div className="px-2 py-1.5 border-b border-border flex justify-end shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-muted-foreground hover:text-destructive"
                onClick={() => {
                  clearHistory();
                  toast.success('History cleared');
                }}
              >
                Clear all
              </Button>
            </div>
          )}
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {history.length === 0 ? (
                <div className="flex flex-col items-center text-center py-10 px-4">
                  <HistoryIcon className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">Your request history will appear here.</p>
                </div>
              ) : (
                history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() =>
                      openRequest(
                        newRequest({
                          name: h.url.split('/').pop() || h.url,
                          method: h.method,
                          url: h.url,
                        })
                      )
                    }
                    className="w-full flex items-start gap-2 px-2 py-1.5 text-xs hover:bg-muted/60 rounded text-left transition-colors"
                  >
                    <span className={cn('font-bold text-[10px] w-10 shrink-0 mt-0.5', METHOD_COLORS[h.method])}>
                      {h.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{h.url}</div>
                      <div className="text-[10px] text-muted-foreground flex gap-2 mt-0.5">
                        <span className={h.status >= 400 ? 'text-red-500' : 'text-emerald-500'}>{h.status}</span>
                        <span>{h.responseTime}ms</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </>
      )}

      {tab === 'env' && (
        <>
          <div className="p-2 flex gap-1.5 items-center border-b border-border shrink-0">
            <span className="text-xs text-muted-foreground flex-1">Manage environments</span>
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setNewEnvOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {environments.length === 0 ? (
                <div className="flex flex-col items-center text-center py-10 px-4">
                  <Globe className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">No environments yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-7 text-xs"
                    onClick={() => setNewEnvOpen(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Create environment
                  </Button>
                </div>
              ) : (
                environments.map((e) => (
                  <EnvRow
                    key={e.id}
                    env={e}
                    selected={selectedId === e.id}
                    onSelect={() => setSelected(e.id)}
                    onEdit={(env) => setDialog({ type: 'editEnvironment', env })}
                    onRename={(env) => setDialog({ type: 'renameEnvironment', id: env.id, name: env.name })}
                    onDelete={(env) => setDialog({ type: 'deleteEnvironment', id: env.id, name: env.name })}
                    onDuplicate={(env) => {
                      addEnvironment(`${env.name} (copy)`);
                      toast.success('Environment duplicated');
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </>
      )}

      <NewCollectionModal open={newColOpen} onOpenChange={setNewColOpen} />
      <NewEnvironmentModal open={newEnvOpen} onOpenChange={setNewEnvOpen} />

      <PromptDialog
        open={!!promptOpen}
        onOpenChange={(v) => !v && setDialog(null)}
        title={
          dialog?.type === 'renameCollection'
            ? 'Rename Collection'
            : dialog?.type === 'addFolder'
              ? 'New Folder'
              : dialog?.type === 'renameEnvironment'
                ? 'Rename Environment'
                : 'Rename Request'
        }
        description={
          dialog?.type === 'addFolder'
            ? 'Enter a name for the new folder.'
            : undefined
        }
        label="Name"
        initialValue={
          dialog?.type === 'renameCollection' ||
          dialog?.type === 'renameEnvironment' ||
          dialog?.type === 'renameRequest'
            ? dialog.name
            : ''
        }
        placeholder={
          dialog?.type === 'addFolder' ? 'e.g. Auth endpoints' : 'Enter name'
        }
        confirmLabel={dialog?.type === 'addFolder' ? 'Create' : 'Save'}
        onSubmit={handlePromptSubmit}
      />

      {/* Environment dialogs */}
      <EditEnvironmentModal
        open={dialog?.type === 'editEnvironment'}
        onOpenChange={(v) => !v && setDialog(null)}
        environment={dialog?.type === 'editEnvironment' ? dialog.env : null}
      />

      <ConfirmDialog
        open={!!confirmOpen}
        onOpenChange={(v) => !v && setDialog(null)}
        title={
          dialog?.type === 'deleteCollection'
            ? 'Delete Collection'
            : dialog?.type === 'deleteEnvironment'
              ? 'Delete Environment'
              : 'Delete Request'
        }
        description={
          dialog?.type === 'deleteCollection'
            ? `Are you sure you want to delete "${dialog.name}"? This action cannot be undone.`
            : dialog?.type === 'deleteEnvironment'
              ? `Are you sure you want to delete "${dialog.name}"? Variables in this environment will be lost.`
              : dialog?.type === 'deleteRequest'
                ? `Are you sure you want to delete "${dialog.name}"?`
                : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirm}
      />
    </div>
  );
}
