import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db, Song, GenerationJob } from './db';
import { generateWavFile, mixVocalsWithAccompaniment } from './audioSynthesizer';
import { generateLyriaMusic, generateGeminiTTS, generateLyricsWithAI } from './geminiService';
import { generateElevenLabsMusic } from './elevenlabsService';

export const apiRouter = Router();

const AUDIO_DIR = path.resolve(process.cwd(), 'data', 'audio');

// In-memory OTP storage for phone login
const phoneOtpStore = new Map<string, { code: string; expiresAt: number }>();

// -------------------------------------------------------------
// 1. Songs API
// -------------------------------------------------------------

apiRouter.get('/songs', (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  const songs = db.getSongs(userId);
  res.json({ success: true, songs });
});

apiRouter.get('/songs/:id', (req: Request, res: Response) => {
  const song = db.getSong(req.params.id);
  if (!song) {
    return res.status(404).json({ success: false, error: 'Song not found' });
  }
  res.json({ success: true, song });
});

apiRouter.patch('/songs/:id', (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }
  const updated = db.updateSong(req.params.id, { title });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Song not found' });
  }
  res.json({ success: true, song: updated });
});

apiRouter.delete('/songs/:id', (req: Request, res: Response) => {
  const userId = req.body.userId || req.query.userId;
  const deleted = db.deleteSong(req.params.id, userId as string);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Song not found or unauthorized' });
  }

  // Delete audio file if exists
  const filePath = path.resolve(AUDIO_DIR, `${req.params.id}.wav`);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Failed to unlink audio file:', e);
    }
  }

  res.json({ success: true, message: 'Song deleted successfully' });
});

// -------------------------------------------------------------
// 2. Audio Streaming & Download
// -------------------------------------------------------------

