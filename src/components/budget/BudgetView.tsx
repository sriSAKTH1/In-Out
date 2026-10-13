import React, { useState } from 'react';
import type { Budget, Category, Transaction, UserSettings } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { calculateBudgetStatuses } from '../../utils/calculations';
import { BottomSheet } from '../common/BottomSheet';
import { ProLimitModal } from '../common/ProLimitModal';
import { Toast } from '../common/Toast';
import { Plus, Target, AlertCircle, CheckCircle2, AlertTriangle, Trash2, Edit3 } from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { sortCategories } from '../../utils/formatters';

interface BudgetViewProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  settings: UserSettings;
  onSaveBudget: (budget: Partial<Budget>) => void;
  onDeleteBudget: (budgetId: string) => void;
  onUpdateSettings?: (settings: Partial<UserSettings>) => void;
  onOpenProSheet?: () => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  budgets,
  categories,
  transactions,
  settings,
  onSaveBudget,
  onDeleteBudget,
  onUpdateSettings,
  onOpenProSheet,
}) => {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showProBudgetLimitModal, setShowProBudgetLimitModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [budgetType, setBudgetType] = useState<'overall' | 'category'>('overall');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [alertPercentage, setAlertPercentage] = useState(80);
  const [errorMsg, setErrorMsg] = useState('');

  const budgetStatuses = calculateBudgetStatuses(budgets, transactions, categories);

  const overallBudget = budgetStatuses.find((b) => !b.budget.category_id);
  const categoryBudgets = budgetStatuses.filter((b) => b.budget.category_id);

  const openAddModal = (budgetToEdit?: Budget) => {
    haptics.light();
    if (budgetToEdit) {
      setEditingBudget(budgetToEdit);
      setBudgetType(budgetToEdit.category_id ? 'category' : 'overall');
      setName(budgetToEdit.name);
      setCategoryId(budgetToEdit.category_id || '');
      setAmount(budgetToEdit.amount.toString());
      setPeriod(budgetToEdit.period);
      setAlertPercentage(budgetToEdit.alert_percentage || 80);
    } else {
      if (budgets.length >= 10 && !settings.is_pro_user) {
        haptics.error();
        setShowProBudgetLimitModal(true);
        return;
      }
      setEditingBudget(null);
      setBudgetType('overall');
      setName('');
      setCategoryId(categories.filter((c) => c.type === 'expense')[0]?.id || '');
      setAmount('');
      setPeriod('monthly');
      setAlertPercentage(80);
    }
    setErrorMsg('');
    setShowAddSheet(true);
  };

  const handleSave = () => {
    if (!editingBudget && budgets.length >= 10 && !settings.is_pro_user) {
      haptics.error();
      setShowProBudgetLimitModal(true);
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid budget amount.');
      haptics.error();
      return;
    }

    if (budgetType === 'category' && !categoryId) {
      setErrorMsg('Please select a category for the category budget.');
      haptics.error();
      return;
    }

    const now = new Date();
    const startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endStr = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const selectedCat = categories.find((c) => c.id === categoryId);
    const budgetName = budgetType === 'overall' ? 'Monthly Overall Budget' : name || `${selectedCat?.name || 'Category'} Budget`;

    haptics.success();
    onSaveBudget({
      id: editingBudget ? editingBudget.id : undefined,
      name: budgetName,
      category_id: budgetType === 'category' ? categoryId : null,
      amount: parsedAmount,
      period,
      start_date: startStr,
      end_date: endStr,
      alert_percentage: alertPercentage,
    });

    setShowAddSheet(false);
  };

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Title & Add Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-primary)]">Budgets</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Control spending limits & alerts</p>
        </div>

        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Budget</span>
        </button>
      </div>

      {/* Overall Budget Card */}
      {overallBudget ? (
        <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-light)] text-[var(--accent-primary)] flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">{overallBudget.budget.name}</h3>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium">Monthly Overall Limit</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => openAddModal(overallBudget.budget)}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteBudget(overallBudget.budget.id)}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Amount Stats Grid */}
          <div className="grid grid-cols-3 gap-2 py-2">
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Budget Limit</span>
              <div className="text-sm font-extrabold text-[var(--text-primary)] mt-0.5">
                <CurrencyDisplay amount={overallBudget.budget.amount} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Spent</span>
              <div className="text-sm font-extrabold text-rose-600 mt-0.5">
                <CurrencyDisplay amount={overallBudget.spent} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Remaining</span>
              <div className="text-sm font-extrabold text-emerald-600 mt-0.5">
                <CurrencyDisplay amount={overallBudget.remaining} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} />
              </div>
            </div>
          </div>

          {/* Progress Bar & Alert Pill */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[var(--text-secondary)]">{overallBudget.percentage}% used</span>
              <div className="flex items-center gap-1">
                {overallBudget.status === 'exceeded' ? (
                  <span className="flex items-center gap-1 text-xs text-rose-600 font-extrabold bg-rose-500/10 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" /> Exceeded
                  </span>
                ) : overallBudget.status === 'warning' ? (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" /> Near Limit
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> On Track
                  </span>
                )}
              </div>
            </div>

            <div className="w-full h-3 rounded-full bg-[var(--bg-canvas)] overflow-hidden p-0.5 border border-[var(--border-color)]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallBudget.status === 'exceeded'
                    ? 'bg-rose-600'
                    : overallBudget.status === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-[var(--accent-primary)]'
                }`}
                style={{ width: `${Math.min(100, overallBudget.percentage)}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-2">
          <p className="text-sm font-bold text-[var(--text-primary)]">No Overall Budget Set</p>
          <p className="text-xs text-[var(--text-secondary)]">Create an overall monthly budget to track your complete spending limit.</p>
          <button
            onClick={() => openAddModal()}
            className="mt-2 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-bold"
          >
            + Set Overall Budget
          </button>
        </div>
      )}

      {/* Category Budgets List */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-[var(--text-primary)] px-1">Category Spending Limits</h4>

        {categoryBudgets.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
            <p className="text-xs font-medium text-[var(--text-secondary)]">No category budgets created yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryBudgets.map((b) => (
              <div key={b.budget.id} className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">
                      {categories.find((c) => c.id === b.budget.category_id)?.icon || '🏷️'}
                    </span>
                    <div>
                      <h5 className="text-sm font-bold text-[var(--text-primary)]">{b.categoryName}</h5>
                      <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                        <CurrencyDisplay amount={b.spent} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} /> /{' '}
                        <CurrencyDisplay amount={b.budget.amount} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} />
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        b.status === 'exceeded'
                          ? 'bg-rose-500/10 text-rose-600'
                          : b.status === 'warning'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-emerald-500/10 text-emerald-600'
                      }`}
                    >
                      {b.percentage}%
                    </span>
                    <button
                      onClick={() => openAddModal(b.budget)}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteBudget(b.budget.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-[var(--bg-canvas)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.status === 'exceeded' ? 'bg-rose-600' : b.status === 'warning' ? 'bg-amber-500' : 'bg-[var(--accent-primary)]'
                    }`}
                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-secondary)]">
                  <span>Remaining: <CurrencyDisplay amount={b.remaining} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} /></span>
                  <span>Alert at {b.budget.alert_percentage || 80}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Budget Bottom Sheet */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title={editingBudget ? 'Edit Budget' : 'New Budget'}
      >
        <div className="space-y-4">
          {/* Budget Type */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Budget Target</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
              <button
                onClick={() => {
                  haptics.light();
                  setBudgetType('overall');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  budgetType === 'overall' ? 'bg-[var(--accent-primary)] text-white shadow-xs' : 'text-[var(--text-secondary)]'
                }`}
              >
                Overall Spending
              </button>
              <button
                onClick={() => {
                  haptics.light();
                  setBudgetType('category');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  budgetType === 'category' ? 'bg-[var(--accent-primary)] text-white shadow-xs' : 'text-[var(--text-secondary)]'
                }`}
              >
                Category Specific
              </button>
            </div>
          </div>

          {/* Category Dropdown (If category budget) */}
          {budgetType === 'category' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-primary)] focus:outline-none"
              >
                {sortCategories(categories.filter((c) => c.type === 'expense' && c.is_active)).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name} {c.is_default ? '⭐' : ''} {c.is_permanent || c.name.toLowerCase() === 'other' ? '(Other)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Budget Name (If category budget) */}
          {budgetType === 'category' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Budget Name</label>
              <input
                type="text"
                placeholder="e.g. Monthly Dining Out"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-primary)] focus:outline-none"
              />
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Budget Amount ({settings.currency_symbol})</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-base font-extrabold text-[var(--text-primary)] focus:outline-none"
            />
          </div>

          {/* Period Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-primary)] focus:outline-none"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Alert Threshold Slider */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
              <span>Alert Warning Threshold</span>
              <span className="text-[var(--accent-primary)] font-extrabold">{alertPercentage}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={alertPercentage}
              onChange={(e) => setAlertPercentage(parseInt(e.target.value))}
              className="w-full accent-[var(--accent-primary)]"
            />
            <p className="text-[10px] text-[var(--text-muted)]">
              Triggers warning badge when spending reaches {alertPercentage}% of total limit.
            </p>
          </div>

          {errorMsg && <p className="text-xs font-bold text-rose-500 text-center">{errorMsg}</p>}

          {/* Save Action */}
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold text-base shadow-lg transition-all"
          >
            {editingBudget ? 'Update Budget' : 'Save Budget'}
          </button>
        </div>
      </BottomSheet>

      {/* PRO LIMIT MODAL FOR BUDGETS */}
      <ProLimitModal
        isOpen={showProBudgetLimitModal}
        onClose={() => setShowProBudgetLimitModal(false)}
        type="budget"
        onOpenProSheet={onOpenProSheet}
        onActivatePro={() => {
          setShowProBudgetLimitModal(false);
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
