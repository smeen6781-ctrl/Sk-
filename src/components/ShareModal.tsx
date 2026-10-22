import React, { useState, useEffect } from 'react';
import { Song } from '../types';
import { useAuth } from '../context/AuthContext';
import { sendSongEmail, listChatSpaces, postSongToChatSpace, GoogleChatSpace } from '../lib/workspaceApi';
import { Mail, MessageSquare, Copy, Check, AlertCircle, X, Send, Sparkles } from 'lucide-react';

interface ShareModalProps {
  song: Song;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ song, isOpen, onClose }) => {
  const { isGoogleAuthenticated, loginGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'gmail' | 'chat' | 'link'>('gmail');

  // Gmail State
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Google Chat State
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [chatMessage, setChatMessage] = useState('');
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isPostingChat, setIsPostingChat] = useState(false);
  const [chatStatus, setChatStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Confirmation Modal State (Mandatory for Workspace actions!)
  const [pendingAction, setPendingAction] = useState<{
    type: 'gmail' | 'chat';
    title: string;
    description: string;
  } | null>(null);

  // Copy Link State
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && isGoogleAuthenticated && activeTab === 'chat' && spaces.length === 0) {
      loadSpaces();
    }
  }, [isOpen, isGoogleAuthenticated, activeTab]);

  const loadSpaces = async () => {
    setIsLoadingSpaces(true);
    setChatStatus(null);
    try {
      const list = await listChatSpaces();
      setSpaces(list);
      if (list.length > 0) {
        setSelectedSpace(list[0].name);
      }
    } catch (err: any) {
      console.warn('Failed to load chat spaces:', err);
      setChatStatus({
        success: false,
        message: err.message || 'Could not fetch Google Chat spaces. Make sure Chat permissions are granted.',
      });
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const handleRequestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setEmailStatus({ success: false, message: 'Please enter a valid recipient email address.' });
      return;
    }

    // Trigger explicit confirmation dialog
    setPendingAction({
      type: 'gmail',
      title: 'Send Song via Gmail?',
      description: `You are about to send an email to ${recipientEmail} with the audio track link and lyrics for "${song.title}". Do you confirm?`,
    });
  };

  const handleConfirmSendEmail = async () => {
    setPendingAction(null);
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      await sendSongEmail({
        recipientEmail,
        songTitle: song.title,
        songStyle: song.style,
        lyrics: song.lyrics,
        audioUrl: song.audio_url,
        customNote,
      });
      setEmailStatus({
        success: true,
        message: `Song successfully sent to ${recipientEmail} via Gmail!`,
      });
      setRecipientEmail('');
      setCustomNote('');
    } catch (err: any) {
      setEmailStatus({
        success: false,
        message: err.message || 'Failed to send email. Check your Gmail connection.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleRequestPostChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace) {
      setChatStatus({ success: false, message: 'Please select a Google Chat space.' });
      return;
    }

    const spaceName = spaces.find((s) => s.name === selectedSpace)?.displayName || selectedSpace;

    // Trigger explicit confirmation dialog
    setPendingAction({
      type: 'chat',
      title: 'Post to Google Chat?',
      description: `You are about to share "${song.title}" into the "${spaceName}" Google Chat space. Do you confirm?`,
    });
  };

  const handleConfirmPostChat = async () => {
    setPendingAction(null);
    setIsPostingChat(true);
    setChatStatus(null);
    try {
      await postSongToChatSpace({
        spaceName: selectedSpace,
        songTitle: song.title,
        songStyle: song.style,
        audioUrl: song.audio_url,
        messageText: chatMessage,
      });
      setChatStatus({
        success: true,
        message: `Successfully posted "${song.title}" to Google Chat space!`,
      });
      setChatMessage('');
    } catch (err: any) {
      setChatStatus({
        success: false,
        message: err.message || 'Failed to post message to Google Chat.',
      });
    } finally {
      setIsPostingChat(false);
    }
  };

  const handleCopyLink = () => {
    const fullUrl = window.location.origin + song.audio_url;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Share Song</h2>
              <p className="text-xs text-zinc-400 line-clamp-1">{song.title} ({song.style})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Connection Notice if not Google Authenticated */}
        {!isGoogleAuthenticated && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 font-medium text-purple-300">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Connect Google to unlock Gmail & Google Chat sharing</span>
            </div>
            <p className="text-zinc-400">
              Send tracks and lyrics directly through your connected Gmail and announce releases in Google Chat spaces.
            </p>
            <button
              onClick={loginGoogle}
              className="self-start flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-zinc-900 font-semibold hover:bg-zinc-200 transition text-xs shadow"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'gmail'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            Gmail Send
          </button>
          <button
            onClick={() => {
              setActiveTab('chat');
              if (isGoogleAuthenticated && spaces.length === 0) loadSpaces();
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'chat'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Google Chat
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'link'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Copy className="w-4 h-4" />
            Direct Audio Link
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === 'gmail' && (
            <form onSubmit={handleRequestSendEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Personal Note (Optional)
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Check out this new track I produced with SK AI!"
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition resize-none"
                />
              </div>

              {emailStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    emailStatus.success
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-950/40 border border-red-500/30 text-red-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{emailStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSendingEmail || !isGoogleAuthenticated}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {isSendingEmail ? 'Sending via Gmail...' : 'Send Song via Gmail'}
              </button>
            </form>
          )}

          {activeTab === 'chat' && (
            <form onSubmit={handleRequestPostChat} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Google Chat Space
                  </label>
                  <button
                    type="button"
                    onClick={loadSpaces}
                    disabled={isLoadingSpaces || !isGoogleAuthenticated}
                    className="text-xs text-pink-400 hover:underline"
                  >
                    Refresh Spaces
                  </button>
                </div>

                {isLoadingSpaces ? (
                  <div className="py-6 text-center text-xs text-zinc-400">Loading Google Chat spaces...</div>
                ) : spaces.length > 0 ? (
                  <select
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500 transition"
                  >
                    {spaces.map((space) => (
                      <option key={space.name} value={space.name}>
                        {space.displayName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
                    No active Chat spaces found or Chat API access is waiting. You can create a space in Google Chat or enter a space name manually.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Release Message
                </label>
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Hey team! Just generated our new track on SK AI. Let me know what you think!"
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition resize-none"
                />
              </div>

              {chatStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    chatStatus.success
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-950/40 border border-red-500/30 text-red-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{chatStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isPostingChat || !isGoogleAuthenticated || !selectedSpace}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                {isPostingChat ? 'Posting to Chat...' : 'Post to Google Chat Space'}
              </button>
            </form>
          )}

          {activeTab === 'link' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Direct audio streaming URL. Anyone with this link can stream or download this song.
              </p>
              <div className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={window.location.origin + song.audio_url}
                  className="bg-transparent text-xs text-zinc-300 flex-1 px-2 focus:outline-none truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Confirmation Dialog for Workspace Actions (MANDATORY REQUIREMENT) */}
        {pendingAction && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{pendingAction.title}</h3>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{pendingAction.description}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={pendingAction.type === 'gmail' ? handleConfirmSendEmail : handleConfirmPostChat}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition shadow-lg shadow-purple-600/30"
                >
                  Confirm & Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
