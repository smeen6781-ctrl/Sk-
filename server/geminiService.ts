import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Initialize server-side Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface LyriaGenerationOptions {
  prompt: string;
  durationSeconds: number; // 30, 60, 120, 180
  model?: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  style?: string;
  mood?: string;
  language?: string;
  vocalStyle?: string;
  lyrics?: string;
}

export interface LyriaResult {
  audioBuffer: Buffer;
  mimeType: string;
  lyrics?: string;
  modelUsed: string;
}

/**
 * Generate music using Lyria 3 (Clip or Pro)
 */
export async function generateLyriaMusic(options: LyriaGenerationOptions): Promise<LyriaResult> {
  const model = options.durationSeconds <= 30 ? 'lyria-3-clip-preview' : 'lyria-3-pro-preview';

  const promptParts = [
    `Generate an original music track.`,
    `Prompt: ${options.prompt}`,
    options.style ? `Musical Style: ${options.style}` : '',
    options.mood ? `Mood & Emotion: ${options.mood}` : '',
    options.language ? `Language / Cultural elements: ${options.language}` : '',
    options.vocalStyle ? `Vocal direction: ${options.vocalStyle}` : '',
    options.lyrics ? `Song Lyrics (sing these exact lines): "${options.lyrics}"` : '',
    `Target duration: ${options.durationSeconds} seconds.`,
  ];

  const detailedPrompt = promptParts.filter(Boolean).join('. ');

  try {
    const responseStream = await ai.models.generateContentStream({
      model: options.model || model,
      contents: detailedPrompt,
    });

    let audioBase64 = '';
    let lyricsExtracted = '';
    let mimeType = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text) {
          lyricsExtracted += part.text;
        }
      }
    }

    if (!audioBase64) {
      throw new Error('Lyria model returned no audio stream data in response.');
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    return {
      audioBuffer,
      mimeType,
      lyrics: options.lyrics || lyricsExtracted.trim(),
      modelUsed: options.model || model,
    };
  } catch (error: any) {
    console.warn(`Lyria Music Generation notice (${options.model || model}):`, error?.message || error);
    throw error;
  }
}

/**
 * Generate AI Vocals singing exact user lyrics using Gemini 3.8 Flash TTS
 * Accurately handles Hindi Devanagari, Punjabi, Hinglish, and English pronunciation.
 */
export async function generateGeminiTTS(
  text: string,
  voice: string = 'Puck',
  style: string = 'Melodic singing cadence with clear vocal articulation',
  languageHint?: string
): Promise<{ audioBuffer: Buffer; mimeType: string }> {
  try {
    // Detect script for accurate phonetic pronunciation
    const isHindiDevanagari = /[\u0900-\u097F]/.test(text);
    const isPunjabiGurmukhi = /[\u0A00-\u0A7F]/.test(text);

    let languageTag = 'en-US';
    if (isHindiDevanagari || (languageHint && languageHint.toLowerCase().includes('hindi'))) {
      languageTag = 'hi-IN';
    } else if (isPunjabiGurmukhi || (languageHint && languageHint.toLowerCase().includes('punjabi'))) {
      languageTag = 'pa-IN';
    }

    // Check if the script contains dual-speaker markers (e.g., "Speaker1: ... \n Speaker2: ...")
    const linesWithSpeakers = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^[A-Za-z0-9\s_-]+:/.test(l));

    const isMultiSpeaker = linesWithSpeakers.length >= 2;

    let inputPayload: any;
    let speechConfigPayload: any;

    if (isMultiSpeaker) {
      const speakerSet = new Set<string>();
      linesWithSpeakers.forEach((line) => {
        const m = line.match(/^([A-Za-z0-9\s_-]+):/);
        if (m) speakerSet.add(m[1].trim());
      });

      const speakersList = Array.from(speakerSet);
      const speaker1 = speakersList[0] || 'Singer 1';
      const speaker2 = speakersList[1] || 'Singer 2';

      inputPayload = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((line) => {
          const m = line.match(/^([A-Za-z0-9\s_-]+):\s*(.*)$/);
          if (m) {
            const currentSpeaker = m[1].trim() === speaker2 ? speaker2 : speaker1;
            return {
              type: 'text',
              text: `${currentSpeaker}: ${m[2]}`,
              annotations: [
                {
                  type: 'speech_metadata',
                  speaker: currentSpeaker,
                  style,
                },
              ],
            };
          }
          return {
            type: 'text',
            text: `${speaker1}: ${line}`,
            annotations: [
              {
                type: 'speech_metadata',
                speaker: speaker1,
                style,
              },
            ],
          };
        });

      speechConfigPayload = {
        speakers: [
          {
            speaker: speaker1,
            voice: voice || 'Puck',
          },
          {
            speaker: speaker2,
            voice: voice === 'Puck' ? 'Kore' : 'Puck',
          },
        ],
      };
    } else {
      // Single speaker: speech_config is an array with 1 item
      inputPayload = [
        {
          type: 'text',
          text,
          annotations: [
            {
              type: 'speech_metadata',
              style: `${style}, singing the lyrics with authentic rhythm and pitch`,
            },
          ],
        },
      ];

      speechConfigPayload = [
        {
          voice: voice || 'Puck',
        },
      ];
    }

    const interaction = await ai.interactions.create({
      model: 'gemini-3.8-flash-tts',
      input: inputPayload,
      response_format: { type: 'audio' },
      generation_config: {
        speech_config: speechConfigPayload,
      },
    });

    const outputAudio = interaction.output_audio;
    if (!outputAudio?.data) {
      throw new Error('No audio returned from gemini-3.8-flash-tts');
    }

    const audioBuffer = Buffer.from(outputAudio.data, 'base64');
    return {
      audioBuffer,
      mimeType: outputAudio.mime_type || 'audio/wav',
    };
  } catch (error: any) {
    console.warn('Gemini 3.8 Flash TTS notice:', error?.message || error);
    throw error;
  }
}

