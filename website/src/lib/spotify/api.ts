import { PlaybackResult, SpotifyTrack, SpotifyUser } from "./types";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export async function fetchCurrentlyPlaying(token: string): Promise<PlaybackResult> {
  try {
    const res = await fetch(`${SPOTIFY_API_BASE}/me/player/currently-playing`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 204 No Content: nothing currently playing
    if (res.status === 204) {
      return { status: "nothing" };
    }

    // 401 Unauthorized: token expired or invalid
    if (res.status === 401) {
      return { status: "unauthorized" };
    }

    // 429 Too Many Requests: Rate limited
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "2", 10);
      return { status: "rate_limited", retryAfterSec: retryAfter };
    }

    if (!res.ok) {
      return { status: "nothing" };
    }

    const data = await res.json();

    // Check if the user is listening to an ad or podcast episode
    if (data.currently_playing_type && data.currently_playing_type !== "track") {
      return { status: "not_track" };
    }

    if (!data.item) {
      return { status: "nothing" };
    }

    const item = data.item;
    const track: SpotifyTrack = {
      id: item.id || `track-${Date.now()}`,
      title: item.name || "Unknown Track",
      artist:
        item.artists?.map((a: { name: string }) => a.name).join(", ") ||
        "Unknown Artist",
      album: item.album?.name || "",
      albumArt:
        item.album?.images?.[0]?.url ||
        item.album?.images?.[1]?.url ||
        "",
      durationMs: item.duration_ms || 180000,
      progressMs: data.progress_ms || 0,
      isPlaying: data.is_playing || false,
      isAdOrPodcast: false,
    };

    return {
      status: track.isPlaying ? "playing" : "paused",
      track,
    };
  } catch (err) {
    console.error("Network error fetching Spotify currently-playing:", err);
    return { status: "nothing" };
  }
}

export async function fetchUserProfile(token: string): Promise<SpotifyUser | null> {
  try {
    const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      id: data.id,
      displayName: data.display_name || data.id,
      avatarUrl: data.images?.[0]?.url,
      product: data.product,
    };
  } catch (err) {
    console.error("Error fetching Spotify user profile:", err);
    return null;
  }
}
