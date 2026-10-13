import React, { useState } from 'react';
import type { Category, Transaction, UserSettings } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { calculatePeriodSummary, calculateCategoryBreakdown, calculateDailyCashFlow } from '../../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { haptics } from '../../utils/haptics';

interface StatsViewProps {
  categories: Category[];
  transactions: Transaction[];
  settings: UserSettings;
}

export const StatsView: React.FC<StatsViewProps> = ({ categories, transactions, settings }) => {
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'three_months' | 'year' | 'all'>('this_month');
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  const getPeriodDates = () => {
    const now = new Date();
    if (period === 'this_month') {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        label: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
      };
    }
    if (period === 'last_month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        start: lm,
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        label: `${lm.toLocaleString('default', { month: 'long' })} ${lm.getFullYear()}`,
      };
    }
    if (period === 'three_months') {
      const tm = new Date();
      tm.setMonth(tm.getMonth() - 3);
      return { start: tm, end: now, label: 'Last 3 Months' };
    }
    if (period === 'year') {
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
        label: `Year ${now.getFullYear()}`,
      };
    }
    return { start: undefined, end: undefined, label: 'All Time' };
  };

  const { start, end, label } = getPeriodDates();

  const summary = calculatePeriodSummary(transactions, start, end);
  const expenseBreakdown = calculateCategoryBreakdown(transactions, categories, 'expense', start, end);
  const incomeBreakdown = calculateCategoryBreakdown(transactions, categories, 'income', start, end);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const breakdownData = activeTab === 'expense' ? expenseBreakdown : incomeBreakdown;
  const trendData = calculateDailyCashFlow(transactions, period === 'this_month' ? 30 : period === 'three_months' ? 90 : 14);

  const COLORS = ['#5A5A40', '#D84315', '#F57F17', '#C2185B', '#455A64', '#7B1FA2', '#00838F', '#2E7D32'];

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Header & Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-primary)]">Statistics</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{label}</p>
        </div>

        <select
          value={period}
          onChange={(e) => {
            haptics.light();
            setPeriod(e.target.value as any);
          }}
          className="py-2 px-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] focus:outline-none shadow-2xs"
        >
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="three_months">3 Months</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Income</span>
          <div className="text-sm sm:text-base font-extrabold text-[var(--income-color)] mt-1">
            <CurrencyDisplay amount={summary.income} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Expense</span>
          <div className="text-sm sm:text-base font-extrabold text-[var(--expense-color)] mt-1">
            <CurrencyDisplay amount={summary.expense} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Net</span>
          <div className={`text-sm sm:text-base font-extrabold mt-1 ${summary.net >= 0 ? 'text-[var(--income-color)]' : 'text-[var(--expense-color)]'}`}>
            <CurrencyDisplay amount={summary.net} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} prefixSign />
          </div>
        </div>
      </div>

      {/* Category Breakdown Section (Seamless canvas background, no white box) */}
      <div className="py-2 space-y-4">
        {/* Expense vs Income Toggle */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 px-1">
          <h4 className="text-sm font-bold text-[var(--text-primary)]">Category Breakdown</h4>
          <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => {
                haptics.light();
                setActiveTab('expense');
                setActiveIndex(null);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Expense
            </button>
            <button
              onClick={() => {
                haptics.light();
                setActiveTab('income');
                setActiveIndex(null);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {breakdownData.length === 0 ? (
          <div className="py-8 text-center text-xs font-medium text-[var(--text-secondary)]">
            No {activeTab} transactions found for this period.
          </div>
        ) : (
          <>
            {/* Pie Chart with Hover / Click Pop-Out Expansion & Callouts */}
            <div className="h-64 sm:h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 25, right: 35, bottom: 25, left: 35 }}>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={65}
                    paddingAngle={1.5}
                    dataKey="amount"
                    nameKey="categoryName"
                    labelLine={false}
                    onMouseEnter={(_, idx) => {
                      haptics.light();
                      setActiveIndex(idx);
                    }}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={(_, idx) => {
                      haptics.light();
                      setActiveIndex(activeIndex === idx ? null : idx);
                    }}
                    label={(props) => {
                      const RADIAN = Math.PI / 180;
                      const { cx, cy, midAngle = 0, outerRadius, fill, payload, percent = 0, index } = props;
                      const isActive = activeIndex === index;
                      const rRadius = isActive ? outerRadius + 8 : outerRadius;

                      const sin = Math.sin(-RADIAN * midAngle);
                      const cos = Math.cos(-RADIAN * midAngle);

                      const sx = cx + (rRadius + 3) * cos;
                      const sy = cy + (rRadius + 3) * sin;
                      const mx = cx + (rRadius + 18) * cos;
                      const my = cy + (rRadius + 18) * sin;
                      const isRight = cos >= 0;
                      const ex = mx + (isRight ? 14 : -14);
                      const ey = my;

                      const textAnchor = isRight ? 'start' : 'end';
                      const percentageStr = `${(percent * 100).toFixed(1)} %`;

                      return (
                        <g key={`label-${payload.categoryId}`}>
                          <path
                            d={`M${sx},${sy} Q${mx},${my} ${ex},${ey}`}
                            stroke={fill}
                            fill="none"
                            strokeWidth={isActive ? 2.5 : 1.5}
                            opacity={isActive ? 1 : 0.85}
                          />
                          <circle cx={sx} cy={sy} r={isActive ? 3.5 : 2} fill={fill} />
                          <text
                            x={ex + (isRight ? 6 : -6)}
                            y={ey - 6}
                            fill="var(--text-primary)"
                            textAnchor={textAnchor}
                            dominantBaseline="central"
                            style={{
                              fontSize: isActive ? '12px' : '11px',
                              fontWeight: isActive ? '900' : 'bold',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {`${payload.icon || '🏷️'} ${payload.categoryName}`}
                          </text>
                          <text
                            x={ex + (isRight ? 6 : -6)}
                            y={ey + 7}
                            fill={isActive ? fill : 'var(--text-secondary)'}
                            textAnchor={textAnchor}
                            dominantBaseline="central"
                            style={{
                              fontSize: isActive ? '11px' : '10px',
                              fontWeight: isActive ? 'bold' : '500',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {percentageStr}
                          </text>
                        </g>
                      );
                    }}
                  >
                    {breakdownData.map((entry, index) => {
                      const isActive = activeIndex === index;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || COLORS[index % COLORS.length]}
                          stroke={isActive ? '#ffffff' : 'none'}
                          strokeWidth={isActive ? 2 : 0}
                          style={{
                            transform: isActive ? 'scale(1.08)' : 'scale(1)',
                            transformOrigin: 'center center',
                            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            cursor: 'pointer',
                            filter: isActive ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))' : 'none',
                          }}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdown List */}
            <div className="space-y-3 pt-2">
              {breakdownData.map((item, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <div
                    key={item.categoryId}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
                    className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm scale-[1.01]'
                        : 'hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-[var(--text-primary)]">
                          <CurrencyDisplay amount={item.amount} symbol={settings.currency_symbol} hideBalance={settings.hide_balance} />
                        </span>
                        <span className="text-xs font-bold text-[var(--text-secondary)] w-10 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)]/40 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color || '#5A5A40',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Income vs Expense Bar Comparison */}
      <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-[var(--text-primary)]">Daily Cash Flow Comparison</h4>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
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
              <Bar dataKey="income" fill="#2E7D32" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#C62828" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
