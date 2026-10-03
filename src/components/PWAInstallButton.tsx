import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="Install Minuteman as App"
        className={`flex items-center gap-1.5 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors shadow-sm ${
          compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        }`}
      >
        <Download size={compact ? 12 : 14} />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Install on iPhone / iPad"
          className={`flex items-center gap-1.5 rounded-lg border border-emerald-500/40 text-emerald-300 hover:bg-emerald-950 transition-colors ${
            compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
          }`}
        >
          <Smartphone size={compact ? 12 : 14} />
          <span>Install PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono">
            <div className="w-full max-w-sm rounded-xl bg-[#181d1a] border-2 border-emerald-500/60 p-6 shadow-2xl text-emerald-100">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                Install on iPhone / iPad
              </h3>
              <p className="mt-3 text-xs text-emerald-300/80 leading-relaxed">
                1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                3. Launch Minuteman directly from your home screen for fullscreen offline play!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded bg-emerald-500 py-1.5 text-xs font-bold text-black hover:bg-emerald-400 transition-colors"
              >
                GOT IT
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
