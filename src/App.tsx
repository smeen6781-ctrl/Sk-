import React, { useState, useEffect } from 'react';
import { ViewTab, Song } from './types';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { Navbar } from './components/Navbar';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { AuthModal } from './components/AuthModal';
import { CreditsModal } from './components/CreditsModal';
import { HomeView } from './views/HomeView';
import { GenerateView } from './views/GenerateView';
import { LyricsView } from './views/LyricsView';
import { VoiceView } from './views/VoiceView';
import { LibraryView } from './views/LibraryView';
import { ProfileView } from './views/ProfileView';
import { AdminView } from './views/AdminView';
import { fetchSongs } from './lib/api';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('home');
  const [songs, setSongs] = useState<Song[]>([]);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // State to pass lyrics from Lyrics Studio to Generator
  const [transferLyrics, setTransferLyrics] = useState<{ lyrics: string; title: string } | null>(null);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      const data = await fetchSongs();
      setSongs(data);
    } catch (e) {
      console.error('Failed to load songs:', e);
    }
  };

  const handleSongCreated = (newSong: Song) => {
    setSongs((prev) => [newSong, ...prev.filter((s) => s.id !== newSong.id)]);
  };

  const handleSongDeleted = (songId: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  const handleSongUpdated = (updated: Song) => {
    setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleNavigateToGeneratorWithLyrics = (lyrics: string, title: string) => {
    setTransferLyrics({ lyrics, title });
    setCurrentTab('generate');
  };

  return (
    <div className="min-h-screen bg-[#07070d] text-zinc-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenCredits={() => setIsCreditsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomeView
            onNavigate={(tab) => setCurrentTab(tab)}
            songs={songs}
            onSongCreated={handleSongCreated}
            onOpenCredits={() => setIsCreditsOpen(true)}
          />
        )}

        {currentTab === 'generate' && (
          <GenerateView
            onSongCreated={handleSongCreated}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenCredits={() => setIsCreditsOpen(true)}
            initialLyrics={transferLyrics?.lyrics}
            initialTitle={transferLyrics?.title}
          />
        )}

        {currentTab === 'lyrics' && (
          <LyricsView onNavigateToGenerator={handleNavigateToGeneratorWithLyrics} />
        )}

        {currentTab === 'voice' && <VoiceView />}

        {currentTab === 'library' && (
          <LibraryView
            songs={songs}
            onSongDeleted={handleSongDeleted}
            onSongUpdated={handleSongUpdated}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            onOpenCredits={() => setIsCreditsOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {currentTab === 'admin' && <AdminView />}
      </main>

      {/* Sticky Audio Player Bar */}
      <AudioPlayerBar />

      {/* Global Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CreditsModal isOpen={isCreditsOpen} onClose={() => setIsCreditsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
