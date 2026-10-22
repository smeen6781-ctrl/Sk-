import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { purchaseCredits } from '../lib/api';
import confetti from 'canvas-confetti';
import { X, Check, Zap, Sparkles, Crown, Shield } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose }) => {
  const { user, setUserFromData } = useAuth();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (pkgId: string, amount: number, name: string) => {
    setIsProcessing(true);
    setSuccessMsg(null);
    try {
      const updatedUser = await purchaseCredits(user.id, pkgId, amount);
      setUserFromData(updatedUser);
      setSuccessMsg(`Successfully activated ${name}! Your new balance is ${updatedUser.credits} credits.`);
      toast.success(`Purchased ${name}! +${amount} credits added.`);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Payment processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Credits & Subscriptions</h3>
              <p className="text-xs text-zinc-400">
                Current Balance: <strong className="text-purple-400 font-mono">{user.credits} credits</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs text-center font-medium">
            {successMsg}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Starter Pack */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition">
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Top-up Pack</span>
              <h4 className="text-lg font-bold text-white mt-1">100 Credits</h4>
              <div className="mt-3 mb-4">
                <span className="text-2xl font-black text-white">$4.99</span>
                <span className="text-xs text-zinc-400 ml-1">one-time</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" /> 20 short clips (30s)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" /> Full MP3/WAV download
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" /> Never expires
                </li>
              </ul>
            </div>
            <button
              onClick={() => handlePurchase('pack-100', 4.99, '100 Credits Pack')}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition cursor-pointer"
            >
              Buy 100 Credits
            </button>
          </div>

          {/* Creator Plan (Popular) */}
          <div className="relative bg-gradient-to-b from-purple-950/40 to-zinc-950 border-2 border-purple-500/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl shadow-purple-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Creator Pass</span>
              <h4 className="text-lg font-bold text-white mt-1">500 Credits / mo</h4>
              <div className="mt-3 mb-4">
                <span className="text-2xl font-black text-white">$14.99</span>
                <span className="text-xs text-zinc-400 ml-1">/ month</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-pink-400" /> 100 clips or 50 full songs
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-pink-400" /> Lyria 3 Pro preview engine
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-pink-400" /> Priority processing queue
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-pink-400" /> Commercial usage license
                </li>
              </ul>
            </div>
            <button
              onClick={() => handlePurchase('creator', 14.99, 'Creator Pass')}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs transition shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              Upgrade to Creator
            </button>
          </div>

          {/* Pro Studio Plan */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition">
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Pro Studio</span>
              <h4 className="text-lg font-bold text-white mt-1">2,500 Credits / mo</h4>
              <div className="mt-3 mb-4">
                <span className="text-2xl font-black text-white">$49.99</span>
                <span className="text-xs text-zinc-400 ml-1">/ month</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> 500 clips or 250 tracks
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> Uncapped duration options
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> ElevenLabs + Lyria access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> Dedicated studio priority
                </li>
              </ul>
            </div>
            <button
              onClick={() => handlePurchase('pro', 49.99, 'Pro Studio Pass')}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition cursor-pointer"
            >
              Get Pro Studio
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Secure billing with instant credits crediting</span>
          </div>
          <span>Cancel anytime in your profile</span>
        </div>
      </div>
    </div>
  );
};
