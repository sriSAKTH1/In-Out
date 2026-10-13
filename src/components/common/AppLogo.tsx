import React from 'react';

import logoUrl from '../../assets/logo.png';

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-36 h-36',
  };

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      <img
        src={logoUrl}
        alt="In & Out Logo"
        className="w-full h-full object-contain drop-shadow-lg"
      />
    </div>
  );
};
