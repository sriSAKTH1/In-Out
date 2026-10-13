import type { Account, Category, Transaction, Budget, UserSettings, FeedbackSubmission } from '../types';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  DEFAULT_TRANSACTIONS,
  DEFAULT_BUDGETS,
  DEFAULT_SETTINGS,
} from './defaultData';

const KEYS = {
  ACCOUNTS: 'inandout_accounts_v1',
  CATEGORIES: 'inandout_categories_v1',
  TRANSACTIONS: 'inandout_transactions_v1',
  BUDGETS: 'inandout_budgets_v1',
  SETTINGS: 'inandout_settings_v1',
  FEEDBACKS: 'inandout_feedbacks_v1',
};

const STORAGE_CHANGE_EVENT = 'inandout_storage_change';

const notifyListeners = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
  }
};

export const storage = {
  // Load functions
  getAccounts: (): Account[] => {
    try {
      const data = localStorage.getItem(KEYS.ACCOUNTS);
      return data ? JSON.parse(data) : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  },

  getCategories: (): Category[] => {
    try {
      const data = localStorage.getItem(KEYS.CATEGORIES);
      if (!data) return DEFAULT_CATEGORIES;
      const categories: Category[] = JSON.parse(data);
      let updated = false;
      const merged = [...categories];

      // Auto-migrate missing default categories (ensuring all 12 expense categories exist)
      for (const defCat of DEFAULT_CATEGORIES) {
        if (!merged.some((c) => c.id === defCat.id || (c.type === defCat.type && c.name.toLowerCase() === defCat.name.toLowerCase()))) {
          merged.push(defCat);
          updated = true;
        }
      }

      // Ensure top 6 expense categories have star status (is_default) and 'Other' is permanent
      const starredExpenseIds = ['cat_food', 'cat_transport', 'cat_shopping', 'cat_bills', 'cat_entertainment', 'cat_health'];
      merged.forEach((c) => {
        if (starredExpenseIds.includes(c.id) && !c.is_default) {
          c.is_default = true;
          updated = true;
        }
        if ((c.id === 'cat_other' || c.id === 'cat_income_other' || c.name.toLowerCase() === 'other') && !c.is_permanent) {
          c.is_permanent = true;
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(merged));
      }
      return merged;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  getTransactions: (): Transaction[] => {
    try {
      const data = localStorage.getItem(KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : DEFAULT_TRANSACTIONS;
    } catch {
      return DEFAULT_TRANSACTIONS;
    }
  },

  getBudgets: (): Budget[] => {
    try {
      const data = localStorage.getItem(KEYS.BUDGETS);
      return data ? JSON.parse(data) : DEFAULT_BUDGETS;
    } catch {
      return DEFAULT_BUDGETS;
    }
  },

  getSettings: (): UserSettings => {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  getFeedbacks: (): FeedbackSubmission[] => {
    try {
      const data = localStorage.getItem(KEYS.FEEDBACKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Save functions
  saveAccounts: (accounts: Account[]): void => {
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
    notifyListeners();
  },

  saveCategories: (categories: Category[]): void => {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    notifyListeners();
  },

  saveTransactions: (transactions: Transaction[]): void => {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    notifyListeners();
  },

  saveBudgets: (budgets: Budget[]): void => {
    localStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
    notifyListeners();
  },

  saveSettings: (settings: UserSettings): void => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    notifyListeners();
  },

  saveFeedbacks: (feedbacks: FeedbackSubmission[]): void => {
    localStorage.setItem(KEYS.FEEDBACKS, JSON.stringify(feedbacks));
    notifyListeners();
  },

  // Pub/Sub listener
  subscribe: (callback: () => void): (() => void) => {
    const handler = () => callback();
    window.addEventListener(STORAGE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  },

  // Backup & Restore
  exportBackupJSON: (): string => {
    const backupData = {
      app: 'In & Out',
      version: 'v1.1.0',
      exported_at: new Date().toISOString(),
      accounts: storage.getAccounts(),
      categories: storage.getCategories(),
      transactions: storage.getTransactions(),
      budgets: storage.getBudgets(),
      settings: storage.getSettings(),
    };
    return JSON.stringify(backupData, null, 2);
  },

  importBackupJSON: (jsonStr: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || (!parsed.transactions && !parsed.accounts)) {
        return { success: false, message: 'Invalid backup file structure.' };
      }

      if (parsed.accounts) storage.saveAccounts(parsed.accounts);
      if (parsed.categories) storage.saveCategories(parsed.categories);
      if (parsed.transactions) storage.saveTransactions(parsed.transactions);
      if (parsed.budgets) storage.saveBudgets(parsed.budgets);
      if (parsed.settings) storage.saveSettings(parsed.settings);

      notifyListeners();
      return { success: true, message: 'Data restored successfully.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to parse JSON backup.' };
    }
  },

  exportTransactionsCSV: (): string => {
    const transactions = storage.getTransactions();
    const categories = storage.getCategories();
    const accounts = storage.getAccounts();

    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const accMap = new Map(accounts.map((a) => [a.id, a.name]));

    const headers = ['ID', 'Type', 'Amount', 'Date', 'Category', 'Account / From Account', 'To Account', 'Note'];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      t.amount,
      t.date,
      t.category_id ? catMap.get(t.category_id) || '' : '',
      t.account_id ? accMap.get(t.account_id) || '' : t.from_account_id ? accMap.get(t.from_account_id) || '' : '',
      t.to_account_id ? accMap.get(t.to_account_id) || '' : '',
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  exportFeedbacksCSV: (): string => {
    const feedbacks = storage.getFeedbacks();
    const headers = ['ID', 'Rating', 'Category', 'Message', 'Created At'];
    const rows = feedbacks.map((f) => [
      f.id,
      f.rating,
      f.category,
      `"${(f.message || '').replace(/"/g, '""')}"`,
      f.created_at,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  // Reset actions
  resetToSeedData: (): void => {
    storage.saveAccounts(DEFAULT_ACCOUNTS);
    storage.saveCategories(DEFAULT_CATEGORIES);
    storage.saveTransactions(DEFAULT_TRANSACTIONS);
    storage.saveBudgets(DEFAULT_BUDGETS);
    storage.saveSettings(DEFAULT_SETTINGS);
    notifyListeners();
  },

  resetToCleanState: (): void => {
    storage.saveAccounts(DEFAULT_ACCOUNTS.map(a => ({ ...a, initial_balance: 0 })));
    storage.saveCategories(DEFAULT_CATEGORIES);
    storage.saveTransactions([]);
    storage.saveBudgets([]);
    storage.saveSettings({ ...DEFAULT_SETTINGS, is_setup_completed: true });
    notifyListeners();
  },

  deleteAllData: (): void => {
    localStorage.removeItem(KEYS.ACCOUNTS);
    localStorage.removeItem(KEYS.CATEGORIES);
    localStorage.removeItem(KEYS.TRANSACTIONS);
    localStorage.removeItem(KEYS.BUDGETS);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.FEEDBACKS);
    notifyListeners();
  },
};
