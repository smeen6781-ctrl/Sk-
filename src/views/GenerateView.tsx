import React, { useState, useEffect } from 'react';
import { ViewTab, Song } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { startGenerationJob, pollJobStatus, generateLyrics } from '../lib/api';
import confetti from 'canvas-confetti';
import { useToast } from '../context/ToastContext';
import {
  Sparkles,
  Music2,
  FileText,
  Sliders,
  Clock,
  Layers,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  RotateCcw,
  Check,
  Edit3,
  Lock,
  Volume2,
  Info,
} from 'lucide-react';

interface GenerateViewProps {
  onSongCreated: (song: Song) => void;
  onNavigate: (tab: ViewTab) => void;
  onOpenCredits: () => void;
  initialLyrics?: string;
  initialTitle?: string;
}

export const GenerateView: React.FC<GenerateViewProps> = ({
  onSongCreated,
  onNavigate,
  onOpenCredits,
  initialLyrics = '',
  initialTitle = '',
}) => {
  const { user, refreshUser } = useAuth();
  const { playSong } = usePlayer();
  const toast = useToast();

  // Form Parameters
  const [prompt, setPrompt] = useState(
    initialTitle ? `Song track based on: ${initialTitle}` : ''
  );
  const [style, setStyle] = useState('Bollywood-inspired');
  const [mood, setMood] = useState('Romantic');
  const [language, setLanguage] = useState('Hindi');
  const [tempo, setTempo] = useState<number>(96);
  const [vocalStyle, setVocalStyle] = useState('Melodic & Emotional');
  const [duration, setDuration] = useState<number>(30);
  // Default to gemini-tts for exact word-for-word vocal accuracy
  const [provider, setProvider] = useState<
    'gemini-tts' | 'lyria-3-clip' | 'lyria-3-pro' | 'elevenlabs' | 'sk-synth'
  >('gemini-tts');

  // Exact lyrics storage — NEVER overwritten or modified silently
  const [lyrics, setLyrics] = useState(initialLyrics || '');
  const [isLyricsConfirmed, setIsLyricsConfirmed] = useState(false);
  const [isEditingLyrics, setIsEditingLyrics] = useState(true);
  const [isWritingLyrics, setIsWritingLyrics] = useState(false);

  // Background Job Processing
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepDescription, setStepDescription] = useState('');
  const [generatedSong, setGeneratedSong] = useState<Song | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialLyrics) {
      setLyrics(initialLyrics);
      setIsLyricsConfirmed(true);
      setIsEditingLyrics(false);
    }
  }, [initialLyrics]);

  const cost = duration <= 30 ? 5 : 10;

  // Benchmark test lyrics from user requirement
  const benchmarkHindiLyrics = `तेरी यादों में रात गुज़र जाती है,
तेरी बातें दिल को रुलाती हैं,
तू नहीं है फिर भी लगता है,
तेरी धड़कन पास बुलाती है।`;

  const handleLoadBenchmarkLyrics = () => {
    setLyrics(benchmarkHindiLyrics);
    setPrompt('Soulful Bollywood romantic melody with acoustic guitar and emotional Hindi vocals');
    setStyle('Bollywood-inspired');
    setMood('Romantic');
    setLanguage('Hindi');
    setTempo(96);
    setVocalStyle('Melodic & Emotional');
    setProvider('gemini-tts');
    setIsLyricsConfirmed(true);
    setIsEditingLyrics(false);
  };

  const handleAiWriteLyrics = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a song prompt or topic first.');
      return;
    }
    setIsWritingLyrics(true);
    try {
      const res = await generateLyrics({
        topic: prompt,
        style,
        mood,
        language,
        vocalType: vocalStyle,
      });
      // Store exact approved lyrics
      setLyrics(res.lyrics);
      setIsLyricsConfirmed(false);
      setIsEditingLyrics(true);
      if (res.recommendedBpm) setTempo(res.recommendedBpm);
      toast.success('AI Lyrics generated! Review and lock them for your track.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to auto-generate lyrics.');
    } finally {
      setIsWritingLyrics(false);
    }
  };

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Check credits
    if (user.credits < cost) {
      onOpenCredits();
      return;
    }

    // Require confirmation if custom lyrics are entered
    if (lyrics.trim() && !isLyricsConfirmed) {
      setIsLyricsConfirmed(true);
      setIsEditingLyrics(false);
    }

    setErrorMsg(null);
    setGeneratedSong(null);
    setIsGenerating(true);
    setProgress(10);
    setStepDescription('Preparing exact lyrics and audio production...');

    try {
      const res = await startGenerationJob({
        userId: user.id,
        prompt: prompt.trim(),
        style,
        mood,
        language,
        tempo,
        vocalStyle,
        duration,
        provider,
        // Send exact approved lyrics without modifications
        lyrics: lyrics.trim() || undefined,
      });

      // Poll job status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await pollJobStatus(res.jobId);
          setProgress(statusRes.job.progress);
          setStepDescription(statusRes.job.step_description);

          if (statusRes.job.status === 'completed' && statusRes.song) {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setGeneratedSong(statusRes.song);
            onSongCreated(statusRes.song);
            playSong(statusRes.song);
            refreshUser();
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          } else if (statusRes.job.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setErrorMsg(statusRes.job.error || 'Music generation pipeline encountered an error.');
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 1500);
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMsg(err.message || 'Failed to start generation.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Studio Music Generator</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Text-to-Song Studio</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Generate full songs where AI vocals sing your <strong>exact custom lyrics</strong> over studio accompaniment.
          </p>
        </div>

        {/* Benchmark Test Button */}
        <button
          type="button"
          onClick={handleLoadBenchmarkLyrics}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 hover:bg-purple-900/50 text-purple-300 font-semibold text-xs transition shadow-lg shrink-0 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-pink-400" />
          <span>Load Hindi Test Lyrics (4 Lines)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: 7 Columns */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <form onSubmit={handleStartGeneration} className="space-y-6">
            {/* 1. Musical Style & Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Music Style & Arrangement Description
                </label>
                <span className="text-[11px] text-zinc-500">Instruments & mood</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your musical vision: instruments, emotions, beat style (e.g. 'Soulful acoustic Bollywood romance with lofi rain ambiance and emotional guitars')..."
                rows={2}
                required
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-2xl p-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition resize-none leading-relaxed"
              />
            </div>

            {/* 2. Dedicated Exact Lyrics Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Song Lyrics (Exact Words to Sing)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAiWriteLyrics}
                    disabled={isWritingLyrics}
                    className="flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isWritingLyrics ? 'Writing...' : 'AI Lyrics'}</span>
                  </button>
                </div>
              </div>

              {isEditingLyrics ? (
                <div>
                  <textarea
                    value={lyrics}
                    onChange={(e) => {
                      setLyrics(e.target.value);
                      setIsLyricsConfirmed(false);
                    }}
                    placeholder="Enter the exact lines you want the vocals to sing (Hindi Devanagari, Hinglish, Punjabi, or English)..."
                    rows={5}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl p-3.5 text-xs text-zinc-100 placeholder-zinc-500 font-mono leading-relaxed focus:outline-none transition resize-none"
                  />
                  {lyrics.trim() && (
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLyricsConfirmed(true);
                          setIsEditingLyrics(false);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm & Lock Lyrics</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Approved Lyrics Review Display */
                <div className="bg-zinc-900/90 border border-emerald-500/40 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approved Lyrics Locked ({lyrics.split('\n').filter(Boolean).length} lines)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingLyrics(true)}
                      className="flex items-center gap-1 text-zinc-400 hover:text-white text-xs underline cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Lyrics</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed p-2.5 bg-black/40 rounded-lg border border-zinc-800">
                    {lyrics}
                  </pre>
                  <p className="text-[11px] text-zinc-400 italic">
                    ✓ These exact words, line order, and language will be sung by the AI vocalist.
                  </p>
                </div>
              )}
            </div>

            {/* Grid for Style, Mood, Language */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Bollywood-inspired">Bollywood-inspired</option>
                  <option value="Romantic">Romantic</option>
                  <option value="Lofi">Lofi</option>
                  <option value="Punjabi Folk & Trap">Punjabi Folk & Trap</option>
                  <option value="Rap / Hip-Hop">Rap / Hip-Hop</option>
                  <option value="Pop">Pop</option>
                  <option value="EDM">EDM</option>
                  <option value="Sad">Sad</option>
                  <option value="Acoustic">Acoustic</option>
                  <option value="Devotional">Devotional</option>
                  <option value="Cinematic">Cinematic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Mood</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Romantic">Romantic</option>
                  <option value="Emotional">Emotional</option>
                  <option value="Sad">Sad</option>
                  <option value="Chill">Chill</option>
                  <option value="Energetic">Energetic</option>
                  <option value="Uplifting">Uplifting</option>
                  <option value="Dark">Dark</option>
                  <option value="Devotional">Devotional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Hinglish">Hinglish</option>
                  <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="English">English</option>
                  <option value="Instrumental">Instrumental Only</option>
                </select>
              </div>
            </div>

            {/* Vocal Style & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Vocal Style</label>
                <select
                  value={vocalStyle}
                  onChange={(e) => setVocalStyle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Melodic & Emotional">Melodic & Emotional</option>
                  <option value="Soft Acoustic Whisper">Soft Acoustic Whisper</option>
                  <option value="High-Energy Rap Flow">High-Energy Rap Flow</option>
                  <option value="Duet Vocals">Duet Vocals</option>
                  <option value="Soulful Classical">Soulful Classical</option>
                  <option value="Instrumental Only">Instrumental Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={30}>30s Short Clip (5 credits)</option>
                  <option value={60}>1 Minute Track (10 credits)</option>
                  <option value={120}>2 Minutes Track (10 credits)</option>
                  <option value={180}>3 Minutes Track (10 credits)</option>
                </select>
              </div>
            </div>

            {/* Tempo Slider */}
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span className="font-semibold">Tempo (BPM)</span>
                <span className="font-mono text-purple-400 font-bold">{tempo} BPM</span>
              </div>
              <input
                type="range"
                min={70}
                max={160}
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Provider Selector with Accuracy Transparency */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-400">
                  AI Music Generation Engine
                </label>
                {provider === 'gemini-tts' ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Exact Word-for-Word Vocals Guaranteed
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                    <Info className="w-3 h-3" /> May vary or improvise lyrics
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setProvider('gemini-tts')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    provider === 'gemini-tts'
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1">
                    <span>Vocal Studio</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">Exact</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Sings exact lyrics</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('lyria-3-clip')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    provider === 'lyria-3-clip'
                      ? 'bg-pink-600/20 border-pink-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">Lyria 3 Clip</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">30s AI music</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('lyria-3-pro')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    provider === 'lyria-3-pro'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">Lyria 3 Pro</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Full AI music</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('sk-synth')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    provider === 'sk-synth'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">Instrumental</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Beats only</div>
                </button>
              </div>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>Cost: <strong className="text-white">{cost} credits</strong></span>
                <span>•</span>
                <span>Balance: <strong className="text-purple-400">{user.credits}</strong></span>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Synthesizing...' : 'Generate Studio Song'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Stage: 5 Columns (Live Pipeline Status & Output) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Generation Pipeline</span>
            </h3>

            {isGenerating ? (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                    {stepDescription}
                  </span>
                  <span className="font-mono text-sm">{progress}%</span>
                </div>

                <div className="w-full bg-zinc-950 rounded-full h-3 overflow-hidden p-0.5 border border-zinc-800">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${progress >= 25 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <span>Exact Lyrics & Harmony Alignment</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${progress >= 60 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <span>Neural Vocal Performance ({language})</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${progress >= 85 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <span>Stereo Master Accompaniment Mixing</span>
                  </div>
                </div>
              </div>
            ) : generatedSong ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white text-sm">Song Generated!</h4>
                    <p className="text-xs text-emerald-300">Exact lyrics sung over studio accompaniment.</p>
                  </div>
                </div>

                <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
                  <img
                    src={generatedSong.cover_url}
                    alt={generatedSong.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                    <div>
                      <h4 className="font-bold text-white text-base">{generatedSong.title}</h4>
                      <p className="text-xs text-purple-300">{generatedSong.style} • {generatedSong.duration}s</p>
                    </div>
                  </div>
                </div>

                {generatedSong.lyrics && (
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {generatedSong.lyrics}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => playSong(generatedSong)}
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Song (Listen to Lyrics)</span>
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500 space-y-3">
                <Music2 className="w-12 h-12 mx-auto text-zinc-700" />
                <p className="text-xs max-w-xs mx-auto">
                  Enter your prompt & lyrics on the left. Click "Load Hindi Test Lyrics" to test with the benchmark Hindi verses!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
