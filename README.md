# SK AI — Studio-Grade AI Song Generator

**SK AI** is a professional, full-stack AI music generation application with real audio synthesis, AI vocals, lyrics writing, background job processing, and Google Workspace sharing.

---

## 🌟 Key Features

1. **Text-to-Song Generator**:
   - Create complete songs with vocals, lyrics, and arrangements from detailed text prompts.
   - Multilingual support: **Hindi, Hinglish, Punjabi, English, and more**.
   - Music Styles: **Bollywood-inspired, Punjabi Folk & Trap, Lofi, Romantic, Pop, EDM, Rap / Hip-Hop, Acoustic, Sad, Devotional, Cinematic**.
   - Custom controls: Duration (30s, 1m, 2m, 3m), BPM (70–160), Mood, Vocal style (Male, Female, Duet, Soft, Rap Flow, Instrumental Only).

2. **Multi-Engine AI Music Architecture**:
   - **Google Lyria 3**: Short clips with `lyria-3-clip-preview` (up to 30s) and full-length songs with `lyria-3-pro-preview`.
   - **Gemini 3.8 Flash TTS Vocal Studio**: Generates realistic vocals, rap verses, and spoken dialogue using `gemini-3.8-flash-tts` with licensed persona voices (`Puck`, `Kore`, `Fenrir`, `Charon`, `Zephyr`).
   - **ElevenLabs Music Integration**: Official API integration for sound and music generation.
   - **SK Algorithmic Studio Synthesizer**: Native multi-stem PCM audio engine rendering chords, 808 bass, percussion, and melodies to ensure zero broken audio.

3. **AI Lyrics Assistant**:
   - Powered by `gemini-3.8-flash`.
   - Generates complete structured lyrics (`[Verse 1]`, `[Chorus]`, `[Verse 2]`, `[Bridge]`, `[Outro]`) in Hindi, Hinglish, Punjabi, English, and Spanish.
   - Built-in interactive lyrics editor with one-click transfer into the song generator.

4. **Real Audio Player & Downloads**:
   - Built-in dockable audio player with seek slider, volume control, loop mode, and track navigation.
   - Dynamic real-time canvas frequency waveform visualizer.
   - Master WAV and MP3 audio downloads.
   - Rename, replay, and manage your tracks in the **My Songs** library.

5. **Google Workspace Sharing (Gmail & Google Chat)**:
   - **Gmail API**: Email songs with audio playback links and formatted lyrics directly to collaborators and fans.
   - **Google Chat API**: List spaces and announce song releases into Google Chat spaces.
   - Strict explicit user confirmation dialogs before sending emails or posting messages.

6. **Authentication & Credits Ledger**:
   - Sign in with Google (Firebase Auth + Workspace OAuth).
   - Phone number OTP verification with secure session tokens.
   - Transparent credit pricing (5 credits for 30s preview, 10 credits for full track).
   - Credit packages and subscription management.

7. **Root Admin Panel**:
   - Live metrics: Total users, songs created, active subscriptions, total audio minutes, failure rates.
   - Active provider switcher (Google Lyria 3 Clip, Lyria 3 Pro, ElevenLabs, Algorithmic Synth).
   - User credit grant and management tools.
   - Job queue diagnostics and audit logs.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Visualizer
- **Backend**: Node.js, Express, tsx
- **AI Models**:
  - `lyria-3-clip-preview` & `lyria-3-pro-preview` (Music generation)
  - `gemini-3.8-flash-tts` (Speech & Vocals)
  - `gemini-3.8-flash` (Lyrics creation)
  - ElevenLabs Music API (External provider)
- **Database**: Relational-structured persistent JSON database (`./data/database.json`)
- **Authentication & Workspace**: Firebase SDK, Google OAuth (Gmail & Google Chat)

---

## 🚀 Getting Started

### 1. Environment Variables
Copy `.env.example` to `.env`:

```bash
# GEMINI_API_KEY: Required for Lyria 3 and Gemini TTS
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Optional: ElevenLabs API Key
ELEVENLABS_API_KEY="YOUR_ELEVENLABS_KEY"

# Port
PORT=3000
```

### 2. Install & Run
```bash
# Install dependencies
npm install

# Start development server (runs tsx server.ts with Vite)
npm run dev
```

### 3. Build for Production
```bash
npm run build
npm start
```
