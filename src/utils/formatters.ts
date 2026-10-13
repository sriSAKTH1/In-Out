export const formatCurrency = (
  amount: number,
  symbol: string = '₹',
  hideBalance: boolean = false
): string => {
  if (hideBalance) {
    return `${symbol}••••••`;
  }
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formattedNumber}`;
};

export const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const formatTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(d);
  } catch {
    return '';
  }
};

export const getRelativeDateLabel = (dateStr: string): string => {
  try {
    const target = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (
      target.getFullYear() === today.getFullYear() &&
      target.getMonth() === today.getMonth() &&
      target.getDate() === today.getDate()
    ) {
      return 'Today';
    }

    if (
      target.getFullYear() === yesterday.getFullYear() &&
      target.getMonth() === yesterday.getMonth() &&
      target.getDate() === yesterday.getDate()
    ) {
      return 'Yesterday';
    }

    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
};

export const formatCompactNumber = (num: number, symbol: string = '₹'): string => {
  if (Math.abs(num) >= 1000000) {
    return `${symbol}${(num / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1000) {
    return `${symbol}${(num / 1000).toFixed(1)}k`;
  }
  return `${symbol}${num.toLocaleString()}`;
};

export const sortCategories = <T extends { name: string; is_default?: boolean; is_permanent?: boolean; id?: string }>(cats: T[]): T[] => {
  return [...cats].sort((a, b) => {
    const isAOther = a.is_permanent || a.id === 'cat_other' || a.id === 'cat_income_other' || a.name.trim().toLowerCase() === 'other';
    const isBOther = b.is_permanent || b.id === 'cat_other' || b.id === 'cat_income_other' || b.name.trim().toLowerCase() === 'other';

    if (isAOther && !isBOther) return 1; // 'Other' always last
    if (!isAOther && isBOther) return -1;

    if (a.is_default && !b.is_default) return -1; // Starred categories first
    if (!a.is_default && b.is_default) return 1;

    return 0;
  });
};

