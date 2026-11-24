"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  ArrowsOut,
  Sparkle,
  MusicNotes,
  Waveform,
  TextAa,
  MagnifyingGlass,
  ArrowClockwise,
  WarningCircle,
  CircleNotch,
  SignOut,
} from "@phosphor-icons/react";
import { SAMPLE_TRACKS } from "../lib/sampleTracks";
import { TrackInfo, ViewMode, LyricStyle } from "../lib/types";
import { audioEngine } from "../lib/audioEngine";
import { AmbientGlowOverlay } from "./AmbientGlowOverlay";
import { LyricsOverlay } from "./LyricsOverlay";
import { SpotifyModal } from "./SpotifyModal";
import { useSpotifyPlayer } from "../lib/spotify";

const GLOW_PRESETS: { name: string; colors: [string, string] }[] = [
  { name: "Cyberpunk", colors: ["#6366f1", "#06b6d4"] },
  { name: "Aurora", colors: ["#10b981", "#3b82f6"] },
  { name: "Sunset Gold", colors: ["#f43f5e", "#f59e0b"] },
  { name: "Electric Violet", colors: ["#a855f7", "#ec4899"] },
  { name: "Deep Velvet", colors: ["#8b5cf6", "#3b82f6"] },
];

const LYRIC_STYLES: { id: LyricStyle; label: string }[] = [
  { id: "karaoke", label: "Karaoke Glow" },
  { id: "fisheye", label: "Fisheye Lens" },
  { id: "waveform", label: "Waveform Bounce" },
  { id: "constellation", label: "Constellation" },
  { id: "typewriter", label: "Typewriter" },
];

