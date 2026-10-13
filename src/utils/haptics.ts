export const triggerHaptic = (pattern: number | number[] = 10): void => {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors if blocked by browser policy
    }
  }
};

export const haptics = {
  light: () => triggerHaptic(8),
  medium: () => triggerHaptic(15),
  heavy: () => triggerHaptic(30),
  success: () => triggerHaptic([10, 30, 20]),
  warning: () => triggerHaptic([20, 50, 20]),
  error: () => triggerHaptic([40, 40, 40, 40]),
};
