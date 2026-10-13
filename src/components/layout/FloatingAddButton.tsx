import React, { useState } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TransactionType } from '../../types';
import { haptics } from '../../utils/haptics';

interface FloatingAddButtonProps {
  onSelectType: (type: TransactionType) => void;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onSelectType }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    haptics.medium();
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (type: TransactionType) => {
    haptics.light();
    setIsOpen(false);
    onSelectType(type);
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 pointer-events-none flex justify-center pb-2">
      <div className="relative max-w-lg w-full flex justify-end px-6 pointer-events-auto">
        {/* Expanded Options */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Invisible backdrop click catcher */}
              <div
                className="fixed inset-0 bg-black/30 backdrop-blur-2xs z-30"
                onClick={() => setIsOpen(false)}
              />

              {/* Action Buttons Menu */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-16 right-6 z-40 flex flex-col items-end gap-3"
              >
                {/* Income */}
                <button
                  onClick={() => handleSelect('income')}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all font-semibold"
                >
                  <span className="text-sm">Income</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                </button>

                {/* Expense */}
                <button
                  onClick={() => handleSelect('expense')}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all font-semibold"
                >
                  <span className="text-sm">Expense</span>
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </button>

                {/* Transfer */}
                <button
                  onClick={() => handleSelect('transfer')}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all font-semibold"
                >
                  <span className="text-sm">Transfer</span>
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Floating Action Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleOpen}
          aria-label="Add Transaction"
          className={`z-40 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all ${
            isOpen
              ? 'bg-stone-800 text-white rotate-45'
              : 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)]'
          }`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-7 h-7 stroke-[2.5]" />}
        </motion.button>
      </div>
    </div>
  );
};
