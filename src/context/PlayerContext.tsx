import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Song } from '../types';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLooping: boolean;
  playSong: (song: Song, playlist?: Song[]) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleLoop: () => void;
  playNext: () => void;
  playPrevious: () => void;
  playlist: Song[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || currentSong?.duration || 0);
    };

    audio.onended = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        playNext();
      }
    };

    audio.onerror = (e) => {
      console.warn('Audio playback encountered an issue:', e);
      setIsPlaying(false);
    };

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const playSong = (song: Song, newPlaylist?: Song[]) => {
    if (newPlaylist && newPlaylist.length > 0) {
      setPlaylist(newPlaylist);
    }
    setCurrentSong(song);
    if (audioRef.current) {
      audioRef.current.src = song.audio_url;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Auto-play error (user interaction might be needed):', err);
          setIsPlaying(false);
        });
    }
  };

  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeSong = () => {
    if (audioRef.current && currentSong) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  const toggleLoop = () => {
    setIsLooping((prev) => !prev);
  };

  const playNext = () => {
    if (!currentSong || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((s) => s.id === currentSong.id);
    if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
      playSong(playlist[currentIndex + 1]);
    } else if (playlist.length > 0) {
      // Loop back to start
      playSong(playlist[0]);
    }
  };

  const playPrevious = () => {
    if (!currentSong || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((s) => s.id === currentSong.id);
    if (currentIndex > 0) {
      playSong(playlist[currentIndex - 1]);
    } else if (playlist.length > 0) {
      playSong(playlist[playlist.length - 1]);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isLooping,
        playSong,
        pauseSong,
        resumeSong,
        togglePlay,
        seek,
        setVolume,
        toggleLoop,
        playNext,
        playPrevious,
        playlist,
        audioRef,
        isExpanded,
        setIsExpanded,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
};
