"use client";

import React, { useState } from "react";
import { Video, X, AlertCircle, Check } from "lucide-react";

export interface VideoEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertVideo: (videoUrl: string) => void;
}

export function VideoEmbedModal({ isOpen, onClose, onInsertVideo }: VideoEmbedModalProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = videoUrl.trim();
    if (!clean) {
      setError("Veuillez renseigner l'adresse de la vidéo.");
      return;
    }

    // Whitelist YouTube & Vimeo
    const isYouTube = clean.includes("youtube.com") || clean.includes("youtu.be");
    const isVimeo = clean.includes("vimeo.com");

    if (!isYouTube && !isVimeo) {
      setError("Seuls les liens YouTube et Vimeo sont autorisés pour des raisons de sécurité.");
      return;
    }

    onInsertVideo(clean);
    setVideoUrl("");
    onClose();
  };

  return (
    <div
      id="modal-novika-video-embed"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#E6E0D4] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E0D4]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#FAF8F5] border border-[#E6E0D4] flex items-center justify-center text-[#111111]">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">Insérer une vidéo</h3>
              <p className="text-[11px] text-[#7A7A7A]">YouTube ou Vimeo uniquement</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-[#7A7A7A] hover:text-[#111111] hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1">
              Lien de la vidéo (YouTube / Vimeo)
            </label>
            <input
              type="url"
              required
              autoFocus
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E0D4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E6E0D4] text-xs font-semibold text-[#666660] hover:bg-[#FAF8F5]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black"
            >
              Insérer la vidéo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
