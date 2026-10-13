export type AccountType =
  | 'bank'
  | 'cash'
  | 'wallet'
  | 'credit_card'
  | 'savings'
  | 'investment'
  | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  currency: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_default: boolean;
  is_active: boolean;
  is_permanent?: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO String or YYYY-MM-DD
  category_id?: string | null;
  account_id?: string | null;
  from_account_id?: string | null;
  to_account_id?: string | null;
  note?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  name: string;
  category_id?: string | null;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  start_date: string;
  end_date: string;
  alert_percentage: number;
  created_at: string;
  updated_at: string;
}

export type ThemeType = 'light' | 'dark' | 'midnight' | 'forest' | 'clay' | 'system';

export interface UserSettings {
  currency: string;
  currency_symbol: string;
  language: string;
  theme: ThemeType;
  font_family?: 'normal' | 'italic' | 'bold_italic' | 'monospace' | 'script' | 'formal' | 'funky' | 'casual' | 'system' | 'inter' | 'outfit' | 'serif';
  accent_color?: string;
  passcode_enabled: boolean;
  passcode_pin?: string;
  biometric_enabled: boolean;
  auto_lock_minutes: number;
  start_screen: 'overview' | 'stats' | 'budget' | 'account' | 'more';
  date_format: string;
  notifications_enabled: boolean;
  show_totals?: boolean;
  hide_balance?: boolean;
  is_setup_completed: boolean;
  is_pro_user?: boolean;
  pro_plan?: 'monthly' | 'yearly' | 'lifetime';
  pro_unlocked_at?: string;
  disable_splash_animation?: boolean;
}

export type TabType = 'overview' | 'stats' | 'budget' | 'account' | 'more';

export interface FilterOptions {
  type: 'all' | 'income' | 'expense' | 'transfer';
  categoryId?: string | null;
  accountId?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  query?: string;
}

export interface FeedbackSubmission {
  id: string;
  rating: number;
  category: 'bug' | 'feature' | 'other';
  message: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  auth_provider: 'firebase' | 'google' | 'local';
  email_verified?: boolean;
}
