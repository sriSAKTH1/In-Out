import React, { useEffect, useState } from 'react';
import { AppLogo } from './AppLogo';
import { ShieldCheck, Lock } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface SplashScreenProps {
  onEnter: () => void;
  autoTransition?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter, autoTransition = true }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Securing Local Encrypted Storage...');

  useEffect(() => {
    if (!autoTransition) return;

    haptics.light();
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + 5;
        if (next === 40) setStatusText('Loading Accounts & Balances...');
        if (next === 75) setStatusText('Syncing Financial Overview...');
        if (next === 95) setStatusText('Ready!');
        return next;
      });
    }, 45);

    const timer = setTimeout(() => {
      haptics.medium();
      onEnter();
    }, 1800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onEnter, autoTransition]);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-canvas)] flex flex-col items-center justify-between p-8 max-w-lg mx-auto select-none animate-fade-in">
      {/* Top Spacer */}
      <div className="w-full pt-4 flex justify-between items-center text-[10px] font-extrabold text-[var(--text-muted)] tracking-wider uppercase">
        <span>In & Out Mobile</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          v1.1.0 • Privacy First
        </span>
      </div>

      {/* Center Animated Logo & Glow */}
      <div className="flex flex-col items-center text-center space-y-6 my-auto">
        <div className="relative">
          {/* Animated Multi-color Pulsing Glow (Navy, Green, Red matching logo) */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#1B2A5E] via-[#2EAC57] to-[#E53935] blur-2xl opacity-40 animate-pulse" />

          {/* Logo container with floating animation */}
          <div className="relative p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl animate-bounce-subtle">
            <AppLogo size="2xl" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
            IN & OUT
          </h1>
          <p className="text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">
            Mobile Financial Manager
          </p>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="w-64 space-y-2 pt-4">
          <div className="h-2 w-full rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-emerald-500 to-emerald-400 transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
            <span className="truncate pr-2">{statusText}</span>
            <span className="font-mono text-[var(--accent-primary)] font-black">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Privacy Security Assurance */}
      <div className="w-full pb-4 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] font-bold text-[var(--text-secondary)]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>100% Local Encrypted Device Privacy</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-[var(--text-muted)]">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>Powered by niceTRY Studio</span>
        </div>
      </div>
    </div>
  );
};
