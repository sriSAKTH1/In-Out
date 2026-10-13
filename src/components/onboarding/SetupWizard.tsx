import React, { useState } from 'react';
import type { Account, UserSettings, UserProfile, Category } from '../../types';
import { PRESET_CATEGORIES } from '../../data/defaultData';
import { Landmark, ArrowRight, Check, Tag, CheckSquare, Square } from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { AppLogo } from '../common/AppLogo';

interface SetupWizardProps {
  userProfile?: UserProfile | null;
  onComplete: (settings: UserSettings, initialAccount?: Partial<Account>, selectedCategories?: Category[]) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Account Form State
  const [accName, setAccName] = useState('Cash');
  const [accType, setAccType] = useState<'bank' | 'cash' | 'wallet' | 'credit_card'>('cash');
  const [accBalance, setAccBalance] = useState('10000');
  const [accIcon, setAccIcon] = useState('💵');

  // Currency
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [currency, setCurrency] = useState('INR');

  // Filter out default categories from selectable preset list
  const DEFAULT_CAT_IDS = new Set([
    'cat_food', 'cat_transport', 'cat_shopping', 'cat_bills', 'cat_other',
    'cat_salary', 'cat_business', 'cat_freelance', 'cat_gift', 'cat_investment', 'cat_income_other'
  ]);
  const selectablePresetCategories = PRESET_CATEGORIES.filter((c) => !DEFAULT_CAT_IDS.has(c.id));

  // Category Choose Page State (Max 10 selection)
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [showMaxNotice, setShowMaxNotice] = useState<boolean>(false);

  const toggleCategory = (id: string) => {
    haptics.light();
    if (selectedCatIds.includes(id)) {
      setSelectedCatIds(selectedCatIds.filter((item) => item !== id));
    } else {
      if (selectedCatIds.length >= 10) {
        haptics.error();
        setShowMaxNotice(true);
        setTimeout(() => setShowMaxNotice(false), 3000);
        return;
      }
      setSelectedCatIds([...selectedCatIds, id]);
    }
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    haptics.medium();
    setStep(2);
  };

