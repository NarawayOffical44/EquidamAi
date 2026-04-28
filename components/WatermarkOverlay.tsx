'use client';

import React from 'react';
import { FREE_TIER_WATERMARK, WatermarkConfig } from '@/lib/utils/watermark';

/**
 * React component for watermark overlay on free tier reports
 */
export function WatermarkOverlay({
  config = FREE_TIER_WATERMARK,
}: { config?: WatermarkConfig } = {}) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      style={{
        backgroundColor: "transparent",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          fontSize: `${config.fontSize}px`,
          fontWeight: "bold",
          color: config.fontColor,
          opacity: config.opacity,
          transform: `translate(-50%, -50%) rotate(${config.angle}deg)`,
          whiteSpace: "nowrap",
          fontFamily: "Arial, sans-serif",
          textTransform: "uppercase",
          letterSpacing: "2px",
          width: "100vw",
          textAlign: "center",
        }}
      >
        {config.text}
      </div>
    </div>
  );
}
