import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload, X, Play, Image as ImageIcon, Video, Loader2,
  Trash2, ChevronLeft, ChevronRight, Lock, Folder, FolderPlus, Plus, Download,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MediaItem {
  id: string;
  organization: string;
  file_url: string;
  file_type: 'image' | 'video';
  title: string | null;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
  folder_id: string | null;
}

interface GalleryFolder {
  id: string;
  organization: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'ALL',  label: 'All',      color: 'bg-slate-500',  light: 'bg-slate-100 text-slate-700' },
  { key: 'UCM',  label: 'UCM',      color: 'bg-orange-500', light: 'bg-orange-100 text-orange-700' },
  { key: 'CWA',  label: 'CWA',      color: 'bg-purple-500', light: 'bg-purple-100 text-purple-700' },
  { key: 'CYAF', label: 'CYAF',     color: 'bg-blue-500',   light: 'bg-blue-100 text-blue-700' },
  { key: 'CYF',  label: 'CYF',      color: 'bg-green-500',  light: 'bg-green-100 text-green-700' },
  { key: 'C',    label: 'Children', color: 'bg-pink-500',   light: 'bg-pink-100 text-pink-700' },
];
const TAB_MAP = Object.fromEntries(TABS.map(t => [t.key, t]));

// ─── Video Thumbnail ──────────────────────────────────────────────────────────
function VideoThumb({ url }: { url: string }) {
  return (
    <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
      <video src={url} className="w-full h-full object-cover opacity-70" preload="metadata" muted />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface GalleryPanelProps {
  canUpload: boolean;
  defaultUploaderName?: string;
  canDelete?: boolean;
  /** The logged-in member's own organization (e.g. 'UCM'). Folder
   *  creation and folder-scoped uploads for an organization's tab are
   *  only offered to members whose own organization matches that tab. */
  memberOrganization?: string | null;
  /** Super admins and editor admins can manage folders for every
   *  organization, not just one matching their own linked member profile
   *  (they may not even have one — admin accounts are separate from
   *  member accounts). */
  isAdminManager?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GalleryPanel({
  canUpload,
  defaultUploaderName = '',
  canDelete = false,
  memberOrganization = null,
  isAdminManager = false,
}: GalleryPanelProps) {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('ALL');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Folders
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [uploadOrg, setUploadOrg] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadBy, setUploadBy] = useState(defaultUploaderName);
  // When set, the upload modal is "locked" to this organization/folder
  // (e.g. uploading into a specific folder) and hides the org picker.
  const [uploadContext, setUploadContext] = useState<{ organization: string; folderId: string | null } | null>(null);

  // ✅ BATCH UPLOAD STATE
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Reset the open folder whenever the org tab changes.
  useEffect(() => { setActiveFolderId(null); }, [activeTab]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const orgMedia = activeTab === 'ALL' ? media : media.filter(m => m.organization === activeTab);
  const orgFolders = folders.filter(f => f.organization === activeTab);
  const activeFolder = activeFolderId ? folders.find(f => f.id === activeFolderId) ?? null : null;

  // Whichever flat grid is currently visible — used for both rendering
  // and lightbox prev/next navigation, so they always stay in sync.
  const filtered = activeTab === 'ALL'
    ? media
    : activeFolderId
      ? orgMedia.filter(m => m.folder_id === activeFolderId)
      : orgMedia.filter(m => !m.folder_id);

  const lightboxItem = lightboxIdx !== null ? filtered[lightboxIdx] : null;

  // Can the logged-in person manage folders/uploads for a given org?
  // Super admins and editor admins can manage every organization's folders;
  // regular members are limited to their own organization.
  const canManageOrg = (org: string) => canUpload && (isAdminManager || (!!memberOrganization && memberOrganization === org));

  // Drag-and-drop: dragging a photo/video thumbnail onto a folder moves it in.
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const handleMoveToFolder = async (itemId: string, folderId: string) => {
    // Optimistic update so it feels instant.
    setMedia(prev => prev.map(m => m.id === itemId ? { ...m, folder_id: folderId } : m));
    const { data, error } = await supabase
      .from('media_gallery')
      .update({ folder_id: folderId })
      .eq('id', itemId)
      .select();

    // A missing UPDATE policy on media_gallery doesn't error — it just
    // silently matches zero rows, which looks identical to success. Treat
    // "no rows came back" as a failure too, so it doesn't quietly revert
    // the next time the page refetches.
    if (error || !data || data.length === 0) {
      toast({
        title: 'Could not move photo',
        description: error?.message || 'No permission to update this item — an UPDATE policy may be missing on media_gallery.',
        variant: 'destructive',
      });
      fetchMedia(); // revert to server truth on failure
    } else {
      toast({ title: 'Moved into folder' });
    }
  };

  // Downloads the currently displayed media item to the visitor's device,
  // rather than just opening it in a new tab.
  const handleDownload = async (item: MediaItem) => {
    try {
      const response = await fetch(item.file_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const ext = item.file_url.split('.').pop()?.split('?')[0] || (item.file_type === 'video' ? 'mp4' : 'jpg');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.title?.trim().replace(/[^a-z0-9]+/gi, '-') || 'gallery'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: at least open it so the user can save it manually.
      window.open(item.file_url, '_blank');
    }
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchMedia(); fetchFolders(); }, []);

  const fetchMedia = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('media_gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setMedia((data || []) as MediaItem[]);
    setLoading(false);
  };

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from('gallery_folders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setFolders((data || []) as GalleryFolder[]);
  };

  // ── CREATE FOLDER ──────────────────────────────────────────────────────────
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({ title: 'Folder name required', variant: 'destructive' });
      return;
    }
    setCreatingFolder(true);
    const { error } = await supabase.from('gallery_folders').insert({
      organization: activeTab,
      name: newFolderName.trim(),
      created_by: uploadBy.trim() || defaultUploaderName || null,
    });
    setCreatingFolder(false);
    if (error) {
      toast({ title: 'Could not create folder', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Folder created' });
    setShowCreateFolder(false);
    setNewFolderName('');
    fetchFolders();
  };

  // ── FILE CHANGE (BATCH) ───────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadFiles(files);
    setUploadPreviews(files.map(file => URL.createObjectURL(file)));
  };

  const resetUploadForm = () => {
    setUploadOrg('');
    setUploadTitle('');
    setUploadDescription('');
    setUploadBy(defaultUploaderName);
    setUploadContext(null);

    setUploadFiles([]);
    setUploadPreviews([]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openUpload = (context?: { organization: string; folderId: string | null }) => {
    setUploadContext(context ?? null);
    setShowUpload(true);
  };

  // ── UPLOAD (BATCH SUPABASE) ───────────────────────────────────────────────
  const handleUpload = async () => {
    const org = uploadContext?.organization || uploadOrg;
    const folderId = uploadContext?.folderId ?? null;

    if (!uploadFiles.length || !org) {
      toast({
        title: 'Missing info',
        description: 'Please select an organization and files.',
        variant: 'destructive',
      });
      return;
    }

    if (!uploadTitle.trim()) {
      toast({
        title: 'Title required',
        description: 'Please provide a caption/title for this media.',
        variant: 'destructive',
      });
      return;
    }

    if (!uploadBy.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name as the uploader.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const uploads = await Promise.all(
        uploadFiles.map(async (file) => {
          const ext = file.name.split('.').pop();
          const path = `${org}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;

          const { error: storageErr } = await supabase.storage
            .from('media-gallery')
            .upload(path, file, {
              contentType: file.type,
            });

          if (storageErr) throw storageErr;

          const { data: urlData } = supabase.storage
            .from('media-gallery')
            .getPublicUrl(path);

          return {
            organization: org,
            file_url: urlData.publicUrl,
            file_type: file.type.startsWith('video') ? 'video' : 'image',
            title: uploadTitle.trim(),
            description: uploadDescription.trim() || null,
            uploaded_by: uploadBy.trim(),
            folder_id: folderId,
          };
        })
      );

      const { error: dbErr } = await supabase
        .from('media_gallery')
        .insert(uploads);

      if (dbErr) throw dbErr;

      toast({
        title: 'Uploaded!',
        description: `${uploadFiles.length} files added to gallery.`,
      });

      setShowUpload(false);
      resetUploadForm();
      fetchMedia();
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // ── DELETE ─────────────────────────────────────────────────────────────────
  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Remove this media from the gallery?')) return;

    try {
      const path = new URL(item.file_url)
        .pathname
        .split('/media-gallery/')[1];

      await supabase.storage.from('media-gallery').remove([path]);
      await supabase.from('media_gallery').delete().eq('id', item.id);

      toast({ title: 'Deleted' });
      fetchMedia();
      if (lightboxIdx !== null) setLightboxIdx(null);
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => {
            const count = tab.key === 'ALL'
              ? media.length
              : media.filter(m => m.organization === tab.key).length;

            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? `${tab.color} text-white border-transparent shadow-sm`
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {canUpload ? (
          <Button onClick={() => openUpload()} size="sm">
            <Upload className="w-3.5 h-3.5" /> Upload Media
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-lg">
            <Lock className="w-3.5 h-3.5" />
            Login to upload
          </div>
        )}
      </div>

      {/* ── Folder view (organization tabs only) ── */}
      {activeTab !== 'ALL' && (
        <div className="space-y-4">
          {activeFolderId && activeFolder ? (
            /* Inside a folder */
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => setActiveFolderId(null)}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <Folder className="w-4 h-4" />
                {activeFolder.name}
              </button>
              {canManageOrg(activeFolder.organization) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openUpload({ organization: activeFolder.organization, folderId: activeFolder.id })}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Photo
                </Button>
              )}
            </div>
          ) : (
            /* Folder grid for this organization */
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Folders</p>
              </div>
              {orgFolders.length === 0 && !canManageOrg(activeTab) ? null : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {orgFolders.map(folder => {
                    const count = media.filter(m => m.folder_id === folder.id).length;
                    const isDropTarget = canManageOrg(folder.organization);
                    return (
                      <button
                        key={folder.id}
                        onClick={() => setActiveFolderId(folder.id)}
                        onDragOver={(e) => { if (isDropTarget && draggedItemId) { e.preventDefault(); setDragOverFolderId(folder.id); } }}
                        onDragLeave={() => setDragOverFolderId(prev => prev === folder.id ? null : prev)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverFolderId(null);
                          if (isDropTarget && draggedItemId) handleMoveToFolder(draggedItemId, folder.id);
                        }}
                        className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/40 transition-all aspect-square
                          ${dragOverFolderId === folder.id ? 'border-primary border-2 bg-primary/5 scale-[1.03]' : 'border-border'}`}
                      >
                        <Folder className="w-8 h-8 text-primary/70" />
                        <span className="text-xs font-medium text-foreground text-center line-clamp-1">{folder.name}</span>
                        <span className="text-[10px] text-muted-foreground">{count} {count === 1 ? 'item' : 'items'}</span>
                      </button>
                    );
                  })}
                  {canManageOrg(activeTab) && (
                    <button
                      onClick={() => setShowCreateFolder(true)}
                      className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all aspect-square"
                    >
                      <FolderPlus className="w-8 h-8" />
                      <span className="text-xs font-medium">New Folder</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Uncategorized / flat media section header (org tabs, folder-less items) ── */}
      {activeTab !== 'ALL' && !activeFolderId && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {orgFolders.length > 0 ? 'Uncategorized' : 'Photos & Videos'}
          </p>
          {canManageOrg(activeTab) && (
            <Button size="sm" variant="ghost" onClick={() => openUpload({ organization: activeTab, folderId: null })}>
              <Plus className="w-3.5 h-3.5" /> Add Photo
            </Button>
          )}
        </div>
      )}

      {/* ── Create Folder Dialog ── */}
      <Dialog open={showCreateFolder} onOpenChange={(open) => { if (!open) { setShowCreateFolder(false); setNewFolderName(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4" /> New {TAB_MAP[activeTab]?.label} Folder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Folder name (e.g. Youth Retreat 2026)"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={creatingFolder}>
              {creatingFolder ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Folder'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Upload Dialog (UPDATED FOR BATCH PREVIEW) ── */}
      <Dialog open={showUpload} onOpenChange={(open) => {
        if (!open) {
          setShowUpload(false);
          resetUploadForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {uploadContext?.folderId && activeFolder ? `Add Photo to "${activeFolder.name}"` : 'Upload Media'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {uploadContext ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <Badge className={`${TAB_MAP[uploadContext.organization]?.color} text-white`}>
                  {TAB_MAP[uploadContext.organization]?.label ?? uploadContext.organization}
                </Badge>
                {uploadContext.folderId ? 'This will be added to the folder above.' : 'This will be added without a folder.'}
              </div>
            ) : (
              <Select value={uploadOrg} onValueChange={setUploadOrg}>
                <SelectTrigger><SelectValue placeholder="Organization" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UCM">UCM</SelectItem>
                  <SelectItem value="CWA">CWA</SelectItem>
                  <SelectItem value="CYAF">CYAF</SelectItem>
                  <SelectItem value="CYF">CYF</SelectItem>
                  <SelectItem value="C">Children</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Input
              placeholder="Title"
              value={uploadTitle}
              onChange={e => setUploadTitle(e.target.value)}
            />

            <Textarea
              placeholder="Description"
              value={uploadDescription}
              onChange={e => setUploadDescription(e.target.value)}
            />

            <Input
              placeholder="Uploaded by"
              value={uploadBy}
              onChange={e => setUploadBy(e.target.value)}
            />

            {/* FILE PICKER */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-dashed border-2 p-4 rounded-lg cursor-pointer"
            >
              {uploadPreviews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {uploadPreviews.map((src, i) => (
                    <img key={i} src={src} className="h-20 w-full object-cover rounded" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Click to select multiple files
                </p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Media Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        activeTab === 'ALL' || activeFolderId || orgFolders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No media yet in this category.</p>
          </div>
        ) : null
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((item, idx) => {
            const tab = TAB_MAP[item.organization];
            const draggable = canManageOrg(item.organization) && !activeFolderId;
            return (
              <Card
                key={item.id}
                onClick={() => setLightboxIdx(idx)}
                draggable={draggable}
                onDragStart={(e) => { setDraggedItemId(item.id); e.dataTransfer.effectAllowed = 'move'; }}
                onDragEnd={() => { setDraggedItemId(null); setDragOverFolderId(null); }}
                className={`group relative aspect-square overflow-hidden border-border p-0
                  ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
              >
                {item.file_type === 'video' ? (
                  <VideoThumb url={item.file_url} />
                ) : (
                  <img
                    src={item.file_url}
                    alt={item.title || 'Gallery media'}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                )}

                {/* Organization badge */}
                {tab && activeTab === 'ALL' && (
                  <span className={`absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded-full text-white ${tab.color}`}>
                    {tab.label}
                  </span>
                )}

                {/* Caption overlay */}
                {item.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-4 pb-1.5">
                    <p className="text-white text-[11px] font-medium line-clamp-1">{item.title}</p>
                  </div>
                )}

                {/* Download + Delete buttons */}
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                    title="Download"
                    className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                      className="w-6 h-6 rounded-full bg-black/60 hover:bg-destructive flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Lightbox ── */}
      <Dialog open={lightboxIdx !== null} onOpenChange={(open) => !open && setLightboxIdx(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-none">
          {lightboxItem && (
            <div className="relative">
              <button
                onClick={() => setLightboxIdx(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {filtered.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIdx((lightboxIdx! - 1 + filtered.length) % filtered.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setLightboxIdx((lightboxIdx! + 1) % filtered.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </>
              )}

              <div className="w-full max-h-[75vh] flex items-center justify-center bg-black">
                {lightboxItem.file_type === 'video' ? (
                  <video src={lightboxItem.file_url} controls autoPlay className="max-w-full max-h-[75vh]" />
                ) : (
                  <img src={lightboxItem.file_url} alt={lightboxItem.title || ''} className="max-w-full max-h-[75vh] object-contain" />
                )}
              </div>

              <div className="p-4 bg-background">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {lightboxItem.title && <p className="font-semibold text-sm truncate">{lightboxItem.title}</p>}
                    {lightboxItem.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{lightboxItem.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                      {lightboxItem.uploaded_by && <span>By {lightboxItem.uploaded_by}</span>}
                      <span>{new Date(lightboxItem.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => handleDelete(lightboxItem)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 gap-1.5"
                    onClick={() => handleDownload(lightboxItem)}
                  >
                    <Download className="w-3.5 h-3.5" /> Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}