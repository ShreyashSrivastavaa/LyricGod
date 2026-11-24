// Spotify Direct OAuth (Implicit & PKCE) and Playback Client

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  durationMs: number;
  progressMs: number;
  isPlaying: boolean;
}

const SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

export function getSpotifyAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "token",
    redirect_uri: redirectUri,
    scope: SCOPES,
    show_dialog: "true",
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export function extractTokenFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (hash && hash.includes("access_token=")) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get("access_token");
    if (token) {
      localStorage.setItem("spotify_access_token", token);
      window.history.replaceState({}, document.title, window.location.pathname);
      return token;
    }
  }
  return null;
}

export async function fetchCurrentlyPlaying(token: string): Promise<SpotifyTrack | null> {
  try {
    const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 204) return null; // No active playback

    if (res.status === 401) {
      // Token expired
      localStorage.removeItem("spotify_access_token");
      return null;
    }

    if (res.status === 200) {
      const data = await res.json();
      if (!data.item) return null;

      return {
        id: data.item.id,
        title: data.item.name,
        artist:
          data.item.artists?.map((a: { name: string }) => a.name).join(", ") || "Unknown",
        album: data.item.album?.name || "",
        albumArt: data.item.album?.images?.[0]?.url || "",
        durationMs: data.item.duration_ms || 0,
        progressMs: data.progress_ms || 0,
        isPlaying: data.is_playing || false,
      };
    }
  } catch (err) {
    console.error("Error fetching Spotify playback", err);
  }
  return null;
}
