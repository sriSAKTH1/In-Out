import React, { useState } from 'react';
import type { Account, Category, Transaction, FilterOptions } from '../../types';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { sortCategories } from '../../utils/formatters';

interface TransactionFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  transactions?: Transaction[];
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  onResetFilters: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
  currencySymbol?: string;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  transactions = [],
  onSelectTransaction,
  currencySymbol = '₹',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  if (!isOpen) return null;

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  const filteredTransactions = transactions.filter((tx) => {
    if (selectedType !== 'all' && tx.type !== selectedType) return false;
    if (selectedCategoryId && tx.category_id !== selectedCategoryId) return false;
    if (
      selectedAccountId &&
      tx.account_id !== selectedAccountId &&
      tx.from_account_id !== selectedAccountId &&
      tx.to_account_id !== selectedAccountId
    ) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cat = tx.category_id ? catMap.get(tx.category_id) : null;
      const acc = tx.account_id ? accMap.get(tx.account_id) : null;
      const matchNote = tx.note?.toLowerCase().includes(q);
      const matchCat = cat?.name.toLowerCase().includes(q);
      const matchAcc = acc?.name.toLowerCase().includes(q);
      if (!matchNote && !matchCat && !matchAcc) return false;
    }
    return true;
  });

  const netAmount = filteredTransactions.reduce((acc, tx) => {
    if (tx.type === 'income') return acc + tx.amount;
    if (tx.type === 'expense') return acc - tx.amount;
    return acc;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col p-4 space-y-4 overflow-y-auto animate-fade-in max-w-lg mx-auto border-x border-[var(--border-color)]">
      {/* Top Search Capsule Bar (Matches User Screenshot) */}
      <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md">
        <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0 ml-1.5" />
        <input
          type="text"
          autoFocus
          placeholder="Search category, note, account..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm font-bold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
        />
        <button
          onClick={() => {
            haptics.light();
            setShowFilters(!showFilters);
          }}
          className={`p-2 rounded-xl transition-colors ${
            showFilters ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
          }`}
          title="Filter Options"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            haptics.light();
            onClose();
          }}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
          title="Close Search"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Expandable Secondary Filter Drawer */}
      {showFilters && (
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 animate-fade-in text-xs font-bold">
          <div>
            <span className="text-[var(--text-muted)] block mb-1.5 uppercase tracking-wider text-[10px]">Type</span>
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
              {(['all', 'income', 'expense', 'transfer'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`py-1.5 rounded-lg capitalize transition-all ${
                    selectedType === t ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[var(--text-muted)] block mb-1 uppercase tracking-wider text-[10px]">Category</span>
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] focus:outline-none"
              >
                <option value="">All Categories</option>
                {sortCategories(categories).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name} {c.is_default ? '⭐' : ''} {c.is_permanent || c.name.toLowerCase() === 'other' ? '(Other)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[var(--text-muted)] block mb-1 uppercase tracking-wider text-[10px]">Account</span>
              <select
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(e.target.value || null)}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] focus:outline-none"
              >
                <option value="">All Accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Header Row (Matches User Screenshot) */}
      <div className="flex items-center justify-between px-1 text-xs sm:text-sm font-extrabold text-[var(--text-secondary)]">
        <span>Found {filteredTransactions.length} matching transactions</span>
        <span>
          Net:{' '}
          <span className={netAmount >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
            {currencySymbol}
            {Math.abs(netAmount).toLocaleString()}
          </span>
        </span>
      </div>

      {/* Transaction Results Cards (Matches User Screenshot) */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pb-10">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] font-medium text-xs">
            No transactions match your search query.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const cat = tx.category_id ? catMap.get(tx.category_id) : null;
            const acc = tx.account_id ? accMap.get(tx.account_id) : null;
            const fromAcc = tx.from_account_id ? accMap.get(tx.from_account_id) : null;
            const toAcc = tx.to_account_id ? accMap.get(tx.to_account_id) : null;

            const txDate = new Date(tx.date);
            const dateStr = `${txDate.toLocaleString('default', { month: 'short' })} ${txDate.getDate()}`;

            return (
              <div
                key={tx.id}
                onClick={() => {
                  haptics.light();
                  onSelectTransaction?.(tx);
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  {/* Square icon container with white bg matching screenshot */}
                  <div className="w-11 h-11 rounded-2xl bg-white text-slate-900 flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                    {tx.type === 'transfer' ? '⇄' : cat?.icon || '🏷️'}
                  </div>

                  <div>
                    <div className="text-sm font-extrabold text-[var(--text-primary)]">
                      {tx.type === 'transfer'
                        ? `Transfer: ${fromAcc?.name || 'Account'} → ${toAcc?.name || 'Account'}`
                        : cat?.name || tx.note || 'Uncategorized'}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                      {dateStr} • {acc?.name || fromAcc?.name || 'Cash Wallet'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-base font-black ${
                      tx.type === 'income'
                        ? 'text-emerald-500'
                        : tx.type === 'expense'
                        ? 'text-rose-500'
                        : 'text-sky-500'
                    }`}
                  >
                    {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                    {currencySymbol}
                    {tx.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
