import React, { useState } from 'react';
import type { Account, AccountType, Transaction, UserSettings } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { calculateAccountBalances, calculateTotalBalance } from '../../utils/calculations';
import { BottomSheet } from '../common/BottomSheet';
import { ProLimitModal } from '../common/ProLimitModal';
import { Toast } from '../common/Toast';
import { Plus, Landmark, Wallet, CreditCard, PiggyBank, TrendingUp, Edit3, Archive, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface AccountViewProps {
  accounts: Account[];
  transactions: Transaction[];
  settings: UserSettings;
  onSaveAccount: (account: Partial<Account>) => void;
  onArchiveAccount: (accountId: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onUpdateSettings?: (settings: Partial<UserSettings>) => void;
  onOpenProSheet?: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  accounts,
  transactions,
  settings,
  onSaveAccount,
  onArchiveAccount,
  onSelectTransaction,
  onUpdateSettings,
  onOpenProSheet,
}) => {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showProAccountLimitModal, setShowProAccountLimitModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Add / Edit Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [icon, setIcon] = useState('🏦');
  const [color, setColor] = useState('#1E88E5');
  const [errorMsg, setErrorMsg] = useState('');

  const activeAccounts = accounts.filter((a) => a.is_active);
  const balanceMap = calculateAccountBalances(accounts, transactions);
  const totalBalance = calculateTotalBalance(accounts, balanceMap);

  const openAddModal = (accToEdit?: Account) => {
    haptics.light();
    if (accToEdit) {
      setEditingAccount(accToEdit);
      setName(accToEdit.name);
      setType(accToEdit.type);
      setInitialBalance(accToEdit.initial_balance.toString());
      setIcon(accToEdit.icon);
      setColor(accToEdit.color);
    } else {
      if (activeAccounts.length >= 4 && !settings.is_pro_user) {
        haptics.error();
        setShowProAccountLimitModal(true);
        return;
      }
      setEditingAccount(null);
      setName('');
      setType('bank');
      setInitialBalance('0');
      setIcon('🏦');
      setColor('#1E88E5');
    }
    setErrorMsg('');
    setShowAddSheet(true);
  };

  const handleSave = () => {
    if (!editingAccount && activeAccounts.length >= 4 && !settings.is_pro_user) {
      haptics.error();
      setShowProAccountLimitModal(true);
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Please enter an account name.');
      haptics.error();
      return;
    }
    const parsedInit = parseFloat(initialBalance);
    if (isNaN(parsedInit)) {
      setErrorMsg('Please enter a valid initial balance.');
      haptics.error();
      return;
    }

    haptics.success();
    onSaveAccount({
      id: editingAccount ? editingAccount.id : undefined,
      name: name.trim(),
      type,
      initial_balance: parsedInit,
      currency: settings.currency,
      icon,
      color,
      is_active: true,
    });
    setShowAddSheet(false);
  };

  // Account specific transactions
  const accountTransactions = selectedAccount
    ? transactions.filter(
        (t) =>
          t.account_id === selectedAccount.id ||
          t.from_account_id === selectedAccount.id ||
          t.to_account_id === selectedAccount.id
      )
    : [];

  const getAccountTypeIcon = (accType: AccountType) => {
    switch (accType) {
      case 'bank': return Landmark;
      case 'cash': return Wallet;
      case 'credit_card': return CreditCard;
      case 'savings': return PiggyBank;
      case 'investment': return TrendingUp;
      default: return Landmark;
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-primary)]">Accounts</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Manage bank, cash & cards</p>
        </div>

        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Accounts Total Balance Card */}
      <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
          Total Account Net Balance
        </span>
        <div className="text-3xl font-black tracking-tight text-[var(--text-primary)] mt-1">
          <CurrencyDisplay amount={totalBalance} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">Combined balance across {activeAccounts.length} active accounts</p>
      </div>

      {/* Account Cards Grid */}
      <div className="space-y-3">
        {activeAccounts.map((acc) => {
          const currentBal = balanceMap[acc.id] || 0;
          const TypeIcon = getAccountTypeIcon(acc.type);

          return (
            <div
              key={acc.id}
              onClick={() => {
                haptics.light();
                setSelectedAccount(acc);
              }}
              className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all cursor-pointer shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-2xs"
                  style={{ backgroundColor: `${acc.color || '#1E88E5'}20` }}
                >
                  {acc.icon || '🏦'}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-[var(--text-primary)]">{acc.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] capitalize mt-0.5 font-medium">
                    <TypeIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>{acc.type.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-base font-extrabold ${currentBal < 0 ? 'text-rose-600' : 'text-[var(--text-primary)]'}`}>
                  <CurrencyDisplay amount={currentBal} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} />
                </div>
                <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">Tap for details</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Detail Sheet */}
      <BottomSheet
        isOpen={selectedAccount !== null}
        onClose={() => setSelectedAccount(null)}
        title={selectedAccount ? selectedAccount.name : 'Account Detail'}
      >
        {selectedAccount && (
          <div className="space-y-5">
            {/* Balance Overview Card */}
            <div className="p-5 rounded-3xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-center">
              <div className="text-3xl font-black text-[var(--text-primary)]">
                <CurrencyDisplay
                  amount={balanceMap[selectedAccount.id] || 0}
                  symbol={settings.currency_symbol}
                  hideBalance={settings.hide_balance}
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Current Calculated Balance</p>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)]">
                <div>
                  Initial Balance:{' '}
                  <CurrencyDisplay
                    amount={selectedAccount.initial_balance}
                    symbol={settings.currency_symbol}
                    hideBalance={settings.hide_balance}
                  />
                </div>
                <div>Type: <span className="capitalize">{selectedAccount.type.replace('_', ' ')}</span></div>
              </div>
            </div>

            {/* Account Activity List */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Account Activity</h5>
              {accountTransactions.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] py-4 text-center">No transactions linked to this account.</p>
              ) : (
                <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] overflow-hidden max-h-56 overflow-y-auto">
                  {accountTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => {
                        setSelectedAccount(null);
                        onSelectTransaction(tx);
                      }}
                      className="p-3 flex items-center justify-between text-xs hover:bg-[var(--bg-card-hover)] cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {tx.type === 'income' && <ArrowDownLeft className="w-4 h-4 text-emerald-600" />}
                        {tx.type === 'expense' && <ArrowUpRight className="w-4 h-4 text-rose-600" />}
                        {tx.type === 'transfer' && <ArrowRightLeft className="w-4 h-4 text-sky-600" />}
                        <div>
                          <div className="font-bold text-[var(--text-primary)]">{tx.note || tx.type}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{tx.date.split('T')[0]}</div>
                        </div>
                      </div>
                      <div className={`font-extrabold ${tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-rose-600' : 'text-sky-600'}`}>
                        <CurrencyDisplay amount={tx.type === 'expense' ? -tx.amount : tx.amount} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  const acc = selectedAccount;
                  setSelectedAccount(null);
                  openAddModal(acc);
                }}
                className="py-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-sm hover:bg-[var(--bg-card-hover)] flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Edit Account</span>
              </button>

              <button
                onClick={() => {
                  haptics.heavy();
                  onArchiveAccount(selectedAccount.id);
                  setSelectedAccount(null);
                }}
                className="py-3.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold text-sm hover:bg-amber-500/20 flex items-center justify-center gap-2"
              >
                <Archive className="w-4 h-4" />
                <span>Archive Account</span>
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Add / Edit Account Form Sheet */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title={editingAccount ? 'Edit Account' : 'Add Account'}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Account Name</label>
            <input
              type="text"
              placeholder="e.g. HDFC Bank, Cash Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-primary)] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Account Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-primary)] focus:outline-none"
            >
              <option value="bank">Bank Account</option>
              <option value="cash">Cash Wallet</option>
              <option value="credit_card">Credit Card</option>
              <option value="savings">Savings Account</option>
              <option value="investment">Investment</option>
              <option value="wallet">Digital Wallet</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Initial Starting Balance ({settings.currency_symbol})</label>
            <input
              type="number"
              placeholder="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-base font-extrabold text-[var(--text-primary)] focus:outline-none"
            />
          </div>

          {/* Icon Picker Presets */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Customize Account Icon</label>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {['🏦', '💵', '💳', '👛', '💰', '🐷', '📊', '📈', '🏛️', '💎', '📱', '🏠', '🚗', '💼', '🪙', '🔑'].map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-2xl text-xl flex items-center justify-center border transition-all shrink-0 ${
                    icon === ic ? 'bg-[var(--accent-light)] border-[var(--accent-primary)] scale-110 shadow-xs' : 'bg-[var(--bg-canvas)] border-[var(--border-color)]'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && <p className="text-xs font-bold text-rose-500 text-center">{errorMsg}</p>}

          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold text-base shadow-lg transition-all"
          >
            {editingAccount ? 'Update Account' : 'Save Account'}
          </button>
        </div>
      </BottomSheet>

      {/* PRO LIMIT MODAL FOR ACCOUNTS */}
      <ProLimitModal
        isOpen={showProAccountLimitModal}
        onClose={() => setShowProAccountLimitModal(false)}
        type="account"
        onOpenProSheet={onOpenProSheet}
        onActivatePro={() => {
          setShowProAccountLimitModal(false);
          setShowAddSheet(false);
          setToastMessage('Coming soon');
          setShowToast(true);
        }}
      />

      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};
