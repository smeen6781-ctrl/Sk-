import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { AudioVisualizer } from './AudioVisualizer';
import { ShareModal } from './ShareModal';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  Music2,
  FileText,
} from 'lucide-react';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const AudioPlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLooping,
    togglePlay,
    seek,
    setVolume,
    toggleLoop,
    playNext,
    playPrevious,
    isExpanded,
    setIsExpanded,
  } = usePlayer();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeTabExpanded, setActiveTabExpanded] = useState<'visualizer' | 'lyrics'>('lyrics');

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/download/${currentSong.id}`;
    link.setAttribute('download', `${currentSong.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.wav`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Docked Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-4 py-2.5 sm:px-6 sm:py-3 shadow-2xl transition-all">
        {/* Progress Scrubber */}
        <div className="absolute top-0 left-0 right-0 -translate-y-1/2 px-4 group">
          <input
            type="range"
            min={0}
            max={duration || 30}
            step={0.1}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:h-2 transition-all"
          />
        </div>

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Song Meta */}
          <div className="flex items-center gap-3 min-w-0 max-w-[28%] sm:max-w-[30%]">
            <img
              src={currentSong.cover_url}
              alt={currentSong.title}
              className="w-12 h-12 rounded-xl object-cover shadow-md border border-zinc-800 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white truncate">{currentSong.title}</h4>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {currentSong.style} • {currentSong.mood}
              </p>
            </div>
          </div>

          {/* Center: Controls & Visualizer */}
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-md">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleLoop}
                className={`p-1.5 rounded-lg transition ${
                  isLooping ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-400 hover:text-white'
                }`}
                title="Loop track"
              >
                <Repeat className="w-4 h-4" />
              </button>

              <button
                onClick={playPrevious}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
                title="Previous track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 transition transform active:scale-95 cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={playNext}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
                title="Next track"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
                title="Expand studio view"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration || currentSong.duration)}</span>
            </div>
          </div>

          {/* Right: Actions, Volume & Sharing */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setVolume(volume === 0 ? 0.85 : 0)}
                className="text-zinc-400 hover:text-white p-1"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition"
              title="Share via Gmail / Google Chat"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
              title="Download Master WAV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Expanded Studio Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col p-6 sm:p-10 animate-in fade-in duration-200 overflow-y-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Music2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{currentSong.title}</h3>
                <p className="text-xs text-zinc-400">
                  {currentSong.style} • {currentSong.tempo} BPM • {currentSong.language} • {currentSong.provider}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-sm font-semibold text-zinc-200 transition"
              >
                <Share2 className="w-4 h-4 text-purple-400" />
                Share Track
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition shadow-lg shadow-purple-600/30"
              >
                <Download className="w-4 h-4" />
                Download Audio
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition"
              >
                <Minimize2 className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main Stage Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-8">
            {/* Left Column: Artwork + Visualizer */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
              <div className="relative group w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 mb-6">
                <img
                  src={currentSong.cover_url}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                  <div className="text-left">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/30 text-purple-300 border border-purple-500/40 mb-2">
                      {currentSong.provider}
                    </span>
                    <h2 className="text-xl font-bold text-white">{currentSong.title}</h2>
                  </div>
                </div>
              </div>

              {/* Real-time Visualizer */}
              <div className="w-full max-w-sm px-4">
                <AudioVisualizer isPlaying={isPlaying} barCount={48} height={56} />
              </div>

              {/* Expanded Playback Controls */}
              <div className="flex items-center gap-6 mt-6">
                <button onClick={toggleLoop} className={`p-2 transition ${isLooping ? 'text-purple-400' : 'text-zinc-500 hover:text-white'}`}>
                  <Repeat className="w-5 h-5" />
                </button>
                <button onClick={playPrevious} className="p-2 text-zinc-400 hover:text-white transition">
                  <SkipBack className="w-6 h-6" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white flex items-center justify-center shadow-xl shadow-purple-500/40 transform active:scale-95 transition"
                >
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
                <button onClick={playNext} className="p-2 text-zinc-400 hover:text-white transition">
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Right Column: Lyrics & Song Insights */}
            <div className="lg:col-span-7 flex flex-col bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <h4 className="text-base font-bold text-white">Lyrics & Composition</h4>
                </div>
                <div className="text-xs text-zinc-400">
                  Prompt: <span className="text-zinc-300 italic">"{currentSong.prompt}"</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[380px] pr-4 space-y-4 font-sans text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {currentSong.lyrics || (
                  <div className="text-center py-12 text-zinc-500 italic">
                    Instrumental master track — no lyrics specified.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Integration */}
      <ShareModal song={currentSong} isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
    </>
  );
};
