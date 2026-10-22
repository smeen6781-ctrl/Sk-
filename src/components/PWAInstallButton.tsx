import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Check, Copy, ExternalLink, X, Sparkles } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // App live URL
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-lf4njs3w3wd5btanf3bzm5-33072044257.asia-northeast1.run.app';

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If already running inside standalone PWA mode, don't show the button
  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition cursor-pointer shadow-sm group"
        title="Download App / APK Instructions"
      >
        <Download className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Install App / APK</span>
        <span className="sm:hidden">App</span>
      </button>

      {/* Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  SK AI Song Generator Mobile App
                  <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full font-mono">
                    Android & iOS
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">फोन में बिना किसी परेशानी के ऐप इनस्टॉल करें</p>
              </div>
            </div>

            {/* Option 1: Direct 1-Click Install */}
            <div className="rounded-xl bg-purple-950/30 border border-purple-500/30 p-4 mb-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-purple-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    विधि 1: 1-Click डायरेक्ट फ़ोन इनस्टॉल (Recommended)
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1">
                    आपको कोई थर्ड-पार्टी APK डाउनलोड करने की ज़रूरत नहीं है। यह सीधे आपके फ़ोन की होम स्क्रीन पर असली ऐप की तरह इंस्टॉल हो जाएगा।
                  </p>
                </div>
              </div>

              {isInstallable ? (
                <button
                  onClick={async () => {
                    await install();
                    setShowModal(false);
                  }}
                  className="mt-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition"
                >
                  <Download className="w-4 h-4" />
                  अभी अपने फ़ोन पर Install करें
                </button>
              ) : isIOS ? (
                <div className="mt-2 bg-zinc-900/80 rounded-lg p-3 text-xs text-zinc-300">
                  <p className="font-semibold text-white mb-1">iPhone / iPad यूज़र्स के लिए:</p>
                  1. Safari ब्राउज़र में नीचे दिए <strong>Share (शेयर)</strong> बटन पर टैप करें।<br />
                  2. नीचे स्क्रॉल करके <strong>Add to Home Screen (होम स्क्रीन में जोड़ें)</strong> चुनें।
                </div>
              ) : (
                <div className="mt-2 bg-zinc-900/80 rounded-lg p-3 text-xs text-zinc-300">
                  <p className="font-semibold text-white mb-1">Chrome ब्राउज़र से इंस्टॉल करने के लिए:</p>
                  1. ऊपर दाईं ओर <strong>Three Dots (⋮)</strong> मेन्यू पर टैप करें।<br />
                  2. <strong>"Install App"</strong> या <strong>"Add to Home Screen"</strong> पर टैप करें।
                </div>
              )}
            </div>

            {/* Option 2: Build Real APK file via PWABuilder */}
            <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/60 p-4">
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5 mb-1.5">
                <Download className="w-4 h-4 text-pink-400" />
                विधि 2: .APK फ़ाइल डाउनलोड और जनरेट करना
              </h4>
              <p className="text-xs text-zinc-400 mb-3">
                अगर आपको दोस्तों को भेजने या Google Play Store पर डालने के लिए ओरिजिनल <strong>.apk</strong> फ़ाइल चाहिए, तो आप <strong>PWABuilder</strong> से 2 मिनट में मुफ़्त में APK बना सकते हैं:
              </p>

              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-400">
                  <span className="truncate pr-2">{appUrl}</span>
                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] cursor-pointer transition shrink-0"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy URL'}
                  </button>
                </div>

                <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px]">
                  <li>ऊपर दिए गए URL को कॉपी करें (या नीचे दिए गए बटन पर सीधे क्लिक करें)।</li>
                  <li className="pt-1">
                    <a
                      href={`https://www.pwabuilder.com?site=${encodeURIComponent(appUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs shadow transition cursor-pointer my-1"
                    >
                      <span>1-Click Generate .APK (PWABuilder)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </li>
                  <li>वेबसाइट पर <strong>Package For Stores ➔ Android</strong> चुनें और <strong>Download APK / Package</strong> पर क्लिक करें।</li>
                </ol>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer transition"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
