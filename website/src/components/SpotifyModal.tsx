"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkle, Key, ArrowSquareOut, Check } from "@phosphor-icons/react";
import { getSpotifyAuthUrl, SpotifyTrack } from "../lib/spotify";

interface SpotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectToken: (token: string) => void;
  onLoadDirectTrack?: (track: SpotifyTrack) => void;
  isConnected: boolean;
  onDisconnect: () => void;
}

export function SpotifyModal({
  isOpen,
  onClose,
  onConnectToken,
  onLoadDirectTrack,
  isConnected,
  onDisconnect,
}: SpotifyModalProps) {
  const [tab, setTab] = useState<"direct" | "manual">("direct");
  const [clientId, setClientId] = useState("");
  const [manualInput, setManualInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved =
        localStorage.getItem("spotify_client_id") ||
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ||
        "";
      setClientId(saved);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDirectSpotifyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) return;

    const trimmed = clientId.trim();
    localStorage.setItem("spotify_client_id", trimmed);
    const redirectUri = window.location.origin;
    const authUrl = getSpotifyAuthUrl(trimmed, redirectUri);
    window.location.href = authUrl;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualInput.trim();
    if (!trimmed) return;

    // Check if user pasted a Spotify API JSON response
    if (trimmed.startsWith("{") && trimmed.includes('"item"')) {
      try {
        const json = JSON.parse(trimmed);
        if (json.item && onLoadDirectTrack) {
          const directTrack: SpotifyTrack = {
            id: json.item.id || `direct-${Date.now()}`,
            title: json.item.name || "Unknown Track",
            artist:
              json.item.artists?.map((a: { name: string }) => a.name).join(", ") ||
              "Unknown Artist",
            album: json.item.album?.name || "",
            albumArt: json.item.album?.images?.[0]?.url || "",
            durationMs: json.item.duration_ms || 180000,
            progressMs: json.progress_ms || 0,
            isPlaying: json.is_playing || true,
          };
          onLoadDirectTrack(directTrack);
          onClose();
          return;
        }
      } catch (err) {
        console.error("JSON parse error:", err);
      }
    }

    let token = trimmed;
    if (token.toLowerCase().startsWith("bearer ")) {
      token = token.slice(7).trim();
    }

    localStorage.setItem("spotify_access_token", token);
    onConnectToken(token);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] shadow-lg shadow-[#1DB954]/10">
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.216.353-.675.467-1.028.251-2.817-1.722-6.362-2.112-10.538-1.157-.402.093-.805-.157-.898-.56-.093-.403.158-.805.56-.898 4.571-1.045 8.492-.595 11.654 1.336.353.216.467.674.25 1.028zm1.467-3.262c-.272.443-.852.583-1.295.311-3.226-1.983-8.144-2.556-11.959-1.399-.499.152-1.031-.132-1.183-.631-.152-.499.132-1.031.631-1.183 4.367-1.325 9.789-.687 13.495 1.591.444.272.584.851.311 1.311zm.126-3.411C15.228 8.358 8.874 8.148 5.163 9.274c-.604.184-1.246-.16-1.43-.765-.183-.604.161-1.246.765-1.43 4.269-1.296 11.289-1.051 15.75 1.599.543.322.723 1.027.401 1.57-.323.543-1.028.723-1.571.401z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Connect With Spotify Directly
              </h3>
              <p className="text-xs text-zinc-400">
                Log in and sync your live audio in one click
              </p>
            </div>
          </div>

          {isConnected ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/20">
                <Check size={24} weight="bold" />
              </div>
              <h4 className="text-base font-semibold text-white mb-1">
                Spotify Directly Connected!
              </h4>
              <p className="text-xs text-zinc-400 mb-6 max-w-sm mx-auto">
                Play any song in Spotify (Desktop, Web, or Mobile) and LyricGod
                will automatically stream lyrics and edge glow here.
              </p>
              <button
                onClick={() => {
                  onDisconnect();
                  onClose();
                }}
                className="rounded-full border border-red-500/40 bg-red-500/10 px-6 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Disconnect Account
              </button>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 mb-6">
                <button
                  onClick={() => setTab("direct")}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                    tab === "direct"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Direct 1-Click Login
                </button>
                <button
                  onClick={() => setTab("manual")}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                    tab === "manual"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Manual Token / JSON
                </button>
              </div>

              {tab === "direct" ? (
                <form onSubmit={handleDirectSpotifyLogin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-2">
                      Spotify Developer Client ID
                    </label>
                    <input
                      type="text"
                      placeholder="Paste your 32-character Client ID from developer.spotify.com"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-[#1DB954] focus:outline-none"
                    />
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-xs text-zinc-400 space-y-1.5 text-[11px] leading-relaxed">
                    <p className="text-zinc-200 font-semibold flex items-center gap-1.5">
                      <Sparkle size={13} weight="fill" className="text-[#1DB954]" />
                      How to connect directly:
                    </p>
                    <p>
                      1. Go to{" "}
                      <a
                        href="https://developer.spotify.com/dashboard"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#1DB954] underline inline-flex items-center gap-0.5 font-medium"
                      >
                        Spotify Developer Dashboard <ArrowSquareOut size={10} />
                      </a>
                    </p>
                    <p>
                      2. Create an App (name it &quot;LyricGod&quot;) and add Redirect URI:{" "}
                      <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-[10px]">
                        {typeof window !== "undefined"
                          ? window.location.origin
                          : "http://localhost:3000"}
                      </code>
                    </p>
                    <p>3. Paste the Client ID above and click the button below.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={!clientId.trim()}
                    className="w-full flex items-center justify-center gap-2.5 rounded-full bg-[#1DB954] py-3.5 text-sm font-bold text-black hover:bg-[#1ed760] transition-transform active:scale-[0.98] disabled:opacity-40 shadow-lg shadow-[#1DB954]/20"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.216.353-.675.467-1.028.251-2.817-1.722-6.362-2.112-10.538-1.157-.402.093-.805-.157-.898-.56-.093-.403.158-.805.56-.898 4.571-1.045 8.492-.595 11.654 1.336.353.216.467.674.25 1.028zm1.467-3.262c-.272.443-.852.583-1.295.311-3.226-1.983-8.144-2.556-11.959-1.399-.499.152-1.031-.132-1.183-.631-.152-.499.132-1.031.631-1.183 4.367-1.325 9.789-.687 13.495 1.591.444.272.584.851.311 1.311zm.126-3.411C15.228 8.358 8.874 8.148 5.163 9.274c-.604.184-1.246-.16-1.43-.765-.183-.604.161-1.246.765-1.43 4.269-1.296 11.289-1.051 15.75 1.599.543.322.723 1.027.401 1.57-.323.543-1.028.723-1.571.401z" />
                    </svg>
                    Log in with Spotify
                  </button>
                </form>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Spotify OAuth Token or Raw JSON Response
                    </label>
                    <textarea
                      rows={4}
                      placeholder='Paste your "BQ..." token, or paste the Spotify JSON response'
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#1DB954] focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-[#1DB954] py-3 text-xs font-bold text-black hover:bg-[#1ed760] transition-transform active:scale-[0.98] disabled:opacity-40"
                  >
                    Sync Playback
                  </button>
                </form>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
