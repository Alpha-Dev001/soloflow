import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/* ── Design tokens (consistent with app) ── */
const T = {
  surface: '#FFFFFF',
  surfaceWarm: '#FAF8F5',
  border: '#EDE8E1',
  borderStrong: '#E0D9CF',
  ink: '#1A1918',
  body: '#6B6158',
  muted: '#8C8278',
  accent: '#82694E',
  success: '#248A3D',
  successBg: '#F0FAF2',
  successBorder: '#C3EACB',
  error: '#D70015',
  errorBg: '#FEF1F1',
  errorBorder: '#FECDCA',
  info: '#0071E3',
  infoBg: '#EBF3FE',
  infoBorder: '#B8D4F8',
};

/** Max toasts visible at once */
const MAX_TOASTS = 2;
/** Auto-dismiss after ms */
const DISMISS_MS = 4000;

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {}
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);

    setToasts(prev => {
      // Enforce max toasts: remove oldest if at limit
      const next = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
      return [...next, { id, message, type }];
    });

    // Auto-dismiss
    const timer = setTimeout(() => {
      removeToast(id);
    }, DISMISS_MS);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  const getIcon = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: T.success }} />;
      case 'error':
        return <AlertCircle className="w-4 h-4 shrink-0" style={{ color: T.error }} />;
      case 'info':
        return <Info className="w-4 h-4 shrink-0" style={{ color: T.info }} />;
    }
  };

  const getColorScheme = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return { bg: T.successBg, border: T.successBorder, iconBg: '#E4F5E7' };
      case 'error':
        return { bg: T.errorBg, border: T.errorBorder, iconBg: '#FDE8E8' };
      case 'info':
        return { bg: T.infoBg, border: T.infoBorder, iconBg: '#E0EDFB' };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — bottom-right, stacked */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 w-full max-w-sm pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t, index) => {
          const colors = getColorScheme(t.type);
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 ease-out animate-in slide-in-from-bottom-2 fade-in"
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
                boxShadow: '0 4px 16px -4px rgba(74, 59, 50, 0.10), 0 1px 3px rgba(74, 59, 50, 0.06)',
              }}
              role="alert"
            >
              {/* Icon circle */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: colors.iconBg }}
              >
                {getIcon(t.type)}
              </div>

              {/* Message */}
              <span
                className="flex-1 text-[13px] font-medium leading-snug"
                style={{ color: T.ink }}
              >
                {t.message}
              </span>

              {/* Dismiss button */}
              <button
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-md shrink-0 transition-colors cursor-pointer"
                style={{ color: T.muted }}
                onMouseEnter={e => { e.currentTarget.style.color = T.ink; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.backgroundColor = 'transparent'; }}
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Auto-dismiss progress bar */}
              <div
                className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full overflow-hidden"
                style={{ backgroundColor: `${colors.border}80` }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: t.type === 'success' ? T.success : t.type === 'error' ? T.error : T.info,
                    animation: `toast-progress ${DISMISS_MS}ms linear forwards`,
                    opacity: 0.4,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyframes for progress bar */}
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
