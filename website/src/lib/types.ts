export interface LyricWord {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface LyricLine {
  text: string;
  start: number;
  end: number;
  words?: LyricWord[];
}

export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverGradient: string;
  glowColors: [string, string];
  duration: number;
  lyrics: LyricLine[];
}

export type ViewMode = "combined" | "glow" | "lyrics";

export type GlowPreset =
  | "cyberpunk"
  | "aurora"
  | "sunset"
  | "electric"
  | "crimson"
  | "amber";

export type LyricStyle =
  | "karaoke"
  | "typewriter"
  | "fisheye"
  | "waveform"
  | "constellation"
  | "minimal";
