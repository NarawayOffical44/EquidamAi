"use client";

import { X, Play, Pause } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title?: string;
}

export function VideoModal({ isOpen, onClose, videoSrc, title }: VideoModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

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
        <div className="relative w-full bg-black rounded-lg overflow-hidden group" style={{ paddingBottom: "56.25%" }}>
          <video
            ref={videoRef}
            autoPlay
            className="absolute inset-0 w-full h-full"
            src={videoSrc}
            title={title || "Evaldam AI Video"}
            preload="metadata"
            playsInline
          >
            Your browser does not support the video tag.
          </video>

          {/* Minimal Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <div className="bg-white/90 rounded-full p-4 hover:bg-white transition-colors">
              {isPlaying ? (
                <Pause className="w-8 h-8 text-black fill-black" />
              ) : (
                <Play className="w-8 h-8 text-black fill-black" />
              )}
            </div>
          </button>
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
