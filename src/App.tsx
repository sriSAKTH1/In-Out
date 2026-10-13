import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { MobileShell } from './components/layout/MobileShell';
import { SplashScreen } from './components/layout/SplashScreen';
import { storage } from './data/storage';

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const settings = storage.getSettings();
      // First-time users (is_setup_completed = false) always see it.
      // Otherwise, check if they explicitly turned it off.
      if (settings.is_setup_completed && settings.disable_splash_animation) {
        return false;
      }
    } catch (e) {
      // Fallback
    }
    return true;
  });

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [showSplash]);

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" />
        ) : (
          <MobileShell key="main" />
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default App;
