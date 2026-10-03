import React, { useEffect, useState } from 'react';
import { memoryCard, GitSyncNotification } from '../memory/memoryCard';
import { Cloud, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const GitSyncToast: React.FC = () => {
  const [toasts, setToasts] = useState<GitSyncNotification[]>([]);

  useEffect(() => {
    const unsubscribe = memoryCard.subscribeNotification(n => {
      setToasts(prev => [...prev.slice(-3), n]); // keep last 4 max

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== n.id));
      }, 4500);
    });

    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none font-mono">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-lg shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-2.5 text-xs animate-slide-in ${
              isSuccess
                ? 'bg-[#0f241a]/95 border-emerald-500/70 text-emerald-100 shadow-emerald-950/40'
                : isError
                ? 'bg-[#291114]/95 border-red-500/70 text-red-100 shadow-red-950/40'
                : 'bg-[#181d1a]/95 border-teal-500/70 text-teal-100 shadow-teal-950/40'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 size={16} className="text-emerald-400" />}
              {isError && <AlertCircle size={16} className="text-red-400" />}
              {!isSuccess && !isError && <Cloud size={16} className="text-teal-400" />}
            </div>

            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className={`font-bold tracking-wider uppercase text-[11px] ${
                  isSuccess ? 'text-emerald-300' : isError ? 'text-red-300' : 'text-teal-300'
                }`}>
                  {toast.title}
                </span>
                <span className="text-[9px] text-white/40">{toast.timestamp}</span>
              </div>
              <p className="text-[11px] text-white/80 leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-white/40 hover:text-white p-0.5 shrink-0"
              aria-label="Dismiss toast"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
