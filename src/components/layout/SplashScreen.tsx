import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLogo } from '../common/AppLogo';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-canvas)] overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full flex flex-col items-center justify-center space-y-4"
      >
        <AppLogo size="xl" />
        <div className="text-center">
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">In & Out</h1>
          <p className="text-sm font-bold text-[var(--text-secondary)] mt-1">Mobile-First Money Manager</p>
        </div>
      </motion.div>
    </div>
  );
};
