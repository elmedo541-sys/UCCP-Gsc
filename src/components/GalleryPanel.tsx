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
  Trash2, ChevronLeft, ChevronRight, Lock,
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
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GalleryPanel({
  canUpload,
  defaultUploaderName = '',
  canDelete = false,
}: GalleryPanelProps) {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('ALL');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [uploadOrg, setUploadOrg] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadBy, setUploadBy] = useState(defaultUploaderName);

  // ✅ BATCH UPLOAD STATE
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = activeTab === 'ALL'
    ? media
    : media.filter(m => m.organization === activeTab);

  const lightboxItem = lightboxIdx !== null ? filtered[lightboxIdx] : null;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchMedia(); }, []);

  const fetchMedia = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('media_gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setMedia((data || []) as MediaItem[]);
    setLoading(false);
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

    setUploadFiles([]);
    setUploadPreviews([]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── UPLOAD (BATCH SUPABASE) ───────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadFiles.length || !uploadOrg) {
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
          const path = `${uploadOrg}/${Date.now()}-${Math.random()
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
            organization: uploadOrg,
            file_url: urlData.publicUrl,
            file_type: file.type.startsWith('video') ? 'video' : 'image',
            title: uploadTitle.trim(),
            description: uploadDescription.trim() || null,
            uploaded_by: uploadBy.trim(),
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

  // ── RENDER (UNCHANGED UI except upload section) ────────────────────────────
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
          <Button onClick={() => setShowUpload(true)} size="sm">
            <Upload className="w-3.5 h-3.5" /> Upload Media
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-lg">
            <Lock className="w-3.5 h-3.5" />
            Login to upload
          </div>
        )}
      </div>

      {/* ── Upload Dialog (UPDATED FOR BATCH PREVIEW) ── */}
      <Dialog open={showUpload} onOpenChange={(open) => {
        if (!open) {
          setShowUpload(false);
          resetUploadForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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

    </div>
  );
}