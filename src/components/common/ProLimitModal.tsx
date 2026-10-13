import React from 'react';
import { BottomSheet } from './BottomSheet';
import { Crown, Sparkles } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface ProLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'category' | 'account' | 'budget';
  onOpenProSheet?: () => void;
  onActivatePro?: () => void;
}

export const ProLimitModal: React.FC<ProLimitModalProps> = ({
  isOpen,
  onClose,
  type,
  onActivatePro,
}) => {
  const getModalDetails = () => {
    switch (type) {
      case 'category':
        return {
          badge: '14 / 14 Categories Max',
          title: 'Category Limit Reached',
          message:
            'You have reached the maximum limit of 14 categories on the Free Plan (4 Default + 10 Custom). Upgrade to Innotech Pro to add unlimited categories!',
          proFeature: '⚡ Unlimited Custom Categories',
        };
      case 'account':
        return {
          badge: '4 / 4 Accounts Max',
          title: 'Account Limit Reached',
          message:
            'You have reached the maximum 4 active bank accounts limit on the Free Plan. Upgrade to Innotech Pro to add unlimited bank accounts, cards & wallets!',
          proFeature: '⚡ Unlimited Bank & Wallet Accounts',
        };
      case 'budget':
      default:
        return {
          badge: '10 / 10 Budgets Max',
          title: 'Budget Limit Reached',
          message:
            'You have reached the maximum 10 active budgets limit on the Free Plan. Upgrade to Innotech Pro to create unlimited overall & category budgets!',
          proFeature: '⚡ Unlimited Category & Overall Budgets',
        };
    }
  };

  const details = getModalDetails();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Free Plan Limit Reached">
      <div className="space-y-4 text-center py-2 animate-fade-in">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center mx-auto shadow-lg">
          <Crown className="w-8 h-8" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 font-extrabold text-[11px] uppercase tracking-wider">
            {details.badge}
          </span>
          <h3 className="text-xl font-black text-[var(--text-primary)] mt-2">
            {details.title}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
            {details.message}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-left space-y-2.5">
          <span className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-wider block">Innotech Pro Features</span>
          <div className="text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>{details.proFeature}</span>
          </div>
          <div className="text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>🌍 Multi-Currency Real-Time Exchange Conversion</span>
          </div>
          <div className="text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>☁️ Encrypted Cloud Sync & AI Financial Insights</span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              haptics.light();
              onClose();
              if (onActivatePro) {
                onActivatePro();
              }
            }}
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Crown className="w-4 h-4" />
            <span>Active the Pro</span>
          </button>
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className="w-full py-2.5 rounded-2xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