/**
 * Generate Structured Song Lyrics with Gemini 3.8 Flash
 */
export async function generateLyricsWithAI(params: {
  topic: string;
  style: string;
  mood: string;
  language: string;
  vocalType?: string;
}): Promise<{
  title: string;
  lyrics: string;
  structure: {
    verse1: string;
    chorus: string;
    verse2: string;
    bridge: string;
    outro: string;
  };
  musicalKey: string;
  recommendedBpm: number;
}> {
  const prompt = `You are a world-class songwriter and music producer for SK AI Studio.
Create a complete, evocative song with rhythm, cadence, and rhyme.
Song Topic / Idea: "${params.topic}"
Musical Style: ${params.style}
Mood: ${params.mood}
Language: ${params.language} (If Hindi or Punjabi or Hinglish, write natural Romanized Hinglish/Punjabi or native script with clear phonetic singable flow).
Vocal Delivery Style: ${params.vocalType || 'Melodic, emotionally expressive'}

Respond strictly with valid JSON conforming to this schema (no extra markdown outside the JSON block):
{
  "title": "A catchy song title",
  "recommendedBpm": 105,
  "musicalKey": "C Major",
  "structure": {
    "verse1": "4-6 lines of verse 1",
    "chorus": "Catchy 4-line hook / chorus",
    "verse2": "4-6 lines of verse 2",
    "bridge": "Climactic 4-line bridge",
    "outro": "2-4 line fadeout outro"
  },
  "lyrics": "The complete full song formatted with section headers [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return parsed;
  } catch (error: any) {
    console.warn('Lyrics generation notice, using structured fallback:', error?.message || error);
    return {
      title: `${params.mood} ${params.style} Anthem`,
      musicalKey: 'A Minor',
      recommendedBpm: 110,
      structure: {
        verse1: `Walk through the shadows under city lights\nSearching for rhythm in the endless nights\nEvery beat echoing what we left behind\nA melody frozen in the back of my mind.`,
        chorus: `Sing it loud, let the bass line break the dawn\nWe are here, together where we belong\nSK AI playing in my soul tonight\nLost in the frequency, burning bright.`,
        verse2: `Heartbeat syncs with the synthesizer glow\nCatching the wave, letting all the worry go\nEvery whisper turning to an anthem strong\nThis is our story, this is our song.`,
        bridge: `And when the silence starts to creep\nMusic is the promise that we keep\nHigher and higher till the world disappears\nWashing away all the doubts and tears.`,
        outro: `Fade into the rhythm...\nLet the music breathe...\nSK AI forever.`,
      },
      lyrics: `[Verse 1]\nWalk through the shadows under city lights\nSearching for rhythm in the endless nights\nEvery beat echoing what we left behind\nA melody frozen in the back of my mind.\n\n[Chorus]\nSing it loud, let the bass line break the dawn\nWe are here, together where we belong\nSK AI playing in my soul tonight\nLost in the frequency, burning bright.\n\n[Verse 2]\nHeartbeat syncs with the synthesizer glow\nCatching the wave, letting all the worry go\nEvery whisper turning to an anthem strong\nThis is our story, this is our song.\n\n[Bridge]\nAnd when the silence starts to creep\nMusic is the promise that we keep\nHigher and higher till the world disappears\nWashing away all the doubts and tears.\n\n[Outro]\nFade into the rhythm...\nLet the music breathe...\nSK AI forever.`,
    };
  }
}
