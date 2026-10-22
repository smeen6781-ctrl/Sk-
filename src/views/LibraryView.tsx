import React, { useState } from 'react';
import { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { deleteSong, updateSongTitle } from '../lib/api';
import { ShareModal } from '../components/ShareModal';
import {
  Library,
  Search,
  Filter,
  Play,
  Pause,
  Download,
  Share2,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

import { useToast } from '../context/ToastContext';

interface LibraryViewProps {
  songs: Song[];
  onSongDeleted: (songId: string) => void;
  onSongUpdated: (updated: Song) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  songs,
  onSongDeleted,
  onSongUpdated,
}) => {
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [shareSong, setShareSong] = useState<Song | null>(null);
  const [viewLyricsSong, setViewLyricsSong] = useState<Song | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredSongs = songs.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.lyrics && s.lyrics.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStyle = selectedStyle === 'all' || s.style.toLowerCase().includes(selectedStyle.toLowerCase());
    return matchesSearch && matchesStyle;
  });

  const handleStartRename = (song: Song) => {
    setEditingSongId(song.id);
    setEditTitle(song.title);
  };

  const handleSaveRename = async (songId: string) => {
    if (!editTitle.trim()) return;
    try {
      const updated = await updateSongTitle(songId, editTitle.trim());
      onSongUpdated(updated);
      setEditingSongId(null);
      toast.success('Track title updated successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to rename song');
    }
  };

  const confirmDelete = async () => {
    if (!songToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSong(songToDelete.id);
      onSongDeleted(songToDelete.id);
      toast.success(`"${songToDelete.title}" deleted.`);
      setSongToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete song');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
            <Library className="w-4 h-4 text-emerald-400" />
            <span>Master Catalog</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">My Songs & Creations</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Browse, replay, download, and share your generated music portfolio.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title or lyrics..."
              className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition w-48 sm:w-64"
            />
          </div>

          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Styles</option>
            <option value="bollywood">Bollywood</option>
            <option value="punjabi">Punjabi</option>
            <option value="lofi">Lofi</option>
            <option value="pop">Pop</option>
            <option value="rap">Rap / Hip-Hop</option>
            <option value="edm">EDM</option>
            <option value="acoustic">Acoustic</option>
          </select>
        </div>
      </div>

      {/* Songs Grid */}
      {filteredSongs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSongs.map((song) => {
            const isCurrent = currentSong?.id === song.id;
            const songPlaying = isCurrent && isPlaying;

            return (
              <div
                key={song.id}
                className="bg-zinc-900/60 border border-zinc-800 hover:border-purple-500/40 rounded-3xl p-5 flex flex-col justify-between transition group shadow-lg hover:shadow-purple-500/10"
              >
                <div>
                  {/* Artwork with play overlay */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-4 bg-zinc-950">
                    <img
                      src={song.cover_url}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          if (isCurrent) {
                            togglePlay();
                          } else {
                            playSong(song, filteredSongs);
                          }
                        }}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-xl transform active:scale-95 transition cursor-pointer"
                      >
                        {songPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-purple-300 border border-purple-500/30">
                      {song.style}
                    </span>

                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-zinc-300">
                      {song.duration}s
                    </span>
                  </div>

                  {/* Title & Rename Editor */}
                  {editingSongId === song.id ? (
                    <div className="flex items-center gap-1.5 mb-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-purple-500 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(song.id)}
                        className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingSongId(null)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-white text-base truncate">{song.title}</h3>
                      <button
                        onClick={() => handleStartRename(song)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-200 transition"
                        title="Rename song"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                    {song.prompt}
                  </p>
                </div>

                {/* Footer details & Action Buttons */}
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-zinc-500">{song.tempo} BPM</span>
                    <span>•</span>
                    <span className="text-[11px] text-zinc-500">{song.language}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {song.lyrics && (
                      <button
                        onClick={() => setViewLyricsSong(song)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                        title="View Lyrics"
                      >
                        <FileText className="w-4 h-4 text-blue-400" />
                      </button>
                    )}
                    <button
                      onClick={() => setShareSong(song)}
                      className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                      title="Share via Gmail / Google Chat"
                    >
                      <Share2 className="w-4 h-4 text-purple-400" />
                    </button>
                    <a
                      href={`/api/download/${song.id}`}
                      download
                      className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                      title="Download Master Track"
                    >
                      <Download className="w-4 h-4 text-pink-400" />
                    </a>
                    <button
                      onClick={() => setSongToDelete(song)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                      title="Delete Song"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center bg-zinc-900/40 border border-zinc-800 rounded-3xl space-y-3">
          <Library className="w-12 h-12 mx-auto text-zinc-700" />
          <h3 className="font-bold text-white text-base">No Songs Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search criteria or create a brand new track using the Text-to-Song Generator.
          </p>
        </div>
      )}

      {/* Share Modal */}
      {shareSong && (
        <ShareModal
          song={shareSong}
          isOpen={Boolean(shareSong)}
          onClose={() => setShareSong(null)}
        />
      )}

      {/* Lyrics Viewer Modal */}
      {viewLyricsSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">{viewLyricsSong.title} — Lyrics</h3>
              </div>
              <button
                onClick={() => setViewLyricsSong(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto pr-2 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {viewLyricsSong.lyrics}
            </div>
          </div>
        </div>
      )}

      {/* In-App Deletion Confirmation Modal (No window.confirm) */}
      {songToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Song?</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-zinc-200">"{songToDelete.title}"</strong>? This action cannot be reversed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSongToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-lg shadow-red-600/30 transition cursor-pointer flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
