import { pcmToWav } from './wav';

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';

// Default key — used when the user hasn't set their own
export const DEFAULT_API_KEY = 'sk_830d00b90d1da0bdb2461aa55d15e7675c5d05c9fe0dd031';

// Fetch the user's available voices from ElevenLabs
export const fetchVoices = async (apiKey) => {
  const res = await fetch(`${ELEVENLABS_API}/voices`, {
    headers: { 'xi-api-key': apiKey },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.detail?.message || err.detail || `Failed to fetch voices (${res.status})`
    );
  }
  const data = await res.json();
  return data.voices;
};

// Generate speech via ElevenLabs v3 TTS — returns an MP3 or WAV Blob
export const generateSpeech = async (apiKey, { text, voiceId, language, outputFormat = 'mp3' }) => {
  const formatParam = outputFormat === 'wav' ? 'pcm_44100' : 'mp3_44100';
  const res = await fetch(
    `${ELEVENLABS_API}/text-to-speech/${voiceId}?output_format=${formatParam}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_v3',
        language_code: language,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.detail?.message || err.detail || `TTS generation failed (${res.status})`
    );
  }
  const blob = await res.blob();
  if (outputFormat === 'wav') {
    const pcmData = await blob.arrayBuffer();
    return pcmToWav(pcmData, 44100, 1);
  }
  return blob;
};

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'pl', label: 'Polish' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ru', label: 'Russian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'cs', label: 'Czech' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ko', label: 'Korean' },
];