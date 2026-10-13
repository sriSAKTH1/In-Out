import React from 'react';
import type { TabType, UserProfile } from '../../types';
import { Eye, EyeOff, Search } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface HeaderProps {
  hideBalance: boolean;
  onToggleHideBalance: () => void;
  onOpenSearch: () => void;
  visible?: boolean;
  activeTab?: TabType;
  userName?: string;
  userProfile?: UserProfile | null;
}

export const Header: React.FC<HeaderProps> = ({
  hideBalance,
  onToggleHideBalance,
  onOpenSearch,
  visible = true,
  activeTab = 'overview',
  userName,
  userProfile,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    if (hour >= 17) timeGreeting = 'Good evening';

    const name = userName || userProfile?.name;
    if (name && name !== 'User') {
      const firstName = name.trim().split(' ')[0];
      return `${timeGreeting}, ${firstName} 👋`;
    }
    return `${timeGreeting} 👋`;
  };

  const getPageInfo = (): { title: string; subtitle: string } => {
    switch (activeTab) {
      case 'stats':
        return { title: 'Statistics', subtitle: 'Spending & income breakdown' };
      case 'budget':
        return { title: 'Budgets', subtitle: 'Monthly limits & budget tracking' };
      case 'account':
        return { title: 'Accounts', subtitle: 'Bank, cash & wallet balances' };
      case 'more':
        return { title: 'More Settings', subtitle: 'App settings, privacy & profile' };
      case 'overview':
      default:
        return { title: 'Overview', subtitle: getGreeting() };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header
      className={`sticky top-0 z-30 w-full bg-[var(--bg-canvas)]/95 backdrop-blur-md transition-all duration-300 ease-in-out transform overflow-hidden ${
        visible
          ? 'max-h-24 opacity-100 py-3 border-b border-[var(--border-color)] translate-y-0'
          : 'max-h-0 opacity-0 py-0 border-none -translate-y-full pointer-events-none'
      }`}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Left Side: Title & Subtitle */}
        <div className="pl-3">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xl tracking-tight text-[var(--accent-primary)]">{title}</span>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent-primary)]">In & Out</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{subtitle}</p>
        </div>

        {/* Right Side: Eye button BEFORE Search button */}
        <div className="flex items-center gap-1 pr-2">
          {/* Eye / Hide Balance Button */}
          <button
            onClick={() => {
              haptics.light();
              onToggleHideBalance();
            }}
            aria-label={hideBalance ? "Show balance" : "Hide balance"}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {hideBalance ? <EyeOff className="w-5 h-5 text-[var(--accent-primary)]" /> : <Eye className="w-5 h-5" />}
          </button>

          {/* Search Button */}
          <button
            onClick={() => {
              haptics.light();
              onOpenSearch();
            }}
            aria-label="Search Transactions"
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
