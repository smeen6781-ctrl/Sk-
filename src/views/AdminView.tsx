import React, { useState, useEffect } from 'react';
import { AdminMetrics, AdminConfig, GenerationJob } from '../types';
import { fetchAdminMetrics, updateAdminConfig, fetchAdminJobs, grantCreditsAdmin } from '../lib/api';
import {
  Shield,
  Users,
  Music,
  Activity,
  AlertTriangle,
  Key,
  DollarSign,
  Save,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const AdminView: React.FC = () => {
  const toast = useToast();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Config Form
  const [activeProvider, setActiveProvider] = useState<'lyria-3-clip' | 'lyria-3-pro' | 'elevenlabs' | 'gemini-tts' | 'sk-synth'>('lyria-3-clip');
  const [elevenlabsKey, setElevenlabsKey] = useState('');
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [costPerClip, setCostPerClip] = useState(5);
  const [costPerFull, setCostPerFull] = useState(10);

  // User credit management
  const [targetUserId, setTargetUserId] = useState('');
  const [creditsToGrant, setCreditsToGrant] = useState(50);
  const [grantMessage, setGrantMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminMetrics();
      setMetrics(data.metrics);
      setConfig(data.config);
      setActiveProvider(data.config.active_provider);
      setFallbackEnabled(data.config.fallback_enabled);
      setCostPerClip(data.config.cost_per_clip);
      setCostPerFull(data.config.cost_per_full);

      const jobsData = await fetchAdminJobs();
      setJobs(jobsData);
    } catch (err: any) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setSaveSuccess(false);
    try {
      const updated = await updateAdminConfig({
        active_provider: activeProvider,
        elevenlabs_api_key: elevenlabsKey ? elevenlabsKey : undefined,
        fallback_enabled: fallbackEnabled,
        cost_per_clip: costPerClip,
        cost_per_full: costPerFull,
      });
      setConfig(updated);
      setSaveSuccess(true);
      toast.success('Admin settings saved successfully.');
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update admin configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleGrantCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim()) return;
    try {
      await grantCreditsAdmin(targetUserId.trim(), creditsToGrant);
      toast.success(`Granted ${creditsToGrant} credits to user ${targetUserId}!`);
      setTargetUserId('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to grant credits.');
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="py-24 text-center text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-2" />
        <p className="text-sm">Loading admin metrics & configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-400 mb-1">
            <Shield className="w-4 h-4" />
            <span>Root Administrator</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">SK AI Studio Admin Panel</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Monitor infrastructure metrics, API providers, credit policies, and pipeline health.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 transition"
        >
          <RefreshCw className="w-4 h-4 text-purple-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase">Total Users</span>
            <div className="text-2xl font-black text-white font-mono mt-1">{metrics.totalUsers}</div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase">Generated Songs</span>
            <div className="text-2xl font-black text-purple-400 font-mono mt-1">{metrics.totalSongs}</div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase">Audio Minutes</span>
            <div className="text-2xl font-black text-pink-400 font-mono mt-1">{metrics.totalAudioMinutes}m</div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase">Active Subs</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{metrics.activeSubscriptions}</div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase">Credits Consumed</span>
            <div className="text-2xl font-black text-blue-400 font-mono mt-1">{metrics.totalCreditsUsed}</div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase">Failures</span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{metrics.failureCount}</div>
          </div>
        </div>
      )}

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Provider Settings: 7 Columns */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-base">API Provider & Engine Settings</h3>
            </div>
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Config Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Default Music Provider Engine
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label
                  className={`p-3 rounded-2xl border cursor-pointer transition ${
                    activeProvider === 'lyria-3-clip'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value="lyria-3-clip"
                    checked={activeProvider === 'lyria-3-clip'}
                    onChange={() => setActiveProvider('lyria-3-clip')}
                    className="sr-only"
                  />
                  <div className="font-bold">Google Lyria 3 Clip</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">30s Short clips preview</div>
                </label>

                <label
                  className={`p-3 rounded-2xl border cursor-pointer transition ${
                    activeProvider === 'lyria-3-pro'
                      ? 'bg-pink-600/20 border-pink-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value="lyria-3-pro"
                    checked={activeProvider === 'lyria-3-pro'}
                    onChange={() => setActiveProvider('lyria-3-pro')}
                    className="sr-only"
                  />
                  <div className="font-bold">Google Lyria 3 Pro</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Full-length tracks</div>
                </label>

                <label
                  className={`p-3 rounded-2xl border cursor-pointer transition ${
                    activeProvider === 'elevenlabs'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value="elevenlabs"
                    checked={activeProvider === 'elevenlabs'}
                    onChange={() => setActiveProvider('elevenlabs')}
                    className="sr-only"
                  />
                  <div className="font-bold">ElevenLabs Music API</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Commercial audio provider</div>
                </label>

                <label
                  className={`p-3 rounded-2xl border cursor-pointer transition ${
                    activeProvider === 'sk-synth'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value="sk-synth"
                    checked={activeProvider === 'sk-synth'}
                    onChange={() => setActiveProvider('sk-synth')}
                    className="sr-only"
                  />
                  <div className="font-bold">SK Algorithmic Engine</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Native multi-stem synthesis</div>
                </label>
              </div>
            </div>

            {/* ElevenLabs API Key */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                ElevenLabs API Secret Key
              </label>
              <input
                type="password"
                value={elevenlabsKey}
                onChange={(e) => setElevenlabsKey(e.target.value)}
                placeholder={config?.elevenlabs_api_key || 'Enter ElevenLabs xi-api-key...'}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono transition"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Keys are stored securely on the server and never exposed to client browsers.
              </p>
            </div>

            {/* Fallback Mode Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div>
                <h4 className="text-xs font-bold text-white">Automated Fallback Engine</h4>
                <p className="text-[11px] text-zinc-400">
                  Switch automatically to SK Algorithmic Studio synth if the third-party API hits rate limits or quota.
                </p>
              </div>
              <input
                type="checkbox"
                checked={fallbackEnabled}
                onChange={(e) => setFallbackEnabled(e.target.checked)}
                className="w-5 h-5 accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Credit pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Cost per 30s Clip (Credits)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={costPerClip}
                  onChange={(e) => setCostPerClip(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Cost per Full Track (Credits)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={costPerFull}
                  onChange={(e) => setCostPerFull(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingConfig}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingConfig ? 'Saving Settings...' : 'Save Configuration'}</span>
            </button>
          </form>
        </div>

        {/* User Credit Management: 5 Columns */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Credit Allocation Utility</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Grant promotional or support credits directly to any user account ID.
            </p>

            <form onSubmit={handleGrantCredits} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">User ID</label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="e.g. demo-user-1"
                  required
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Credits Amount</label>
                <input
                  type="number"
                  min={5}
                  max={10000}
                  value={creditsToGrant}
                  onChange={(e) => setCreditsToGrant(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {grantMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs">
                  {grantMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                Grant Credits
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Generation Jobs Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 overflow-hidden">
        <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <span>Recent Generation Jobs ({jobs.length})</span>
        </h3>

        {jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Job ID</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Progress</th>
                  <th className="py-2.5 px-3">Step Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {jobs.slice(0, 15).map((j) => (
                  <tr key={j.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-2.5 px-3 text-zinc-400 truncate max-w-[120px]">{j.id}</td>
                    <td className="py-2.5 px-3 text-zinc-300">{j.user_id}</td>
                    <td className="py-2.5 px-3 text-purple-300">{j.provider}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          j.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : j.status === 'failed'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-purple-500/20 text-purple-300 animate-pulse'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{j.progress}%</td>
                    <td className="py-2.5 px-3 text-zinc-400 font-sans truncate max-w-[200px]">
                      {j.error || j.step_description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500 text-xs">No generation jobs logged yet.</div>
        )}
      </div>
    </div>
  );
};
