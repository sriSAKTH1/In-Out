import React from 'react';
import type { Account, Category, Transaction } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { formatDate, formatTime } from '../../utils/formatters';
import { Edit3, Trash2, Tag, Landmark, Calendar, FileText } from 'lucide-react';
import { haptics } from '../../utils/haptics';

interface TransactionDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
  onDelete: (txId: string) => void;
  currencySymbol?: string;
  hideBalance?: boolean;
}

export const TransactionDetailSheet: React.FC<TransactionDetailSheetProps> = ({
  isOpen,
  onClose,
  transaction,
  accounts,
  categories,
  onEdit,
  onDelete,
  currencySymbol = '₹',
  hideBalance = false,
}) => {
  if (!transaction) return null;

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  const cat = transaction.category_id ? catMap.get(transaction.category_id) : null;
  const acc = transaction.account_id ? accMap.get(transaction.account_id) : null;
  const fromAcc = transaction.from_account_id ? accMap.get(transaction.from_account_id) : null;
  const toAcc = transaction.to_account_id ? accMap.get(transaction.to_account_id) : null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Transaction Details">
      <div className="space-y-5">
        {/* Header Amount Card */}
        <div className="p-5 rounded-3xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-center">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2"
            style={{
              backgroundColor:
                transaction.type === 'income'
                  ? 'rgba(46, 125, 50, 0.15)'
                  : transaction.type === 'expense'
                  ? 'rgba(198, 40, 40, 0.15)'
                  : 'rgba(2, 119, 189, 0.15)',
              color:
                transaction.type === 'income'
                  ? 'var(--income-color)'
                  : transaction.type === 'expense'
                  ? 'var(--expense-color)'
                  : 'var(--transfer-color)',
            }}
          >
            {transaction.type}
          </div>

          <div
            className={`text-3xl sm:text-4xl font-black ${
              transaction.type === 'income'
                ? 'text-[var(--income-color)]'
                : transaction.type === 'expense'
                ? 'text-[var(--expense-color)]'
                : 'text-[var(--transfer-color)]'
            }`}
          >
            <CurrencyDisplay
              amount={transaction.type === 'expense' ? -transaction.amount : transaction.amount}
              symbol={currencySymbol}
              hideBalance={hideBalance}
              prefixSign={transaction.type === 'income'}
            />
          </div>

          <div className="text-xs text-[var(--text-secondary)] font-medium mt-1">
            {formatDate(transaction.date)} • {formatTime(transaction.date)}
          </div>
        </div>

        {/* Details Grid */}
        <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] overflow-hidden">
          {/* Category */}
          {transaction.type !== 'transfer' && (
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
                <Tag className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Category</span>
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <span>{cat?.icon || '🏷️'}</span>
                <span>{cat?.name || 'Uncategorized'}</span>
              </div>
            </div>
          )}

          {/* Account */}
          {transaction.type !== 'transfer' && (
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
                <Landmark className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Account</span>
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <span>{acc?.icon || '🏦'}</span>
                <span>{acc?.name || 'Unknown Account'}</span>
              </div>
            </div>
          )}

          {/* Transfer Accounts */}
          {transaction.type === 'transfer' && (
            <>
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
                  <Landmark className="w-4 h-4 text-rose-500" />
                  <span>From Account</span>
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>{fromAcc?.icon || '🏦'}</span>
                  <span>{fromAcc?.name || 'Unknown'}</span>
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
                  <Landmark className="w-4 h-4 text-emerald-500" />
                  <span>To Account</span>
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>{toAcc?.icon || '🏦'}</span>
                  <span>{toAcc?.name || 'Unknown'}</span>
                </div>
              </div>
            </>
          )}

          {/* Date */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
              <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Timestamp</span>
            </div>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              {transaction.date ? new Date(transaction.date).toLocaleString() : 'N/A'}
            </div>
          </div>

          {/* Note */}
          {transaction.note && (
            <div className="p-3.5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] shrink-0">
                <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Note</span>
              </div>
              <div className="text-sm font-medium text-[var(--text-primary)] text-right break-words">
                {transaction.note}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              haptics.light();
              onClose();
              onEdit(transaction);
            }}
            className="py-3.5 px-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-canvas)] text-[var(--text-primary)] font-bold text-sm hover:bg-[var(--bg-card-hover)] flex items-center justify-center gap-2 transition-colors"
          >
            <Edit3 className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => {
              haptics.heavy();
              onDelete(transaction.id);
            }}
            className="py-3.5 px-4 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20 font-bold text-sm hover:bg-rose-500/20 flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
