import React, { useState } from 'react';
import { generateTTSVocal } from '../lib/api';
import {
  Mic2,
  Sparkles,
  Play,
  Pause,
  Download,
  Loader2,
  Volume2,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const VoiceView: React.FC = () => {
  const toast = useToast();
  const [text, setText] = useState(
    'Alex: Welcome back! Today we are diving deep into AI music models, rhythm, and future vocal synthesizers.'
  );
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  const [vocalStyle, setVocalStyle] = useState('Enthusiastic, bright vocal delivery');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const voiceOptions = [
    { name: 'Puck', desc: 'Warm, dynamic male vocal persona' },
    { name: 'Kore', desc: 'Clear, emotive female vocal persona' },
    { name: 'Fenrir', desc: 'Deep, resonant baritone delivery' },
    { name: 'Charon', desc: 'Calm, authoritative narrator tone' },
    { name: 'Zephyr', desc: 'Airy, melodic soft vocal timbre' },
  ];

  const stylePresets = [
    'Enthusiastic, bright vocal delivery',
    'Melodic, rhythmic sung cadence',
    'Fast aggressive rap flow with punchy consonants',
    'Soft emotional whisper with intimate breath',
    'Dramatic cinematic trailer narration',
  ];

  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }

    setIsLoading(true);
    try {
      const res = await generateTTSVocal({
        text: text.trim(),
        voice: selectedVoice,
        style: vocalStyle,
      });
      setAudioUrl(res.audioUrl);

      const audio = new Audio(res.audioUrl);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
      toast.success('Voice synthesis complete!');
    } catch (err: any) {
      toast.error(err.message || 'TTS generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlay = () => {
    if (!audioElement) return;
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
          <Mic2 className="w-4 h-4 text-pink-400" />
          <span>Powered by gemini-3.8-flash-tts</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">AI Voice & Vocal Studio</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Generate realistic speech, rap flow, and vocals with speech metadata and licensed Google personas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form: 7 Columns */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSynthesize} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Vocal Script / Spoken Lyrics
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                required
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-2xl p-4 text-xs text-white placeholder-zinc-500 focus:outline-none transition resize-none leading-relaxed"
              />
            </div>

            {/* Voice Model Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">
                Licensed Voice Persona
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {voiceOptions.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => setSelectedVoice(v.name)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      selectedVoice === v.name
                        ? 'bg-purple-600/20 border-purple-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">{v.name}</div>
                    <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vocal Style Direction */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Speech Style Direction
              </label>
              <input
                type="text"
                value={vocalStyle}
                onChange={(e) => setVocalStyle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {stylePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setVocalStyle(preset)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-purple-300 transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Voice with Gemini TTS...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize AI Vocals</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output: 5 Columns */}
        <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-purple-400" />
              <span>Voice Playback & Master Stems</span>
            </h3>

            {audioUrl ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                    <Mic2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Persona: {selectedVoice}</h4>
                    <p className="text-xs text-purple-300 italic">{vocalStyle}</p>
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={handleTogglePlay}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      <span>{isPlaying ? 'Pause' : 'Play Vocal'}</span>
                    </button>
                    <a
                      href={audioUrl}
                      download={`SK_AI_Voice_${selectedVoice}.wav`}
                      className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200">
                  <div className="flex items-center gap-1.5 font-semibold text-purple-300 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>24kHz Studio RIFF WAV Output</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Generated with high-resolution neural speech parameters. Suitable for layering over instrumental tracks.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-zinc-500 space-y-2">
                <Mic2 className="w-10 h-10 mx-auto text-zinc-700" />
                <p className="text-xs">
                  Enter vocal lines on the left and synthesize audio with Gemini 3.8 Flash TTS.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
