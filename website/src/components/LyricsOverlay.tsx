"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LyricLine, LyricStyle } from "../lib/types";

interface LyricsOverlayProps {
  lyrics: LyricLine[];
  currentTime: number;
  style: LyricStyle;
  fontSize: number;
  glowColor: string;
}

export function LyricsOverlay({
  lyrics,
  currentTime,
  style,
  fontSize,
  glowColor,
}: LyricsOverlayProps) {
  // Find currently active line and upcoming lines
  const { currentLineIndex, currentLine } = useMemo(() => {
    let activeIdx = lyrics.findIndex(
      (l) => currentTime >= l.start && currentTime <= l.end
    );
    if (activeIdx === -1) {
      // Find the closest past line or first line
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (currentTime >= lyrics[i].start) {
          activeIdx = i;
          break;
        }
      }
    }
    if (activeIdx === -1 && lyrics.length > 0) activeIdx = 0;
    return {
      currentLineIndex: activeIdx,
      currentLine: lyrics[activeIdx] || lyrics[0],
    };
  }, [lyrics, currentTime]);

  const prevLine = lyrics[currentLineIndex - 1];
  const nextLine = lyrics[currentLineIndex + 1];

  // Helper to determine if a word is currently spoken/sung
  const renderLineWords = (line: LyricLine) => {
    if (!line.words || line.words.length === 0) {
      return <span>{line.text}</span>;
    }

    return (
      <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        {line.words.map((w, idx) => {
          const isPassed = currentTime >= w.end;
          const isCurrent = currentTime >= w.start && currentTime < w.end;

          if (style === "fisheye") {
            return (
              <motion.span
                key={idx}
                animate={{
                  scale: isCurrent ? 1.3 : isPassed ? 1 : 0.9,
                  opacity: isCurrent ? 1 : isPassed ? 0.8 : 0.4,
                  filter: isCurrent
                    ? `drop-shadow(0 0 12px ${glowColor})`
                    : "none",
                }}
                transition={{ duration: 0.15 }}
                className={`font-semibold inline-block ${
                  isCurrent ? "text-white" : isPassed ? "text-zinc-200" : "text-zinc-500"
                }`}
              >
                {w.word}
              </motion.span>
            );
          }

          if (style === "waveform") {
            const waveBounce = isCurrent ? -8 : 0;
            return (
              <motion.span
                key={idx}
                animate={{
                  y: waveBounce,
                  color: isCurrent ? "#ffffff" : isPassed ? "#e4e4e7" : "#71717a",
                  filter: isCurrent ? `drop-shadow(0 0 16px ${glowColor})` : "none",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="font-medium inline-block"
              >
                {w.word}
              </motion.span>
            );
          }

          if (style === "constellation") {
            return (
              <motion.span
                key={idx}
                initial={{ opacity: 0.3 }}
                animate={{
                  opacity: isCurrent ? 1 : isPassed ? 0.75 : 0.25,
                  scale: isCurrent ? 1.15 : 1,
                  textShadow: isCurrent ? `0 0 20px ${glowColor}, 0 0 40px ${glowColor}` : "none",
                }}
                className={`inline-block tracking-wide font-mono ${
                  isCurrent ? "text-white" : "text-zinc-400"
                }`}
              >
                {w.word}
              </motion.span>
            );
          }

          if (style === "typewriter") {
            return (
              <span
                key={idx}
                className={`transition-colors duration-100 ${
                  isCurrent
                    ? "text-white font-bold underline decoration-indigo-400 decoration-2"
                    : isPassed
                    ? "text-zinc-200"
                    : "text-zinc-600"
                }`}
              >
                {w.word}
              </span>
            );
          }

          // Default "karaoke" style
          return (
            <span
              key={idx}
              className={`relative inline-block transition-all duration-150 ${
                isCurrent
                  ? "text-white font-bold scale-[1.08]"
                  : isPassed
                  ? "text-zinc-200 font-medium"
                  : "text-zinc-600"
              }`}
              style={{
                textShadow: isCurrent
                  ? `0 0 16px ${glowColor}, 0 0 32px ${glowColor}`
                  : "none",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="relative z-20 flex flex-col items-center justify-center text-center p-6 select-none max-w-4xl mx-auto min-h-[220px]">
      {/* Previous Line */}
      {prevLine && (
        <p className="text-zinc-600 text-sm md:text-base font-normal mb-3 transition-opacity duration-300 opacity-40 line-clamp-1">
          {prevLine.text}
        </p>
      )}

      {/* Active Line */}
      <AnimatePresence mode="wait">
        {currentLine && (
          <motion.div
            key={currentLine.text}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: `${fontSize}px` }}
            className="font-medium tracking-tight leading-relaxed px-4 py-2"
          >
            {renderLineWords(currentLine)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Line */}
      {nextLine && (
        <p className="text-zinc-500 text-sm md:text-base font-normal mt-3 transition-opacity duration-300 opacity-50 line-clamp-1">
          {nextLine.text}
        </p>
      )}
    </div>
  );
}