  const handleFinish = () => {
    haptics.success();

    const finalSettings: UserSettings = {
      currency,
      currency_symbol: currencySymbol,
      language: 'en',
      theme: 'light',
      passcode_enabled: false,
      biometric_enabled: false,
      auto_lock_minutes: 5,
      start_screen: 'overview',
      date_format: 'DD/MM/YYYY',
      notifications_enabled: true,
      is_setup_completed: true,
    };

    const firstAccount: Partial<Account> = {
      name: accName.trim() || 'Cash',
      type: accType,
      initial_balance: parseFloat(accBalance) || 0,
      currency,
      icon: accIcon,
      color: '#43A047',
      is_active: true,
    };

    const chosenCategories = PRESET_CATEGORIES.filter((c) => selectedCatIds.includes(c.id));

    onComplete(finalSettings, firstAccount, chosenCategories);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-canvas)] flex flex-col justify-between p-6 max-w-lg mx-auto overflow-y-auto animate-fade-in">
      {/* Branding Header */}
      <div className="pt-4 text-center space-y-1.5">
        <AppLogo size="lg" className="mx-auto" />
        <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
          Welcome to In & Out!
        </h1>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-light)] text-[var(--accent-primary)] text-xs font-extrabold">
          <span>{step === 1 ? 'Step 1 of 2: Create Account & Amount' : 'Step 2 of 2: Category Selection (Max 10)'}</span>
        </div>
      </div>

      {step === 1 ? (
        /* STEP 1: Main Account Setup Form Box */
        <form onSubmit={handleStep1Next} className="my-auto py-4 space-y-5">
          <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent-light)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Add Your Initial Account</h3>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                  Default account is Cash
                </p>
              </div>
            </div>

            {/* Account Name */}
            <div className="space-y-1 pt-2">
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                Account Name / Title
              </label>
              <input
                type="text"
                required
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                placeholder="e.g. Cash or Cash Wallet"
                className="w-full p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {/* Custom Account Icon Picker */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Customize Account Icon</label>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {['💵', '🏦', '💳', '👛', '💰', '🐷', '📊', '📈', '🏛️', '💎', '📱', '🏠', '🚗', '💼', '🪙'].map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setAccIcon(ic);
                    }}
                    className={`w-10 h-10 rounded-2xl text-xl flex items-center justify-center border transition-all ${
                      accIcon === ic
                        ? 'bg-[var(--accent-light)] border-[var(--accent-primary)] scale-110 shadow-xs'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-color)]'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Type Grid */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', label: 'Cash Wallet', icon: '💵' },
                  { id: 'bank', label: 'Bank Account', icon: '🏦' },
                  { id: 'wallet', label: 'Digital Wallet', icon: '👛' },
                  { id: 'credit_card', label: 'Credit Card', icon: '💳' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setAccType(t.id as any);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                      accType === t.id
                        ? 'bg-[var(--accent-light)] border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-xs'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-color)] text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{t.icon}</span>
                      <span>{t.label}</span>
                    </div>
                    {accType === t.id && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Amount / Balance */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  Initial Starting Amount
                </label>
                <div className="flex items-center gap-1 text-xs font-bold text-[var(--accent-primary)]">
                  {['₹', '$', '€', '£'].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => {
                        haptics.light();
                        setCurrencySymbol(sym);
                        setCurrency(sym === '₹' ? 'INR' : sym === '$' ? 'USD' : sym === '€' ? 'EUR' : 'GBP');
                      }}
                      className={`px-2 py-0.5 rounded-lg border text-xs ${
                        currencySymbol === sym
                          ? 'bg-[var(--accent-primary)] text-white border-transparent'
                          : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-xl font-black text-[var(--text-muted)]">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  value={accBalance}
                  onChange={(e) => setAccBalance(e.target.value)}
                  placeholder="10000"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xl font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-extrabold text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>Continue to Category Selection</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      ) : (
        /* STEP 2: Category Choose Page (Selectable Grid) */
        <div className="my-auto py-2 space-y-4">
          <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[var(--accent-light)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Select Additional Categories</h3>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                    Choose up to 10 additional categories (4 defaults included)
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                selectedCatIds.length >= 10
                  ? 'bg-amber-500/20 text-amber-600'
                  : 'bg-[var(--accent-light)] text-[var(--accent-primary)]'
              }`}>
                {selectedCatIds.length} / 10 Selected
              </span>
            </div>

            {showMaxNotice && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-bold animate-fade-in text-center">
                ⚠️ Maximum 10 additional categories allowed (4 default + 10 custom = 14 total).
              </div>
            )}

            {/* Default categories notice & controls */}
            <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">Available ({selectablePresetCategories.length} categories)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setSelectedCatIds(selectablePresetCategories.slice(0, 10).map((c) => c.id));
                  }}
                  className="text-[var(--accent-primary)] hover:underline"
                >
                  Select 10
                </button>
                <span className="text-[var(--border-color)]">•</span>
                <button
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setSelectedCatIds([]);
                  }}
                  className="text-[var(--text-secondary)] hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Categories Selectable Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {selectablePresetCategories.map((cat) => {
                const isSelected = selectedCatIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all ${
                      isSelected
                        ? 'bg-[var(--accent-light)] border-[var(--accent-primary)] shadow-2xs'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-color)] opacity-65'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-lg flex-shrink-0">{cat.icon}</span>
                      <div className="truncate">
                        <span className="text-xs font-bold text-[var(--text-primary)] block truncate">{cat.name}</span>
                        <span className="text-[9px] font-semibold text-[var(--text-muted)] capitalize">{cat.type}</span>
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                haptics.light();
                setStep(1);
              }}
              className="py-4 px-5 rounded-2xl border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs hover:bg-[var(--bg-card)] transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="flex-1 py-4 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>Confirm & Go to Main App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="text-center pb-2 text-[10px] font-semibold text-[var(--text-muted)]">
        Setup Wizard • Customizable Account & Categories • Stored On-Device
      </div>
    </div>
  );
};
