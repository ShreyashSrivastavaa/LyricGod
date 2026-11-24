"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LyricLine } from "../lib/types";

// Tuning constants exposed as requested
export const MAX_NODES = 8;
export const MIN_EDGE = 70;
export const MAX_EDGE = 120;
export const MIN_TURN_DEG = 35;
export const NODE_TTL_MS = 6000;
export const CLUSTER_WIDTH_PCT = 0.30;
export const CLUSTER_HEIGHT_PCT = 0.30;
export const MIN_NODE_DIST = 48;
export const LINE_GAP_RESET_SEC = 2.5;

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
  clusterIndex: number; // local cluster index
  clusterId: number;
  x: number; // coordinate relative to cluster origin
  y: number; // coordinate relative to cluster origin
  dir: number; // angle in radians
  hasSparkle: boolean;
}

interface StarmapEdge {
  id: string;
  fromIndex: number;
  toIndex: number;
  fromNode: StarmapWord;
  toNode: StarmapWord;
  isCrossLink: boolean;
  isNewest: boolean;
}

// 70 static star-dust particles with 5-15% opacity for faint parallax
const STAR_DUST = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 37.19) % 100,
  y: (i * 59.27) % 100,
  size: i % 4 === 0 ? 1.6 : 1.0,
  opacity: 0.05 + ((i % 5) * 0.025), // 0.05 to 0.15
}));

// Deterministic PRNG (Mulberry32)
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

// Segment-intersection test: counter-clockwise algorithm
function ccw(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) {
  return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
}

function segmentsIntersect(
  a1: { x: number; y: number },
  a2: { x: number; y: number },
  b1: { x: number; y: number },
  b2: { x: number; y: number }
): boolean {
  // If endpoints touch or match, they don't cross
  if (
    (Math.abs(a1.x - b1.x) < 0.1 && Math.abs(a1.y - b1.y) < 0.1) ||
    (Math.abs(a1.x - b2.x) < 0.1 && Math.abs(a1.y - b2.y) < 0.1) ||
    (Math.abs(a2.x - b1.x) < 0.1 && Math.abs(a2.y - b1.y) < 0.1) ||
    (Math.abs(a2.x - b2.x) < 0.1 && Math.abs(a2.y - b2.y) < 0.1)
  ) {
    return false;
  }
  return ccw(a1, b1, b2) !== ccw(a2, b1, b2) && ccw(a1, a2, b1) !== ccw(a1, a2, b2);
}

