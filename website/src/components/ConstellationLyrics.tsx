"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LyricLine } from "../lib/types";

interface ConstellationLyricsProps {
  allLyrics?: LyricLine[];
  currentLine: LyricLine;
  prevLine?: LyricLine;
  nextLine?: LyricLine;
  currentTime: number;
  glowColor?: string;
  bassPulse?: number;
}

interface ConstellationWord {
  id: string;
  word: string;
  start: number;
  end: number;
  globalIndex: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  isPassed: boolean;
  isActive: boolean;
  isUpcoming: boolean;
}

// 16 non-linear celestial star-slots distributed across the entire 2D canvas
const CELESTIAL_SLOTS = [
  { x: 16, y: 24 }, // Slot 0: Top left
  { x: 38, y: 16 }, // Slot 1: Top mid-left
  { x: 64, y: 20 }, // Slot 2: Top mid-right
  { x: 85, y: 28 }, // Slot 3: Top right
  { x: 12, y: 50 }, // Slot 4: Mid left
  { x: 30, y: 40 }, // Slot 5: Center upper-left
  { x: 48, y: 32 }, // Slot 6: High center
  { x: 68, y: 46 }, // Slot 7: Center mid-right
  { x: 88, y: 54 }, // Slot 8: Mid right
  { x: 18, y: 76 }, // Slot 9: Bottom left
  { x: 36, y: 66 }, // Slot 10: Bottom mid-left
  { x: 52, y: 74 }, // Slot 11: Bottom center
  { x: 72, y: 72 }, // Slot 12: Bottom right
  { x: 88, y: 78 }, // Slot 13: Far bottom right
  { x: 26, y: 32 }, // Slot 14: Inner top
  { x: 56, y: 54 }, // Slot 15: Inner center
];

