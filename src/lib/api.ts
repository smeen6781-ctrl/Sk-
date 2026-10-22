import { Song, User, GenerationJob, AdminConfig, AdminMetrics, LyricsResponse } from '../types';

export async function fetchSongs(userId?: string): Promise<Song[]> {
  const url = userId ? `/api/songs?userId=${encodeURIComponent(userId)}` : '/api/songs';
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch songs');
  return data.songs;
}

export async function fetchSong(id: string): Promise<Song> {
  const res = await fetch(`/api/songs/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch song');
  return data.song;
}

export async function updateSongTitle(id: string, title: string): Promise<Song> {
  const res = await fetch(`/api/songs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update song title');
  return data.song;
}

export async function deleteSong(id: string, userId?: string): Promise<void> {
  const res = await fetch(`/api/songs/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete song');
}

export async function startGenerationJob(payload: {
  userId: string;
  prompt: string;
  style: string;
  mood: string;
  language: string;
  tempo: number;
  vocalStyle: string;
  duration: number;
  provider?: string;
  lyrics?: string;
}): Promise<{ jobId: string; songId: string; cost: number }> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Generation request failed');
  return data;
}

export async function pollJobStatus(jobId: string): Promise<{ job: GenerationJob; song?: Song }> {
  const res = await fetch(`/api/jobs/${jobId}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Job not found');
  return data;
}

export async function generateLyrics(params: {
  topic: string;
  style: string;
  mood: string;
  language: string;
  vocalType?: string;
}): Promise<LyricsResponse> {
  const res = await fetch('/api/lyrics/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to generate lyrics');
  return data;
}

export async function generateTTSVocal(params: {
  text: string;
  voice: string;
  style: string;
}): Promise<{ audioUrl: string; voice: string }> {
  const res = await fetch('/api/tts/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to synthesize speech');
  return data;
}

export async function syncGoogleUser(googleUser: {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}): Promise<User> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(googleUser),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to sync Google user');
  return data.user;
}

export async function sendPhoneOtp(phone: string): Promise<{ success: boolean; debugCode?: string }> {
  const res = await fetch('/api/auth/phone/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to send OTP');
  return data;
}

export async function verifyPhoneOtp(params: { phone: string; code: string; name?: string }): Promise<User> {
  const res = await fetch('/api/auth/phone/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Verification failed');
  return data.user;
}

export async function purchaseCredits(userId: string, packageId: string, amountPaid: number): Promise<User> {
  const res = await fetch('/api/credits/buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, packageId, amountPaid }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Purchase failed');
  return data.user;
}

export async function deleteAccount(userId: string): Promise<void> {
  const res = await fetch('/api/auth/delete-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Account deletion failed');
}

export async function fetchAdminMetrics(): Promise<{ metrics: AdminMetrics; config: AdminConfig }> {
  const res = await fetch('/api/admin/metrics');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch metrics');
  return data;
}

export async function updateAdminConfig(config: Partial<AdminConfig>): Promise<AdminConfig> {
  const res = await fetch('/api/admin/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update admin config');
  return data.config;
}

export async function fetchAdminJobs(): Promise<GenerationJob[]> {
  const res = await fetch('/api/admin/jobs');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch jobs');
  return data.jobs;
}

export async function grantCreditsAdmin(userId: string, credits: number): Promise<User> {
  const res = await fetch('/api/admin/grant-credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, credits }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to grant credits');
  return data.user;
}
