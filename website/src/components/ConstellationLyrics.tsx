"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LyricLine } from "../lib/types";

interface ConstellationLyricsProps {
  currentLine: LyricLine;
  prevLine?: LyricLine;
  nextLine?: LyricLine;
  currentTime: number;
  glowColor?: string;
  bassPulse?: number;
}

interface NodePos {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  word: string;
  index: number;
  start: number;
  end: number;
}

export function ConstellationLyrics({
  currentLine,
  currentTime,
  glowColor = "#ffffff",
  bassPulse = 0,
}: ConstellationLyricsProps) {
  const words = currentLine?.words || [];

  // Determine current active word index
  const activeWordIndex = useMemo(() => {
    if (!words || words.length === 0) return 0;
    const idx = words.findIndex(
      (w) => currentTime >= w.start && currentTime <= w.end
    );
    if (idx !== -1) return idx;

    // If before first word
    if (currentTime < words[0].start) return 0;

    // If past last word or between words, find most recent
    for (let i = words.length - 1; i >= 0; i--) {
      if (currentTime >= words[i].start) return i;
    }
    return words.length - 1;
  }, [words, currentTime]);

  // Compute organic 2D constellation coordinates for each word in the line
  const nodes: NodePos[] = useMemo(() => {
    if (!words || words.length === 0) {
      return [
        {
          x: 50,
          y: 50,
          word: currentLine?.text || "",
          index: 0,
          start: currentLine?.start || 0,
          end: currentLine?.end || 3,
        },
      ];
    }

    const count = words.length;

    return words.map((w, i) => {
      // Horizontal spread across canvas (18% to 82%)
      const xPercent =
        count === 1 ? 50 : 16 + (i / (count - 1)) * 68;

      // Organic zig-zag / celestial height offsets
      // Alternating constellation coordinates matching the geometric star map in the video
      const heightPresets = [-18, 16, -12, 22, -22, 14, -16, 20, -10, 18];
      const baseOffset = heightPresets[i % heightPresets.length];
      
      // Slight pseudorandom jitter based on word characters for natural star clustering
      const charHash = (w.word.charCodeAt(0) + (w.word.charCodeAt(w.word.length - 1) || 0)) % 12;
      const jitter = charHash - 6;

      const yPercent = Math.max(22, Math.min(76, 50 + baseOffset + jitter));

      return {
        x: xPercent,
        y: yPercent,
        word: w.word,
        index: i,
        start: w.start,
        end: w.end,
      };
    });
  }, [words, currentLine?.text, currentLine?.start, currentLine?.end]);

  const activeNode = nodes[activeWordIndex] || nodes[0];
  const isWordActiveNow =
    activeNode &&
    currentTime >= activeNode.start &&
    currentTime <= activeNode.end + 0.15;

  // Connecting lines between nodes
  const lines = useMemo(() => {
    const list: {
      from: NodePos;
      to: NodePos;
      isPassed: boolean;
      isActive: boolean;
      isSecondary?: boolean;
    }[] = [];

    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i];
      const to = nodes[i + 1];
      const isPassed = i + 1 <= activeWordIndex;
      const isActive = i === activeWordIndex - 1;
      list.push({ from, to, isPassed, isActive, isSecondary: false });

      // Secondary geometric links to create constellation triangles (as seen in the reference video)
      if (i + 2 < nodes.length && i % 2 === 0) {
        const toSecond = nodes[i + 2];
        const secondPassed = i + 2 <= activeWordIndex;
        list.push({
          from,
          to: toSecond,
          isPassed: secondPassed,
          isActive: false,
          isSecondary: true,
        });
      }
    }
    return list;
  }, [nodes, activeWordIndex]);

  return (
    <div className="relative w-full h-[340px] sm:h-[400px] md:h-[480px] select-none overflow-hidden flex items-center justify-center">
      {/* 1. Atmospheric Smoke & Billowing Nebula Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft atmospheric cloud center */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] md:w-[750px] h-[320px] md:h-[420px] rounded-full blur-[90px] opacity-25 transition-all duration-300 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(200,210,240,0.18) 40%, rgba(30,30,40,0.05) 75%, transparent 100%)",
            transform: `translate(-50%, -50%) scale(${1 + bassPulse * 0.15})`,
          }}
        />

        {/* Dynamic celestial cloud mist pockets */}
        <div
          className="absolute top-1/3 left-1/4 w-[380px] h-[260px] rounded-full blur-[100px] opacity-15 pointer-events-none transition-transform duration-500"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
            transform: `scale(${1 + Math.sin(currentTime * 1.5) * 0.08})`,
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[340px] h-[220px] rounded-full blur-[95px] opacity-15 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(220,230,255,0.25) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* 2. SVG Constellation Geometric Network Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <filter id="glow-bright" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {lines.map((l, idx) => (
          <line
            key={`line-${idx}`}
            x1={`${l.from.x}%`}
            y1={`${l.from.y}%`}
            x2={`${l.to.x}%`}
            y2={`${l.to.y}%`}
            stroke={
              l.isPassed
                ? "rgba(255, 255, 255, 0.75)"
                : l.isSecondary
                ? "rgba(255, 255, 255, 0.14)"
                : "rgba(255, 255, 255, 0.28)"
            }
            strokeWidth={l.isPassed && !l.isSecondary ? 2 : 1.2}
            strokeDasharray={l.isSecondary ? "3 3" : undefined}
            filter={l.isPassed && !l.isSecondary ? "url(#glow-bright)" : undefined}
            className="transition-all duration-300"
          />
        ))}
      </svg>

      {/* 3. Static Constellation Word Nodes */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
        {nodes.map((node, i) => {
          const isActive = i === activeWordIndex;
          const isPassed = i < activeWordIndex;

          return (
            <div
              key={`node-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
              }}
            >
              {/* Star Node Dot */}
              <div
                className={`rounded-full transition-all duration-200 ${
                  isActive
                    ? "w-3 h-3 bg-white shadow-[0_0_12px_#ffffff] scale-125"
                    : isPassed
                    ? "w-2 h-2 bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                    : "w-1.5 h-1.5 bg-white/30"
                }`}
              />

              {/* Inactive Node Word Label (Visible when not actively targeted by crosshair) */}
              {!isActive && (
                <span
                  className={`mt-1.5 whitespace-nowrap text-xs md:text-sm font-sans tracking-tight transition-all duration-200 ${
                    isPassed
                      ? "text-zinc-300 font-medium opacity-80"
                      : "text-zinc-500 font-normal opacity-50"
                  }`}
                >
                  {node.word}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Active Target Crosshair Reticle (Glides from word to word) */}
      <motion.div
        className="absolute z-30 pointer-events-none flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2"
        animate={{
          left: `${activeNode.x}%`,
          top: `${activeNode.y}%`,
        }}
        transition={{
          type: "spring",
          stiffness: 340,
          damping: 26,
          mass: 0.8,
        }}
      >
        {/* The Targeting Crosshair Reticle (Exact match to the reference video) */}
        <div className="relative flex items-center justify-center">
          {/* Outer Rotating/Pulsing Reticle Ring */}
          <motion.div
            animate={{
              scale: isWordActiveNow ? [1, 1.15, 1] : 1,
              opacity: isWordActiveNow ? 1 : 0.85,
            }}
            transition={{ duration: 0.25 }}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center"
          >
            {/* Inner Ring */}
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-[0_0_14px_rgba(255,255,255,0.8)] flex items-center justify-center">
              {/* Center Radiant Core */}
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            </div>
          </motion.div>

          {/* 4 Crosshair Axis Lines (Spikes radiating outward) */}
          {/* Top Axis */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-[1.5px] h-3.5 bg-white shadow-[0_0_6px_#ffffff]" />
          {/* Bottom Axis */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[1.5px] h-3.5 bg-white shadow-[0_0_6px_#ffffff]" />
          {/* Left Axis */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-[1.5px] w-3.5 bg-white shadow-[0_0_6px_#ffffff]" />
          {/* Right Axis */}
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-[1.5px] w-3.5 bg-white shadow-[0_0_6px_#ffffff]" />
        </div>

        {/* 5. The Active Singing Word (Large, Bold, High-Contrast White with Bloom) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`active-word-${activeNode.word}-${activeNode.index}`}
            initial={{ scale: 0.85, opacity: 0, y: 4 }}
            animate={{
              scale: isWordActiveNow ? 1.15 : 1,
              opacity: 1,
              y: 0,
            }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="mt-3 md:mt-4 text-center pointer-events-none"
          >
            <span
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-[0_0_24px_rgba(255,255,255,0.95)]"
              style={{
                fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
                textShadow:
                  "0 0 15px rgba(255,255,255,1), 0 0 35px rgba(255,255,255,0.7), 0 0 60px rgba(255,255,255,0.4)",
              }}
            >
              {activeNode.word}
            </span>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* 6. Subtle Song Beat Pulse Indicator at bottom */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-40 text-[10px] font-mono tracking-widest text-zinc-400">
        <span>STARMAP RETICLE SYNC</span>
        <span className="w-1 h-1 rounded-full bg-white animate-ping" />
      </div>
    </div>
  );
}
