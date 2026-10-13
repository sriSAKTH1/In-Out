import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserCircle2 } from 'lucide-react';

interface DemoNoticeModalProps {
  onLoginClick: () => void;
}

export const DemoNoticeModal: React.FC<DemoNoticeModalProps> = ({ onLoginClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_demo_notice');
    if (!hasSeen) {
      // Small delay so it pops up nicely after splash screen
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleContinueDemo = () => {
    localStorage.setItem('has_seen_demo_notice', 'true');
    setIsOpen(false);
  };

  const handleLogin = () => {
    localStorage.setItem('has_seen_demo_notice', 'true');
    setIsOpen(false);
    onLoginClick();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <UserCircle2 className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Welcome to In & Out</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
                This website is fully stored with demo data. Please log in with your ID or sign up.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleLogin}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-500/20"
                >
                  <LogIn className="w-5 h-5" />
                  Log in / Sign up
                </button>
                <button
                  onClick={handleContinueDemo}
                  className="w-full py-3 px-4 bg-[var(--bg-canvas)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl font-medium transition-all active:scale-95"
                >
                  Continue with demo account
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
