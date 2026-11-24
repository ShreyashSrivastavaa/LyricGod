import { SpotifyTokenResponse } from "./types";

const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

export const SPOTIFY_SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
].join(" ");

// Helper to sanitize local dev URLs for Spotify (replacing localhost with 127.0.0.1)
export function getSanitizedRedirectUri(): string {
  if (typeof window === "undefined") return "";

  if (process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
  }

  const origin = window.location.origin.replace("localhost", "127.0.0.1");
  return `${origin}/callback`;
}

// Generate secure random string for PKCE and State
function generateRandomString(length: number): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

// Generate S256 code challenge from verifier using Web Crypto API
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);

  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Start PKCE Authorization flow
export async function initiateSpotifyLogin(customClientId?: string): Promise<void> {
  const clientId =
    customClientId ||
    localStorage.getItem("spotify_client_id") ||
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

  if (!clientId) {
    throw new Error("Missing Spotify Client ID. Please provide your Client ID.");
  }

  // Persist chosen client ID
  localStorage.setItem("spotify_client_id", clientId);

  const verifier = generateRandomString(96);
  const challenge = await generateCodeChallenge(verifier);
  const state = generateRandomString(32);
  const redirectUri = getSanitizedRedirectUri();

  // Save verifier, state, and redirectUri in sessionStorage
  sessionStorage.setItem("spotify_pkce_verifier", verifier);
  sessionStorage.setItem("spotify_auth_state", state);
  sessionStorage.setItem("spotify_redirect_uri", redirectUri);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
    show_dialog: "true",
  });

  window.location.href = `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
}

// Exchange authorization code for access and refresh tokens
export async function exchangeCodeForToken(
  code: string,
  returnedState: string
): Promise<{ success: boolean; error?: string }> {
  const storedState = sessionStorage.getItem("spotify_auth_state");
  const verifier = sessionStorage.getItem("spotify_pkce_verifier");
  const storedRedirectUri =
    sessionStorage.getItem("spotify_redirect_uri") || getSanitizedRedirectUri();
  const clientId =
    localStorage.getItem("spotify_client_id") ||
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

  if (!returnedState || returnedState !== storedState) {
    return { success: false, error: "State mismatch. Possible CSRF attack detected." };
  }

  if (!verifier || !clientId) {
    return {
      success: false,
      error: "Missing PKCE code verifier or Client ID in session.",
    };
  }

  const payload = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: storedRedirectUri,
    code_verifier: verifier,
  });

  try {
    const res = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error_description || `Token exchange failed with status ${res.status}`,
      };
    }

    const data: SpotifyTokenResponse = await res.json();
    storeTokens(data);

    // Clean up temporary authorization state
    sessionStorage.removeItem("spotify_pkce_verifier");
    sessionStorage.removeItem("spotify_auth_state");
    sessionStorage.removeItem("spotify_redirect_uri");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown token exchange failure",
    };
  }
}

// Refresh access token using refresh_token
export async function refreshSpotifyToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const refreshToken = localStorage.getItem("spotify_refresh_token");
  const clientId =
    localStorage.getItem("spotify_client_id") ||
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

  if (!refreshToken || !clientId) {
    clearSpotifyAuth();
    return null;
  }

  const payload = new URLSearchParams({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  try {
    const res = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
    });

    if (!res.ok) {
      // Refresh token revoked or expired
      clearSpotifyAuth();
      return null;
    }

    const data: SpotifyTokenResponse = await res.json();
    storeTokens(data);
    return data.access_token;
  } catch (err) {
    console.error("Failed to refresh Spotify token:", err);
    return null;
  }
}

// Helper to store tokens and computed expiration timestamp
function storeTokens(data: SpotifyTokenResponse) {
  localStorage.setItem("spotify_access_token", data.access_token);
  if (data.refresh_token) {
    localStorage.setItem("spotify_refresh_token", data.refresh_token);
  }
  // Store expiration time in ms (subtract 30s buffer)
  const expiresAt = Date.now() + (data.expires_in - 30) * 1000;
  localStorage.setItem("spotify_expires_at", expiresAt.toString());
}

// Retrieve valid access token, proactively refreshing if near expiration
export async function getValidAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("spotify_access_token");
  const expiresAtStr = localStorage.getItem("spotify_expires_at");

  if (!token) return null;

  if (expiresAtStr) {
    const expiresAt = parseInt(expiresAtStr, 10);
    // If token expires in less than 60 seconds, refresh it now
    if (Date.now() > expiresAt - 60000) {
      return await refreshSpotifyToken();
    }
  }

  return token;
}

// Wipe all stored tokens
export function clearSpotifyAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("spotify_access_token");
  localStorage.removeItem("spotify_refresh_token");
  localStorage.removeItem("spotify_expires_at");
}

export function isSpotifyAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("spotify_access_token");
}
