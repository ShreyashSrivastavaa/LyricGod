"use client";

import React from "react";

interface AmbientGlowOverlayProps {
  colors: [string, string];
  intensity: number;      // 0 to 1
  thickness: number;      // border px width
  glowSpread: number;     // blur spread px
  bassPulse: number;      // dynamic 0 to 1 from audio
  isAudioReactive: boolean;
  isFullWindow?: boolean;
}

export function AmbientGlowOverlay({
  colors,
  intensity,
  thickness,
  glowSpread,
  bassPulse,
  isAudioReactive,
  isFullWindow = false,
}: AmbientGlowOverlayProps) {
  const dynamicSpread = isAudioReactive
    ? glowSpread + bassPulse * 50
    : glowSpread;
  const dynamicOpacity = isAudioReactive
    ? Math.min(1, intensity * (0.8 + bassPulse * 0.6))
    : intensity;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden transition-all duration-75 ${
        isFullWindow ? "fixed z-40" : "z-10 rounded-2xl"
      }`}
      style={{ opacity: dynamicOpacity }}
    >
      {/* Top Border Glow */}
      <div
        className="absolute top-0 left-0 right-0 transition-all duration-75"
        style={{
          height: `${thickness}px`,
          background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
          boxShadow: `0 0 ${dynamicSpread}px ${colors[0]}`,
        }}
      />

      {/* Bottom Border Glow */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-all duration-75"
        style={{
          height: `${thickness}px`,
          background: `linear-gradient(90deg, ${colors[1]}, ${colors[0]})`,
          boxShadow: `0 0 ${dynamicSpread}px ${colors[1]}`,
        }}
      />

      {/* Left Border Glow */}
      <div
        className="absolute top-0 bottom-0 left-0 transition-all duration-75"
        style={{
          width: `${thickness}px`,
          background: `linear-gradient(180deg, ${colors[0]}, ${colors[1]})`,
          boxShadow: `0 0 ${dynamicSpread}px ${colors[0]}`,
        }}
      />

      {/* Right Border Glow */}
      <div
        className="absolute top-0 bottom-0 right-0 transition-all duration-75"
        style={{
          width: `${thickness}px`,
          background: `linear-gradient(180deg, ${colors[1]}, ${colors[0]})`,
          boxShadow: `0 0 ${dynamicSpread}px ${colors[1]}`,
        }}
      />

      {/* 4 Soft Corner Blobs for natural screen spill */}
      <div
        className="absolute top-0 left-0 rounded-full blur-[80px]"
        style={{
          width: `${dynamicSpread * 1.8}px`,
          height: `${dynamicSpread * 1.8}px`,
          backgroundColor: colors[0],
          opacity: 0.6,
        }}
      />
      <div
        className="absolute top-0 right-0 rounded-full blur-[80px]"
        style={{
          width: `${dynamicSpread * 1.8}px`,
          height: `${dynamicSpread * 1.8}px`,
          backgroundColor: colors[1],
          opacity: 0.6,
        }}
      />
      <div
        className="absolute bottom-0 left-0 rounded-full blur-[80px]"
        style={{
          width: `${dynamicSpread * 1.8}px`,
          height: `${dynamicSpread * 1.8}px`,
          backgroundColor: colors[1],
          opacity: 0.6,
        }}
      />
      <div
        className="absolute bottom-0 right-0 rounded-full blur-[80px]"
        style={{
          width: `${dynamicSpread * 1.8}px`,
          height: `${dynamicSpread * 1.8}px`,
          backgroundColor: colors[0],
          opacity: 0.6,
        }}
      />
    </div>
  );
}
