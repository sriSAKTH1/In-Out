import React, { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, isOpen, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, duration]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-[90%] animate-bounce-in">
      <div className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs shadow-xl flex items-center justify-between gap-3 border border-amber-300/30">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="tracking-wide text-xs">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          aria-label="Close Toast"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};
