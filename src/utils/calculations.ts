import type { Account, Transaction, Budget, Category } from '../types';

export interface AccountBalanceMap {
  [accountId: string]: number;
}

export const calculateAccountBalances = (
  accounts: Account[],
  transactions: Transaction[]
): AccountBalanceMap => {
  const balanceMap: AccountBalanceMap = {};

  // Initialize with account initial balances
  accounts.forEach((acc) => {
    balanceMap[acc.id] = acc.initial_balance || 0;
  });

  // Calculate effect of transactions
  transactions.forEach((tx) => {
    const amount = tx.amount || 0;

    if (tx.type === 'income') {
      if (tx.account_id && balanceMap[tx.account_id] !== undefined) {
        balanceMap[tx.account_id] += amount;
      }
    } else if (tx.type === 'expense') {
      if (tx.account_id && balanceMap[tx.account_id] !== undefined) {
        balanceMap[tx.account_id] -= amount;
      }
    } else if (tx.type === 'transfer') {
      if (tx.from_account_id && balanceMap[tx.from_account_id] !== undefined) {
        balanceMap[tx.from_account_id] -= amount;
      }
      if (tx.to_account_id && balanceMap[tx.to_account_id] !== undefined) {
        balanceMap[tx.to_account_id] += amount;
      }
    }
  });

  return balanceMap;
};

export const calculateTotalBalance = (
  accounts: Account[],
  balanceMap: AccountBalanceMap
): number => {
  return accounts
    .filter((acc) => acc.is_active)
    .reduce((total, acc) => total + (balanceMap[acc.id] || 0), 0);
};

export interface PeriodSummary {
  income: number;
  expense: number;
  net: number;
}

export const calculatePeriodSummary = (
  transactions: Transaction[],
  startDate?: Date,
  endDate?: Date
): PeriodSummary => {
  let income = 0;
  let expense = 0;

  transactions.forEach((tx) => {
    const txDate = new Date(tx.date);

    if (startDate && txDate < startDate) return;
    if (endDate && txDate > endDate) return;

    if (tx.type === 'income') {
      income += tx.amount;
    } else if (tx.type === 'expense') {
      expense += tx.amount;
    }
  });

  return {
    income,
    expense,
    net: income - expense,
  };
};

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

export const calculateCategoryBreakdown = (
  transactions: Transaction[],
  categories: Category[],
  type: 'expense' | 'income' = 'expense',
  startDate?: Date,
  endDate?: Date
): CategoryBreakdownItem[] => {
  const categoryMap: { [catId: string]: number } = {};
  let totalAmount = 0;

  const filtered = transactions.filter((tx) => {
    if (tx.type !== type) return false;
    const txDate = new Date(tx.date);
    if (startDate && txDate < startDate) return false;
    if (endDate && txDate > endDate) return false;
    return true;
  });

  filtered.forEach((tx) => {
    const catId = tx.category_id || 'uncategorized';
    categoryMap[catId] = (categoryMap[catId] || 0) + tx.amount;
    totalAmount += tx.amount;
  });

  const catLookup: { [id: string]: Category } = {};
  categories.forEach((c) => {
    catLookup[c.id] = c;
  });

  const result: CategoryBreakdownItem[] = Object.keys(categoryMap).map((catId) => {
    const amount = categoryMap[catId];
    const cat = catLookup[catId];
    return {
      categoryId: catId,
      categoryName: cat ? cat.name : 'Uncategorized',
      icon: cat ? cat.icon : '🏷️',
      color: cat ? cat.color : '#736E65',
      amount,
      percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
    };
  });

  return result.sort((a, b) => b.amount - a.amount);
};

export interface BudgetStatus {
  budget: Budget;
  categoryName?: string;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'normal' | 'warning' | 'exceeded';
}

export const calculateBudgetStatuses = (
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[]
): BudgetStatus[] => {
  const catLookup: { [id: string]: Category } = {};
  categories.forEach((c) => {
    catLookup[c.id] = c;
  });

  return budgets.map((b) => {
    const startDate = new Date(b.start_date);
    const endDate = new Date(b.end_date);

    const spent = transactions
      .filter((tx) => {
        if (tx.type !== 'expense') return false;
        if (b.category_id && tx.category_id !== b.category_id) return false;
        const d = new Date(tx.date);
        return d >= startDate && d <= endDate;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const remaining = Math.max(0, b.amount - spent);
    const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

    let status: 'normal' | 'warning' | 'exceeded' = 'normal';
    if (spent > b.amount) {
      status = 'exceeded';
    } else if (percentage >= (b.alert_percentage || 80)) {
      status = 'warning';
    }

    const cat = b.category_id ? catLookup[b.category_id] : undefined;

    return {
      budget: b,
      categoryName: cat ? cat.name : 'Overall Spending',
      spent,
      remaining,
      percentage,
      status,
    };
  });
};

export interface DailyCashFlowPoint {
  dayLabel: string;
  date: string;
  income: number;
  expense: number;
  net: number;
}

export const calculateDailyCashFlow = (
  transactions: Transaction[],
  daysCount: number = 30
): DailyCashFlowPoint[] => {
  const points: DailyCashFlowPoint[] = [];
  const today = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    let income = 0;
    let expense = 0;

    transactions.forEach((tx) => {
      const txDateStr = tx.date.split('T')[0];
      if (txDateStr === dateStr) {
        if (tx.type === 'income') income += tx.amount;
        if (tx.type === 'expense') expense += tx.amount;
      }
    });

    points.push({
      dayLabel: `${d.getDate()}/${d.getMonth() + 1}`,
      date: dateStr,
      income,
      expense,
      net: income - expense,
    });
  }

  return points;
};
