"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title?: string;
}

export function VideoModal({ isOpen, onClose, videoSrc, title }: VideoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-4xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
          aria-label="Close video"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Video container */}
        <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
          <video
            autoPlay
            controls
            controlsList="nodownload"
            className="absolute inset-0 w-full h-full"
            src={videoSrc}
            title={title || "Evaldam AI Video"}
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Title */}
        {title && (
          <p className="text-white mt-4 text-center text-sm">
            {title}
          </p>
        )}
      </div>
    </div>
  );
}
