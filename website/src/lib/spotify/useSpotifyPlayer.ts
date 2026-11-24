"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getValidAccessToken,
  clearSpotifyAuth,
  initiateSpotifyLogin,
  isSpotifyAuthenticated,
} from "./auth";
import { fetchCurrentlyPlaying, fetchUserProfile } from "./api";
import { SpotifyTrack, SpotifyUser, PlaybackResult } from "./types";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
export type PlayerPlaybackState = "playing" | "paused" | "idle" | "ad_or_podcast";

export function useSpotifyPlayer() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [playbackState, setPlaybackState] = useState<PlayerPlaybackState>("idle");
  const [interpolatedProgressSec, setInterpolatedProgressSec] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lastProgressRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);

  // Synchronize playback state ref
  isPlayingRef.current = playbackState === "playing";

  // Core poll function
  const poll = useCallback(async (isManualResync = false) => {
    if (isPollingRef.current && !isManualResync) return;
    isPollingRef.current = true;

    try {
      const token = await getValidAccessToken();
      if (!token) {
        setStatus("disconnected");
        setUser(null);
        setCurrentTrack(null);
        setPlaybackState("idle");
        isPollingRef.current = false;
        return;
      }

      setStatus("connected");

      // Fetch user profile if not yet loaded
      if (!user) {
        const profile = await fetchUserProfile(token);
        if (profile) setUser(profile);
      }

      const res: PlaybackResult = await fetchCurrentlyPlaying(token);

      if (res.status === "unauthorized") {
        clearSpotifyAuth();
        setStatus("disconnected");
        setUser(null);
        setCurrentTrack(null);
        setPlaybackState("idle");
        setErrorMessage("Spotify session expired. Please reconnect.");
        isPollingRef.current = false;
        return;
      }

      if (res.status === "rate_limited") {
        // Delay next poll according to Retry-After
        const wait = (res.retryAfterSec || 3) * 1000;
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        pollTimerRef.current = setTimeout(() => poll(), wait);
        isPollingRef.current = false;
        return;
      }

      if (res.status === "not_track") {
        setPlaybackState("ad_or_podcast");
        isPollingRef.current = false;
        return;
      }

      if (res.status === "nothing" || !res.track) {
        setPlaybackState("idle");
        isPollingRef.current = false;
        return;
      }

      const track = res.track;
      setCurrentTrack(track);
      setPlaybackState(track.isPlaying ? "playing" : "paused");

      const serverSec = track.progressMs / 1000;
      const currentLocal = lastProgressRef.current;

      // Seek / jump detection: If drift is > 1.5s, snap to server time
      if (Math.abs(currentLocal - serverSec) > 1.5 || isManualResync) {
        setInterpolatedProgressSec(serverSec);
        lastProgressRef.current = serverSec;
      }

      lastSyncTimeRef.current = performance.now();
      setErrorMessage(null);
    } catch (err) {
      console.error("Spotify sync error:", err);
      setErrorMessage("Network error while syncing with Spotify.");
    } finally {
      isPollingRef.current = false;
    }
  }, [user]);

  // Initial authentication check & starting polling loop
  useEffect(() => {
    if (isSpotifyAuthenticated()) {
      setStatus("connecting");
      poll().then(() => {
        setStatus("connected");
      });
    } else {
      setStatus("disconnected");
    }

    const interval = setInterval(() => {
      poll();
    }, 2000);

    return () => {
      clearInterval(interval);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [poll]);

  // Local progress interpolation between 2-second polls
  useEffect(() => {
    if (playbackState !== "playing" || !currentTrack) return;

    let animId: number;
    let lastTick = performance.now();

    const tick = () => {
      const now = performance.now();
      const deltaSec = (now - lastTick) / 1000;
      lastTick = now;

      setInterpolatedProgressSec((prev) => {
        const next = prev + deltaSec;
        const maxSec = currentTrack.durationMs / 1000;
        const clamped = Math.min(next, maxSec);
        lastProgressRef.current = clamped;
        return clamped;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [playbackState, currentTrack]);

  // Actions
  const connect = useCallback(async (customClientId?: string) => {
    setStatus("connecting");
    setErrorMessage(null);
    try {
      await initiateSpotifyLogin(customClientId);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to start Spotify login");
    }
  }, []);

  const disconnect = useCallback(() => {
    clearSpotifyAuth();
    setStatus("disconnected");
    setUser(null);
    setCurrentTrack(null);
    setPlaybackState("idle");
    setInterpolatedProgressSec(0);
    setErrorMessage(null);
  }, []);

  const resync = useCallback(() => {
    return poll(true);
  }, [poll]);

  return {
    status,
    user,
    currentTrack,
    playbackState,
    progressSec: interpolatedProgressSec,
    errorMessage,
    connect,
    disconnect,
    resync,
  };
}
