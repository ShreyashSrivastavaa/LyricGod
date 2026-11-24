export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  durationMs: number;
  progressMs: number;
  isPlaying: boolean;
  isAdOrPodcast: boolean;
}

export interface SpotifyUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  product?: string;
}

export type PlaybackStatus =
  | "playing"
  | "paused"
  | "nothing"
  | "not_track"
  | "rate_limited"
  | "unauthorized";

export interface PlaybackResult {
  status: PlaybackStatus;
  track?: SpotifyTrack;
  retryAfterSec?: number;
}
