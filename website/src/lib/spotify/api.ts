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

export async function resumePlayback(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${SPOTIFY_API_BASE}/me/player/play`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 204 || res.ok) {
      return { success: true };
    }

    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      const reason = data?.error?.reason || data?.error?.message;
      if (reason === "PREMIUM_REQUIRED") {
        return { success: false, error: "Controlling playback via API requires Spotify Premium. Please play/pause in your Spotify app." };
      }
      return { success: false, error: "Playback permission required. Please reconnect your Spotify account." };
    }

    if (res.status === 404) {
      return { success: false, error: "No active Spotify player found. Start playing in your Spotify app first." };
    }

    return { success: false, error: `Failed to resume playback (HTTP ${res.status})` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function pausePlayback(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${SPOTIFY_API_BASE}/me/player/pause`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 204 || res.ok) {
      return { success: true };
    }

    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      const reason = data?.error?.reason || data?.error?.message;
      if (reason === "PREMIUM_REQUIRED") {
        return { success: false, error: "Controlling playback via API requires Spotify Premium. Please play/pause in your Spotify app." };
      }
      return { success: false, error: "Playback permission required. Please reconnect your Spotify account." };
    }

    if (res.status === 404) {
      return { success: false, error: "No active Spotify player found." };
    }

    return { success: false, error: `Failed to pause playback (HTTP ${res.status})` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function seekPlayback(token: string, positionMs: number): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${SPOTIFY_API_BASE}/me/player/seek?position_ms=${Math.floor(positionMs)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 204 || res.ok) {
      return { success: true };
    }

    return { success: false, error: "Could not seek track" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function nextTrack(token: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${SPOTIFY_API_BASE}/me/player/next`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: res.status === 204 || res.ok };
  } catch {
    return { success: false };
  }
}

export async function previousTrack(token: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${SPOTIFY_API_BASE}/me/player/previous`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: res.status === 204 || res.ok };
  } catch {
    return { success: false };
  }
}
