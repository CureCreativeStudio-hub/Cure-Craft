import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md bg-[#040e15] border border-[#156876]/60 rounded-[28px] shadow-2xl p-5 sm:p-6 text-[#F5F9FA] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3.5 mb-4">
          <div className={`p-2.5 rounded-full shrink-0 ${
            variant === 'danger'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : variant === 'warning'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-[#00E4FF]/20 text-[#00E4FF] border border-[#00E4FF]/30'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#F5F9FA] tracking-tight">{title}</h3>
            <p className="text-xs sm:text-sm text-[#8CA0A8] mt-1.5 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full text-[#8CA0A8] hover:text-[#F5F9FA] hover:bg-[#156876]/30 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#156876]/30">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-xs font-semibold text-[#8CA0A8] hover:text-[#F5F9FA] hover:bg-[#156876]/30 border border-[#156876]/50 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                : variant === 'warning'
                ? 'bg-amber-500 hover:bg-amber-400 text-[#000611]'
                : 'bg-[#00E4FF] hover:bg-white text-[#000611] shadow-[0_0_12px_rgba(0,228,255,0.4)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
