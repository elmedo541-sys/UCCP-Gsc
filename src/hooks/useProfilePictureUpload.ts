import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const UPLOAD_CONFIG = {
  maxFileSizeMB: 10,
  allowedExtensions: ["jpg", "jpeg", "png", "gif", "webp"],
};

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  resourcePath: string | null;
  previewUrl: string | null;
}

export function useProfilePictureUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    resourcePath: null,
    previewUrl: null,
  });
  const previewUrlRef = useRef<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const maxSizeBytes = UPLOAD_CONFIG.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum allowed: ${UPLOAD_CONFIG.maxFileSizeMB}MB`;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !UPLOAD_CONFIG.allowedExtensions.includes(ext)) {
      return `Unsupported file type. Allowed: ${UPLOAD_CONFIG.allowedExtensions.join(", ")}`;
    }
    return null;
  }, []);

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      const newPreviewUrl = URL.createObjectURL(file);
      previewUrlRef.current = newPreviewUrl;

      setState((prev) => ({
        ...prev,
        isUploading: true,
        progress: 0,
        error: null,
        resourcePath: null,
        previewUrl: newPreviewUrl,
      }));

      try {
        const validationError = validateFile(file);
        if (validationError) throw new Error(validationError);

        setState((prev) => ({ ...prev, progress: 20 }));

        // Upload directly to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(fileName, file, { upsert: false });

        if (uploadError) throw uploadError;

        setState((prev) => ({ ...prev, progress: 80 }));

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        setState((prev) => ({
          ...prev,
          progress: 100,
          resourcePath: publicUrl,
        }));

        return publicUrl;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return null;
      } finally {
        setState((prev) => ({ ...prev, isUploading: false }));
      }
    },
    [validateFile]
  );

  const reset = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      resourcePath: null,
      previewUrl: null,
    });
  }, []);

  return {
    ...state,
    config: UPLOAD_CONFIG,
    uploadFile,
    reset,
    validateFile,
  };
}
