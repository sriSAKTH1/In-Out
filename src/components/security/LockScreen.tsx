import React, { useState } from 'react';
import { Fingerprint, Delete } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface LockScreenProps {
  correctPin: string;
  onUnlock: () => void;
  biometricEnabled?: boolean;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  correctPin,
  onUnlock,
  biometricEnabled = false,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorState, setErrorState] = useState(false);

  const handleKeyPress = (num: string) => {
    haptics.light();
    setErrorState(false);

    if (enteredPin.length < 4) {
      const next = enteredPin + num;
      setEnteredPin(next);

      if (next.length === 4) {
        if (next === correctPin) {
          haptics.success();
          onUnlock();
        } else {
          haptics.error();
          setErrorState(true);
          setTimeout(() => {
            setEnteredPin('');
            setErrorState(false);
          }, 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    haptics.light();
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handleBiometrics = () => {
    haptics.success();
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-canvas)] flex flex-col items-center justify-between p-6 max-w-lg mx-auto animate-fade-in">
      {/* App Branding Header */}
      <div className="text-center pt-12 space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-[var(--accent-primary)] text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl">
          I&O
        </div>
        <h2 className="text-2xl font-black text-[var(--text-primary)]">In & Out</h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium">Welcome back! Unlock to view finances.</p>
      </div>

      {/* PIN Dots Display */}
      <div className="flex items-center gap-4 py-4">
        {[0, 1, 2, 3].map((idx) => {
          const isFilled = idx < enteredPin.length;
          return (
            <div
              key={idx}
              className={`w-5 h-5 rounded-full transition-all duration-200 ${
                errorState
                  ? 'bg-rose-600 scale-110'
                  : isFilled
                  ? 'bg-[var(--accent-primary)] scale-110 shadow-md'
                  : 'bg-[var(--border-color)]'
              }`}
            />
          );
        })}
      </div>

      {errorState && <p className="text-xs font-bold text-rose-500 animate-bounce">Incorrect PIN. Try again.</p>}

      {/* Keypad */}
      <div className="w-full max-w-xs space-y-3 pb-8">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button
              key={n}
              onClick={() => handleKeyPress(n)}
              className="w-full h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xl font-extrabold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] active:scale-95 transition-all shadow-xs flex items-center justify-center"
            >
              {n}
            </button>
          ))}

          {/* Bottom Row */}
          <button
            onClick={biometricEnabled ? handleBiometrics : undefined}
            disabled={!biometricEnabled}
            className={`w-full h-14 rounded-2xl border flex items-center justify-center transition-all ${
              biometricEnabled
                ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--accent-primary)] hover:bg-[var(--bg-card-hover)]'
                : 'border-transparent text-transparent cursor-default'
            }`}
          >
            {biometricEnabled && <Fingerprint className="w-6 h-6" />}
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            className="w-full h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xl font-extrabold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] active:scale-95 transition-all shadow-xs flex items-center justify-center"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="w-full h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] active:scale-95 transition-all shadow-xs flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
