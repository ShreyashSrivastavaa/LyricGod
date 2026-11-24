"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
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

interface StarmapWord {
  id: string;
  displayWord: string;
  cleanWord: string;
  start: number;
  end: number;
  globalIndex: number;
  x: number; // pixel coordinate
  y: number; // pixel coordinate
  hasSparkle: boolean;
}

interface StarmapEdge {
  id: string;
  fromIndex: number;
  toIndex: number;
  isCrossLink: boolean;
}

// Fast seeded PRNG (Mulberry32)
function createPRNG(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// Angle difference helper in range [-PI, PI]
function angleDiff(a: number, b: number) {
  let diff = a - b;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  return diff;
}

export function ConstellationLyrics({
  allLyrics = [],
  currentLine,
  currentTime,
  glowColor = "#ffffff",
  bassPulse = 0,
}: ConstellationLyricsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 900,
    height: 520,
  });

  // Track container dimensions via ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 1. Flatten all song words into chronological sequence with separate instances for repeated words
  const rawWords = useMemo(() => {
    const lines = allLyrics.length > 0 ? allLyrics : [currentLine];
    const list: {
      displayWord: string;
      cleanWord: string;
      start: number;
      end: number;
      globalIndex: number;
      id: string;
    }[] = [];

    let gIdx = 0;
    for (let lIdx = 0; lIdx < lines.length; lIdx++) {
      const line = lines[lIdx];
      if (line.words && line.words.length > 0) {
        for (const w of line.words) {
          const display = w.word;
          const clean = display.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»।]/g, "").trim();
          list.push({
            displayWord: display,
            cleanWord: clean || display,
            start: w.start,
            end: w.end,
            globalIndex: gIdx,
            id: `node-${gIdx}-${clean || "w"}`,
          });
          gIdx++;
        }
      } else if (line.text) {
        const tokens = line.text.split(" ").filter(Boolean);
        const dur = Math.max(1.8, (line.end - line.start) / (tokens.length || 1));
        tokens.forEach((tok, tIdx) => {
          const clean = tok.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»।]/g, "").trim();
          list.push({
            displayWord: tok,
            cleanWord: clean || tok,
            start: line.start + tIdx * dur,
            end: line.start + (tIdx + 1) * dur,
            globalIndex: gIdx,
            id: `node-${gIdx}-${clean || "w"}`,
          });
          gIdx++;
        });
      }
    }
    return list;
  }, [allLyrics, currentLine]);

  // 2. Identify the active singing word index
  const activeWordGlobalIdx = useMemo(() => {
    if (rawWords.length === 0) return 0;
    const found = rawWords.findIndex(
      (w) => currentTime >= w.start && currentTime <= w.end
    );
    if (found !== -1) return found;

    if (currentTime < rawWords[0].start) return 0;

    for (let i = rawWords.length - 1; i >= 0; i--) {
      if (currentTime >= rawWords[i].start) return i;
    }
    return rawWords.length - 1;
  }, [rawWords, currentTime]);

  // 3. Precompute Full Constrained Random Walk Starmap (Deterministic seeded RNG)
  const { allNodes, allEdges } = useMemo(() => {
    if (rawWords.length === 0) {
      return { allNodes: [], allEdges: [] };
    }

    const { width: W, height: H } = dimensions;

    // Seed = first song word + total count + container aspect
    const seedString = `${rawWords[0]?.cleanWord || "star"}_${rawWords.length}_${rawWords[Math.floor(rawWords.length / 2)]?.cleanWord || "cluster"}`;
    const rng = createPRNG(seedString);

    // Cluster box: centered, ~45% container width x ~40% container height
    // Padding 24px
    const clusterW = Math.max(260, W * 0.45);
    const clusterH = Math.max(200, H * 0.40);
    const cx = W / 2;
    const cy = H / 2;

    const xmin = cx - clusterW / 2 + 24;
    const xmax = cx + clusterW / 2 - 24;
    const ymin = cy - clusterH / 2 + 24;
    const ymax = cy + clusterH / 2 - 24;

    const nodes: StarmapWord[] = [];
    const edges: StarmapEdge[] = [];
    const existingEdgeSet = new Set<string>();

    const addEdge = (fromIdx: number, toIdx: number, isCrossLink: boolean) => {
      const a = Math.min(fromIdx, toIdx);
      const b = Math.max(fromIdx, toIdx);
      const key = `${a}-${b}`;
      if (existingEdgeSet.has(key)) return;
      existingEdgeSet.add(key);
      edges.push({
        id: `edge-${key}`,
        fromIndex: a,
        toIndex: b,
        isCrossLink,
      });
    };

    // First node starts close to center
    let currentX = cx + (rng() - 0.5) * 40;
    let currentY = cy + (rng() - 0.5) * 40;
    let currentDir = rng() * 2 * Math.PI;

    // Scale step lengths appropriately for narrow mobile screens
    const scaleFactor = Math.min(1.0, Math.max(0.65, W / 1000));
    const minStep = 50 * scaleFactor;
    const maxStep = 130 * scaleFactor;

    for (let i = 0; i < rawWords.length; i++) {
      const w = rawWords[i];

      if (i > 0) {
        let bestCandidateX = currentX;
        let bestCandidateY = currentY;
        let bestCandidateDir = currentDir;
        let foundValid = false;

        // Try up to 8 times to find a step that respects turn angle, gravity, bounds, and min distance
        for (let attempt = 0; attempt < 8; attempt++) {
          const stepLen = minStep + rng() * (maxStep - minStep);

          // Random turn of 40 to 140 degrees (left or right). Never allow |turn| < 35 degrees!
          const turnAngleDeg = 40 + rng() * 100;
          const turnDir = rng() < 0.5 ? -1 : 1;
          const turnRad = (turnAngleDeg * Math.PI) / 180 * turnDir;

          let candidateDir = currentDir + turnRad;

          // Weak gravity toward cluster center (~15% pull) so walk never drifts out
          const angleToCenter = Math.atan2(cy - currentY, cx - currentX);
          const diff = angleDiff(angleToCenter, candidateDir);
          candidateDir += 0.15 * diff;

          let candX = currentX + Math.cos(candidateDir) * stepLen;
          let candY = currentY + Math.sin(candidateDir) * stepLen;

          // Boundary bounce / reflection inside cluster box
          if (candX < xmin) {
            candX = xmin + (xmin - candX) * 0.5;
            candidateDir = Math.PI - candidateDir;
          } else if (candX > xmax) {
            candX = xmax - (candX - xmax) * 0.5;
            candidateDir = Math.PI - candidateDir;
          }

          if (candY < ymin) {
            candY = ymin + (ymin - candY) * 0.5;
            candidateDir = -candidateDir;
          } else if (candY > ymax) {
            candY = ymax - (candY - ymax) * 0.5;
            candidateDir = -candidateDir;
          }

          // Ensure strictly inside box
          candX = Math.max(xmin, Math.min(xmax, candX));
          candY = Math.max(ymin, Math.min(ymax, candY));

          // Check minimum 36px distance to existing nodes in recent cluster
          let tooClose = false;
          const checkBack = Math.max(0, i - 15);
          for (let j = checkBack; j < i; j++) {
            const dx = candX - nodes[j].x;
            const dy = candY - nodes[j].y;
            if (dx * dx + dy * dy < 36 * 36) {
              tooClose = true;
              break;
            }
          }

          if (!tooClose) {
            bestCandidateX = candX;
            bestCandidateY = candY;
            bestCandidateDir = candidateDir;
            foundValid = true;
            break;
          }

          // Fallback candidate
          bestCandidateX = candX;
          bestCandidateY = candY;
          bestCandidateDir = candidateDir;
        }

        currentX = bestCandidateX;
        currentY = bestCandidateY;
        currentDir = bestCandidateDir;
      }

      // 1 in 5 stars gets a decorative tiny 4-point sparkle
      const hasSparkle = rng() < 0.22;

      nodes.push({
        ...w,
        x: Math.round(currentX * 10) / 10,
        y: Math.round(currentY * 10) / 10,
        hasSparkle,
      });

      // Connect edges
      if (i > 0) {
        // 1. Always connect to previous node (solid line, opacity 0.7)
        addEdge(i - 1, i, false);

        // 2. ~65% probability connect to 1-2 nearest nodes among last 8 within 170px (cross-link)
        if (rng() < 0.65) {
          const maxLookback = Math.max(0, i - 8);
          const candidates: { idx: number; dist: number }[] = [];

          for (let prevIdx = i - 2; prevIdx >= maxLookback; prevIdx--) {
            const prevNode = nodes[prevIdx];
            const dist = Math.hypot(currentX - prevNode.x, currentY - prevNode.y);
            if (dist <= 170 * scaleFactor) {
              candidates.push({ idx: prevIdx, dist });
            }
          }

          candidates.sort((a, b) => a.dist - b.dist);

          const crossLinksCount = Math.min(candidates.length, rng() < 0.35 ? 2 : 1);
          for (let c = 0; c < crossLinksCount; c++) {
            addEdge(candidates[c].idx, i, true);
          }
        }
      }
    }

    return { allNodes: nodes, allEdges: edges };
  }, [rawWords, dimensions]);

  // 4. Rolling Window: Keep last ~14-18 nodes (fade older over 600ms)
  const WINDOW_SIZE = 16;
  const PREV_NODES_COUNT = 14;

  const windowMinIdx = Math.max(0, activeWordGlobalIdx - PREV_NODES_COUNT);
  const windowMaxIdx = Math.min(allNodes.length - 1, activeWordGlobalIdx + 2);

  // Nodes currently in active view
  const visibleNodes = useMemo(() => {
    return allNodes.filter(
      (n) => n.globalIndex >= windowMinIdx && n.globalIndex <= windowMaxIdx
    );
  }, [allNodes, windowMinIdx, windowMaxIdx]);

  const visibleNodeIndices = useMemo(() => {
    const s = new Set<number>();
    visibleNodes.forEach((n) => s.add(n.globalIndex));
    return s;
  }, [visibleNodes]);

  // Edges within active view
  const visibleEdges = useMemo(() => {
    return allEdges.filter(
      (e) => visibleNodeIndices.has(e.fromIndex) && visibleNodeIndices.has(e.toIndex)
    );
  }, [allEdges, visibleNodeIndices]);

  // Active target node
  const activeNode =
    allNodes[activeWordGlobalIdx] ||
    allNodes[0] || { x: dimensions.width / 2, y: dimensions.height / 2, displayWord: "" };

  // 5. Camera Translate: Slowly translate whole group if reticle moves beyond 70% of cluster box
  const cameraOffset = useMemo(() => {
    const { width: W, height: H } = dimensions;
    const cx = W / 2;
    const cy = H / 2;
    const clusterW = W * 0.45;
    const clusterH = H * 0.40;

    const thresholdX = (clusterW * 0.7) / 2;
    const thresholdY = (clusterH * 0.7) / 2;

    const dx = activeNode.x - cx;
    const dy = activeNode.y - cy;

    let shiftX = 0;
    let shiftY = 0;

    if (Math.abs(dx) > thresholdX) {
      shiftX = (Math.abs(dx) - thresholdX) * (dx > 0 ? -0.8 : 0.8);
    }
    if (Math.abs(dy) > thresholdY) {
      shiftY = (Math.abs(dy) - thresholdY) * (dy > 0 ? -0.8 : 0.8);
    }

    return { x: Math.round(shiftX), y: Math.round(shiftY) };
  }, [activeNode, dimensions]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[420px] sm:h-[480px] md:h-[540px] select-none overflow-hidden flex items-center justify-center font-sans"
      style={{
        fontFamily:
          'var(--font-geist-sans), "Noto Sans Devanagari", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Subtle atmospheric mist cloud behind the constellation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[700px] h-[300px] md:h-[420px] rounded-full blur-[90px] opacity-20 pointer-events-none transition-transform duration-300"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(200,215,245,0.15) 40%, transparent 75%)",
            transform: `translate(-50%, -50%) scale(${1 + bassPulse * 0.12})`,
          }}
        />
      </div>

      {/* Main Constellation Canvas Group (Moves smoothly with cameraOffset) */}
      <motion.div
        className="absolute inset-0 w-full h-full pointer-events-none"
        animate={{
          x: cameraOffset.x,
          y: cameraOffset.y,
        }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {/* SVG Network: Lines and Nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="active-line-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Thin white constellation lines (0.75-1px, ~60% opacity) */}
          {visibleEdges.map((edge) => {
            const nFrom = allNodes[edge.fromIndex];
            const nTo = allNodes[edge.toIndex];
            if (!nFrom || !nTo) return null;

            const isSolidPassed = edge.toIndex <= activeWordGlobalIdx && !edge.isCrossLink;
            const isLatestEdge = edge.toIndex === activeWordGlobalIdx && edge.fromIndex === activeWordGlobalIdx - 1;

            return (
              <line
                key={edge.id}
                x1={nFrom.x}
                y1={nFrom.y}
                x2={nTo.x}
                y2={nTo.y}
                stroke={
                  isLatestEdge
                    ? "#ffffff"
                    : isSolidPassed
                    ? "rgba(255, 255, 255, 0.72)"
                    : edge.isCrossLink
                    ? "rgba(255, 255, 255, 0.35)"
                    : "rgba(255, 255, 255, 0.55)"
                }
                strokeWidth={isLatestEdge ? 1.3 : edge.isCrossLink ? 0.75 : 0.95}
                strokeDasharray={edge.isCrossLink ? "3 3" : undefined}
                filter={isLatestEdge ? "url(#active-line-glow)" : undefined}
                style={{
                  transition: "stroke 0.25s ease-out, stroke-width 0.25s ease-out",
                }}
              />
            );
          })}

          {/* 2. Star Nodes (Small dots 3-4px with soft glow, some with 4-point sparkle) */}
          {visibleNodes.map((node) => {
            const isActive = node.globalIndex === activeWordGlobalIdx;
            const isPassed = node.globalIndex < activeWordGlobalIdx;

            // Distance from active for gradual fading of older nodes
            const age = activeWordGlobalIdx - node.globalIndex;
            const nodeOpacity = age > 14 ? Math.max(0.2, 1 - (age - 14) * 0.2) : 1;

            return (
              <g
                key={`star-g-${node.id}`}
                className="transition-opacity duration-500"
                style={{ opacity: nodeOpacity }}
              >
                {/* Star Dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isActive ? 4 : isPassed ? 3.5 : 2.8}
                  fill={isActive ? "#ffffff" : "rgba(255, 255, 255, 0.9)"}
                  filter="url(#star-glow)"
                  className="transition-all duration-200"
                />

                {/* 4-point sparkle decorative accent for select stars */}
                {node.hasSparkle && !isActive && (
                  <path
                    d={`M ${node.x} ${node.y - 4} Q ${node.x} ${node.y} ${node.x + 4} ${node.y} Q ${node.x} ${node.y} ${node.x} ${node.y + 4} Q ${node.x} ${node.y} ${node.x - 4} ${node.y} Z`}
                    fill="rgba(255, 255, 255, 0.65)"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* 3. Small Word Labels (11-13px, light weight, ~50-70% opacity sitting RIGHT ON stars with 2-6px offset) */}
        {visibleNodes.map((node) => {
          const isActive = node.globalIndex === activeWordGlobalIdx;
          if (isActive) return null; // Active word rendered prominently by reticle

          const isPassed = node.globalIndex < activeWordGlobalIdx;
          const age = activeWordGlobalIdx - node.globalIndex;
          const labelOpacity = age > 12 ? Math.max(0.3, 0.7 - (age - 12) * 0.1) : isPassed ? 0.65 : 0.45;

          return (
            <div
              key={`label-${node.id}`}
              className="absolute pointer-events-none transition-opacity duration-500"
              style={{
                left: node.x + 3,
                top: node.y - 14,
                opacity: labelOpacity,
                whiteSpace: "nowrap",
              }}
            >
              <span
                className="text-[11px] sm:text-[12px] font-normal tracking-tight text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
                style={{
                  fontFamily:
                    'var(--font-geist-sans), "Noto Sans Devanagari", sans-serif',
                }}
              >
                {node.displayWord}
              </span>
            </div>
          );
        })}

        {/* 4. Active Reticle + Big Word (Radius 28-32px ring, ticks, glowing center dot, big bold word) */}
        <motion.div
          className="absolute pointer-events-none flex items-center"
          animate={{
            x: activeNode.x,
            y: activeNode.y,
          }}
          transition={{
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1], // ease-out cubic 300-400ms
          }}
          style={{
            top: 0,
            left: 0,
          }}
        >
          {/* Reticle Target Ring (Radius ~28-32px -> Diameter 58px) */}
          <div className="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shrink-0">
            {/* Main Ring */}
            <motion.div
              animate={{
                scale: [0.95, 1.05, 1],
              }}
              transition={{ duration: 0.3 }}
              className="w-[58px] h-[58px] rounded-full border border-white/70 shadow-[0_0_16px_rgba(255,255,255,0.6)] flex items-center justify-center"
            >
              {/* Glowing center dot */}
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            </motion.div>

            {/* Crosshair Ticks (Small, elegant ticks) */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-white/90" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-white/90" />
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-[1px] w-2 bg-white/90" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-[1px] w-2 bg-white/90" />
          </div>

          {/* Active Word (Large 28-36px, bold, soft white glow, right next to reticle) */}
          <div className="relative -translate-y-1/2 ml-3">
            <AnimatePresence mode="wait">
              <motion.span
                key={`active-${activeNode.id}`}
                initial={{ opacity: 0, scale: 0.75, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="inline-block text-[28px] sm:text-[32px] md:text-[36px] font-bold text-white tracking-tight leading-none whitespace-nowrap"
                style={{
                  fontFamily:
                    'var(--font-geist-sans), "Noto Sans Devanagari", sans-serif',
                  textShadow:
                    "0 0 14px rgba(255,255,255,0.95), 0 0 28px rgba(255,255,255,0.65), 0 0 45px rgba(255,255,255,0.35)",
                }}
              >
                {activeNode.displayWord}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Discrete HUD Label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-40 text-[10px] font-mono tracking-widest text-zinc-400 pointer-events-none">
        <span>STARMAP RETICLE SYNC</span>
        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
      </div>
    </div>
  );
}
