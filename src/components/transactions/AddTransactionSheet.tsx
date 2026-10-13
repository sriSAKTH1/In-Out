import React, { useState, useEffect } from 'react';
import type { Account, Category, Transaction, TransactionType } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { ProLimitModal } from '../common/ProLimitModal';
import { Toast } from '../common/Toast';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Calendar, Tag, Landmark, Check, Star, Plus, Trash2 } from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { sortCategories } from '../../utils/formatters';

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  onAddCategory?: (category: Category) => void;
  onDeleteCategory?: (catId: string) => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  accounts: Account[];
  categories: Category[];
  currencySymbol?: string;
}

export const AddTransactionSheet: React.FC<AddTransactionSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  onAddCategory,
  onDeleteCategory,
  initialType = 'expense',
  editingTransaction,
  accounts,
  categories,
  currencySymbol = '₹',
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState<'single' | 'from' | 'to' | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Quick category creation inside category picker sheet
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [showProCategoryModal, setShowProCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🛍️');
  const [newCatColor, setNewCatColor] = useState('#5A5A40');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.category_id || '');
      setAccountId(editingTransaction.account_id || '');
      setFromAccountId(editingTransaction.from_account_id || '');
      setToAccountId(editingTransaction.to_account_id || '');
      setDate(editingTransaction.date.split('T')[0]);
      setNote(editingTransaction.note || '');
    } else {
      setType(initialType);
      setAmount('');
      // Set sensible defaults
      const activeAccounts = accounts.filter((a) => a.is_active);
      if (activeAccounts.length > 0) {
        setAccountId(activeAccounts[0].id);
        setFromAccountId(activeAccounts[0].id);
        if (activeAccounts.length > 1) {
          setToAccountId(activeAccounts[1].id);
        }
      }
      const activeCategories = categories.filter((c) => c.type === initialType && c.is_active);
      if (activeCategories.length > 0) {
        setCategoryId(activeCategories[0].id);
      }
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
    setErrorMsg('');
  }, [isOpen, initialType, editingTransaction, accounts, categories]);

  const handleTypeChange = (newType: TransactionType) => {
    haptics.light();
    setType(newType);
    const activeCats = categories.filter((c) => c.type === (newType === 'transfer' ? 'expense' : newType) && c.is_active);
    if (activeCats.length > 0 && !activeCats.some((c) => c.id === categoryId)) {
      setCategoryId(activeCats[0].id);
    }
  };

  const handleQuickAddAmount = (addVal: number) => {
    haptics.light();
    const curr = parseFloat(amount) || 0;
    setAmount((curr + addVal).toString());
  };

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount.');
      haptics.error();
      return;
    }

    if (type !== 'transfer' && !accountId) {
      setErrorMsg('Please select an account.');
      haptics.error();
      return;
    }

    if (type === 'transfer') {
      if (!fromAccountId || !toAccountId) {
        setErrorMsg('Please select both origin and destination accounts.');
        haptics.error();
        return;
      }
      if (fromAccountId === toAccountId) {
        setErrorMsg('Origin and destination accounts must be different.');
        haptics.error();
        return;
      }
    }

    haptics.success();
    onSave({
      id: editingTransaction ? editingTransaction.id : undefined,
      type,
      amount: parsedAmount,
      category_id: type === 'transfer' ? null : categoryId,
      account_id: type === 'transfer' ? null : accountId,
      from_account_id: type === 'transfer' ? fromAccountId : null,
      to_account_id: type === 'transfer' ? toAccountId : null,
      date: new Date(date).toISOString(),
      note: note.trim(),
    });
    onClose();
  };

  const handleSaveQuickCategory = () => {
    if (!newCatName.trim()) return;
    if (currentCategoryList.length >= 12) {
      haptics.error();
      setShowProCategoryModal(true);
      return;
    }
    haptics.success();
    const catType = type === 'income' ? 'income' : 'expense';
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      type: catType,
      icon: newCatIcon,
      color: newCatColor,
      is_default: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (onAddCategory) {
      onAddCategory(newCat);
    }
    setCategoryId(newCat.id);
    setNewCatName('');
    setShowQuickAddCat(false);
  };

  const currentCategoryList = sortCategories(
    categories.filter(
      (c) => c.is_active && c.type === (type === 'income' ? 'income' : 'expense')
    )
  );
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedFromAcc = accounts.find((a) => a.id === fromAccountId);
  const selectedToAcc = accounts.find((a) => a.id === toAccountId);

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      >
        <div className="space-y-4">
          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
            <button
              onClick={() => handleTypeChange('income')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Income</span>
            </button>
            <button
              onClick={() => handleTypeChange('expense')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>
            <button
              onClick={() => handleTypeChange('transfer')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                type === 'transfer'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount Display & Native Keyboard Input Box */}
          <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-center space-y-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
              {type === 'income' ? 'Income Amount' : type === 'expense' ? 'Expense Amount' : 'Transfer Amount'}
            </span>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-2xl font-black text-[var(--text-muted)]">{currencySymbol}</span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setErrorMsg('');
                  setAmount(e.target.value);
                }}
                className="w-full text-center text-3xl sm:text-4xl font-black tracking-tight bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                autoFocus
              />
            </div>
            {errorMsg && <p className="text-xs font-semibold text-rose-500 mt-1">{errorMsg}</p>}
          </div>

          {/* Quick Add Presets & Clear */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {[100, 500, 1000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAddAmount(val)}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all"
              >
                +{currencySymbol}{val}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount('')}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition-all"
            >
              Clear
            </button>
          </div>

          {/* Form Options Grid */}
          <div className="space-y-3 pt-2">
            {/* Category Field (For Income/Expense) */}
            {type !== 'transfer' && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span className="text-xs font-bold text-[var(--text-secondary)]">Category</span>
                </div>
                <button
                  onClick={() => {
                    haptics.light();
                    setShowCategoryPicker(true);
                  }}
                  className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
                >
                  {selectedCategory ? (
                    <span>
                      {selectedCategory.icon} {selectedCategory.name}
                    </span>
                  ) : (
                    <span className="text-rose-500">Select Category &gt;</span>
                  )}
                </button>
              </div>
            )}

            {/* Account Selector (For Income/Expense) */}
            {type !== 'transfer' && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span className="text-xs font-bold text-[var(--text-secondary)]">Account</span>
                </div>
                <button
                  onClick={() => {
                    haptics.light();
                    setShowAccountPicker('single');
                  }}
                  className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
                >
                  {selectedAccount ? (
                    <span>
                      {selectedAccount.icon} {selectedAccount.name}
                    </span>
                  ) : (
                    <span className="text-rose-500">Select Account &gt;</span>
                  )}
                </button>
              </div>
            )}

            {/* Transfer From / To Account Selectors */}
            {type === 'transfer' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">From Account</span>
                  <button
                    onClick={() => {
                      haptics.light();
                      setShowAccountPicker('from');
                    }}
                    className="w-full text-left font-bold text-sm text-[var(--text-primary)] truncate"
                  >
                    {selectedFromAcc ? `${selectedFromAcc.icon} ${selectedFromAcc.name}` : 'Select From'}
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">To Account</span>
                  <button
                    onClick={() => {
                      haptics.light();
                      setShowAccountPicker('to');
                    }}
                    className="w-full text-left font-bold text-sm text-[var(--text-primary)] truncate"
                  >
                    {selectedToAcc ? `${selectedToAcc.icon} ${selectedToAcc.name}` : 'Select To'}
                  </button>
                </div>
              </div>
            )}

            {/* Date Field */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="text-xs font-bold text-[var(--text-secondary)]">Date</span>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            {/* Note Field */}
            <div className="p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
              <input
                type="text"
                placeholder="Note or description (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            onClick={handleSave}
            className={`w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all active:scale-[0.98] ${
              type === 'income'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : type === 'expense'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {editingTransaction ? 'Update Transaction' : `Save ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </button>
        </div>
      </BottomSheet>

      {/* Category Picker Sheet */}
      <BottomSheet
        isOpen={showCategoryPicker}
        onClose={() => {
          setShowCategoryPicker(false);
          setShowQuickAddCat(false);
        }}
        title="Select Category"
        maxHeight="max-h-[85vh]"
      >
        <div className="space-y-3.5">
          {/* Header Row with Total Count & Add Category Button */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
            <div>
              <span className="text-xs font-black text-[var(--text-primary)] block">
                Total {type === 'income' ? 'Income' : 'Expense'} Categories: <span className="text-[var(--accent-primary)] font-black">{currentCategoryList.length}</span>
              </span>
              <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                ⭐ Starred First • "Other" Last
              </span>
            </div>
            <button
              onClick={() => {
                if (currentCategoryList.length >= 12) {
                  haptics.error();
                  setShowProCategoryModal(true);
                } else {
                  haptics.light();
                  setShowQuickAddCat(!showQuickAddCat);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-extrabold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showQuickAddCat ? 'Cancel' : '+ Add New'}</span>
            </button>
          </div>

          {/* Quick Add Form inside Category Picker */}
          {showQuickAddCat && (
            <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] space-y-3 animate-fade-in">
              <h5 className="text-xs font-extrabold text-[var(--text-primary)]">
                Add New {type === 'income' ? 'Income' : 'Expense'} Category
              </h5>
              <input
                type="text"
                placeholder="Category name (e.g. Subscriptions)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-secondary)]">Icon:</span>
                <div className="flex gap-1 overflow-x-auto">
                  {['🛍️', '🍕', '🚗', '💡'].map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewCatIcon(ic)}
                      className={`p-1 rounded-lg border text-sm ${newCatIcon === ic ? 'border-[var(--accent-primary)] bg-[var(--accent-light)]' : 'border-[var(--border-color)]'}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-secondary)]">Color:</span>
                <div className="flex gap-1 overflow-x-auto">
                  {['#5A5A40', '#E53935', '#43A047', '#1E88E5', '#8E24AA', '#FB8C00', '#0097A7', '#0288D1'].map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setNewCatColor(clr)}
                      className={`w-5 h-5 rounded-full border border-black/20 ${newCatColor === clr ? 'ring-2 ring-offset-1 ring-stone-600' : ''}`}
                      style={{ backgroundColor: clr }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowQuickAddCat(false)}
                  className="flex-1 py-2 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickCategory}
                  className="flex-1 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-extrabold shadow-sm"
                >
                  Save & Select
                </button>
              </div>
            </div>
          )}

          {/* Full Grid Display of Categories */}
          <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {currentCategoryList.map((cat) => {
              const isOther = cat.is_permanent || cat.id === 'cat_other' || cat.id === 'cat_income_other' || cat.name.toLowerCase() === 'other';
              const isSelected = categoryId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-1 transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-light)] border-[var(--accent-primary)] font-extrabold text-[var(--accent-primary)] shadow-2xs'
                      : 'bg-[var(--bg-canvas)] border-[var(--border-color)] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setCategoryId(cat.id);
                      setShowCategoryPicker(false);
                      setShowQuickAddCat(false);
                    }}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  >
                    <span className="text-xl flex-shrink-0">{cat.icon}</span>
                    <div className="truncate">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold truncate">{cat.name}</span>
                        {cat.is_default && <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                      </div>
                      {isOther && <span className="text-[9px] font-extrabold text-amber-600 block">Permanent</span>}
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSelected && <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />}
                    {!isOther && onDeleteCategory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          haptics.heavy();
                          if (categoryId === cat.id) {
                            const fallback = currentCategoryList.find((c) => c.id !== cat.id);
                            if (fallback) setCategoryId(fallback.id);
                          }
                          onDeleteCategory(cat.id);
                        }}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* Account Picker Sheet */}
      <BottomSheet
        isOpen={showAccountPicker !== null}
        onClose={() => setShowAccountPicker(null)}
        title="Select Account"
      >
        <div className="space-y-2">
          {accounts
            .filter((a) => a.is_active)
            .map((acc) => {
              const isSelected =
                showAccountPicker === 'single'
                  ? accountId === acc.id
                  : showAccountPicker === 'from'
                  ? fromAccountId === acc.id
                  : toAccountId === acc.id;

              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    haptics.light();
                    if (showAccountPicker === 'single') setAccountId(acc.id);
                    if (showAccountPicker === 'from') setFromAccountId(acc.id);
                    if (showAccountPicker === 'to') setToAccountId(acc.id);
                    setShowAccountPicker(null);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-light)] border-[var(--accent-primary)] font-extrabold text-[var(--accent-primary)]'
                      : 'bg-[var(--bg-canvas)] border-[var(--border-color)] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{acc.icon}</span>
                    <div>
                      <div className="text-sm font-bold">{acc.name}</div>
                      <div className="text-xs text-[var(--text-secondary)] capitalize">{acc.type.replace('_', ' ')}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-[var(--accent-primary)]" />}
                </button>
              );
            })}
        </div>
      </BottomSheet>

      {/* Pro Limit Modal for Quick Add Category */}
      <ProLimitModal
        isOpen={showProCategoryModal}
        onClose={() => setShowProCategoryModal(false)}
        type="category"
        onActivatePro={() => {
          setShowProCategoryModal(false);
          setShowQuickAddCat(false);
          setToastMessage('Coming soon');
          setShowToast(true);
        }}
      />

      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
};
