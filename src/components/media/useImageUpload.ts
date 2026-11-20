"use client";

import { useState } from "react";
import { StoredMediaItem, MediaUsageType } from "@/lib/media-storage";

export interface UseImageUploadOptions {
  storeSlug?: string;
  contextType?: MediaUsageType;
  onSuccess?: (mediaItem: StoredMediaItem) => void;
  onError?: (error: string) => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { storeSlug = "lome-glow", contextType = "product", onSuccess, onError } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File, altText?: string): Promise<StoredMediaItem | null> => {
    setIsUploading(true);
    setProgress(15);
    setError(null);

    // Contrôle client rapide de la taille (5 Mo)
    if (file.size > 5 * 1024 * 1024) {
      const err = "Le fichier dépasse la limite maximale autorisée de 5 Mo.";
      setError(err);
      setIsUploading(false);
      onError?.(err);
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storeSlug", storeSlug);
      formData.append("contextType", contextType);
      if (altText) formData.append("altText", altText);

      setProgress(45);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(85);

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Échec du téléversement de l'image.";
        setError(errMsg);
        setIsUploading(false);
        onError?.(errMsg);
        return null;
      }

      setProgress(100);
      setIsUploading(false);
      onSuccess?.(data.mediaItem);
      return data.mediaItem;
    } catch {
      const errMsg = "Erreur de connexion lors du téléversement.";
      setError(errMsg);
      setIsUploading(false);
      onError?.(errMsg);
      return null;
    }
  };

  const uploadFromUrl = async (url: string, altText?: string): Promise<StoredMediaItem | null> => {
    setIsUploading(true);
    setProgress(20);
    setError(null);

    try {
      const res = await fetch("/api/media/upload-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          storeSlug,
          contextType,
          altText,
        }),
      });

      setProgress(80);
      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Impossible de récupérer l'image distante.";
        setError(errMsg);
        setIsUploading(false);
        onError?.(errMsg);
        return null;
      }

      setProgress(100);
      setIsUploading(false);
      onSuccess?.(data.mediaItem);
      return data.mediaItem;
    } catch {
      const errMsg = "Erreur réseau lors de l'importation de l'image distante.";
      setError(errMsg);
      setIsUploading(false);
      onError?.(errMsg);
      return null;
    }
  };

  return {
    isUploading,
    progress,
    error,
    uploadFile,
    uploadFromUrl,
    clearError: () => setError(null),
  };
}
