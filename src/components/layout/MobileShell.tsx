import React, { useState, useEffect, useRef } from 'react';
import type { Account, Category, Transaction, Budget, UserSettings, TabType, FilterOptions, TransactionType, UserProfile } from '../../types';
import { storage } from '../../data/storage';
import { authService } from '../../services/authService';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { FloatingAddButton } from './FloatingAddButton';
import { OverviewView } from '../overview/OverviewView';
import { StatsView } from '../stats/StatsView';
import { BudgetView } from '../budget/BudgetView';
import { AccountView } from '../account/AccountView';
import { MoreView } from '../more/MoreView';
import { AddTransactionSheet } from '../transactions/AddTransactionSheet';
import { TransactionDetailSheet } from '../transactions/TransactionDetailSheet';
import { TransactionFilters } from '../transactions/TransactionFilters';

import { SetupWizard } from '../onboarding/SetupWizard';
import { SplashScreen } from '../common/SplashScreen';
import { DemoNoticeModal } from '../common/DemoNoticeModal';
import { AuthScreen } from '../auth/AuthScreen';

export const MobileShell: React.FC = () => {
  const DEFAULT_GUEST_PROFILE: UserProfile = {
    id: 'usr_guest',
    name: 'niceTRY User',
    email: 'guest@nicetry.app',
    created_at: new Date().toISOString(),
    auth_provider: 'local',
  };

  // Splash Screen Opening Page State
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Scroll Header Visibility State
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(true);
  const lastScrollTopRef = useRef<number>(0);

  // User Auth State
  const [userProfile, setUserProfile] = useState<UserProfile>(
    authService.getUserProfile() || DEFAULT_GUEST_PROFILE
  );
  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(false);

  // Global Data State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<UserSettings>(storage.getSettings());

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('overview');



  // Sheets & Modals State
  const [showAddTxSheet, setShowAddTxSheet] = useState<boolean>(false);
  const [addTxType, setAddTxType] = useState<TransactionType>('expense');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    type: 'all',
    categoryId: null,
    accountId: null,
    minAmount: null,
    maxAmount: null,
    startDate: null,
    endDate: null,
    query: '',
  });

  // Reset header to visible whenever activeTab changes
  useEffect(() => {
    setIsHeaderVisible(true);
  }, [activeTab]);

  // Handle Main Body Scroll for Header Hide/Show (Down hides header, Up shows header)
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    const diff = currentScrollTop - lastScrollTopRef.current;

    if (Math.abs(diff) < 3) return;

    if (diff > 0 && currentScrollTop > 10) {
      // User scrolls down -> hide header
      setIsHeaderVisible(false);
    } else if (diff < 0) {
      // User scrolls up -> show header
      setIsHeaderVisible(true);
    }
    lastScrollTopRef.current = currentScrollTop;
  };

  // Subscribe to Auth changes
  useEffect(() => {
    const current = authService.getUserProfile();
    setUserProfile(current || DEFAULT_GUEST_PROFILE);
    const unsub = authService.subscribeAuthChange(() => {
      const updated = authService.getUserProfile();
      setUserProfile(updated || DEFAULT_GUEST_PROFILE);
    });
    return () => unsub();
  }, []);

  const applyVisualSettings = (loadedSettings: UserSettings) => {
    document.documentElement.setAttribute('data-theme', loadedSettings.theme || 'light');
    document.documentElement.setAttribute('data-font', loadedSettings.font_family || 'system');
    if (loadedSettings.accent_color) {
      document.documentElement.style.setProperty('--accent-primary', loadedSettings.accent_color);
      document.documentElement.style.setProperty('--accent-primary-hover', loadedSettings.accent_color);
      document.documentElement.style.setProperty('--accent-light', `${loadedSettings.accent_color}25`);
    } else {
      document.documentElement.style.removeProperty('--accent-primary');
      document.documentElement.style.removeProperty('--accent-primary-hover');
      document.documentElement.style.removeProperty('--accent-light');
    }
  };

  // Load state and subscribe to storage changes
  const reloadData = () => {
    const loadedSettings = storage.getSettings();
    setAccounts(storage.getAccounts());
    setCategories(storage.getCategories());
    setTransactions(storage.getTransactions());
    setBudgets(storage.getBudgets());
    setSettings(loadedSettings);
    applyVisualSettings(loadedSettings);
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = storage.subscribe(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, []);



  // Handlers
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    storage.saveSettings(updated);
    setSettings(updated);
    applyVisualSettings(updated);
  };

  const handleOpenAddTx = (type: TransactionType) => {
    setAddTxType(type);
    setEditingTx(null);
    setShowAddTxSheet(true);
  };

  const handleSaveTransaction = (txData: Partial<Transaction>) => {
    if (editingTx) {
      const updated = transactions.map((t) =>
        t.id === editingTx.id
          ? ({ ...t, ...txData, updated_at: new Date().toISOString() } as Transaction)
          : t
      );
      storage.saveTransactions(updated);
    } else {
      const newTx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: txData.type || 'expense',
        amount: txData.amount || 0,
        category_id: txData.category_id || '',
        account_id: txData.account_id,
        from_account_id: txData.from_account_id,
        to_account_id: txData.to_account_id,
        date: txData.date || new Date().toISOString().split('T')[0],
        note: txData.note || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      storage.saveTransactions([...transactions, newTx]);
    }
    setShowAddTxSheet(false);
    setEditingTx(null);
    reloadData();
  };

  const handleEditTransaction = (tx: Transaction) => {
    setSelectedTx(null);
    setEditingTx(tx);
    setAddTxType(tx.type);
    setShowAddTxSheet(true);
  };

  const handleDeleteTransaction = (id: string) => {
    storage.saveTransactions(transactions.filter((t) => t.id !== id));
    setSelectedTx(null);
    reloadData();
  };

  const handleSaveBudget = (budgetData: Partial<Budget>) => {
    if (budgetData.id) {
      const updated = budgets.map((b) => (b.id === budgetData.id ? ({ ...b, ...budgetData } as Budget) : b));
      storage.saveBudgets(updated);
    } else {
      const newBudget: Budget = {
        id: `bgt_${Date.now()}`,
        name: budgetData.name || 'Budget Limit',
        category_id: budgetData.category_id || null,
        amount: budgetData.amount || 0,
        period: budgetData.period || 'monthly',
        start_date: budgetData.start_date || new Date().toISOString().split('T')[0],
        end_date: budgetData.end_date || new Date().toISOString().split('T')[0],
        alert_percentage: budgetData.alert_percentage || 80,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      storage.saveBudgets([...budgets, newBudget]);
    }
    reloadData();
  };

  const handleDeleteBudget = (id: string) => {
    storage.saveBudgets(budgets.filter((b) => b.id !== id));
    reloadData();
  };

  const handleSaveAccount = (accData: Partial<Account>) => {
    if (accData.id) {
      const updated = accounts.map((a) => (a.id === accData.id ? ({ ...a, ...accData } as Account) : a));
      storage.saveAccounts(updated);
    } else {
      const newAcc: Account = {
        id: `acc_${Date.now()}`,
        name: accData.name || 'New Account',
        type: accData.type || 'bank',
        initial_balance: accData.initial_balance || 0,
        currency: settings.currency || 'INR',
        icon: accData.icon || '🏦',
        color: accData.color || '#1E88E5',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      storage.saveAccounts([...accounts, newAcc]);
    }
    reloadData();
  };

  const handleArchiveAccount = (id: string) => {
    storage.saveAccounts(accounts.map((a) => (a.id === id ? { ...a, is_active: false } : a)));
    reloadData();
  };

  const handleUpdateCategories = (cats: Category[]) => {
    storage.saveCategories(cats);
    reloadData();
  };

  const handleResetData = (type: 'seed' | 'clean' | 'delete_all') => {
    if (type === 'seed') storage.resetToSeedData();
    else if (type === 'clean') storage.resetToCleanState();
    else storage.deleteAllData();
    reloadData();
  };

  // Onboarding Wizard check (First time setup for user)
  if (!settings.is_setup_completed) {
    return (
      <SetupWizard
        userProfile={userProfile}
        onComplete={(newSettings, firstAcc, chosenCategories) => {
          if (firstAcc) {
            const acc: Account = {
              id: `acc_${Date.now()}`,
              name: firstAcc.name || 'Cash',
              type: firstAcc.type || 'cash',
              initial_balance: firstAcc.initial_balance || 0,
              currency: newSettings.currency,
              icon: firstAcc.icon || '💵',
              color: firstAcc.color || '#43A047',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            storage.saveAccounts([acc]);
          }
          if (chosenCategories && chosenCategories.length > 0) {
            const existingCats = storage.getCategories();
            const existingIds = new Set(existingCats.map((c) => c.id));
            const extraCats = chosenCategories.filter((c) => !existingIds.has(c.id));
            storage.saveCategories([...existingCats, ...extraCats]);
          }
          storage.saveSettings({ ...newSettings, is_setup_completed: true });
          setActiveTab('overview');
          reloadData();
        }}
      />
    );
  }

  // Opening Splash Page check
  if (showSplash) {
    return <SplashScreen onEnter={() => setShowSplash(false)} />;
  }



  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col items-center">
      <div className="w-full max-w-lg min-h-screen flex flex-col relative bg-[var(--bg-canvas)] border-x border-[var(--border-color)]/50 shadow-2xl">
        {/* Top Header with Smart Scroll Hide/Show & Dynamic Page Titles */}
        <Header
          visible={isHeaderVisible}
          activeTab={activeTab}
          userProfile={userProfile}
          hideBalance={!!settings.hide_balance}
          onToggleHideBalance={() => {
            handleUpdateSettings({ ...settings, hide_balance: !settings.hide_balance });
          }}
          onOpenSearch={() => setShowFilters(true)}
        />

        {/* Main Content Body with Scroll Listener */}
        <main onScroll={handleScroll} className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewView
              accounts={accounts}
              categories={categories}
              transactions={transactions}
              settings={settings}
              onToggleHideBalance={() => handleUpdateSettings({ ...settings, hide_balance: !settings.hide_balance })}
              onSelectTransaction={(tx) => setSelectedTx(tx)}
              onQuickAdd={(type) => handleOpenAddTx(type)}
              onOpenSearch={() => setShowFilters(true)}
            />
          )}

          {activeTab === 'stats' && (
            <StatsView categories={categories} transactions={transactions} settings={settings} />
          )}

          {activeTab === 'budget' && (
            <BudgetView
              budgets={budgets}
              categories={categories}
              transactions={transactions}
              settings={settings}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
              onUpdateSettings={handleUpdateSettings}
              onOpenProSheet={() => setActiveTab('more')}
            />
          )}

          {activeTab === 'account' && (
            <AccountView
              accounts={accounts}
              transactions={transactions}
              settings={settings}
              onSaveAccount={handleSaveAccount}
              onArchiveAccount={handleArchiveAccount}
              onSelectTransaction={(tx) => setSelectedTx(tx)}
              onUpdateSettings={handleUpdateSettings}
              onOpenProSheet={() => setActiveTab('more')}
            />
          )}

          {activeTab === 'more' && (
            <MoreView
              categories={categories}
              settings={settings}
              userProfile={userProfile}
              onUpdateSettings={handleUpdateSettings}
              onUpdateCategories={handleUpdateCategories}
              onResetData={handleResetData}
              onSignOut={() => {
                authService.signOut();
                setShowAuthScreen(true);
              }}
              onUpdateProfile={(n) => authService.updateProfile(n)}
              onOpenAuth={() => setShowAuthScreen(true)}
            />
          )}

          {/* Main Body Branding (In between header and footer) */}
          <div className="text-center py-4 my-2 border-t border-[var(--border-color)]/40">
            <span className="text-xs font-black text-[var(--text-primary)] tracking-tight block">
              In & Out - CaseFlow by niceTRY
            </span>
          </div>
        </main>

        {/* Floating Add Button (+) */}
        <FloatingAddButton onSelectType={(type) => handleOpenAddTx(type)} />

        {/* REQUIRED PRIMARY FOOTER (Overview, Stats, Budget, Account, More) */}
        <BottomNavigation activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

        {/* Transaction Add & Edit Sheet */}
        <AddTransactionSheet
          isOpen={showAddTxSheet}
          onClose={() => {
            setShowAddTxSheet(false);
            setEditingTx(null);
          }}
          onSave={handleSaveTransaction}
          onAddCategory={(newCat) => handleUpdateCategories([...categories, newCat])}
          onDeleteCategory={(catId) => handleUpdateCategories(categories.filter((c) => c.id !== catId))}
          initialType={addTxType}
          editingTransaction={editingTx}
          accounts={accounts}
          categories={categories}
          currencySymbol={settings.currency_symbol}
        />

        {/* Transaction Detail Sheet */}
        <TransactionDetailSheet
          isOpen={selectedTx !== null}
          onClose={() => setSelectedTx(null)}
          transaction={selectedTx}
          accounts={accounts}
          categories={categories}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          currencySymbol={settings.currency_symbol}
          hideBalance={settings.hide_balance}
        />

        {/* Full Screen Search & Filter Overlay (Matching Screenshot) */}
        <TransactionFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          accounts={accounts}
          categories={categories}
          transactions={transactions}
          onSelectTransaction={(tx) => setSelectedTx(tx)}
          currencySymbol={settings.currency_symbol}
          filters={filterOptions}
          onApplyFilters={(opts) => setFilterOptions(opts)}
          onResetFilters={() =>
            setFilterOptions({
              type: 'all',
              categoryId: null,
              accountId: null,
              minAmount: null,
              maxAmount: null,
              startDate: null,
              endDate: null,
              query: '',
            })
          }
        />

        {/* Auth Screen Modal / Overlay */}
        {showAuthScreen && (
          <AuthScreen
            onAuthenticated={(profile, isNewUser) => {
              setUserProfile(profile);
              setShowAuthScreen(false);
              if (isNewUser) {
                storage.deleteAllData();
                reloadData();
                const currSettings = storage.getSettings();
                const newSt = { ...currSettings, is_setup_completed: false };
                storage.saveSettings(newSt);
                setSettings(newSt);
              }
            }}
          />
        )}

        {/* First Time Demo Notice Modal */}
        <DemoNoticeModal onLoginClick={() => setShowAuthScreen(true)} />
      </div>
    </div>
  );
};
