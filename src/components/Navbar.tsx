import React from 'react';
import { ViewTab } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Music,
  FileText,
  Mic2,
  Library,
  Zap,
  Shield,
  User as UserIcon,
  Plus,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenCredits: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenCredits,
  onOpenAuth,
}) => {
  const { user, isGoogleAuthenticated } = useAuth();

  return (
    <nav className="sticky top-0 z-30 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-blue-500 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Music className="w-5 h-5 text-purple-400 group-hover:text-pink-400 transition" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
                  SK AI
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  STUDIO
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">Song Generator</p>
            </div>
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onTabChange('home')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentTab === 'home'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onTabChange('generate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentTab === 'generate'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Text-to-Song
            </button>
            <button
              onClick={() => onTabChange('lyrics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentTab === 'lyrics'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              AI Lyrics
            </button>
            <button
              onClick={() => onTabChange('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentTab === 'voice'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Mic2 className="w-3.5 h-3.5 text-purple-400" />
              Voice Studio
            </button>
            <button
              onClick={() => onTabChange('library')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentTab === 'library'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Library className="w-3.5 h-3.5 text-emerald-400" />
              My Songs
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install / APK Button */}
          <PWAInstallButton />

          {/* Admin Switcher */}
          <button
            onClick={() => onTabChange('admin')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
              currentTab === 'admin'
                ? 'bg-pink-600/20 text-pink-300 border border-pink-500/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
            title="Open Admin Dashboard"
          >
            <Shield className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {/* Credits Counter Pill */}
          <button
            onClick={onOpenCredits}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 transition group cursor-pointer"
          >
            <div className="flex items-center gap-1 text-purple-400">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-bold font-mono">{user.credits}</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">credits</span>
            <span className="p-0.5 rounded bg-purple-500/20 text-purple-300 group-hover:bg-purple-500 group-hover:text-white transition">
              <Plus className="w-3 h-3" />
            </span>
          </button>

          {/* Quick Create Button */}
          <button
            onClick={() => onTabChange('generate')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/25 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>

          {/* User Profile / Auth */}
          <button
            onClick={() => onTabChange('profile')}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-zinc-900 transition border border-transparent hover:border-zinc-800"
            title="User Profile"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover border border-purple-500/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile subnavigation bar */}
      <div className="flex md:hidden items-center justify-around pt-2.5 mt-2 border-t border-zinc-900 text-[11px] font-medium text-zinc-400">
        <button
          onClick={() => onTabChange('home')}
          className={`py-1 px-2 ${currentTab === 'home' ? 'text-purple-400 font-bold' : ''}`}
        >
          Home
        </button>
        <button
          onClick={() => onTabChange('generate')}
          className={`py-1 px-2 ${currentTab === 'generate' ? 'text-pink-400 font-bold' : ''}`}
        >
          Generator
        </button>
        <button
          onClick={() => onTabChange('lyrics')}
          className={`py-1 px-2 ${currentTab === 'lyrics' ? 'text-blue-400 font-bold' : ''}`}
        >
          Lyrics
        </button>
        <button
          onClick={() => onTabChange('voice')}
          className={`py-1 px-2 ${currentTab === 'voice' ? 'text-purple-400 font-bold' : ''}`}
        >
          Voice
        </button>
        <button
          onClick={() => onTabChange('library')}
          className={`py-1 px-2 ${currentTab === 'library' ? 'text-emerald-400 font-bold' : ''}`}
        >
          Library
        </button>
      </div>
    </nav>
  );
};
