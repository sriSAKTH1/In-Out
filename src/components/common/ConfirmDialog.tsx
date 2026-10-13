import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  requiredText?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
  requiredText,
}) => {
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setInputText('');
    }
  }, [isOpen]);

  const isMatched = !requiredText || inputText.trim().toLowerCase() === requiredText.trim().toLowerCase();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center py-2">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2">{title}</h4>
        <p className="text-sm text-[var(--text-secondary)] mb-4">{message}</p>

        {requiredText && (
          <div className="w-full mb-5 space-y-1 text-left">
            <label className="text-xs font-bold text-[var(--text-secondary)] block">
              Type <span className="text-rose-600 font-black">"{requiredText}"</span> to confirm:
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Type "${requiredText}"`}
              className="w-full p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-primary)] text-center focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            {cancelText}
          </button>
          <button
            disabled={!isMatched}
            onClick={() => {
              if (!isMatched) return;
              haptics.heavy();
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-sm ${
              !isMatched
                ? 'opacity-40 bg-stone-400 cursor-not-allowed'
                : isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
