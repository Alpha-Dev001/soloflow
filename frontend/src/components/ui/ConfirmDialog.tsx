import React, { useEffect } from 'react';
import { AlertTriangle, LogOut, RefreshCw, Trash2, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' for destructive actions (delete), 'warning' for resets, 'neutral' for sign-out */
  tone?: 'danger' | 'warning' | 'neutral';
  /** Optional detail rows shown between description and actions */
  details?: { label: string; value: React.ReactNode }[];
}

const toneMeta = {
  danger: {
    icon: <Trash2 className="w-5 h-5" />,
    iconBg: 'rgba(180,85,47,0.10)',
    iconColor: '#B4552F',
    ring: 'rgba(180,85,47,0.18)'
  },
  warning: {
    icon: <RefreshCw className="w-5 h-5" />,
    iconBg: 'rgba(201,151,63,0.12)',
    iconColor: '#A8761F',
    ring: 'rgba(201,151,63,0.22)'
  },
  neutral: {
    icon: <LogOut className="w-5 h-5" />,
    iconBg: 'rgba(69,59,51,0.08)',
    iconColor: '#453B33',
    ring: 'rgba(69,59,51,0.16)'
  }
};

/**
 * Professional confirmation dialog for sensitive actions.
 * Matches the SoloFlow warm-taupe design system with a soft backdrop,
 * tonal icon badge, detail rows and clear Cancel / Confirm affordances.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  details
}) => {
  const meta = toneMeta[tone];

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') {
        e.preventDefault();
        void onConfirm();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* Soft blurred backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E8E2D9] z-10 animate-in zoom-in-95 fade-in duration-150 overflow-hidden"
      >
        {/* Tonal top accent line */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${meta.iconColor} 0%, ${meta.iconBg} 100%)` }} />

        <div className="p-6 sm:p-7">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-[#A89D91] hover:text-[#2E241E] hover:bg-[#F5EFEB] rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon + Title */}
          <div className="flex items-start gap-3.5 pr-8">
            <span
              className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: meta.iconBg, color: meta.iconColor, boxShadow: `inset 0 0 0 1px ${meta.ring}` }}
            >
              {meta.icon}
            </span>
            <div className="min-w-0 pt-0.5">
              <h2 className="text-lg font-bold text-[#1A1918] tracking-tight leading-snug">{title}</h2>
              <p className="text-[13px] text-[#6B6158] mt-1.5 leading-relaxed">{description}</p>
            </div>
          </div>

          {/* Optional detail rows */}
          {details && details.length > 0 && (
            <div className="mt-5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] divide-y divide-[#F1EBE4]">
              {details.map(d => (
                <div key={d.label} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8278] shrink-0">{d.label}</span>
                  <span className="text-xs font-semibold text-[#1A1918] truncate text-right">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="sm" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button
              variant={tone === 'danger' ? 'danger-solid' : 'primary'}
              size="sm"
              onClick={() => void onConfirm()}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};