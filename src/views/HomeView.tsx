import React, { useState } from 'react';
import { ViewTab, Song } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { startGenerationJob, pollJobStatus } from '../lib/api';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Play,
  Pause,
  ArrowRight,
  Disc3,
  Clock,
  Globe,
  Music,
  Zap,
  Flame,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: ViewTab) => void;
  songs: Song[];
  onSongCreated: (song: Song) => void;
  onOpenCredits: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  songs,
  onSongCreated,
  onOpenCredits,
}) => {
  const { user, refreshUser } = useAuth();
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();

  // Fast generator state
  const [prompt, setPrompt] = useState('');
  const [customLyrics, setCustomLyrics] = useState('');
  const [showLyricsBox, setShowLyricsBox] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('Bollywood-inspired');
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [selectedMood, setSelectedMood] = useState('Romantic');

  // Background job tracking
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [stepDescription, setStepDescription] = useState('');
  const [genError, setGenError] = useState<string | null>(null);

  const styleOptions = [
    { label: 'Bollywood', value: 'Bollywood-inspired' },
    { label: 'Punjabi', value: 'Punjabi Rap / Hip-Hop' },
    { label: 'Lofi Chill', value: 'Lofi' },
    { label: 'Romantic', value: 'Romantic' },
    { label: 'Pop Anthem', value: 'Pop' },
    { label: 'EDM Festival', value: 'EDM' },
    { label: 'Sad Acoustic', value: 'Sad' },
    { label: 'Devotional', value: 'Devotional' },
    { label: 'Cinematic', value: 'Cinematic' },
  ];

  const suggestedPrompts = [
    {
      title: 'Romantic Hindi Lofi',
      text: 'Soulful Bollywood melody with rain ambiance, acoustic chords, and sweet soft Hindi vocals',
      style: 'Bollywood-inspired',
      lang: 'Hindi',
    },
    {
      title: 'Desi Trap Punjabi',
      text: 'Hard hitting 808 bass Punjabi club banger with high-tempo dhol drops and energetic rap flow',
      style: 'Punjabi Rap / Hip-Hop',
      lang: 'Punjabi',
    },
    {
      title: 'Midnight Lofi Chill',
      text: 'Mellow electric piano study beat with warm vinyl crackle and soothing atmospheric synth pads',
      style: 'Lofi',
      lang: 'Instrumental',
    },
    {
      title: 'Cyberpunk EDM Drop',
      text: 'High-octane melodic electro festival track with soaring supersaw lead synth and euphoric vocal chops',
      style: 'EDM',
      lang: 'English',
    },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !customLyrics.trim()) return;

    setGenError(null);
    setIsGenerating(true);
    setCurrentProgress(10);
    setStepDescription('Submitting generation job to SK AI engine...');

    // Detect if prompt contains lyrics or if custom lyrics are supplied
    const isDevanagari = /[\u0900-\u097F]/.test(prompt) || /[\u0900-\u097F]/.test(customLyrics);
    const effectiveLyrics = customLyrics.trim() || (isDevanagari || prompt.includes('\n') ? prompt.trim() : undefined);
    const chosenProvider = effectiveLyrics ? 'gemini-tts' : 'lyria-3-clip';

    try {
      const res = await startGenerationJob({
        userId: user.id,
        prompt: prompt.trim() || 'Romantic melody track',
        style: selectedStyle,
        mood: selectedMood,
        language: isDevanagari ? 'Hindi' : selectedLanguage,
        tempo: selectedStyle.includes('EDM') ? 128 : selectedStyle.includes('Lofi') ? 82 : 96,
        vocalStyle: selectedLanguage === 'Instrumental' ? 'Instrumental Only' : 'Melodic Vocals',
        duration: selectedDuration,
        provider: chosenProvider,
        lyrics: effectiveLyrics,
      });

      // Poll until completed
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await pollJobStatus(res.jobId);
          setCurrentProgress(statusRes.job.progress);
          setStepDescription(statusRes.job.step_description);

          if (statusRes.job.status === 'completed' && statusRes.song) {
            clearInterval(pollInterval);
            setIsGenerating(false);
            onSongCreated(statusRes.song);
            playSong(statusRes.song, [statusRes.song, ...songs]);
            refreshUser();
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          } else if (statusRes.job.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setGenError(statusRes.job.error || 'Music generation failed.');
          }
        } catch (pollErr: any) {
          console.error('Polling error:', pollErr);
        }
      }, 1500);
    } catch (err: any) {
      setIsGenerating(false);
      setGenError(err.message || 'Generation failed.');
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/20 via-pink-600/20 to-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Next-Gen Music Model • Google Lyria 3 & ElevenLabs Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight sm:leading-none mb-4">
            Create Hit Songs in Seconds with{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              AI Vocals & Beats
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Generate full songs with soulful vocals, lyrics, and production in Hindi, Hinglish, Punjabi, and English.
            Share instantly through Gmail & Google Chat.
          </p>

          {/* Quick Prompt Creation Box */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl max-w-3xl mx-auto text-left">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your song idea or paste lyrics directly here (e.g. 'तेरी यादों में रात गुज़र जाती है...')..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-2xl p-4 text-sm text-white placeholder-zinc-500 focus:outline-none transition resize-none leading-relaxed"
                />
              </div>

              {/* Exact Lyrics Option */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <button
                    type="button"
                    onClick={() => setShowLyricsBox(!showLyricsBox)}
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                  >
                    <span>{showLyricsBox ? '▾ Hide Exact Lyrics Box' : '▸ Add Exact Custom Lyrics (Guaranteed Singing)'}</span>
                  </button>
                  {customLyrics && (
                    <span className="text-[10px] text-emerald-400 font-bold">
                      ✓ Lyrics locked
                    </span>
                  )}
                </div>

                {showLyricsBox && (
                  <div className="p-3 bg-zinc-950/80 border border-purple-500/30 rounded-xl space-y-2 mt-2">
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                      Exact Words for AI Vocalist to Sing
                    </label>
                    <textarea
                      value={customLyrics}
                      onChange={(e) => setCustomLyrics(e.target.value)}
                      placeholder="Paste your exact Hindi, Punjabi, or English lyrics here line-by-line..."
                      rows={4}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-lg p-3 text-xs text-zinc-200 placeholder-zinc-500 font-mono leading-relaxed focus:outline-none transition resize-none"
                    />
                    <div className="flex justify-between items-center text-[10px] text-zinc-400">
                      <span>Exact line order & spelling preserved 100%</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomLyrics(`तेरी यादों में रात गुज़र जाती है,\nतेरी बातें दिल को रुलाती हैं,\nतू नहीं है फिर भी लगता है,\nतेरी धड़कन पास बुलाती है।`);
                          setSelectedLanguage('Hindi');
                        }}
                        className="text-pink-400 hover:underline cursor-pointer"
                      >
                        Insert Hindi Test Lyrics
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Parameter Selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Style */}
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Style</label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    {styleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mood */}
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Mood</label>
                  <select
                    value={selectedMood}
                    onChange={(e) => setSelectedMood(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Romantic">Romantic</option>
                    <option value="Energetic">Energetic</option>
                    <option value="Chill">Chill</option>
                    <option value="Sad">Sad</option>
                    <option value="Uplifting">Uplifting</option>
                    <option value="Dark">Dark</option>
                    <option value="Devotional">Devotional</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Language</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Hinglish">Hinglish</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Punjabi">Punjabi</option>
                    <option value="English">English</option>
                    <option value="Instrumental">Instrumental Only</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Duration</label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value={30}>30s Preview (5 credits)</option>
                    <option value={60}>1 Minute (10 credits)</option>
                    <option value={120}>2 Minutes (10 credits)</option>
                    <option value={180}>3 Minutes (10 credits)</option>
                  </select>
                </div>
              </div>

              {/* Generation Status Banner */}
              {isGenerating && (
                <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs text-purple-300">
                    <span className="flex items-center gap-2 font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                      {stepDescription}
                    </span>
                    <span className="font-mono font-bold">{currentProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                      style={{ width: `${currentProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {genError && (
                <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{genError}</span>
                </div>
              )}

              {/* Action row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-zinc-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Cost: <strong className="text-white">{selectedDuration <= 30 ? 5 : 10} credits</strong></span>
                  <span>•</span>
                  <span>Balance: <strong className="text-purple-400">{user.credits}</strong></span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onNavigate('generate')}
                    className="text-xs text-zinc-400 hover:text-white underline sm:no-underline sm:px-3 sm:py-2.5 sm:rounded-xl sm:border sm:border-zinc-800 transition"
                  >
                    Advanced Studio
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGenerating ? 'Generating Track...' : 'Generate Song'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-zinc-500 font-medium mr-1">Inspirations:</span>
            {suggestedPrompts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(s.text);
                  setSelectedStyle(s.style);
                  setSelectedLanguage(s.lang);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-purple-500/40 transition text-left cursor-pointer"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Songs Library */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-pink-400" />
            <h2 className="text-xl font-bold text-white">Trending SK AI Creations</h2>
          </div>
          <button
            onClick={() => onNavigate('library')}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold"
          >
            <span>View All Library</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {songs.slice(0, 4).map((song) => {
            const isCurrent = currentSong?.id === song.id;
            const songPlaying = isCurrent && isPlaying;

            return (
              <div
                key={song.id}
                className="group relative bg-zinc-900/60 border border-zinc-800 hover:border-purple-500/40 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3.5 bg-zinc-950">
                    <img
                      src={song.cover_url}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => {
                          if (isCurrent) {
                            togglePlay();
                          } else {
                            playSong(song, songs);
                          }
                        }}
                        className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-105 transition active:scale-95 cursor-pointer"
                      >
                        {songPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                      {song.style}
                    </span>

                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-zinc-300">
                      {song.duration}s
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm truncate mb-1">{song.title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {song.prompt}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <span>{song.language}</span>
                  <span className="font-mono">{song.tempo} BPM</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Disc3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Multilingual Music AI</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Generate songs in Hindi, Punjabi, Hinglish, English and more with culturally authentic scales, instruments and cadence.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Google Lyria & ElevenLabs</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real high-fidelity music generation with AI vocals, instrumental stems, and dynamic audio frequency response.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Google Workspace Sharing</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Send your song tracks, WAV audio, and lyrics directly via Gmail and collaborate in real-time within Google Chat spaces.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
