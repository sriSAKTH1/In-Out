import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      haptics.light();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[85vh]"
          >
            {title && (
              <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-color)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
                <button
                  onClick={() => {
                    haptics.light();
                    onClose();
                  }}
                  className="p-1.5 rounded-full hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="p-5 overflow-y-auto text-[var(--text-primary)]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
