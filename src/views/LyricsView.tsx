import React, { useState } from 'react';
import { ViewTab, LyricsResponse } from '../types';
import { generateLyrics } from '../lib/api';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Music,
  BookOpen,
  Send,
  Loader2,
  Sliders,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface LyricsViewProps {
  onNavigateToGenerator: (initialLyrics: string, initialTitle: string) => void;
}

export const LyricsView: React.FC<LyricsViewProps> = ({ onNavigateToGenerator }) => {
  const toast = useToast();
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('Bollywood Romantic');
  const [mood, setMood] = useState('Soulful & Emotional');
  const [language, setLanguage] = useState('Hinglish');
  const [vocalType, setVocalType] = useState('Catchy Melodic Hook');

  const [isLoading, setIsLoading] = useState(false);
  const [lyricsResult, setLyricsResult] = useState<LyricsResponse | null>(null);
  const [editedLyrics, setEditedLyrics] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    try {
      const data = await generateLyrics({
        topic: topic.trim(),
        style,
        mood,
        language,
        vocalType,
      });
      setLyricsResult(data);
      setEditedLyrics(data.lyrics);
      toast.success(`Generated lyrics for "${data.title}"!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate lyrics.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedLyrics || lyricsResult?.lyrics || '');
    setCopied(true);
    toast.success('Lyrics copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
          <FileText className="w-4 h-4 text-pink-400" />
          <span>Gemini AI Songwriter</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">AI Lyrics Studio</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Craft rhyming, evocative verses, hooks, and bridges in Hindi, Hinglish, Punjabi, and English.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: 5 Columns */}
        <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-5">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Song Concept or Story
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What is your song about? (e.g. 'Two people meeting after years at a Mumbai railway station during monsoon rain')..."
                rows={4}
                required
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-2xl p-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Bollywood Romantic">Bollywood Romantic</option>
                  <option value="Punjabi Hip-Hop">Punjabi Hip-Hop</option>
                  <option value="Lofi Chill">Lofi Chill</option>
                  <option value="Pop Anthem">Pop Anthem</option>
                  <option value="Acoustic Folk">Acoustic Folk</option>
                  <option value="Rap & Drill">Rap & Drill</option>
                  <option value="Sufi Devotional">Sufi Devotional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Hinglish">Hinglish</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Mood</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Soulful & Emotional">Soulful & Emotional</option>
                  <option value="Heartbreak & Sadness">Heartbreak & Sadness</option>
                  <option value="Energetic & Confident">Energetic & Confident</option>
                  <option value="Dreamy & Floating">Dreamy & Floating</option>
                  <option value="Euphoric & Joyous">Euphoric & Joyous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Vocal Type</label>
                <select
                  value={vocalType}
                  onChange={(e) => setVocalType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Catchy Melodic Hook">Catchy Melodic Hook</option>
                  <option value="Rapid Fire Rap Delivery">Rapid Fire Rap Delivery</option>
                  <option value="Intimate Acoustic Vocal">Intimate Acoustic Vocal</option>
                  <option value="Anthemic Stadium Chorus">Anthemic Stadium Chorus</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !topic.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Composing with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Full Lyrics</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Stage: 7 Columns (Lyrics Editor & Composer transfer) */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">
                  {lyricsResult?.title || 'Lyrics Preview & Editor'}
                </h3>
              </div>

              {lyricsResult && (
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                    {lyricsResult.musicalKey}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                    {lyricsResult.recommendedBpm} BPM
                  </span>
                </div>
              )}
            </div>

            {lyricsResult ? (
              <textarea
                value={editedLyrics}
                onChange={(e) => setEditedLyrics(e.target.value)}
                rows={16}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-2xl p-4 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none transition resize-none"
              />
            ) : (
              <div className="py-24 text-center text-zinc-500 space-y-3">
                <FileText className="w-12 h-12 mx-auto text-zinc-700" />
                <p className="text-xs max-w-sm mx-auto">
                  Provide a song concept on the left and our AI songwriter will generate structured verses, chorus, and bridge.
                </p>
              </div>
            )}
          </div>

          {lyricsResult && (
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Lyrics'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToGenerator(editedLyrics, lyricsResult.title)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Use in Song Generator</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
