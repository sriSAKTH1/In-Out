import React, { useState } from 'react';
import type { Account, Category, Transaction, UserSettings } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { calculateTotalBalance, calculateAccountBalances, calculatePeriodSummary, calculateDailyCashFlow } from '../../utils/calculations';
import { getRelativeDateLabel, formatTime } from '../../utils/formatters';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { haptics } from '../../utils/haptics';

interface OverviewViewProps {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  settings: UserSettings;
  onToggleHideBalance: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onQuickAdd: (type: 'income' | 'expense' | 'transfer') => void;
  onOpenSearch: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  accounts,
  categories,
  transactions,
  settings,
  onToggleHideBalance,
  onSelectTransaction,
  onQuickAdd,
  onOpenSearch,
}) => {
  // Sub-Navigation Tab: Daily | Weekly | Calendar | Monthly | Total | Note
  const [overviewTab, setOverviewTab] = useState<'daily' | 'weekly' | 'calendar' | 'monthly' | 'total' | 'note'>('calendar');

  // Daily Mode Date State
  const [dailyDate, setDailyDate] = useState<Date>(new Date());

  // Weekly Mode Date State
  const [weekDate, setWeekDate] = useState<Date>(new Date());

  // Calendar State
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(new Date().toISOString().split('T')[0]);

  // Chart & Note Search State
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [noteQuery, setNoteQuery] = useState<string>('');

  const balanceMap = calculateAccountBalances(accounts, transactions);
  const totalBalance = calculateTotalBalance(accounts, balanceMap);

  // Current month summary
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodSummary = calculatePeriodSummary(transactions, monthStart);

  // Cash flow chart points
  const daysCount = chartPeriod === 'week' ? 7 : chartPeriod === 'month' ? 30 : 90;
  const chartData = calculateDailyCashFlow(transactions, daysCount);

  // Category & Account lookups
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  // Calendar Helpers
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  const monthName = calendarMonth.toLocaleString('default', { month: 'long' });

  // Get total days in month
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create date-to-transactions map
  const txByDateMap = new Map<string, Transaction[]>();
  transactions.forEach((tx) => {
    const dStr = tx.date.split('T')[0];
    if (!txByDateMap.has(dStr)) txByDateMap.set(dStr, []);
    txByDateMap.get(dStr)!.push(tx);
  });

  const handlePrevMonth = () => {
    haptics.light();
    setCalendarMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    haptics.light();
    setCalendarMonth(new Date(year, month + 1, 1));
  };

  // Daily Date Helpers
  const handlePrevDailyDate = () => {
    haptics.light();
    const d = new Date(dailyDate);
    d.setDate(d.getDate() - 1);
    setDailyDate(d);
  };

  const handleNextDailyDate = () => {
    haptics.light();
    const d = new Date(dailyDate);
    d.setDate(d.getDate() + 1);
    setDailyDate(d);
  };

  const formatDailyDateText = (d: Date) => {
    const monthStr = d.toLocaleString('default', { month: 'short' });
    const dayStr = d.getDate();
    const yearStr = d.getFullYear();
    return `${monthStr} ${dayStr}, ${yearStr}`;
  };

  // Weekly Date Helpers
  const getWeekRange = (d: Date) => {
    const start = new Date(d);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const handlePrevWeekDate = () => {
    haptics.light();
    const d = new Date(weekDate);
    d.setDate(d.getDate() - 7);
    setWeekDate(d);
  };

  const handleNextWeekDate = () => {
    haptics.light();
    const d = new Date(weekDate);
    d.setDate(d.getDate() + 7);
    setWeekDate(d);
  };

  const formatWeekRangeText = (d: Date) => {
    const { start, end } = getWeekRange(d);
    const startMonth = start.toLocaleString('default', { month: 'short' });
    const endMonth = end.toLocaleString('default', { month: 'short' });
    const yearStr = end.getFullYear();
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${yearStr}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${yearStr}`;
  };

  // Filtered transactions depending on active overviewTab
  let displayedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (overviewTab === 'calendar' && selectedDateStr) {
    displayedTransactions = displayedTransactions.filter((t) => t.date.split('T')[0] === selectedDateStr);
  } else if (overviewTab === 'daily') {
    const dailyStr = dailyDate.toISOString().split('T')[0];
    displayedTransactions = displayedTransactions.filter((t) => t.date.split('T')[0] === dailyStr);
  } else if (overviewTab === 'weekly') {
    const { start: wStart, end: wEnd } = getWeekRange(weekDate);
    displayedTransactions = displayedTransactions.filter((t) => {
      const tTime = new Date(t.date).getTime();
      return tTime >= wStart.getTime() && tTime <= wEnd.getTime();
    });
  } else if (overviewTab === 'note') {
    displayedTransactions = displayedTransactions.filter(
      (t) => t.note && t.note.toLowerCase().includes(noteQuery.toLowerCase())
    );
  }

  // Group displayed transactions by date label
  const groupedTransactions: { [label: string]: Transaction[] } = {};
  displayedTransactions.forEach((tx) => {
    const label = getRelativeDateLabel(tx.date);
    if (!groupedTransactions[label]) groupedTransactions[label] = [];
    groupedTransactions[label].push(tx);
  });

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Total Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] p-6 shadow-lg">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
          <span>Total Balance</span>
          <button
            onClick={() => {
              haptics.light();
              onToggleHideBalance();
            }}
            className="p-1.5 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors text-[var(--text-secondary)]"
          >
            {settings.hide_balance ? <EyeOff className="w-4 h-4 text-[var(--accent-primary)]" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-3">
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--accent-primary)]">
            <CurrencyDisplay
              amount={totalBalance}
              symbol={settings.currency_symbol}
              hideBalance={settings.hide_balance}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">Across all active accounts</p>
        </div>

        {/* Action Pills */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-[var(--border-color)]">
          <button
            onClick={() => onQuickAdd('income')}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-black shadow-2xs"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            <span>Income</span>
          </button>
          <button
            onClick={() => onQuickAdd('expense')}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors text-xs font-black shadow-2xs"
          >
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
            <span>Expense</span>
          </button>
          <button
            onClick={() => onQuickAdd('transfer')}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors text-xs font-black shadow-2xs"
          >
            <ArrowRightLeft className="w-4 h-4 text-sky-500" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* SUB-NAVIGATION PILL BAR (Daily | Weekly | Calendar | Monthly | Total | Note) */}
      <div className="p-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex items-center justify-around text-xs font-bold overflow-x-auto">
        {(['daily', 'weekly', 'calendar', 'monthly', 'total', 'note'] as const).map((tab) => {
          const isActive = overviewTab === tab;
          const labelMap = {
            daily: 'Daily',
            weekly: 'Weekly',
            calendar: 'Calendar',
            monthly: 'Monthly',
            total: 'Total',
            note: 'Note',
          };
          return (
            <button
              key={tab}
              onClick={() => {
                haptics.light();
                setOverviewTab(tab);
              }}
              className={`px-3 py-1.5 rounded-full transition-all duration-200 capitalize whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--accent-primary)] text-white font-black shadow-md border border-[var(--accent-primary)]/30'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {labelMap[tab]}
            </button>
          );
        })}
      </div>

      {/* 1. CALENDAR VIEW MODE */}
      {overviewTab === 'calendar' && (
        <div className="p-5 rounded-3xl bg-[var(--bg-card)] text-[var(--text-primary)] shadow-lg space-y-4 border border-[var(--border-color)] animate-fade-in">
          {/* Month & Year Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black italic text-[var(--accent-primary)] font-serif tracking-wide">
              {monthName} {year}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-full bg-[var(--bg-canvas)] hover:bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-primary)] transition-colors border border-[var(--border-color)] shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-full bg-[var(--bg-canvas)] hover:bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-primary)] transition-colors border border-[var(--border-color)] shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 text-center text-[10px] font-extrabold text-[var(--text-muted)] tracking-wider">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <span key={day} className="py-1">{day}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
            {/* Empty slots for start of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDateStr === dateStr;
              const dayTxs = txByDateMap.get(dateStr) || [];
              const hasIncome = dayTxs.some((t) => t.type === 'income');
              const hasExpense = dayTxs.some((t) => t.type === 'expense');
              const hasTransfer = dayTxs.some((t) => t.type === 'transfer');

              return (
                <button
                  key={dayNum}
                  onClick={() => {
                    haptics.light();
                    setSelectedDateStr(isSelected ? null : dateStr);
                  }}
                  className={`h-11 rounded-2xl flex flex-col items-center justify-center relative transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-light)] text-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)] font-black shadow-md scale-105'
                      : 'hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-bold'
                  }`}
                >
                  <span className="text-xs">{dayNum}</span>
                  {(hasIncome || hasExpense || hasTransfer) && (
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      {hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-2xs" title="Income" />}
                      {hasExpense && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-2xs" title="Expense" />}
                      {hasTransfer && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-2xs" title="Transfer" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDateStr && (
            <div className="pt-3 text-center text-xs font-bold text-[var(--accent-primary)] border-t border-[var(--border-color)] flex items-center justify-between">
              <span>Selected Date: {selectedDateStr}</span>
              <button
                onClick={() => setSelectedDateStr(null)}
                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] underline font-medium"
              >
                Clear Date Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. DAILY VIEW MODE (Matching Referral Image) */}
      {overviewTab === 'daily' && (
        <div className="space-y-4 animate-fade-in">
          {/* Daily Date Navigator Capsule (Top Box in Referral Image) */}
          <div className="p-3.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between shadow-md">
            <button
              onClick={handlePrevDailyDate}
              className="w-8 h-8 rounded-full bg-[var(--bg-canvas)] hover:bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-color)] transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-lg font-black italic font-serif text-[var(--accent-primary)] tracking-wide">
              {formatDailyDateText(dailyDate)}
            </span>

            <button
              onClick={handleNextDailyDate}
              className="w-8 h-8 rounded-full bg-[var(--bg-canvas)] hover:bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-color)] transition-colors shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Daily Ledger Container (Bottom Card in Referral Image) */}
          <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black italic font-serif text-[var(--accent-primary)]">
                Daily Ledger ({displayedTransactions.length})
              </h3>
              <button
                onClick={() => {
                  haptics.light();
                  onQuickAdd('expense');
                }}
                className="px-3.5 py-1.5 rounded-full bg-emerald-600/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/25 font-extrabold text-xs flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>LOG NEW</span>
              </button>
            </div>

            {/* Daily Summary Row */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] block text-[11px] font-bold">Income</span>
                <span className="text-base font-black text-emerald-600">
                  <CurrencyDisplay
                    amount={displayedTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)}
                    symbol={settings.currency_symbol}
                    hideBalance={settings.hide_balance}
                  />
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] block text-[11px] font-bold">Expense</span>
                <span className="text-base font-black text-rose-600">
                  <CurrencyDisplay
                    amount={displayedTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)}
                    symbol={settings.currency_symbol}
                    hideBalance={settings.hide_balance}
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2B. WEEKLY VIEW MODE */}
      {overviewTab === 'weekly' && (
        <div className="space-y-4 animate-fade-in">
          {/* Weekly Date Navigator Capsule */}
          <div className="p-3.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between shadow-md">
            <button
              onClick={handlePrevWeekDate}
              className="w-8 h-8 rounded-full bg-[var(--bg-canvas)] hover:bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-color)] transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm sm:text-base font-black italic font-serif text-[var(--accent-primary)] tracking-wide">
              {formatWeekRangeText(weekDate)}
            </span>

            <button
              onClick={handleNextWeekDate}
              className="w-8 h-8 rounded-full bg-[var(--bg-canvas)] hover:bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-color)] transition-colors shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekly Summary Container */}
          <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black italic font-serif text-[var(--accent-primary)]">
                Weekly Ledger ({displayedTransactions.length})
              </h3>
              <button
                onClick={() => {
                  haptics.light();
                  onQuickAdd('expense');
                }}
                className="px-3.5 py-1.5 rounded-full bg-emerald-600/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/25 font-extrabold text-xs flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>LOG NEW</span>
              </button>
            </div>

            {/* Weekly Summary Row */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] block text-[11px] font-bold">Weekly Income</span>
                <span className="text-base font-black text-emerald-600">
                  <CurrencyDisplay
                    amount={displayedTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)}
                    symbol={settings.currency_symbol}
                    hideBalance={settings.hide_balance}
                  />
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] block text-[11px] font-bold">Weekly Expense</span>
                <span className="text-base font-black text-rose-600">
                  <CurrencyDisplay
                    amount={displayedTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)}
                    symbol={settings.currency_symbol}
                    hideBalance={settings.hide_balance}
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MONTHLY VIEW CARDS */}
      {overviewTab === 'monthly' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Income</span>
              </div>
              <div className="text-lg font-extrabold text-[var(--income-color)]">
                <CurrencyDisplay
                  amount={periodSummary.income}
                  symbol={settings.currency_symbol}
                  hideBalance={settings.hide_balance}
                  prefixSign
                />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">This month</p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Expense</span>
              </div>
              <div className="text-lg font-extrabold text-[var(--expense-color)]">
                <CurrencyDisplay
                  amount={-periodSummary.expense}
                  symbol={settings.currency_symbol}
                  hideBalance={settings.hide_balance}
                />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">This month</p>
            </div>
          </div>

          {/* Cash Flow Chart */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Cash Flow Trend</h4>
              <div className="flex items-center gap-1 bg-[var(--bg-canvas)] p-1 rounded-xl border border-[var(--border-color)]">
                {(['week', 'month', 'quarter'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      haptics.light();
                      setChartPeriod(p);
                    }}
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg capitalize transition-colors ${
                      chartPeriod === p
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {p === 'week' ? '7D' : p === 'month' ? '30D' : '90D'}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C62828" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C62828" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dayLabel" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#2E7D32" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" name="Income" />
                  <Area type="monotone" dataKey="expense" stroke="#C62828" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" name="Expense" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 4. TOTAL CUMULATIVE VIEW */}
      {overviewTab === 'total' && (
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-3 animate-fade-in">
          <h4 className="text-sm font-bold text-[var(--text-primary)]">All-Time Totals</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
              <span className="text-[var(--text-secondary)] block">Total Income</span>
              <span className="text-base font-extrabold text-emerald-600">
                {settings.currency_symbol}
                {transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
              <span className="text-[var(--text-secondary)] block">Total Expense</span>
              <span className="text-base font-extrabold text-rose-600">
                {settings.currency_symbol}
                {transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. NOTE SEARCH & LIST VIEW */}
      {overviewTab === 'note' && (
        <div className="space-y-3 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search transaction notes..."
              value={noteQuery}
              onChange={(e) => setNoteQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Recent / Filtered Transactions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-bold text-[var(--text-primary)]">
            {overviewTab === 'calendar' && selectedDateStr
              ? `Activity on ${selectedDateStr}`
              : overviewTab === 'note'
              ? 'Notes & Memos'
              : 'Recent Activity'}
          </h4>
          <button
            onClick={() => {
              haptics.light();
              onOpenSearch();
            }}
            className="text-xs font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {displayedTransactions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
            <p className="text-sm font-medium text-[var(--text-secondary)]">No transactions found</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Tap + to add your first income or expense.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedTransactions).map((dateGroup) => (
              <div key={dateGroup} className="space-y-2">
                <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
                  {dateGroup}
                </div>

                <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] shadow-xs overflow-hidden">
                  {groupedTransactions[dateGroup].map((tx) => {
                    const cat = tx.category_id ? catMap.get(tx.category_id) : null;
                    const acc = tx.account_id ? accMap.get(tx.account_id) : null;
                    const fromAcc = tx.from_account_id ? accMap.get(tx.from_account_id) : null;
                    const toAcc = tx.to_account_id ? accMap.get(tx.to_account_id) : null;

                    return (
                      <div
                        key={tx.id}
                        onClick={() => {
                          haptics.light();
                          onSelectTransaction(tx);
                        }}
                        className="p-3.5 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-2xs"
                            style={{ backgroundColor: `${cat?.color || '#5A5A40'}20` }}
                          >
                            {tx.type === 'transfer' ? '⇄' : cat?.icon || '🏷️'}
                          </div>

                          <div>
                            <div className="text-sm font-bold text-[var(--text-primary)]">
                              {tx.type === 'transfer'
                                ? `Transfer: ${fromAcc?.name || 'Account'} → ${toAcc?.name || 'Account'}`
                                : cat?.name || tx.note || 'Uncategorized'}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-0.5">
                              {acc && <span>{acc.name}</span>}
                              {tx.note && <span className="truncate max-w-[130px]">• {tx.note}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`text-sm font-extrabold ${
                              tx.type === 'income'
                                ? 'text-[var(--income-color)]'
                                : tx.type === 'expense'
                                ? 'text-[var(--expense-color)]'
                                : 'text-[var(--transfer-color)]'
                            }`}
                          >
                            <CurrencyDisplay
                              amount={tx.type === 'expense' ? -tx.amount : tx.amount}
                              symbol={settings.currency_symbol}
                              hideBalance={settings.hide_balance}
                              prefixSign={tx.type === 'income'}
                            />
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {formatTime(tx.date)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