// Approximate distance from point to segment
function distToSegment(
  p: { x: number; y: number },
  v: { x: number; y: number },
  w: { x: number; y: number }
) {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

// Angle difference in range [-PI, PI]
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
  glowColor = "#8B8CFF",
  bassPulse = 0,
}: ConstellationLyricsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1000,
    height: 560,
  });

  const lastSeekTimeRef = useRef<number>(currentTime);
  const [ambientTick, setAmbientTick] = useState(0);

  // Measure container dimensions
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

  // Ambient gentle drift (+-3px sin wave, 8s period)
  useEffect(() => {
    let animId: number;
    const tick = () => {
      setAmbientTick(performance.now() / 8000);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Detect seek / jump (>1.5s skip)
  const isSeekJump = Math.abs(currentTime - lastSeekTimeRef.current) > 1.5;
  lastSeekTimeRef.current = currentTime;

  // 1. Flatten all song words into chronological sequence (non-empty tokens, preserve repeated words as separate nodes)
  const allSongWords = useMemo(() => {
    const lines = allLyrics.length > 0 ? allLyrics : [currentLine];
    const list: {
      displayWord: string;
      cleanWord: string;
      start: number;
      end: number;
      globalIndex: number;
      lineGapAfter: boolean;
    }[] = [];

    let gIdx = 0;
    for (let lIdx = 0; lIdx < lines.length; lIdx++) {
      const line = lines[lIdx];
      const nextLine = lines[lIdx + 1];
      const isLastInLine = (idx: number, total: number) => idx === total - 1;

      if (line.words && line.words.length > 0) {
        const words = line.words;
        const total = words.length;
        words.forEach((w, wIdx) => {
          const display = w.word;
          // Filter out pure punctuation or empty strings
          const clean = display.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»।]/g, "").trim();
          if (!clean && !display.trim()) return;

          const isLastWord = isLastInLine(wIdx, total);
          const nextStart = isLastWord ? (nextLine?.start || w.end + 3) : words[wIdx + 1]?.start || w.end;
          const gap = nextStart - w.end;
          const lineGapAfter = isLastWord || gap > LINE_GAP_RESET_SEC;

          list.push({
            displayWord: display,
            cleanWord: clean || display,
            start: w.start,
            end: w.end,
            globalIndex: gIdx++,
            lineGapAfter,
          });
        });
      } else if (line.text) {
        const tokens = line.text.split(" ").filter(Boolean);
        const total = tokens.length;
        const dur = Math.max(1.5, (line.end - line.start) / (total || 1));

        tokens.forEach((tok, tIdx) => {
          const clean = tok.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»।]/g, "").trim();
          if (!clean && !tok.trim()) return;

          const isLastWord = isLastInLine(tIdx, total);
          const lineGapAfter = isLastWord || (nextLine ? (nextLine.start - line.end) > LINE_GAP_RESET_SEC : true);

          list.push({
            displayWord: tok,
            cleanWord: clean || tok,
            start: line.start + tIdx * dur,
            end: line.start + (tIdx + 1) * dur,
            globalIndex: gIdx++,
            lineGapAfter,
          });
        });
      }
    }
    return list;
  }, [allLyrics, currentLine]);

  // 2. Find currently active word
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

  // 3. Precompute Full Constellation Node Map & Edge Network using Constrained Random Walk
  const { allNodes, allEdges } = useMemo(() => {
    if (allSongWords.length === 0) {
      return { allNodes: [], allEdges: [] };
    }

    const { width: W, height: H } = dimensions;
    const scaleFactor = Math.min(1.0, Math.max(0.65, W / 1920));

    const minEdgeLen = MIN_EDGE * scaleFactor;
    const maxEdgeLen = Math.min(140, MAX_EDGE * scaleFactor);

    // Box bounds: roughly 28-32% width x 30% height
    const boxW = Math.max(240, W * CLUSTER_WIDTH_PCT);
    const boxH = Math.max(180, H * CLUSTER_HEIGHT_PCT);
    const halfBW = boxW / 2;
    const halfBH = boxH / 2;

    const nodes: StarmapWord[] = [];
    const edges: StarmapEdge[] = [];
    const existingEdgesSet = new Set<string>();

    let clusterId = 0;
    let clusterIdx = 0;
    let currentX = 0;
    let currentY = 0;
    let currentDir = 0;

    for (let i = 0; i < allSongWords.length; i++) {
      const w = allSongWords[i];
      const rng = createPRNG(`${w.cleanWord}_${w.globalIndex}_${clusterId}`);

      // If starting fresh cluster (at start or after long gap > 2.5s)
      const prevWord = allSongWords[i - 1];
      const startNewCluster = i === 0 || (prevWord && prevWord.lineGapAfter);

      if (startNewCluster) {
        clusterId++;
        clusterIdx = 0;
        currentX = (rng() - 0.5) * 30;
        currentY = (rng() - 0.5) * 30;
        currentDir = rng() * 2 * Math.PI;
      } else {
        // Step with Constrained Random Walk:
        // Turn between 35 and 100 degrees (random sign). Never colinear.
        const turnDeg = MIN_TURN_DEG + rng() * (100 - MIN_TURN_DEG);
        const turnSign = rng() < 0.5 ? -1 : 1;
        const turnRad = (turnDeg * Math.PI) / 180 * turnSign;

        let bestCandX = currentX;
        let bestCandY = currentY;
        let bestCandDir = currentDir;
        let foundNoIntersect = false;
        let bestScore = -Infinity;

        // Try up to 12 angles to guarantee NO CROSSING EDGES
        for (let attempt = 0; attempt < 12; attempt++) {
          const step = minEdgeLen + rng() * (maxEdgeLen - minEdgeLen);
          let candDir = currentDir + turnRad + (attempt * 0.45 * turnSign);

          // Weak gravity toward center (15% pull)
          const angleToCenter = Math.atan2(0 - currentY, 0 - currentX);
          candDir += 0.15 * angleDiff(angleToCenter, candDir);

          let candX = currentX + Math.cos(candDir) * step;
          let candY = currentY + Math.sin(candDir) * step;

          // Reflect inside cluster box
          if (candX < -halfBW) candX = -halfBW + 10;
          if (candX > halfBW) candX = halfBW - 10;
          if (candY < -halfBH) candY = -halfBH + 10;
          if (candY > halfBH) candY = halfBH - 10;

          // Minimum distance 48px from existing nodes in current cluster
          let tooClose = false;
          const checkStart = Math.max(0, i - MAX_NODES);
          for (let j = checkStart; j < i; j++) {
            if (nodes[j].clusterId !== clusterId) continue;
            if (Math.hypot(candX - nodes[j].x, candY - nodes[j].y) < MIN_NODE_DIST * scaleFactor) {
              tooClose = true;
              break;
            }
          }

          if (tooClose && attempt < 10) continue;

          // Test segment intersection against all active edges in current cluster
          const newSegStart = { x: currentX, y: currentY };
          const newSegEnd = { x: candX, y: candY };
          let intersectsAny = false;

          for (let e = edges.length - 1; e >= 0; e--) {
            const edge = edges[e];
            if (edge.fromNode.clusterId !== clusterId) break;
            if (segmentsIntersect(newSegStart, newSegEnd, edge.fromNode, edge.toNode)) {
              intersectsAny = true;
              break;
            }
          }

          if (!intersectsAny) {
            bestCandX = candX;
            bestCandY = candY;
            bestCandDir = candDir;
            foundNoIntersect = true;
            break;
          }

          // Fallback: keep track of candidate with maximum distance to existing edges
          let minDist = 999;
          for (let e = edges.length - 1; e >= 0; e--) {
            const edge = edges[e];
            if (edge.fromNode.clusterId !== clusterId) break;
            const d = distToSegment(newSegEnd, edge.fromNode, edge.toNode);
            if (d < minDist) minDist = d;
          }
          if (minDist > bestScore) {
            bestScore = minDist;
            bestCandX = candX;
            bestCandY = candY;
            bestCandDir = candDir;
          }
        }

        currentX = bestCandX;
        currentY = bestCandY;
        currentDir = bestCandDir;
        clusterIdx++;
      }

      const hasSparkle = rng() < 0.25;
      const node: StarmapWord = {
        id: `node-${w.globalIndex}-${w.cleanWord}`,
        displayWord: w.displayWord,
        cleanWord: w.cleanWord,
        start: w.start,
        end: w.end,
        globalIndex: w.globalIndex,
        clusterIndex: clusterIdx,
        clusterId,
        x: Math.round(currentX * 10) / 10,
        y: Math.round(currentY * 10) / 10,
        dir: currentDir,
        hasSparkle,
      };

      nodes.push(node);

      // Edges for this node
      if (!startNewCluster && i > 0) {
        const prevNode = nodes[i - 1];

        // 1. Primary solid sequential edge
        const primaryEdge: StarmapEdge = {
          id: `edge-${prevNode.globalIndex}-${node.globalIndex}`,
          fromIndex: prevNode.globalIndex,
          toIndex: node.globalIndex,
          fromNode: prevNode,
          toNode: node,
          isCrossLink: false,
          isNewest: true,
        };
        edges.push(primaryEdge);
        existingEdgesSet.add(`${prevNode.globalIndex}-${node.globalIndex}`);

        // 2. Optional clean cross-link (only 1 per node, to nearest among last 5 within 130px, closing triangles without crossing)
        if (clusterIdx >= 2 && rng() < 0.65) {
          const maxLookback = Math.max(0, i - 5);
          let bestCrossNode: StarmapWord | null = null;
          let bestCrossDist = 999;

          for (let prevIdx = i - 2; prevIdx >= maxLookback; prevIdx--) {
            const pNode = nodes[prevIdx];
            if (pNode.clusterId !== clusterId) break;
            const dist = Math.hypot(node.x - pNode.x, node.y - pNode.y);

            if (dist <= 130 * scaleFactor && dist < bestCrossDist) {
              // Check if cross-link would intersect any existing edge
              let crossIntersects = false;
              for (let e = edges.length - 1; e >= 0; e--) {
                const ed = edges[e];
                if (ed.fromNode.clusterId !== clusterId) break;
                if (segmentsIntersect(node, pNode, ed.fromNode, ed.toNode)) {
                  crossIntersects = true;
                  break;
                }
              }

              if (!crossIntersects) {
                bestCrossDist = dist;
                bestCrossNode = pNode;
              }
            }
          }

          if (bestCrossNode) {
            const key = `${bestCrossNode.globalIndex}-${node.globalIndex}`;
            if (!existingEdgesSet.has(key)) {
              existingEdgesSet.add(key);
              edges.push({
                id: `cross-${key}`,
                fromIndex: bestCrossNode.globalIndex,
                toIndex: node.globalIndex,
                fromNode: bestCrossNode,
                toNode: node,
                isCrossLink: true,
                isNewest: false,
              });
            }
          }
        }
      }
    }

    return { allNodes: nodes, allEdges: edges };
  }, [allSongWords, dimensions]);

  // 4. Rolling Window: Keep ONLY the last 8 nodes alive (MAX_NODES = 8)
  // Expire by age & by time (NODE_TTL_MS = 6000)
  const { visibleNodes, visibleEdges, activeNode, nextHintVector } = useMemo(() => {
    if (allNodes.length === 0) {
      const fallbackNode: StarmapWord = {
        id: "fallback-0",
        displayWord: "",
        cleanWord: "",
        start: 0,
        end: 0,
        globalIndex: 0,
        clusterIndex: 0,
        clusterId: 0,
        x: 0,
        y: 0,
        dir: 0,
        hasSparkle: false,
      };
      return {
        visibleNodes: [],
        visibleEdges: [],
        activeNode: fallbackNode,
        nextHintVector: null,
      };
    }

    const active = allNodes[activeWordGlobalIdx] || allNodes[0];

    // Node opacities by age: newest = 1.0, then 0.85, 0.7, 0.55, 0.4, 0.28, 0.18, 0.1
    const AGE_OPACITIES = [1.0, 0.85, 0.7, 0.55, 0.4, 0.28, 0.18, 0.1];

    // Filter to last MAX_NODES in current cluster
    const clusterNodes = allNodes.filter(
      (n) =>
        n.clusterId === active.clusterId &&
        n.globalIndex <= active.globalIndex &&
        n.globalIndex >= active.globalIndex - (MAX_NODES - 1)
    );

    // Filter out nodes older than 6s
    const timeBoundedNodes = clusterNodes.filter((n) => {
      const ageMs = (currentTime - n.end) * 1000;
      return ageMs <= NODE_TTL_MS;
    });

    const activeList = isSeekJump ? timeBoundedNodes.slice(-3) : timeBoundedNodes;

    // Attach computed opacity to each node
    const nodeOpacityMap = new Map<number, number>();
    activeList.forEach((n) => {
      const ageRank = active.globalIndex - n.globalIndex;
      const baseOp = AGE_OPACITIES[Math.min(ageRank, AGE_OPACITIES.length - 1)] ?? 0.1;

      // Time fade over last 1 second before 6s TTL
      const ageSec = currentTime - n.end;
      let timeFactor = 1.0;
      if (ageSec > (NODE_TTL_MS / 1000) - 1.0) {
        timeFactor = Math.max(0, (NODE_TTL_MS / 1000 - ageSec));
      }

      const finalOpacity = Math.max(0.1, baseOp * timeFactor);
      nodeOpacityMap.set(n.globalIndex, finalOpacity);
    });

    const activeNodeIndices = new Set(activeList.map((n) => n.globalIndex));

    // Filter edges: An edge dies together with its OLDER endpoint
    // Edge opacity = min(opacity of endpoints) * 0.7 (or * 0.35 for cross-links)
    const activeEdges = allEdges
      .filter((e) => activeNodeIndices.has(e.fromIndex) && activeNodeIndices.has(e.toIndex))
      .map((e) => {
        const opFrom = nodeOpacityMap.get(e.fromIndex) || 0.5;
        const opTo = nodeOpacityMap.get(e.toIndex) || 0.5;
        const edgeOpacity = Math.min(opFrom, opTo) * (e.isCrossLink ? 0.35 : 0.7);
        const isNewest = e.toIndex === active.globalIndex;
        return {
          ...e,
          opacity: edgeOpacity,
          isNewest,
        };
      });

    // Next beat hint: faint dashed line from reticle toward predicted next position, 30% opacity, 40px long
    let hint: { x1: number; y1: number; x2: number; y2: number } | null = null;
    const nextWord = allNodes[active.globalIndex + 1];
    if (nextWord && nextWord.clusterId === active.clusterId) {
      const angle = Math.atan2(nextWord.y - active.y, nextWord.x - active.x);
      hint = {
        x1: active.x,
        y1: active.y,
        x2: active.x + Math.cos(angle) * 40,
        y2: active.y + Math.sin(angle) * 40,
      };
    }

    return {
      visibleNodes: activeList.map((n) => ({
        ...n,
        opacity: nodeOpacityMap.get(n.globalIndex) || 1.0,
      })),
      visibleEdges: activeEdges,
      activeNode: active,
      nextHintVector: hint,
    };
  }, [allNodes, allEdges, activeWordGlobalIdx, currentTime, isSeekJump]);

  // 5. Camera Follow: The newest node (reticle) is the camera target
  // Smoothly translates the whole group so the reticle drifts to center (0, 0)
  const ambientDriftX = Math.sin(ambientTick * Math.PI * 2) * 3;
  const ambientDriftY = Math.cos(ambientTick * Math.PI * 2) * 2;

  const cameraTargetX = -activeNode.x;
  const cameraTargetY = -activeNode.y;

  // Clamped active word safe placement so it never clips off-screen
  const activeWordYOffset = 18; // 18px gap below reticle

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[440px] sm:h-[500px] md:h-[580px] select-none overflow-hidden flex items-center justify-center"
      style={{
        fontFamily:
          'Inter, "Noto Sans Devanagari", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* 1. Star-dust background: 70 faint static dots at 5-15% opacity with parallax (20% camera speed) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          x: cameraTargetX * 0.2,
          y: cameraTargetY * 0.2,
        }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <svg className="w-full h-full">
          {STAR_DUST.map((star, idx) => (
            <circle
              key={`dust-${idx}`}
              cx={`${star.x}%`}
              cy={`${star.y}%`}
              r={star.size}
              fill="#ffffff"
              opacity={star.opacity}
            />
          ))}
        </svg>
      </motion.div>

      {/* 2. Main Constellation Graph Group: Camera centered around active node */}
      <motion.div
        className="absolute top-0 left-0 pointer-events-none"
        animate={{
          x: dimensions.width / 2 + cameraTargetX + ambientDriftX,
          y: dimensions.height / 2 + cameraTargetY + ambientDriftY,
        }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1], // ~500ms smooth settle
        }}
        style={{
          width: 0,
          height: 0,
        }}
      >
        {/* SVG Network: Lines & Star Nodes (Cap DOM at ~30 elements) */}
        <svg className="overflow-visible pointer-events-none absolute inset-0">
          <defs>
            <filter id="accent-edge-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="star-dot-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Faint next-beat hint line (30% opacity, 40px long, single dashed line) */}
          {nextHintVector && (
            <line
              x1={nextHintVector.x1}
              y1={nextHintVector.y1}
              x2={nextHintVector.x2}
              y2={nextHintVector.y2}
              stroke={glowColor}
              strokeWidth={0.8}
              strokeDasharray="3 3"
              opacity={0.3}
            />
          )}

          {/* Edges: 0.75-1px white (#EDEFF7) or 1.5px accent glow on newest edge */}
          {visibleEdges.map((edge) => (
            <line
              key={edge.id}
              x1={edge.fromNode.x}
              y1={edge.fromNode.y}
              x2={edge.toNode.x}
              y2={edge.toNode.y}
              stroke={edge.isNewest ? glowColor : "#EDEFF7"}
              strokeWidth={edge.isNewest ? 1.5 : edge.isCrossLink ? 0.5 : 0.85}
              opacity={edge.opacity}
              filter={edge.isNewest ? "url(#accent-edge-glow)" : undefined}
              style={{
                transition: "opacity 0.4s ease-out, stroke 0.28s ease-out",
              }}
            />
          ))}

          {/* Star Nodes (3px dot with soft glow, newest star 5px with subtle 4-point sparkle) */}
          {visibleNodes.map((node) => {
            const isNewest = node.globalIndex === activeNode.globalIndex;
            return (
              <g
                key={`stardot-${node.id}`}
                style={{
                  opacity: node.opacity,
                  transition: "opacity 0.4s ease-out",
                }}
              >
                {/* 3px or 5px Star Dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isNewest ? 4.5 : 2.5}
                  fill={isNewest ? "#ffffff" : "#EDEFF7"}
                  filter="url(#star-dot-glow)"
                />

                {/* Subtle 4-point sparkle on newest star */}
                {isNewest && (
                  <path
                    d={`M ${node.x} ${node.y - 7} Q ${node.x} ${node.y} ${node.x + 7} ${node.y} Q ${node.x} ${node.y} ${node.x} ${node.y + 7} Q ${node.x} ${node.y} ${node.x - 7} ${node.y} Z`}
                    fill="#ffffff"
                    opacity={0.85}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Small Labels: 13px, weight 500, letter-spacing 0.02em at offset (+8px, -8px), text-shadow */}
        {visibleNodes.map((node) => {
          const isNewest = node.globalIndex === activeNode.globalIndex;
          if (isNewest) return null; // Active word rendered distinctly below reticle

          // Never go below 0.35 opacity until removed
          const labelOpacity = Math.max(0.35, node.opacity);

          return (
            <div
              key={`label-${node.id}`}
              className="absolute pointer-events-none"
              style={{
                left: node.x + 8,
                top: node.y - 8,
                opacity: labelOpacity,
                whiteSpace: "nowrap",
                transform: "translateY(-50%)",
                transition: "opacity 0.35s ease-out",
              }}
            >
              <span
                className="text-[13px] font-medium tracking-[0.02em] text-[#EDEFF7]"
                style={{
                  fontFamily: 'Inter, "Noto Sans Devanagari", sans-serif',
                  textShadow:
                    "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.95)",
                }}
              >
                {node.displayWord}
              </span>
            </div>
          );
        })}

        {/* Reticle: Thin ring (r=26px / diameter 52px), 4 ticks, soft pulse synced to beat */}
        <motion.div
          className="absolute pointer-events-none flex items-center justify-center"
          animate={{
            x: activeNode.x,
            y: activeNode.y,
          }}
          transition={{
            duration: 0.32,
            ease: [0.22, 1, 0.36, 1], // ease-out cubic 320ms
          }}
          style={{
            top: 0,
            left: 0,
          }}
        >
          {/* Reticle Circle & Crosshair Ticks */}
          <div className="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shrink-0">
            {/* Ring (r=26px -> w=52px, h=52px) */}
            <motion.div
              animate={{
                scale: bassPulse > 0.1 ? [1, 1.08, 1] : [1, 1.04, 1],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-[52px] h-[52px] rounded-full border border-white/80 flex items-center justify-center"
              style={{
                boxShadow: `0 0 20px ${glowColor}66, inset 0 0 10px ${glowColor}33`,
              }}
            >
              {/* Glowing center dot */}
              <div
                className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]"
              />
            </motion.div>

            {/* 4 small ticks */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-white" />
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-white" />
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-[1px] w-2 bg-white" />
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-[1px] w-2 bg-white" />
          </div>

          {/* Active Word: 40-48px, weight 800, white, glow (0 0 24px accent at 50%), 18px below reticle */}
          <div
            className="absolute top-[32px] left-1/2 -translate-x-1/2 whitespace-nowrap text-center pointer-events-none"
            style={{
              marginTop: `${activeWordYOffset}px`,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={`active-${activeNode.id}`}
                initial={{ opacity: 0, scale: 0.85, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="inline-block text-[38px] sm:text-[44px] md:text-[48px] font-extrabold text-white tracking-tight leading-none"
                style={{
                  fontFamily: 'Inter, "Noto Sans Devanagari", sans-serif',
                  textShadow: `0 0 24px ${glowColor}80, 0 0 45px ${glowColor}40, 0 1px 3px rgba(0,0,0,0.9)`,
                }}
              >
                {activeNode.displayWord}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Discrete bottom HUD indicator */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-35 text-[10px] font-mono tracking-widest text-zinc-400 pointer-events-none">
        <span>STARMAP NETWORK</span>
        <span className="w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#ffffff]" />
        <span>BEAT SYNC</span>
      </div>
    </div>
  );
}
