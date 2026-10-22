import { db } from './db';

interface ElevenLabsMusicParams {
  prompt: string;
  durationSeconds?: number;
  modelId?: string;
}

export async function generateElevenLabsMusic(params: ElevenLabsMusicParams): Promise<{ audioBuffer: Buffer; mimeType: string }> {
  const config = db.getAdminConfig();
  const apiKey = (config.elevenlabs_api_key || process.env.ELEVENLABS_API_KEY || '').trim();

  if (!apiKey) {
    throw new Error('ElevenLabs API Key is not configured. Please set a valid ElevenLabs xi-api-key in Admin Dashboard or .env.');
  }

  // Diagnostic check for accidentally passing a Google Gemini / AI Studio key
  if (apiKey.startsWith('AQ.') || apiKey.startsWith('AIzaSy')) {
    throw new Error(
      'Invalid ElevenLabs API Key: The key provided starts with "AQ." or "AIza", which is a Google Gemini / AI Studio key rather than an ElevenLabs API key. ElevenLabs keys can be obtained from https://elevenlabs.io/app/settings/api-keys.'
    );
  }

  const durationSec = Math.min(300, Math.max(5, params.durationSeconds || 30));
  const durationMs = durationSec * 1000;
  const modelId = params.modelId || 'music_v2_5';

  // 1. Try official ElevenLabs Music API (POST /v1/music)
  try {
    const musicResponse = await fetch('https://api.elevenlabs.io/v1/music', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        prompt: params.prompt,
        music_length_ms: durationMs,
        model_id: modelId,
        output_format: 'mp3_44100_128',
      }),
    });

    if (musicResponse.ok) {
      const arrayBuffer = await musicResponse.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);
      const mimeType = musicResponse.headers.get('content-type') || 'audio/mpeg';
      return { audioBuffer, mimeType };
    }

    // If unauthorized or rate limit, throw immediate descriptive error
    if (musicResponse.status === 401) {
      let errDetail = 'Invalid API key';
      try {
        const errJson = await musicResponse.json();
        errDetail = errJson.detail?.message || errJson.message || JSON.stringify(errJson);
      } catch {}
      throw new Error(`Invalid ElevenLabs API key: ${errDetail}. Check your xi-api-key at elevenlabs.io.`);
    }

    if (musicResponse.status === 429) {
      let errDetail = 'Rate limit or quota exceeded';
      try {
        const errJson = await musicResponse.json();
        errDetail = errJson.detail?.message || errJson.message || JSON.stringify(errJson);
      } catch {}
      throw new Error(`ElevenLabs quota exceeded: ${errDetail}`);
    }

    // If 404 or unsupported on current tier, fallback to sound-generation
    console.warn(`ElevenLabs /v1/music returned ${musicResponse.status}, attempting /v1/sound-generation fallback...`);
  } catch (err: any) {
    if (err.message && (err.message.includes('Invalid ElevenLabs API') || err.message.includes('quota exceeded'))) {
      throw err;
    }
    console.warn('ElevenLabs /v1/music call notice:', err?.message || err);
  }

  // 2. Fallback to ElevenLabs Sound Generation API (/v1/sound-generation)
  const soundResponse = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: params.prompt,
      duration_seconds: Math.min(30, durationSec),
      prompt_influence: 0.5,
    }),
  });

  if (!soundResponse.ok) {
    let errorDetail = `Status ${soundResponse.status}: ${soundResponse.statusText}`;
    try {
      const errorJson = await soundResponse.json();
      errorDetail = errorJson.detail?.message || errorJson.message || JSON.stringify(errorJson);
    } catch {
      // ignore
    }

    if (soundResponse.status === 401) {
      throw new Error(`Invalid ElevenLabs API Key: ${errorDetail}`);
    } else if (soundResponse.status === 429) {
      throw new Error(`ElevenLabs rate limit or quota exceeded: ${errorDetail}`);
    } else {
      throw new Error(`ElevenLabs API error (${soundResponse.status}): ${errorDetail}`);
    }
  }

  const arrayBuffer = await soundResponse.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);
  const mimeType = soundResponse.headers.get('content-type') || 'audio/mpeg';

  return {
    audioBuffer,
    mimeType,
  };
}

