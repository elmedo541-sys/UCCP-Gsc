import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HomepageImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function HomepageImagesManager() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [images, setImages] = useState<HomepageImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, authLoading, navigate]);

  const fetchImages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Error',
        description: 'Failed to load images',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchImages();
    }
  }, [isAdmin, fetchImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, GIF, or WEBP)',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Step 1: Upload to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('homepage-images')
        .upload(fileName, selectedFile, { upsert: false });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // Step 2: Get public URL
      const { data: urlData } = supabase.storage
        .from('homepage-images')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      setUploadProgress(90);

      // Step 3: Save to database
      const { error: dbError } = await supabase
        .from('homepage_images')
        .insert({
          image_url: publicUrl,
          title: title || null,
          description: description || null,
          display_order: displayOrder,
          is_active: true,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success!',
        description: 'Homepage image added successfully',
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl('');
      setTitle('');
      setDescription('');
      setDisplayOrder(images.length + 1);
      setShowAddDialog(false);
      
      // Refresh images
      fetchImages();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('homepage_images')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Image ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchImages();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update image status',
        variant: 'destructive',
      });
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const { error } = await supabase
        .from('homepage_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });

      fetchImages();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Only super administrators can manage homepage images.
            </p>
            <Button onClick={() => navigate('/admin/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Homepage Images Manager</h1>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Image
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Slideshow Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Images will automatically cycle every 4 seconds on the homepage. 
              Only active images will be displayed. Arrange images using the display order number.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <Card key={image.id} className={!image.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="relative aspect-video mb-3 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={image.image_url}
                    alt={image.title || 'Homepage image'}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    Order: {image.display_order}
                  </div>
                </div>
                <h3 className="font-semibold mb-1">
                  {image.title || 'Untitled'}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {image.description || 'No description'}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(image.id, image.is_active)}
                  >
                    {image.is_active ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Show
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteImage(image.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {images.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No images yet</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Image
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Image Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Homepage Image</DialogTitle>
              <DialogDescription>
                Upload a new image for the homepage slideshow (max 10MB)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Image File *</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="w-full"
                />
                {previewUrl && (
                  <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Welcome to GSC Members Profile Registration"
                  disabled={uploading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Join our community and stay connected with the church family"
                  rows={3}
                  disabled={uploading}
                />
              </div>

              {/* Display Order */}
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value))}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first in the slideshow
                </p>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