export function ConstellationLyrics({
  allLyrics = [],
  currentLine,
  currentTime,
  glowColor = "#ffffff",
  bassPulse = 0,
}: ConstellationLyricsProps) {
  // 1. Flatten all words from the entire song into a single chronological timeline
  const allSongWords = useMemo(() => {
    const list: {
      word: string;
      start: number;
      end: number;
      globalIndex: number;
    }[] = [];

    const lines = allLyrics.length > 0 ? allLyrics : [currentLine];
    let gIdx = 0;

    for (const line of lines) {
      if (line.words && line.words.length > 0) {
        for (const w of line.words) {
          list.push({
            word: w.word,
            start: w.start,
            end: w.end,
            globalIndex: gIdx++,
          });
        }
      } else if (line.text) {
        const tokens = line.text.split(" ").filter(Boolean);
        const dur = Math.max(2, (line.end - line.start) / (tokens.length || 1));
        tokens.forEach((tok, tIdx) => {
          list.push({
            word: tok,
            start: line.start + tIdx * dur,
            end: line.start + (tIdx + 1) * dur,
            globalIndex: gIdx++,
          });
        });
      }
    }

    return list;
  }, [allLyrics, currentLine]);

  // 2. Identify the active singing word index
  const activeWordGlobalIdx = useMemo(() => {
    if (allSongWords.length === 0) return 0;
    const found = allSongWords.findIndex(
      (w) => currentTime >= w.start && currentTime <= w.end
    );
    if (found !== -1) return found;

    if (currentTime < allSongWords[0].start) return 0;

    for (let i = allSongWords.length - 1; i >= 0; i--) {
      if (currentTime >= allSongWords[i].start) return i;
    }
    return allSongWords.length - 1;
  }, [allSongWords, currentTime]);

  // 3. Sliding constellation cluster: take ~14 to 18 words around the current position
  // Words are scattered non-linearly across the screen like real stars in a constellation
  const activeCluster: ConstellationWord[] = useMemo(() => {
    if (allSongWords.length === 0) return [];

    const CLUSTER_SIZE = 14;
    const PREV_WORDS_COUNT = 4;

    let start = Math.max(0, activeWordGlobalIdx - PREV_WORDS_COUNT);
    let end = Math.min(allSongWords.length, start + CLUSTER_SIZE);

    if (end - start < CLUSTER_SIZE && start > 0) {
      start = Math.max(0, end - CLUSTER_SIZE);
    }

    const slice = allSongWords.slice(start, end);

    return slice.map((w) => {
      // Deterministic non-linear jumping across celestial slots (coprime step 5 ensures wide diagonal spread)
      const slotIdx = (w.globalIndex * 5 + 3) % CELESTIAL_SLOTS.length;
      const baseSlot = CELESTIAL_SLOTS[slotIdx];

      // Subtle organic jitter based on word characters so nodes feel natural and unique
      const charHash =
        (w.word.charCodeAt(0) * 3 +
          (w.word.charCodeAt(w.word.length - 1) || 0) * 5) %
        10;
      const jitterX = charHash - 5;
      const jitterY = ((charHash * 7) % 10) - 5;

      const x = Math.max(10, Math.min(90, baseSlot.x + jitterX));
      const y = Math.max(14, Math.min(84, baseSlot.y + jitterY));

      const isPassed = currentTime > w.end;
      const isActive =
        currentTime >= w.start && currentTime <= w.end + 0.15;
      const isUpcoming = currentTime < w.start;

      return {
        id: `word-${w.globalIndex}-${w.word}`,
        word: w.word,
        start: w.start,
        end: w.end,
        globalIndex: w.globalIndex,
        x,
        y,
        isPassed,
        isActive,
        isUpcoming,
      };
    });
  }, [allSongWords, activeWordGlobalIdx, currentTime]);

  // Find the exact active word node
  const activeNode =
    activeCluster.find((w) => w.globalIndex === activeWordGlobalIdx) ||
    activeCluster[0] || { x: 50, y: 50, word: "" };

  // 4. Generate geometric constellation lines connecting scattered star-dots
  const constellationLines = useMemo(() => {
    const lines: {
      from: ConstellationWord;
      to: ConstellationWord;
      isPassed: boolean;
      isActive: boolean;
      isCrossLink: boolean;
    }[] = [];

    for (let i = 0; i < activeCluster.length - 1; i++) {
      const from = activeCluster[i];
      const to = activeCluster[i + 1];

      const isPassed = from.globalIndex < activeWordGlobalIdx && to.globalIndex <= activeWordGlobalIdx;
      const isActive = from.globalIndex === activeWordGlobalIdx || to.globalIndex === activeWordGlobalIdx;

      // Primary chronological constellation line
      lines.push({
        from,
        to,
        isPassed,
        isActive,
        isCrossLink: false,
      });

      // Secondary geometric cross-links (forms star triangles exactly like the reference video)
      if (i + 2 < activeCluster.length && i % 2 === 0) {
        const toSecond = activeCluster[i + 2];
        const secondPassed = toSecond.globalIndex <= activeWordGlobalIdx;
        lines.push({
          from,
          to: toSecond,
          isPassed: secondPassed,
          isActive: false,
          isCrossLink: true,
        });
      }
    }

    return lines;
  }, [activeCluster, activeWordGlobalIdx]);

  return (
    <div className="relative w-full h-[400px] sm:h-[460px] md:h-[540px] select-none overflow-hidden flex items-center justify-center">
      {/* 1. Atmospheric Volumetric Nebula / Smoke Cloud Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep centered atmospheric cloud mist */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[850px] h-[350px] md:h-[480px] rounded-full blur-[95px] opacity-25 transition-transform duration-300 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.45) 0%, rgba(190,205,235,0.2) 40%, rgba(30,30,45,0.06) 75%, transparent 100%)",
            transform: `translate(-50%, -50%) scale(${1 + bassPulse * 0.16})`,
          }}
        />

        {/* Ambient drift clouds */}
        <div
          className="absolute top-1/4 left-1/5 w-[420px] h-[280px] rounded-full blur-[110px] opacity-15 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/5 w-[380px] h-[240px] rounded-full blur-[100px] opacity-15 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(220,230,255,0.25) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* 2. SVG Constellation Lines Connecting Dots Across the Screen */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <filter id="starmap-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {constellationLines.map((line, idx) => (
          <line
            key={`line-${idx}-${line.from.id}-${line.to.id}`}
            x1={`${line.from.x}%`}
            y1={`${line.from.y}%`}
            x2={`${line.to.x}%`}
            y2={`${line.to.y}%`}
            stroke={
              line.isPassed
                ? "rgba(255, 255, 255, 0.8)"
                : line.isActive
                ? "#ffffff"
                : line.isCrossLink
                ? "rgba(255, 255, 255, 0.14)"
                : "rgba(255, 255, 255, 0.28)"
            }
            strokeWidth={line.isActive ? 2.5 : line.isPassed ? 1.8 : 1.2}
            strokeDasharray={line.isCrossLink ? "4 4" : undefined}
            filter={line.isActive || (line.isPassed && !line.isCrossLink) ? "url(#starmap-glow)" : undefined}
            className="transition-all duration-300"
          />
        ))}

        {/* 3. Constellation Dots at Every Word Node */}
        {activeCluster.map((w) => {
          const isAct = w.globalIndex === activeWordGlobalIdx;
          const isPass = w.isPassed;

          return (
            <g key={`dot-g-${w.id}`}>
              {/* Outer halo for active dot */}
              {isAct && (
                <circle
                  cx={`${w.x}%`}
                  cy={`${w.y}%`}
                  r={10 + bassPulse * 8}
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.5"
                  className="animate-ping"
                />
              )}
              {/* Core Star Dot */}
              <circle
                cx={`${w.x}%`}
                cy={`${w.y}%`}
                r={isAct ? 5 : isPass ? 3.5 : 2.5}
                fill={isAct ? "#ffffff" : isPass ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)"}
                filter={isAct || isPass ? "url(#starmap-glow)" : undefined}
                className="transition-all duration-200"
              />
            </g>
          );
        })}
      </svg>

      {/* 4. Non-Active Word Labels (Scattered at their celestial coordinates) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
        {activeCluster.map((w) => {
          const isAct = w.globalIndex === activeWordGlobalIdx;
          const isPass = w.isPassed;

          // Active word is prominently rendered by the Glide Reticle
          if (isAct) return null;

          return (
            <div
              key={`label-${w.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300"
              style={{
                left: `${w.x}%`,
                top: `${w.y + 3.8}%`,
              }}
            >
              <span
                className={`whitespace-nowrap font-sans tracking-tight transition-all duration-200 ${
                  isPass
                    ? "text-zinc-300 font-semibold text-xs sm:text-sm opacity-85 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                    : "text-zinc-500 font-normal text-[11px] sm:text-xs opacity-50"
                }`}
              >
                {w.word}
              </span>
            </div>
          );
        })}
      </div>

      {/* 5. The Active Target Reticle (Glides across 2D space to wherever the word is scattered) */}
      <motion.div
        className="absolute z-30 pointer-events-none flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2"
        animate={{
          left: `${activeNode.x}%`,
          top: `${activeNode.y}%`,
        }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 26,
          mass: 0.75,
        }}
      >
        {/* The Targeting Crosshair Reticle (Exact match to reference video) */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Reticle Ring */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 90],
            }}
            transition={{
              scale: { duration: 0.28 },
              rotate: { duration: 16, repeat: Infinity, ease: "linear" },
            }}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-white/60 shadow-[0_0_24px_rgba(255,255,255,0.5)] flex items-center justify-center"
          >
            {/* Inner Ring */}
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-[0_0_16px_#ffffff] flex items-center justify-center">
              {/* Luminous Center Point */}
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#ffffff]" />
            </div>
          </motion.div>

          {/* 4 Radiating Crosshair Spikes */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-[2px] h-4 bg-white shadow-[0_0_8px_#ffffff]" />
          <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-[2px] h-4 bg-white shadow-[0_0_8px_#ffffff]" />
          <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 h-[2px] w-4 bg-white shadow-[0_0_8px_#ffffff]" />
          <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 h-[2px] w-4 bg-white shadow-[0_0_8px_#ffffff]" />
        </div>

        {/* 6. Active Word Display (Huge, Bold, Glowing White Typography) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`active-${activeNode.word}-${activeNode.globalIndex}`}
            initial={{ scale: 0.8, opacity: 0, y: 6 }}
            animate={{
              scale: 1.15,
              opacity: 1,
              y: 0,
            }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 480, damping: 24 }}
            className="mt-3.5 md:mt-4 text-center pointer-events-none whitespace-nowrap"
          >
            <span
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none"
              style={{
                fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
                textShadow:
                  "0 0 16px rgba(255,255,255,1), 0 0 35px rgba(255,255,255,0.85), 0 0 65px rgba(255,255,255,0.5)",
              }}
            >
              {activeNode.word}
            </span>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* 7. Constellation Starmap HUD Marker */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-50 text-[10px] font-mono tracking-widest text-zinc-400">
        <span>STARMAP NETWORK</span>
        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
        <span>BEAT SYNC</span>
      </div>
    </div>
  );
}
