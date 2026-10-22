import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deleteAccount } from '../lib/api';
import {
  User,
  Shield,
  Zap,
  Mail,
  Smartphone,
  LogOut,
  Trash2,
  Crown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ProfileViewProps {
  onOpenCredits: () => void;
  onOpenAuth: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenCredits, onOpenAuth }) => {
  const { user, isGoogleAuthenticated, loginGoogle, logout } = useAuth();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount(user.id);
      await logout();
      toast.info('Your account and associated tracks have been deleted.');
      setShowDeleteModal(false);
    } catch (e: any) {
      toast.error(e.message || 'Account deletion failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Artist Profile & Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your subscription tier, connected workspace accounts, and credit allocation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card: 1 Col */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto rounded-3xl overflow-hidden border-2 border-purple-500/50 shadow-xl shadow-purple-500/20">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h3 className="font-bold text-white text-lg">{user.name}</h3>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email || user.phone || 'Standard User'}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold mt-2 uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5" />
              <span>{user.subscription_plan} Plan</span>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <button
              onClick={logout}
              className="w-full py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Subscription & Account Details: 2 Col */}
        <div className="md:col-span-2 space-y-6">
          {/* Credits & Subscription Card */}
          <div className="bg-gradient-to-br from-zinc-900/90 to-purple-950/20 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Credits Balance</span>
                <div className="text-3xl font-black text-white font-mono mt-1">{user.credits}</div>
              </div>
              <button
                onClick={onOpenCredits}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition cursor-pointer"
              >
                Top Up Credits
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Each 30-second clip costs 5 credits. Full-length tracks cost 10 credits.
            </p>
          </div>

          {/* Connected Integrations Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Connected Workspace Integrations</h3>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Gmail Integration</h4>
                  <p className="text-[11px] text-zinc-400">
                    {isGoogleAuthenticated ? 'Connected and ready to email songs' : 'Not connected'}
                  </p>
                </div>
              </div>
              {isGoogleAuthenticated ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Active</span>
                </div>
              ) : (
                <button
                  onClick={loginGoogle}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
                >
                  Connect
                </button>
              )}
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Google Chat Spaces</h4>
                  <p className="text-[11px] text-zinc-400">
                    {isGoogleAuthenticated ? 'Connected to post release cards' : 'Not connected'}
                  </p>
                </div>
              </div>
              {isGoogleAuthenticated ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Active</span>
                </div>
              ) : (
                <button
                  onClick={loginGoogle}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
                >
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* Account Deletion */}
          <div className="bg-red-950/20 border border-red-500/20 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-red-300">Danger Zone</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Permanently remove your account, subscription, and generated library.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Deletion In-App Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Permanently Delete Account?</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  This will erase your artist account, credit balance, and all generated tracks from the catalog. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-lg shadow-red-600/30 transition cursor-pointer flex items-center gap-2"
              >
                {isDeleting ? 'Deleting Account...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