export function CombinedStudio() {
  const [tracks, setTracks] = useState<TrackInfo[]>(SAMPLE_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [mode, setMode] = useState<ViewMode>("combined");

  // AuraGlow settings
  const [glowColors, setGlowColors] = useState<[string, string]>(
    SAMPLE_TRACKS[0].glowColors
  );
  const [glowIntensity, setGlowIntensity] = useState(0.85);
  const [glowSpread, setGlowSpread] = useState(55);
  const [glowThickness, setGlowThickness] = useState(8);
  const [isAudioReactive, setIsAudioReactive] = useState(true);
  const [bassPulse, setBassPulse] = useState(0);

  // LyricGod settings
  const [lyricStyle, setLyricStyle] = useState<LyricStyle>("karaoke");
  const [fontSize, setFontSize] = useState(24);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const studioRef = useRef<HTMLDivElement>(null);

  // Search lyrics modal
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);

  // Spotify integration via hook
  const spotify = useSpotifyPlayer();
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [lyricsNotice, setLyricsNotice] = useState<string | null>(null);
  const lastSpotifyTrackIdRef = useRef<string | null>(null);

  const isSpotifyConnected = spotify.status === "connected";
  const isSpotifyActive = isSpotifyConnected && !!spotify.currentTrack;

  // Active track information
  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Active playback variables (switches cleanly between Spotify live playback and local demo)
  const activeCurrentTime = isSpotifyActive ? spotify.progressSec : localCurrentTime;
  const activeIsPlaying = isSpotifyActive
    ? spotify.playbackState === "playing"
    : localIsPlaying;
  const activeDuration = isSpotifyActive && spotify.currentTrack
    ? spotify.currentTrack.durationMs / 1000
    : currentTrack.duration;
  const activeTitle = isSpotifyActive && spotify.currentTrack
    ? spotify.currentTrack.title
    : currentTrack.title;
  const activeArtist = isSpotifyActive && spotify.currentTrack
    ? spotify.currentTrack.artist
    : currentTrack.artist;
  const activeAlbumArt = isSpotifyActive && spotify.currentTrack?.albumArt
    ? spotify.currentTrack.albumArt
    : null;

  // Simple LRC parser
  const parseLrc = useCallback((lrc: string) => {
    const lines = lrc.split("\n");
    const result = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(timeRegex);
      if (match) {
        const mins = parseInt(match[1]);
        const secs = parseInt(match[2]);
        const millis = parseInt(match[3]);
        const timeInSecs =
          mins * 60 + secs + millis / (match[3].length === 2 ? 100 : 1000);
        const text = match[4].trim();

        if (text) {
          const wordsArr = text.split(" ").filter(Boolean);
          const lineDuration = 3.5;
          const wordDuration = lineDuration / (wordsArr.length || 1);

          const words = wordsArr.map((w, wIdx) => ({
            word: w,
            start: timeInSecs + wIdx * wordDuration,
            end: timeInSecs + (wIdx + 1) * wordDuration,
          }));

          result.push({
            text,
            start: timeInSecs,
            end: timeInSecs + lineDuration,
            words,
          });
        }
      }
    }
    return result;
  }, []);

  // Fetch LRCLIB lyrics for Spotify song
  const fetchLyricsForSpotifyTrack = useCallback(
    async (
      title: string,
      artist: string,
      albumArt: string,
      duration: number
    ) => {
      try {
        setLyricsNotice("Fetching synchronized lyrics from LRCLIB...");
        const res = await fetch(
          `https://lrclib.net/api/search?q=${encodeURIComponent(title + " " + artist)}`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          const hit = data[0];
          if (hit.syncedLyrics) {
            const parsed = parseLrc(hit.syncedLyrics);
            if (parsed.length > 0) {
              const spotifyGeneratedTrack: TrackInfo = {
                id: `spotify-${Date.now()}`,
                title,
                artist,
                album: hit.albumName || "Spotify Live",
                coverGradient: "from-emerald-600 via-teal-600 to-indigo-900",
                glowColors: ["#10b981", "#6366f1"],
                duration: duration || hit.duration || 180,
                lyrics: parsed,
              };
              setTracks((prev) => [spotifyGeneratedTrack, ...prev]);
              setCurrentTrackIndex(0);
              setLyricsNotice(null);
              return;
            }
          }
        }

        // Fallback placeholder when track is not in LRCLIB synced database
        const fallbackLines = [
          {
            text: `${title}`,
            start: 0,
            end: duration || 180,
            words: title.split(" ").filter(Boolean).map((w, idx) => ({
              word: w,
              start: idx * 0.8,
              end: (idx + 1) * 0.8,
            })),
          },
          {
            text: `by ${artist}`,
            start: 3,
            end: duration || 180,
            words: `by ${artist}`.split(" ").filter(Boolean).map((w, idx) => ({
              word: w,
              start: 3 + idx * 0.8,
              end: 3 + (idx + 1) * 0.8,
            })),
          },
        ];

        const fallbackTrack: TrackInfo = {
          id: `spotify-${Date.now()}`,
          title,
          artist,
          album: "Spotify Live",
          coverGradient: "from-emerald-600 via-teal-600 to-indigo-900",
          glowColors: ["#10b981", "#3b82f6"],
          duration: duration || 180,
          lyrics: fallbackLines,
        };
        setTracks((prev) => [fallbackTrack, ...prev]);
        setCurrentTrackIndex(0);
        setLyricsNotice("Synced lyrics not yet in LRCLIB • Displaying live track info");
      } catch (err) {
        console.error("Could not fetch lyrics for Spotify track", err);
        setLyricsNotice("Could not load external lyrics • Displaying live track");
      }
    },
    [parseLrc]
  );

  // Detect when Spotify track changes
  useEffect(() => {
    if (!isSpotifyConnected || !spotify.currentTrack) return;

    if (spotify.currentTrack.id !== lastSpotifyTrackIdRef.current) {
      lastSpotifyTrackIdRef.current = spotify.currentTrack.id;
      fetchLyricsForSpotifyTrack(
        spotify.currentTrack.title,
        spotify.currentTrack.artist,
        spotify.currentTrack.albumArt,
        spotify.currentTrack.durationMs / 1000
      );
    }
  }, [
    isSpotifyConnected,
    spotify.currentTrack,
    fetchLyricsForSpotifyTrack,
  ]);

  // Audio animation loop for bass beat reactivity
  useEffect(() => {
    let animId: number;
    const updateAudioMeters = () => {
      if (activeIsPlaying) {
        if (isSpotifyConnected) {
          // Rhythmic harmonic pulse when listening to Spotify
          const pulse = (Math.sin(activeCurrentTime * 4.5) + 1) * 0.35;
          setBassPulse(pulse);
        } else {
          const bass = audioEngine.getBassEnergy();
          setBassPulse(bass);
        }
      } else {
        setBassPulse(0);
      }
      animId = requestAnimationFrame(updateAudioMeters);
    };
    animId = requestAnimationFrame(updateAudioMeters);
    return () => cancelAnimationFrame(animId);
  }, [activeIsPlaying, isSpotifyConnected, activeCurrentTime]);

  // Reset local beat engine when changing sample track
  useEffect(() => {
    if (!isSpotifyActive) {
      setGlowColors(currentTrack.glowColors);
      setLocalCurrentTime(0);
      audioEngine.reset();
      if (localIsPlaying) {
        audioEngine.startBeat((t) => setLocalCurrentTime(t % currentTrack.duration));
      }
    }
  }, [currentTrackIndex, currentTrack, isSpotifyActive, localIsPlaying]);

  // Local play/pause toggle for sample tracks
  const togglePlayback = () => {
    if (isSpotifyConnected) {
      // Manual resync trigger when connected to Spotify
      handleManualResync();
      return;
    }

    if (localIsPlaying) {
      audioEngine.pause();
      setLocalIsPlaying(false);
    } else {
      audioEngine.startBeat((t) => {
        setLocalCurrentTime(t % currentTrack.duration);
      });
      setLocalIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSpotifyConnected) return; // Spotify playback is controlled from the user's Spotify app
    const newTime = parseFloat(e.target.value);
    setLocalCurrentTime(newTime);
  };

  const handleManualResync = async () => {
    setIsResyncing(true);
    await spotify.resync();
    setTimeout(() => setIsResyncing(false), 500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (studioRef.current) {
        studioRef.current.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Live song lyrics search via LRCLIB
  const searchLyrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchStatus("Searching LRCLIB...");

    try {
      const res = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const hit = data[0];
        if (hit.syncedLyrics) {
          const parsedLines = parseLrc(hit.syncedLyrics);
          if (parsedLines.length > 0) {
            const newTrack: TrackInfo = {
              id: `custom-${Date.now()}`,
              title: hit.trackName || searchQuery,
              artist: hit.artistName || "Unknown Artist",
              album: hit.albumName || "LRCLIB Synced",
              coverGradient: "from-indigo-600 via-purple-600 to-pink-700",
              glowColors: ["#818cf8", "#ec4899"],
              duration: hit.duration || 180,
              lyrics: parsedLines,
            };
            setTracks((prev) => [newTrack, ...prev]);
            setCurrentTrackIndex(0);
            setSearchStatus(`Loaded "${hit.trackName}"!`);
          } else {
            setSearchStatus("No synced lines parsed from LRC.");
          }
        } else {
          setSearchStatus("Track found, but only plain text available.");
        }
      } else {
        setSearchStatus("No matches found in LRCLIB.");
      }
    } catch {
      setSearchStatus("Could not reach LRCLIB. Using built-in tracks.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section id="studio" className="relative py-24 scroll-mt-12">
      {/* Spotify Modal */}
      <SpotifyModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
        isConnected={isSpotifyConnected}
        user={spotify.user}
        onDisconnect={spotify.disconnect}
        isConnecting={spotify.status === "connecting"}
      />

      <div className="mx-auto max-w-[1400px] px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1 text-xs text-indigo-400 mb-3">
              <Sparkle size={14} weight="fill" />
              Interactive Experience
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">
              Combined Studio
            </h2>
            <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-xl">
              Experience floating lyrics and screen-edge ambient lighting
              dancing together in real time. Syncs directly with your Spotify account.
            </p>
          </div>

          {/* Top Actions: Spotify Connect + Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Spotify Connect Button */}
            <button
              onClick={() => setIsSpotifyModalOpen(true)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                isSpotifyConnected
                  ? "border border-[#1DB954]/50 bg-[#1DB954]/15 text-[#1DB954] hover:bg-[#1DB954]/25 shadow-lg shadow-[#1DB954]/10"
                  : spotify.status === "connecting"
                  ? "border border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-[#1DB954] hover:text-[#1DB954]"
              }`}
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.216.353-.675.467-1.028.251-2.817-1.722-6.362-2.112-10.538-1.157-.402.093-.805-.157-.898-.56-.093-.403.158-.805.56-.898 4.571-1.045 8.492-.595 11.654 1.336.353.216.467.674.25 1.028zm1.467-3.262c-.272.443-.852.583-1.295.311-3.226-1.983-8.144-2.556-11.959-1.399-.499.152-1.031-.132-1.183-.631-.152-.499.132-1.031.631-1.183 4.367-1.325 9.789-.687 13.495 1.591.444.272.584.851.311 1.311zm.126-3.411C15.228 8.358 8.874 8.148 5.163 9.274c-.604.184-1.246-.16-1.43-.765-.183-.604.161-1.246.765-1.43 4.269-1.296 11.289-1.051 15.75 1.599.543.322.723 1.027.401 1.57-.323.543-1.028.723-1.571.401z" />
              </svg>
              {isSpotifyConnected ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#1DB954] animate-pulse" />
                  {spotify.user?.displayName ? (
                    <span className="max-w-[120px] truncate">{spotify.user.displayName}</span>
                  ) : (
                    "Spotify Connected"
                  )}
                </span>
              ) : spotify.status === "connecting" ? (
                <span className="flex items-center gap-1.5">
                  <CircleNotch size={14} className="animate-spin" />
                  Connecting...
                </span>
              ) : (
                "Connect Spotify"
              )}
            </button>

            {/* Manual Resync Button (Visible when connected) */}
            {isSpotifyConnected && (
              <button
                onClick={handleManualResync}
                disabled={isResyncing}
                title="Resync with Spotify"
                className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-all disabled:opacity-50"
              >
                <ArrowClockwise
                  size={14}
                  className={isResyncing ? "animate-spin text-[#1DB954]" : ""}
                />
                <span className="hidden sm:inline">Sync</span>
              </button>
            )}

            {/* Mode Switcher Tabs */}
            <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-950/80 p-1 backdrop-blur-md">
              <button
                onClick={() => setMode("combined")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  mode === "combined"
                    ? "bg-white text-zinc-950 shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkle size={14} weight="fill" />
                Combined Mode
              </button>
              <button
                onClick={() => setMode("glow")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                  mode === "glow"
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Waveform size={14} />
                AuraGlow Only
              </button>
              <button
                onClick={() => setMode("lyrics")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                  mode === "lyrics"
                    ? "bg-indigo-500 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <TextAa size={14} />
                Lyrics Only
              </button>
            </div>
          </div>
        </div>

        {/* Status / Notice Banners */}
        {isSpotifyConnected && spotify.playbackState === "idle" && (
          <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                <strong>Spotify is connected!</strong> Play any song in Spotify (Desktop, Web, or Mobile) to begin real-time sync.
              </span>
            </div>
            <button
              onClick={handleManualResync}
              className="text-[#1DB954] font-medium hover:underline flex items-center gap-1 shrink-0"
            >
              <ArrowClockwise size={13} />
              Check now
            </button>
          </div>
        )}

        {isSpotifyConnected && spotify.playbackState === "ad_or_podcast" && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200 flex items-center gap-2">
            <WarningCircle size={16} className="text-amber-400 shrink-0" />
            <span>Currently streaming an advertisement or podcast. Lyrics sync resumes automatically on the next song.</span>
          </div>
        )}

        {spotify.errorMessage && (
          <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <WarningCircle size={16} className="text-rose-400 shrink-0" />
              <span>{spotify.errorMessage}</span>
            </div>
            <button
              onClick={handleManualResync}
              className="rounded-full bg-rose-500/20 px-3 py-1 text-[11px] font-semibold text-white hover:bg-rose-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {lyricsNotice && (
          <div className="mb-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-2 text-[11px] text-indigo-300 flex items-center gap-2">
            <Sparkle size={13} weight="fill" className="text-indigo-400 shrink-0" />
            <span>{lyricsNotice}</span>
          </div>
        )}

        {/* Main Display Stage Container */}
        <div
          ref={studioRef}
          className={`relative rounded-3xl border border-zinc-800 bg-zinc-950 transition-all duration-300 overflow-hidden ${
            isFullscreen
              ? "fixed inset-0 z-50 rounded-none border-none flex flex-col justify-between p-8"
              : "min-h-[520px] md:min-h-[620px] p-6 md:p-12 shadow-2xl"
          }`}
        >
          {/* Ambient Edge Glow Layer (Active in Combined & Glow mode) */}
          {(mode === "combined" || mode === "glow") && (
            <AmbientGlowOverlay
              colors={glowColors}
              intensity={glowIntensity}
              thickness={glowThickness}
              glowSpread={glowSpread}
              bassPulse={bassPulse}
              isAudioReactive={isAudioReactive}
              isFullWindow={isFullscreen}
            />
          )}

          {/* Top Bar of the Studio (Now Playing badge + Spotify pill + Fullscreen toggle) */}
          <div className="relative z-30 flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              {activeAlbumArt ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activeAlbumArt}
                  alt={activeTitle}
                  className="w-12 h-12 rounded-xl object-cover shadow-lg border border-zinc-700 shrink-0"
                />
              ) : (
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentTrack.coverGradient} shadow-lg flex items-center justify-center shrink-0`}
                >
                  <MusicNotes size={20} className="text-white/80" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white tracking-tight truncate max-w-[220px] md:max-w-md">
                    {activeTitle}
                  </h4>
                  {isSpotifyActive && (
                    <span className="shrink-0 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 px-2 py-0.5 text-[10px] font-semibold text-[#1DB954]">
                      Live Sync
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 truncate max-w-[220px] md:max-w-md">
                  {activeArtist}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSpotifyModalOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur-md transition-all hover:border-[#1DB954] hover:text-white"
              >
                <svg className="w-3.5 h-3.5 fill-[#1DB954] shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.216.353-.675.467-1.028.251-2.817-1.722-6.362-2.112-10.538-1.157-.402.093-.805-.157-.898-.56-.093-.403.158-.805.56-.898 4.571-1.045 8.492-.595 11.654 1.336.353.216.467.674.25 1.028zm1.467-3.262c-.272.443-.852.583-1.295.311-3.226-1.983-8.144-2.556-11.959-1.399-.499.152-1.031-.132-1.183-.631-.152-.499.132-1.031.631-1.183 4.367-1.325 9.789-.687 13.495 1.591.444.272.584.851.311 1.311zm.126-3.411C15.228 8.358 8.874 8.148 5.163 9.274c-.604.184-1.246-.16-1.43-.765-.183-.604.161-1.246.765-1.43 4.269-1.296 11.289-1.051 15.75 1.599.543.322.723 1.027.401 1.57-.323.543-1.028.723-1.571.401z" />
                </svg>
                <span className="hidden sm:inline">
                  {isSpotifyConnected ? "Spotify Connected" : "Connect Spotify"}
                </span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur-md transition-all hover:border-zinc-500 hover:text-white"
              >
                <ArrowsOut size={14} />
                <span className="hidden sm:inline">
                  {isFullscreen ? "Exit Fullscreen" : "Immersive Fullscreen"}
                </span>
              </button>
            </div>
          </div>

          {/* Center Stage: Floating Lyrics or Visualizer */}
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center my-6">
            {(mode === "combined" || mode === "lyrics") && (
              <LyricsOverlay
                lyrics={currentTrack.lyrics}
                currentTime={activeCurrentTime}
                style={lyricStyle}
                fontSize={fontSize}
                glowColor={glowColors[0]}
              />
            )}

            {mode === "glow" && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-1.5 h-16">
                  {[...Array(28)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-emerald-500 to-cyan-400 transition-all duration-75"
                      style={{
                        height: `${
                          14 +
                          Math.sin(i * 0.4 + activeCurrentTime * 2) * 20 +
                          bassPulse * 30
                        }px`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm font-mono text-zinc-400">
                  AuraGlow Ambient Edge Mode Active
                </p>
                <p className="text-xs text-zinc-600">
                  Edges illuminate with audio beat pulse
                </p>
              </div>
            )}
          </div>

          {/* Bottom Audio Controller Deck */}
          <div className="relative z-30 max-w-xl mx-auto w-full rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4 backdrop-blur-xl">
            {/* Scrubber */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-mono text-zinc-500 w-8 text-right">
                {Math.floor(activeCurrentTime / 60)}:
                {Math.floor(activeCurrentTime % 60)
                  .toString()
                  .padStart(2, "0")}
              </span>
              <input
                type="range"
                min="0"
                max={activeDuration}
                step="0.1"
                value={activeCurrentTime}
                onChange={handleSeek}
                disabled={isSpotifyConnected}
                className="flex-1 h-1.5 rounded-lg bg-zinc-800 accent-indigo-500 cursor-pointer disabled:cursor-default disabled:opacity-75"
              />
              <span className="text-[11px] font-mono text-zinc-500 w-8">
                {Math.floor(activeDuration / 60)}:
                {Math.floor(activeDuration % 60)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>

            {/* Play/Pause & Track Buttons */}
            <div className="flex items-center justify-between">
              {/* Track Selector Dropdown */}
              <select
                value={currentTrackIndex}
                onChange={(e) => setCurrentTrackIndex(Number(e.target.value))}
                className="bg-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-1.5 border border-zinc-700/60 focus:outline-none max-w-[200px] truncate"
              >
                {tracks.map((t, idx) => (
                  <option key={t.id} value={idx}>
                    {t.title} — {t.artist}
                  </option>
                ))}
              </select>

              {/* Central Play/Pause or Resync */}
              <button
                onClick={togglePlayback}
                title={isSpotifyConnected ? "Spotify Live Sync Active" : "Play / Pause Demo"}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-950 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-white/10"
              >
                {activeIsPlaying ? (
                  <Pause size={18} weight="fill" />
                ) : (
                  <Play size={18} weight="fill" className="ml-0.5" />
                )}
              </button>

              <div className="flex items-center gap-2">
                {isSpotifyConnected ? (
                  <button
                    onClick={handleManualResync}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                    title="Manual Resync with Spotify"
                  >
                    <ArrowClockwise
                      size={16}
                      className={isResyncing ? "animate-spin text-[#1DB954]" : ""}
                    />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setLocalCurrentTime(0);
                      audioEngine.reset();
                      if (localIsPlaying) {
                        audioEngine.startBeat((t) => setLocalCurrentTime(t % currentTrack.duration));
                      }
                    }}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                    title="Restart Track"
                  >
                    <ArrowClockwise size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Controls Dashboard (Palette, Styles, Sliders, Live Search) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AuraGlow Lighting Controls */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Waveform size={18} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                AuraGlow Palette & Spread
              </h3>
            </div>

            {/* Palette Presets */}
            <div className="grid grid-cols-5 gap-2 mb-5">
              {GLOW_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setGlowColors(p.colors)}
                  className="flex flex-col items-center gap-1 group"
                  title={p.name}
                >
                  <div
                    className="h-7 w-full rounded-md border border-zinc-700 group-hover:scale-105 transition-transform"
                    style={{
                      background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})`,
                    }}
                  />
                  <span className="text-[10px] text-zinc-500 truncate w-full text-center">
                    {p.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>

            {/* Glow Spread Slider */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Glow Spread</span>
                <span className="font-mono text-zinc-300">{glowSpread}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={glowSpread}
                onChange={(e) => setGlowSpread(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg accent-emerald-500 cursor-pointer"
              />

              {/* Border Thickness Slider */}
              <div className="flex justify-between text-zinc-400 pt-2">
                <span>Border Thickness</span>
                <span className="font-mono text-zinc-300">{glowThickness}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="20"
                value={glowThickness}
                onChange={(e) => setGlowThickness(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg accent-emerald-500 cursor-pointer"
              />

              {/* Audio Reactive Toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-zinc-400">Audio Beat Reactivity</span>
                <button
                  onClick={() => setIsAudioReactive(!isAudioReactive)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isAudioReactive ? "bg-emerald-500" : "bg-zinc-800"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isAudioReactive ? "translate-x-4" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: LyricGod Typography Styles */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TextAa size={18} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">
                LyricGod Animation Styles
              </h3>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {LYRIC_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setLyricStyle(s.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    lyricStyle === s.id
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Font Size Slider */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Lyric Font Size</span>
                <span className="font-mono text-zinc-300">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="18"
                max="36"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg accent-indigo-500 cursor-pointer"
              />

              <div className="pt-3 border-t border-zinc-800/60">
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Word-by-word timing accurately illuminates each syllable at
                  the exact millisecond it is vocalized in your Spotify audio.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Live LRCLIB Lyrics Search */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MagnifyingGlass size={18} className="text-violet-400" />
              <h3 className="text-sm font-semibold text-white">
                Search Any Song (LRCLIB)
              </h3>
            </div>

            <form onSubmit={searchLyrics} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. As It Was - Harry Styles"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Fetch Synced Lyrics"}
              </button>

              {searchStatus && (
                <p className="text-[11px] text-zinc-400 italic">
                  {searchStatus}
                </p>
              )}

              <p className="text-[11px] text-zinc-600 pt-2">
                Queries the real-time LRCLIB open synchronized lyrics database
                and maps words directly into the player.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
