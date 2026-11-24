"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkle, ArrowSquareOut, Check, WarningCircle } from "@phosphor-icons/react";
import { initiateSpotifyLogin, SpotifyUser } from "@/lib/spotify";

interface SpotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  user: SpotifyUser | null;
  onDisconnect: () => void;
  isConnecting?: boolean;
}

export function SpotifyModal({
  isOpen,
  onClose,
  isConnected,
  user,
  onDisconnect,
  isConnecting = false,
}: SpotifyModalProps) {
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetClientId =
      clientId.trim() ||
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ||
      localStorage.getItem("spotify_client_id");

    if (!targetClientId) {
      setError("Please enter your Spotify Developer Client ID to continue.");
      return;
    }

    try {
      await initiateSpotifyLogin(targetClientId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate login");
    }
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
                Connect Spotify
              </h3>
              <p className="text-xs text-zinc-400">
                Direct Authorization Code Flow with PKCE
              </p>
            </div>
          </div>

          {isConnected ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              {user?.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-[#1DB954] shadow-lg object-cover"
                />
              ) : (
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/20">
                  <Check size={24} weight="bold" />
                </div>
              )}
              <h4 className="text-base font-semibold text-white mb-1">
                Connected{user?.displayName ? ` as ${user.displayName}` : ""}!
              </h4>
              <p className="text-xs text-zinc-400 mb-6 max-w-sm mx-auto">
                Play any track in Spotify (Desktop, Web, or Mobile) and LyricGod
                will continuously sync word-level lyrics and ambient edge lighting.
              </p>
              <button
                onClick={() => {
                  onDisconnect();
                  onClose();
                }}
                className="rounded-full border border-rose-500/40 bg-rose-500/10 px-6 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                Disconnect Account
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Spotify Developer Client ID
                </label>
                <input
                  type="text"
                  placeholder="Paste your 32-character Client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-[#1DB954] focus:outline-none font-mono"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                  <WarningCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-xs text-zinc-400 space-y-2 text-[11px] leading-relaxed">
                <p className="text-zinc-200 font-semibold flex items-center gap-1.5">
                  <Sparkle size={13} weight="fill" className="text-[#1DB954]" />
                  Setup instructions (one-time):
                </p>
                <p>
                  1. Go to the{" "}
                  <a
                    href="https://developer.spotify.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1DB954] underline inline-flex items-center gap-0.5 font-medium"
                  >
                    Spotify Developer Dashboard <ArrowSquareOut size={10} />
                  </a>{" "}
                  and click &quot;Create App&quot;.
                </p>
                <p>
                  2. In your App settings, add this exact Redirect URI:
                  <br />
                  <code className="text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded font-mono text-[10px] inline-block mt-1">
                    {typeof window !== "undefined"
                      ? `${window.location.origin.replace("localhost", "127.0.0.1")}/callback`
                      : "http://127.0.0.1:3000/callback"}
                  </code>
                </p>
                <p className="text-zinc-500">
                  *(Spotify requires <code>127.0.0.1</code> instead of <code>localhost</code>).*
                </p>
                <p>3. Copy the Client ID, paste it above, and click the button below.</p>
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-2.5 rounded-full bg-[#1DB954] py-3.5 text-sm font-bold text-black hover:bg-[#1ed760] transition-transform active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#1DB954]/20"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.216.353-.675.467-1.028.251-2.817-1.722-6.362-2.112-10.538-1.157-.402.093-.805-.157-.898-.56-.093-.403.158-.805.56-.898 4.571-1.045 8.492-.595 11.654 1.336.353.216.467.674.25 1.028zm1.467-3.262c-.272.443-.852.583-1.295.311-3.226-1.983-8.144-2.556-11.959-1.399-.499.152-1.031-.132-1.183-.631-.152-.499.132-1.031.631-1.183 4.367-1.325 9.789-.687 13.495 1.591.444.272.584.851.311 1.311zm.126-3.411C15.228 8.358 8.874 8.148 5.163 9.274c-.604.184-1.246-.16-1.43-.765-.183-.604.161-1.246.765-1.43 4.269-1.296 11.289-1.051 15.75 1.599.543.322.723 1.027.401 1.57-.323.543-1.028.723-1.571.401z" />
                </svg>
                {isConnecting ? "Connecting to Spotify..." : "Log In With Spotify (PKCE)"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
