import React from 'react';
import { formatCurrency } from '../../utils/formatters';

interface CurrencyDisplayProps {
  amount: number;
  symbol?: string;
  hideBalance?: boolean;
  className?: string;
  prefixSign?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  symbol = '₹',
  hideBalance = false,
  className = '',
  prefixSign = false,
}) => {
  const formatted = formatCurrency(amount, symbol, hideBalance);
  
  let signPrefix = '';
  if (prefixSign && !hideBalance) {
    if (amount > 0) signPrefix = '+';
    // formatCurrency already puts - if amount < 0
  }

  return <span className={className}>{signPrefix}{formatted}</span>;
};
