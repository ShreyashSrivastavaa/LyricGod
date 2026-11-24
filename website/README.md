# LyricGod — Floating Synced Lyrics & AuraGlow Ambient Lighting

LyricGod is a web application featuring an interactive **Combined Studio** that pairs word-by-word synchronized lyrics with screen-edge **AuraGlow** ambient reactive lighting.

---

## Spotify Live Playback Integration (PKCE)

LyricGod connects directly to your Spotify account using the **Authorization Code Flow with PKCE** (`S256`), meaning zero client secrets are exposed in the browser.

### 1. Create a Spotify Developer App
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and sign in.
2. Click **Create app**.
3. Fill in:
   - **App name**: `LyricGod` (or any name you prefer)
   - **App description**: `Real-time synchronized lyrics and ambient screen glow`
   - **Redirect URIs**: Add both:
     - `http://127.0.0.1:3000/callback` *(for local development)*
     - `https://lyricgod.embarko.app/callback` *(for production)*
     > **Note:** Spotify's developer portal strictly rejects `localhost`. You **must** specify `127.0.0.1`.
   - **Which API/SDKs are you planning to use?**: Select **Web API**.
4. Check the Terms of Service box and click **Save**.
5. In your app overview, copy your **Client ID** (32-character hexadecimal string).

---

### 2. Configure Environment Variables

Create a `.env.local` file inside the `website` directory (copy from `.env.example`):

```bash
# website/.env.local
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback
```

*(You can also paste your Client ID directly into the in-app modal when clicking "Connect Spotify" if you don't want to set an environment variable).*

---

### 3. Local Development

```bash
cd website
pnpm install
pnpm dev
```

Visit [http://127.0.0.1:3000](http://127.0.0.1:3000) (or click the Studio section at `/#studio`).

---

### 4. How the Flow Works
1. **Connect Spotify**: Clicking the button generates a cryptographic `code_verifier`, derives the `S256` `code_challenge`, stores `state` in `sessionStorage`, and redirects to `https://accounts.spotify.com/authorize` with scopes:
   - `user-read-currently-playing`
   - `user-read-playback-state`
2. **Callback Handler (`/callback`)**: Validates `state`, sends the PKCE verifier to Spotify's token exchange endpoint, saves `access_token` and `refresh_token`, and returns to `/#studio`.
3. **Live Sync & Interpolation**:
   - Polling polls `/v1/me/player/currently-playing` every 2 seconds.
   - Smooth sub-second progress interpolation via `requestAnimationFrame`.
   - Handles `204` (nothing playing), `401` (proactive auto-refresh 60s before expiry), `429` (`Retry-After` backoff), and ads/podcasts (`currently_playing_type !== 'track'`).
   - Fetches synchronized timestamped lyrics from [LRCLIB](https://lrclib.net/) to illuminate words in real-time.
