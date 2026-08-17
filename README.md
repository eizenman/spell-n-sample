# spell-n-sample

**Welcome to spell-n-sample project**

## About

spell-n-sample is a React-based sample generator that supercharges vocal sample production for Audiotool users. It connects ElevenLabs' TTS API with Audiotool's Machiniste sampler via the Audiotool Nexus SDK
Users type a single word into each of 9 sample pads (with optional inline emoji expression tags), press Enter to instantly generate speech audio. The audio is pushed directly into the corresponding Machiniste channel slot in a live Audiotool session — enabling rapid one-word vocal chop iteration alongside the DAW.

## UI Design
Inspired by the Speak & Spell toy aesthetic. 9 pads in a 3×3 grid — each pad card contains: single-line text input (one word, emoji-capable), waveform preview with draggable start/end handles and preview button. Enter key triggers generation. Global controls panel at the top: ElevenLabs API key input, Audiotool session connect button, voice selector dropdown, language selector.

## Getting Started

1. **Clone** the repository  
   ```bash
   git clone <repository‑url>
   cd spell-n-sample
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Create a local environment file** (`.env.local`) and set the required variables:

   ```dotenv
   VITE_APP_ID=your_app_id          # Your Audiotool app ID
   VITE_APP_BASE_URL=https://api.your-audiotool-app.com  # Base URL for your Audiotool backend
   VITE_FUNCTIONS_VERSION=latest    # Optional: version of the serverless functions you use
   ```

4. **Run** the development server  
   ```bash
   npm run dev
   ```

The app will be available at `http://127.0.0.1:5173`.

## Authentication

- The application uses Audiotool for user authentication.
- Sign‑in, sign‑up, password reset and OAuth flows are handled by the Audiotool SDK (`@audiotool/nexus`).

## Documentation & Support

- **Audiotool Docs** – https://docs.audiotool.com