apiRouter.get('/audio/:id', (req: Request, res: Response) => {
  const songId = req.params.id;
  const filePath = path.resolve(AUDIO_DIR, `${songId}.wav`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/wav',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/wav',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

apiRouter.get('/download/:id', (req: Request, res: Response) => {
  const songId = req.params.id;
  const song = db.getSong(songId);
  const filePath = path.resolve(AUDIO_DIR, `${songId}.wav`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found' });
  }

  const filename = `${(song?.title || 'SK_AI_Track').replace(/[^a-zA-Z0-9_-]/g, '_')}.wav`;
  res.download(filePath, filename);
});

// -------------------------------------------------------------
// 3. Background Music Generation Engine
// -------------------------------------------------------------

apiRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      userId = 'demo-user-1',
      prompt,
      style = 'Pop',
      mood = 'Energetic',
      language = 'English',
      tempo = 100,
      vocalStyle = 'Male Vocals',
      duration = 30, // 30, 60, 120, 180
      provider: requestedProvider,
      lyrics: userLyrics,
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const config = db.getAdminConfig();
    const durationNum = Number(duration) || 30;
    const cost = durationNum <= 30 ? config.cost_per_clip : config.cost_per_full;

    const user = db.getUser(userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found. Please log in.' });
    }

    if (user.credits < cost) {
      return res.status(402).json({
        success: false,
        error: `Insufficient credits. This generation requires ${cost} credits, but you have ${user.credits}.`,
        currentCredits: user.credits,
        requiredCredits: cost,
      });
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const songId = `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const selectedProvider = requestedProvider || config.active_provider || 'lyria-3-clip';

    // Create queued job
    const job: GenerationJob = {
      id: jobId,
      user_id: userId,
      song_id: songId,
      status: 'queued',
      progress: 5,
      step_description: 'Job queued in SK AI processing pipeline...',
      provider: selectedProvider,
      model: selectedProvider === 'lyria-3-pro' ? 'lyria-3-pro-preview' : selectedProvider === 'lyria-3-clip' ? 'lyria-3-clip-preview' : selectedProvider,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.createJob(job);

    // Return immediate response with jobId (non-blocking!)
    res.json({
      success: true,
      jobId,
      songId,
      cost,
      status: 'queued',
      message: 'Song generation started in background.',
    });

    // Start background asynchronous job execution
    processGenerationJob({
      jobId,
      songId,
      userId,
      prompt,
      style,
      mood,
      language,
      tempo: Number(tempo) || 100,
      vocalStyle,
      duration: durationNum,
      provider: selectedProvider,
      lyrics: userLyrics,
      cost,
    }).catch((err) => {
      console.warn(`Notice in background generation job ${jobId}:`, err?.message || err);
    });
  } catch (error: any) {
    console.warn('Generation route notice:', error?.message || error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

async function processGenerationJob(params: {
  jobId: string;
  songId: string;
  userId: string;
  prompt: string;
  style: string;
  mood: string;
  language: string;
  tempo: number;
  vocalStyle: string;
  duration: number;
  provider: string;
  lyrics?: string;
  cost: number;
}) {
  const { jobId, songId, userId, prompt, style, mood, language, tempo, vocalStyle, duration, provider, lyrics: existingLyrics, cost } = params;

  try {
    db.updateJob(jobId, {
      status: 'processing',
      progress: 25,
      step_description: 'Analyzing musical prompt and arranging harmony...',
    });

    // 1. Preserve exact user lyrics strictly - never overwrite or modify if provided
    let finalLyrics = (existingLyrics || '').trim();
    let songTitle = `${style} ${mood} Beat`;

    if (!finalLyrics && vocalStyle !== 'Instrumental Only') {
      try {
        db.updateJob(jobId, {
          progress: 35,
          step_description: 'Composing original lyrics with Gemini AI...',
        });
        const lyricResult = await generateLyricsWithAI({
          topic: prompt,
          style,
          mood,
          language,
          vocalType: vocalStyle,
        });
        finalLyrics = lyricResult.lyrics;
        if (lyricResult.title) {
          songTitle = lyricResult.title;
        }
      } catch (lyricErr) {
        console.warn('AI Lyrics generation bypassed:', lyricErr);
        finalLyrics = '';
      }
    } else if (finalLyrics) {
      // Extract title from prompt or style if title is default
      const firstLine = finalLyrics.split('\n')[0].replace(/[\[\]]/g, '').trim();
      if (firstLine && firstLine.length < 35) {
        songTitle = firstLine;
      }
    }

    db.updateJob(jobId, {
      progress: 55,
      step_description: `Synthesizing music & vocals via ${provider}...`,
    });

    const targetAudioPath = path.resolve(AUDIO_DIR, `${songId}.wav`);
    let finalModel = provider;
    let audioGenerated = false;

    // 2. Call the selected API provider / vocal synthesis engine
    const isInstrumental = vocalStyle === 'Instrumental Only' || !finalLyrics;

    if (provider === 'gemini-tts' || provider === 'sk-vocal-studio' || (!isInstrumental && provider === 'sk-synth')) {
      // EXACT LYRICS VOCAL STUDIO: Synthesizes exact lines and mixes with studio accompaniment
      try {
        db.updateJob(jobId, {
          progress: 65,
          step_description: 'Synthesizing exact lyrics vocal performance with Gemini 3.8 Flash TTS...',
        });
        const ttsResult = await generateGeminiTTS(finalLyrics, 'Puck', `${vocalStyle}, ${mood}`, language);

        db.updateJob(jobId, {
          progress: 80,
          step_description: 'Mixing vocal performance with musical backing tracks...',
        });

        await mixVocalsWithAccompaniment(
          ttsResult.audioBuffer,
          { durationSeconds: duration, bpm: tempo, style, mood, seedTitle: songTitle },
          targetAudioPath
        );
        audioGenerated = true;
        finalModel = 'gemini-3.8-flash-tts + studio-accompaniment';
      } catch (ttsErr: any) {
        console.warn('Vocal studio synthesis fallback:', ttsErr?.message || ttsErr);
        await generateWavFile(
          { durationSeconds: duration, bpm: tempo, style, mood, seedTitle: songTitle },
          targetAudioPath
        );
        audioGenerated = true;
        finalModel = 'sk-synth';
      }
    } else if (provider === 'elevenlabs') {
      try {
        const elResult = await generateElevenLabsMusic({
          prompt: `${style} ${mood} song, ${prompt}, lyrics: ${finalLyrics}, high quality studio master`,
          durationSeconds: duration,
        });
        fs.writeFileSync(targetAudioPath, elResult.audioBuffer);
        audioGenerated = true;
        finalModel = 'elevenlabs-music-api';
      } catch (elErr: any) {
        console.warn('ElevenLabs generation notice:', elErr?.message || elErr);
        const config = db.getAdminConfig();
        if (config.fallback_enabled) {
          if (!isInstrumental && finalLyrics) {
            const tts = await generateGeminiTTS(finalLyrics, 'Puck', vocalStyle, language).catch(() => null);
            if (tts) {
              await mixVocalsWithAccompaniment(
                tts.audioBuffer,
                { durationSeconds: duration, bpm: tempo, style, mood, seedTitle: songTitle },
                targetAudioPath
              );
              audioGenerated = true;
              finalModel = 'gemini-3.8-flash-tts + studio-accompaniment (elevenlabs fallback)';
            }
          }
          if (!audioGenerated) {
            await generateWavFile(
              { durationSeconds: duration, bpm: tempo, style, mood, seedTitle: songTitle },
              targetAudioPath
            );
            audioGenerated = true;
            finalModel = 'sk-synth-fallback';
          }
        } else {
          throw elErr;
        }
      }
    } else if (provider === 'lyria-3-clip' || provider === 'lyria-3-pro') {
      try {
        const lyriaResult = await generateLyriaMusic({
          prompt,
          durationSeconds: duration,
          model: provider === 'lyria-3-pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview',
          style,
          mood,
          language,
          vocalStyle,
          lyrics: finalLyrics,
        });
        fs.writeFileSync(targetAudioPath, lyriaResult.audioBuffer);
        audioGenerated = true;
        finalModel = lyriaResult.modelUsed;
      } catch (lyriaErr: any) {
        console.warn('Lyria API returned notice:', lyriaErr?.message || lyriaErr);
        const config = db.getAdminConfig();
        if (config.fallback_enabled) {
          console.log('Rendering audio with vocal-aligned studio accompaniment...');
          if (!isInstrumental && finalLyrics) {
            const tts = await generateGeminiTTS(finalLyrics, 'Puck', vocalStyle, language).catch(() => null);
            if (tts) {
              await mixVocalsWithAccompaniment(
                tts.audioBuffer,
                { durationSeconds: duration, bpm: tempo, style, mood, seedTitle: songTitle },
                targetAudioPath
              );
              audioGenerated = true;
              finalModel = 'gemini-3.8-flash-tts + studio-accompaniment (lyria fallback)';
            }
          }
          if (!audioGenerated) {
            await generateWavFile(
              { durationSeconds: duration, bpm: tempo, style, mood, seedTitle: songTitle },
              targetAudioPath
            );
            audioGenerated = true;
            finalModel = 'sk-synth (lyria fallback)';
          }
        } else {
          throw lyriaErr;
        }
      }
    } else {
      // Pure Instrumental Studio Synthesizer
      await generateWavFile(
        { durationSeconds: duration, bpm: tempo, style, mood, seedTitle: songTitle },
        targetAudioPath
      );
      audioGenerated = true;
      finalModel = 'sk-algorithmic-engine';
    }

    if (!audioGenerated || !fs.existsSync(targetAudioPath)) {
      throw new Error('Music generation failed to output a playable audio file.');
    }

    db.updateJob(jobId, {
      progress: 85,
      step_description: 'Mastering stereo audio and generating artwork...',
    });

    // Random artistic cover photo matching mood
    const coverPhotos = [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=80',
    ];
    const coverUrl = coverPhotos[Math.floor(Math.random() * coverPhotos.length)];

    // 3. Deduct credits upon verified completion
    const deducted = db.deductCredits(userId, cost, `Generation of song: "${songTitle}" (${duration}s)`);
    if (!deducted) {
      console.warn(`User ${userId} did not have enough credits at completion.`);
    }

    // 4. Save song record
    const newSong: Song = {
      id: songId,
      user_id: userId,
      title: songTitle,
      prompt,
      style,
      mood,
      language,
      tempo,
      vocal_style: vocalStyle,
      duration,
      audio_url: `/api/audio/${songId}`,
      cover_url: coverUrl,
      lyrics: finalLyrics,
      provider: provider as any,
      model: finalModel,
      status: 'ready',
      created_at: new Date().toISOString(),
    };
    db.addSong(newSong);

    // 5. Log API usage
    db.logApiUsage({
      user_id: userId,
      provider,
      model: finalModel,
      duration_seconds: duration,
      cost_credits: cost,
      status: 'success',
    });

    // 6. Complete Job
    db.updateJob(jobId, {
      status: 'completed',
      progress: 100,
      step_description: 'Song successfully generated and mastered!',
      song_id: songId,
    });
  } catch (error: any) {
    console.warn(`Generation Job ${jobId} notice:`, error?.message || error);
    db.updateJob(jobId, {
      status: 'failed',
      progress: 100,
      step_description: 'Generation failed',
      error: error.message || 'An error occurred during music synthesis.',
    });

    db.logApiUsage({
      user_id: userId,
      provider,
      model: provider,
      duration_seconds: duration,
      cost_credits: 0,
      status: 'failed',
    });
  }
}

apiRouter.get('/jobs/:id', (req: Request, res: Response) => {
  const job = db.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }

  let song: Song | undefined;
  if (job.status === 'completed' && job.song_id) {
    song = db.getSong(job.song_id);
  }

  res.json({
    success: true,
    job,
    song,
  });
});

// -------------------------------------------------------------
// 4. AI Lyrics Assistant
// -------------------------------------------------------------

apiRouter.post('/lyrics/generate', async (req: Request, res: Response) => {
  try {
    const { topic, style = 'Pop', mood = 'Emotional', language = 'English', vocalType } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, error: 'Topic is required' });
    }

    const lyricsData = await generateLyricsWithAI({
      topic,
      style,
      mood,
      language,
      vocalType,
    });

    res.json({ success: true, ...lyricsData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to generate lyrics' });
  }
});

// -------------------------------------------------------------
// 5. AI Vocals & TTS (Gemini 3.8 Flash TTS)
// -------------------------------------------------------------

apiRouter.post('/tts/generate', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Puck', style = 'Melodic, rhythmic vocal delivery' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required for TTS generation' });
    }

    const result = await generateGeminiTTS(text, voice, style);
    const tempId = `tts-${Date.now()}`;
    const filePath = path.resolve(AUDIO_DIR, `${tempId}.wav`);
    fs.writeFileSync(filePath, result.audioBuffer);

    res.json({
      success: true,
      audioUrl: `/api/audio/${tempId}`,
      mimeType: result.mimeType,
      voice,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'TTS generation failed' });
  }
});

// -------------------------------------------------------------
// 6. Auth & User Profile
// -------------------------------------------------------------

apiRouter.post('/auth/google', (req: Request, res: Response) => {
  const { id, name, email, avatar } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, error: 'User id is required' });
  }

  let user = db.getUser(id);
  if (!user && email) {
    user = db.getUserByEmail(email);
  }

  if (user) {
    user = db.upsertUser({
      ...user,
      id,
      name: name || user.name,
      email: email || user.email,
      avatar: avatar || user.avatar,
    });
  } else {
    user = db.upsertUser({
      id,
      name: name || 'Google Artist',
      email,
      avatar,
      role: email === 'ag8302044088@gmail.com' ? 'admin' : 'user',
      credits: 50,
      subscription_plan: 'free',
    });
  }

  res.json({ success: true, user });
});

apiRouter.post('/auth/phone/send-otp', (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone || phone.length < 8) {
    return res.status(400).json({ success: false, error: 'Please enter a valid phone number with country code' });
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  phoneOtpStore.set(phone, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  console.log(`[SMS OTP SERVICE] Sent code ${code} to ${phone}`);

  res.json({
    success: true,
    message: `Verification code sent to ${phone}`,
    // Expose OTP in debug payload for easy testing without SMS gateway wait
    debugCode: code,
  });
});

apiRouter.post('/auth/phone/verify-otp', (req: Request, res: Response) => {
  const { phone, code, name } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, error: 'Phone and OTP are required' });
  }

  const record = phoneOtpStore.get(phone);
  if (!record || record.expiresAt < Date.now()) {
    return res.status(400).json({ success: false, error: 'Verification code expired or not found. Please request a new one.' });
  }

  if (record.code !== code.trim()) {
    return res.status(400).json({ success: false, error: 'Invalid verification code' });
  }

  phoneOtpStore.delete(phone);

  let user = db.getUserByPhone(phone);
  if (!user) {
    const userId = `phone-${phone.replace(/[^0-9]/g, '')}`;
    user = db.upsertUser({
      id: userId,
      name: name || `Artist ${phone.slice(-4)}`,
      phone,
      role: 'user',
      credits: 50,
      subscription_plan: 'free',
    });
  }

  res.json({ success: true, user });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'demo-user-1';
  const user = db.getUser(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  res.json({ success: true, user });
});

apiRouter.post('/credits/buy', (req: Request, res: Response) => {
  const { userId, packageId, amountPaid } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId is required' });
  }

  let creditsToAdd = 100;
  let plan: 'creator' | 'pro' = 'creator';

  if (packageId === 'creator') {
    creditsToAdd = 500;
    plan = 'creator';
  } else if (packageId === 'pro') {
    creditsToAdd = 2500;
    plan = 'pro';
  } else if (packageId === 'pack-100') {
    creditsToAdd = 100;
  }

  const updatedUser = db.addCredits(userId, creditsToAdd, amountPaid || 9.99, `Credit Purchase: ${packageId}`);
  if (updatedUser) {
    db.upsertUser({
      id: userId,
      subscription_plan: plan,
    });
  }

  res.json({ success: true, user: updatedUser, creditsAdded: creditsToAdd });
});

apiRouter.post('/auth/delete-account', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId is required' });
  }

  // Delete all user songs
  const songs = db.getSongs(userId);
  for (const s of songs) {
    db.deleteSong(s.id, userId);
  }

  res.json({ success: true, message: 'Account and associated data deleted' });
});

// -------------------------------------------------------------
// 7. Admin Dashboard APIs
// -------------------------------------------------------------

apiRouter.get('/admin/metrics', (req: Request, res: Response) => {
  const users = db.getAllUsers();
  const songs = db.getSongs();
  const jobs = db.getAllJobs();
  const apiUsage = db.getApiUsage();
  const config = db.getAdminConfig();

  const totalCreditsUsed = apiUsage.reduce((acc, u) => acc + u.cost_credits, 0);
  const totalAudioSeconds = songs.reduce((acc, s) => acc + s.duration, 0);
  const failureCount = jobs.filter((j) => j.status === 'failed').length;

  res.json({
    success: true,
    metrics: {
      totalUsers: users.length,
      totalSongs: songs.length,
      totalJobs: jobs.length,
      failureCount,
      totalCreditsUsed,
      totalAudioMinutes: (totalAudioSeconds / 60).toFixed(1),
      activeSubscriptions: users.filter((u) => u.subscription_plan !== 'free').length,
    },
    config,
  });
});

apiRouter.get('/admin/config', (req: Request, res: Response) => {
  const config = db.getAdminConfig();
  res.json({
    success: true,
    config: {
      ...config,
      // Mask ElevenLabs key for security if present
      elevenlabs_api_key: config.elevenlabs_api_key ? `${config.elevenlabs_api_key.substring(0, 6)}...***` : '',
      isKeyConfigured: Boolean(config.elevenlabs_api_key || process.env.ELEVENLABS_API_KEY),
    },
  });
});

apiRouter.post('/admin/config', (req: Request, res: Response) => {
  const { active_provider, elevenlabs_api_key, fallback_enabled, cost_per_clip, cost_per_full, adminId = 'admin-user-1' } = req.body;

  const updates: any = {};
  if (active_provider) updates.active_provider = active_provider;
  if (elevenlabs_api_key !== undefined) updates.elevenlabs_api_key = elevenlabs_api_key;
  if (fallback_enabled !== undefined) updates.fallback_enabled = Boolean(fallback_enabled);
  if (cost_per_clip !== undefined) updates.cost_per_clip = Number(cost_per_clip);
  if (cost_per_full !== undefined) updates.cost_per_full = Number(cost_per_full);

  const updatedConfig = db.updateAdminConfig(updates, adminId);
  res.json({ success: true, config: updatedConfig });
});

apiRouter.get('/admin/jobs', (req: Request, res: Response) => {
  const jobs = db.getAllJobs().slice(0, 50);
  res.json({ success: true, jobs });
});

apiRouter.get('/admin/logs', (req: Request, res: Response) => {
  const logs = db.getAdminLogs();
  res.json({ success: true, logs });
});

apiRouter.post('/admin/grant-credits', (req: Request, res: Response) => {
  const { userId, credits, adminId = 'admin-user-1' } = req.body;
  if (!userId || !credits) {
    return res.status(400).json({ success: false, error: 'userId and credits are required' });
  }

  const updatedUser = db.addCredits(userId, Number(credits), 0, `Admin grant from ${adminId}`);
  db.logAdminAction(adminId, 'GRANT_CREDITS', `Granted ${credits} credits to user ${userId}`);

  res.json({ success: true, user: updatedUser });
});
