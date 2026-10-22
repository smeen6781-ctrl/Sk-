export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'user' | 'admin';
  credits: number;
  subscription_plan: 'free' | 'creator' | 'pro';
  avatar?: string;
  created_at: string;
}

export interface Song {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  style: string;
  mood: string;
  language: string;
  tempo: number;
  vocal_style: string;
  duration: number;
  audio_url: string;
  cover_url: string;
  lyrics: string;
  provider: 'lyria-3-clip' | 'lyria-3-pro' | 'gemini-tts' | 'elevenlabs' | 'sk-synth';
  model?: string;
  status: 'ready' | 'generating' | 'failed';
  created_at: string;
}

export interface GenerationJob {
  id: string;
  user_id: string;
  song_id?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  step_description: string;
  error?: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface LyricsResponse {
  title: string;
  lyrics: string;
  recommendedBpm: number;
  musicalKey: string;
  structure: {
    verse1: string;
    chorus: string;
    verse2: string;
    bridge: string;
    outro: string;
  };
}

export interface AdminMetrics {
  totalUsers: number;
  totalSongs: number;
  totalJobs: number;
  failureCount: number;
  totalCreditsUsed: number;
  totalAudioMinutes: string;
  activeSubscriptions: number;
}

export interface AdminConfig {
  active_provider: 'lyria-3-clip' | 'lyria-3-pro' | 'elevenlabs' | 'gemini-tts' | 'sk-synth';
  elevenlabs_api_key?: string;
  fallback_enabled: boolean;
  cost_per_clip: number;
  cost_per_full: number;
  isKeyConfigured?: boolean;
}

export type ViewTab = 'home' | 'generate' | 'lyrics' | 'voice' | 'library' | 'credits' | 'profile' | 'admin';
