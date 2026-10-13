import React from 'react';
import type { TabType } from '../../types';
import { LayoutDashboard, PieChart, Target, Landmark, MoreHorizontal } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface BottomNavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'stats', label: 'Stats', icon: PieChart },
    { id: 'budget', label: 'Budget', icon: Target },
    { id: 'account', label: 'Account', icon: Landmark },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)] border-t border-[var(--border-color)] px-2 pt-1 pb-safe shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                haptics.light();
                onSelectTab(tab.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[52px] rounded-2xl transition-all ${
                isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-light)]/40 font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5] scale-110' : 'stroke-2'}`} />
              <span className="text-[11px] leading-tight mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
