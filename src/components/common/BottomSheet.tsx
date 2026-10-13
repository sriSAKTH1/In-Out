import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = 'max-h-[90vh]',
}) => {
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
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Bottom Sheet Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className={`relative w-full max-w-lg mx-auto bg-[var(--bg-card)] rounded-t-3xl shadow-2xl border-t border-[var(--border-color)] overflow-hidden flex flex-col ${maxHeight}`}
          >
            {/* Handle Bar */}
            <div className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="px-5 pb-3 flex items-center justify-between border-b border-[var(--border-color)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
                <button
                  onClick={() => {
                    haptics.light();
                    onClose();
                  }}
                  className="p-2 rounded-full hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Sheet Content */}
            <div className="p-5 overflow-y-auto pb-safe text-[var(--text-primary)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
