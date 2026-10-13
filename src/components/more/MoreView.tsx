import React, { useState } from 'react';
import type { Category, ThemeType, UserSettings, FeedbackSubmission, UserProfile } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ProLimitModal } from '../common/ProLimitModal';
import { Toast } from '../common/Toast';
import { AppLogo } from '../common/AppLogo';
import { storage } from '../../data/storage';
import { feedbackService } from '../../services/feedbackService';
import {
  Tag,
  Download,
  Upload,
  FileSpreadsheet,
  Lock,
  Fingerprint,
  Palette,
  Type,
  Paintbrush,
  Bell,
  MessageSquare,
  HelpCircle,
  Info,
  Star,
  RotateCcw,
  Trash2,
  ChevronRight,
  Check,
  Plus,
  Crown,
  LogOut,
  Edit2,
  ShieldCheck,
  Eye,
  Mail,
  Sparkles,
  Grid,
  UserPlus,
  KeyRound,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { sortCategories } from '../../utils/formatters';

interface MoreViewProps {
  categories: Category[];
  settings: UserSettings;
  userProfile?: UserProfile | null;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onUpdateCategories: (categories: Category[]) => void;
  onResetData: (type: 'seed' | 'clean' | 'delete_all') => void;
  onSignOut: () => void;
  onUpdateProfile: (name: string) => void;
  onOpenAuth?: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  categories,
  settings,
  userProfile,
  onUpdateSettings,
  onUpdateCategories,
  onResetData,
  onSignOut,
  onUpdateProfile,
  onOpenAuth,
}) => {
  // Modal states
  const [activeSheet, setActiveSheet] = useState<
    'categories' | 'backup' | 'security' | 'theme' | 'font' | 'accent_color' | 'feedback' | 'view_feedbacks' | 'faq' | 'about' | 'pro' | 'edit_profile' | null
  >(null);

  // Profile Edit State
  const [editNameInput, setEditNameInput] = useState(userProfile?.name || '');

  // Category management state
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showProCategoryLimitModal, setShowProCategoryLimitModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🛍️');
  const [catColor, setCatColor] = useState('#5A5A40');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');



  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'feature' | 'other'>('feature');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'bug' | 'feature' | 'other'>('all');
  const [feedbacksList, setFeedbacksList] = useState<FeedbackSubmission[]>(storage.getFeedbacks());

  // FAQ expanded state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Confirmation dialogs
  const [confirmResetType, setConfirmResetType] = useState<'seed' | 'clean' | 'delete_all' | null>(null);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const themes: { id: ThemeType; label: string; bg: string; text: string }[] = [
    { id: 'light', label: 'Warm Light', bg: '#F9F7F2', text: '#2D2926' },
    { id: 'dark', label: 'Dark Mode', bg: '#1A1A1A', text: '#EAEAEA' },
    { id: 'midnight', label: 'Midnight Navy', bg: '#0B0F19', text: '#F0F4FC' },
    { id: 'forest', label: 'Deep Forest', bg: '#131C16', text: '#E8F0E9' },
    { id: 'clay', label: 'Terracotta Clay', bg: '#F4EBE2', text: '#3D2E24' },
  ];

  const handleSelectTheme = (t: ThemeType) => {
    haptics.medium();
    document.documentElement.setAttribute('data-theme', t);
    onUpdateSettings({ ...settings, theme: t });
  };

  const handleSaveCategory = () => {
    if (!catName.trim()) return;
    if (editingCategory) {
      haptics.success();
      const updated = categories.map((c) =>
        c.id === editingCategory.id
          ? { ...c, name: catName.trim(), icon: catIcon, color: catColor }
          : c
      );
      onUpdateCategories(updated);
      setCatName('');
      setEditingCategory(null);
      setShowCategoryForm(false);
      return;
    }

    const currentActiveCats = categories.filter((c) => c.type === categoryType && c.is_active);
    if (currentActiveCats.length >= 14 && !settings.is_pro_user) {
      haptics.error();
      setShowProCategoryLimitModal(true);
      return;
    }
    haptics.success();
    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: catName.trim(),
      type: categoryType,
      icon: catIcon,
      color: catColor,
      is_default: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onUpdateCategories([...categories, newCategory]);
    setCatName('');
    setShowCategoryForm(false);
  };

  const handleStartEditCategory = (c: Category) => {
    haptics.light();
    setEditingCategory(c);
    setCatName(c.name);
    setCatIcon(c.icon);
    setCatColor(c.color);
    setShowCategoryForm(true);
  };

  const handleInitiateDeleteCategory = (c: Category) => {
    haptics.heavy();
    onUpdateCategories(categories.filter((cat) => cat.id !== c.id));
  };

  const handleExportJSON = () => {
    haptics.light();
    const jsonStr = storage.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InAndOut_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = storage.importBackupJSON(content);
      if (res.success) {
        haptics.success();
        alert('Data restored successfully!');
        window.location.reload();
      } else {
        haptics.error();
        alert(`Failed to restore: ${res.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    haptics.light();
    const csvStr = storage.exportTransactionsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InAndOut_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const handleSendFeedback = async () => {
    if (!feedbackMsg.trim()) return;
    haptics.success();
    await feedbackService.submitFeedback({
      rating: feedbackRating,
      category: feedbackCategory,
      message: feedbackMsg.trim(),
      user_name: userProfile?.name || 'Anonymous User',
      user_email: userProfile?.email || 'user@local',
    });
    setFeedbackSent(true);
    // Refresh feedbacks list
    const updated = await feedbackService.getAllFeedbacks();
    setFeedbacksList(updated);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackMsg('');
      setActiveSheet(null);
    }, 1500);
  };

  const faqs = [
    {
      q: 'How do I add an expense?',
      a: 'Tap the "+" floating button at the bottom of the screen, select Expense, enter the amount and category, and tap Save Expense.',
    },
    {
      q: 'How do I create a budget?',
      a: 'Go to the Budget tab in the bottom footer, tap "+ New Budget", choose whether it is an overall limit or category specific, enter amount, and save.',
    },
    {
      q: 'How do I backup and restore my financial data?',
      a: 'Go to More > Backup & Restore. Tap "Export Backup JSON" to save your data file, or "Import Backup JSON" to restore from a previously exported file.',
    },
    {
      q: 'How does balance calculation work?',
      a: 'Account Balance = Initial Starting Balance + Income added - Expenses added + Incoming Transfers - Outgoing Transfers.',
    },
    {
      q: 'Is my data secure and private?',
      a: 'Yes! All financial transactions and accounts are stored 100% locally on your device. No data is sent to external cloud servers.',
    },
  ];

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-[var(--text-primary)]">More & Settings</h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">App settings, privacy & profile</p>
      </div>

      {/* USER PROFILE CARD */}
      <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)] text-white font-extrabold text-base flex items-center justify-center shadow-md">
              {getInitials(userProfile?.name)}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                {userProfile?.name || 'User Profile'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium">{userProfile?.email || 'user@local'}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${userProfile?.auth_provider === 'firebase' || userProfile?.auth_provider === 'google' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-[10px] font-bold text-[var(--text-muted)]">
                  {userProfile?.auth_provider === 'firebase'
                    ? '🔥 Firebase Auth'
                    : userProfile?.auth_provider === 'google'
                      ? '🌐 Google Authenticated'
                      : '🟡 Hybrid Local Privacy Auth'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              haptics.light();
              setEditNameInput(userProfile?.name || '');
              setActiveSheet('edit_profile');
            }}
            className="p-2.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--accent-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {/* Privacy Note & Log Out Button */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Financials Stored Locally</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAuth && (
              <button
                onClick={() => {
                  haptics.light();
                  onOpenAuth();
                }}
                className="px-3 py-1.5 rounded-xl bg-[var(--accent-light)] text-[var(--accent-primary)] text-xs font-bold transition-colors"
              >
                Auth Portal
              </button>
            )}
            <button
              onClick={() => {
                haptics.heavy();
                onSignOut();
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pro Features Banner */}
      <div
        onClick={() => {
          haptics.light();
          setActiveSheet('pro');
        }}
        className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/10 border border-amber-500/30 flex items-center justify-between cursor-pointer shadow-sm hover:scale-[1.01] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[var(--text-primary)]">In & Out Pro</h4>
            <p className="text-xs text-[var(--text-secondary)]">Cloud Sync, Receipt Scan & Pro Features</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-amber-600" />
      </div>

      {/* Menu Groups */}
      <div className="space-y-4">
        {/* FINANCE GROUP */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">FINANCE</h4>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] shadow-xs overflow-hidden">
            <button
              onClick={() => {
                haptics.light();
                setActiveSheet('categories');
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-[var(--accent-primary)]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">Categories Management</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>

            <button
              onClick={() => {
                haptics.light();
                setActiveSheet('backup');
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-[var(--accent-primary)]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">Backup & Restore</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>

            <button
              onClick={handleExportCSV}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-[var(--accent-primary)]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">Export CSV Report</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>



        {/* APPEARANCE GROUP */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">APPEARANCE & TYPOGRAPHY</h4>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] shadow-xs overflow-hidden">
            {/* Startup Animation */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">Startup Animation</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">Show splash video on launch</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={!settings.disable_splash_animation}
                onChange={(e) => {
                  haptics.light();
                  onUpdateSettings({ ...settings, disable_splash_animation: !e.target.checked });
                }}
                className="w-5 h-5 accent-[var(--accent-primary)] cursor-pointer"
              />
            </div>

            {/* Theme Options */}
            <button
              onClick={() => {
                haptics.light();
                setActiveSheet('theme');
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-[var(--accent-primary)]" />
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">Theme Options</div>
                  <div className="text-[11px] text-[var(--text-secondary)] capitalize">{settings.theme}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>

            {/* Font Family */}
            <button
              onClick={() => {
                haptics.light();
                setActiveSheet('font');
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-[var(--accent-primary)]" />
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">Font Typography</div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-semibold capitalize">
                    {settings.font_family === 'italic'
                      ? 'Italic 𝑇ℎ𝑖𝑠'
                      : settings.font_family === 'bold_italic'
                        ? 'Bold Italic 𝑻𝒉𝒊𝒔'
                        : settings.font_family === 'monospace'
                          ? 'Monospace 𝚃𝚑𝚒𝚜'
                          : settings.font_family === 'script'
                            ? 'Script 𝒯𝒽𝒾𝓈'
                            : 'Normal Style'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>

            {/* Accent Color */}
            <button
              onClick={() => {
                haptics.light();
                setActiveSheet('accent_color');
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Paintbrush className="w-5 h-5 text-[var(--accent-primary)]" />
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">Accent Color</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {settings.accent_color ? settings.accent_color : 'Theme Default'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* APP SUPPORT & DATA GROUP */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">SUPPORT & DATA</h4>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] shadow-xs overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[var(--accent-primary)]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">Notifications</span>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) => {
                  haptics.light();
                  onUpdateSettings({ ...settings, notifications_enabled: e.target.checked });
                }}
                className="w-5 h-5 accent-[var(--accent-primary)] cursor-pointer"
              />
            </div>

            <button
              onClick={() => {
                haptics.light();
                setActiveSheet('feedback');
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">Submit Feedback</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>

            <button
              onClick={async () => {
                haptics.light();
                setActiveSheet('view_feedbacks');
                try {
                  const fbs = await feedbackService.getAllFeedbacks();
                  setFeedbacksList(fbs || []);
                } catch (err) {
                  console.warn('Failed to load feedbacks:', err);
                  setFeedbacksList(storage.getFeedbacks());
                }
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-amber-600" />
                <div>
                  <span className="text-sm font-bold text-[var(--text-primary)] block">View Submitted Feedbacks</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-semibold">Admin Cloud Dashboard ({feedbacksList.length} items)</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 font-black text-[10px]">
                  {storage.getFeedbacks().length}
                </span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            </button>

            <button
              onClick={() => {
                haptics.light();
                setActiveSheet('faq');
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-[var(--accent-primary)]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">Help & FAQ</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>

            <button
              onClick={() => {
                haptics.light();
                setActiveSheet('about');
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-[var(--accent-primary)]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">About In & Out</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* DANGER DATA RESET GROUP */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold text-rose-500 uppercase tracking-wider px-1">DATA RESET OPTIONS</h4>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-rose-500/20 divide-y divide-[var(--border-color)] shadow-xs overflow-hidden">
            <button
              onClick={() => setConfirmResetType('seed')}
              className="w-full p-4 flex items-center justify-between hover:bg-rose-500/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-bold text-[var(--text-primary)]">Reset the demo data</span>
              </div>
            </button>

            <button
              onClick={() => setConfirmResetType('clean')}
              className="w-full p-4 flex items-center justify-between hover:bg-rose-500/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-bold text-[var(--text-primary)]">Reset the clear empty state</span>
              </div>
            </button>

            <button
              onClick={() => setConfirmResetType('delete_all')}
              className="w-full p-4 flex items-center justify-between hover:bg-rose-500/10 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <span className="text-sm font-bold text-rose-600">Delete all data</span>
              </div>
            </button>
          </div>
        </div>

        {/* BRANDING IN MAIN BODY (IN BETWEEN HEADER AND FOOTER) */}
        <div className="text-center py-4 space-y-1 border-t border-[var(--border-color)]/40 mt-4">
          <h4 className="text-xs font-black text-[var(--text-primary)] tracking-tight">
            In & Out - CaseFlow by niceTRY
          </h4>
          <p className="text-[10px] text-[var(--text-muted)] font-semibold">
            Personal Money Manager & Cash Flow Intelligence
          </p>
        </div>
      </div>

      {/* CATEGORIES MANAGEMENT BOTTOM SHEET */}
      <BottomSheet
        isOpen={activeSheet === 'categories'}
        onClose={() => setActiveSheet(null)}
        title="Categories Management"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
            <button
              onClick={() => setCategoryType('expense')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${categoryType === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-[var(--text-secondary)]'
                }`}
            >
              Expense Categories
            </button>
            <button
              onClick={() => setCategoryType('income')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${categoryType === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-[var(--text-secondary)]'
                }`}
            >
              Income Categories
            </button>
          </div>

          {/* Total Categories Summary Banner */}
          {(() => {
            const currentCats = sortCategories(categories.filter((c) => c.type === categoryType && c.is_active));
            const starredCount = currentCats.filter((c) => c.is_default).length;
            return (
              <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-[var(--text-primary)] block">
                    Total {categoryType === 'expense' ? 'Expense' : 'Income'} Categories: <span className="text-[var(--accent-primary)] font-black text-sm">{currentCats.length}</span>
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-semibold mt-0.5 block">
                    {starredCount} Starred ⭐ • "Other" Main Category (Permanent)
                  </span>
                </div>
                <span className="px-3 py-1 rounded-xl bg-[var(--accent-light)] text-[var(--accent-primary)] font-black text-xs">
                  {currentCats.length} Total
                </span>
              </div>
            );
          })()}

          {/* Category Items Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {sortCategories(categories.filter((c) => c.type === categoryType && c.is_active)).map((c) => {
              const isOther = c.is_permanent || c.id === 'cat_other' || c.id === 'cat_income_other' || c.name.toLowerCase() === 'other';
              const isEditableOrDeletable = !isOther;
              return (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl flex-shrink-0">{c.icon}</span>
                    <div className="truncate">
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate block">{c.name}</span>
                      {isOther && <span className="text-[9px] font-extrabold text-amber-600 block">Permanent Main</span>}
                    </div>
                  </div>
                  {isEditableOrDeletable && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditCategory(c)}
                        className="p-1 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--accent-light)] transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInitiateDeleteCategory(c)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {isOther && (
                    <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {!showCategoryForm ? (
            <button
              onClick={() => {
                setEditingCategory(null);
                setCatName('');
                setCatIcon('🛍️');
                setCatColor('#5A5A40');
                const currentActiveCats = categories.filter((c) => c.type === categoryType && c.is_active);
                if (currentActiveCats.length >= 14 && !settings.is_pro_user) {
                  haptics.error();
                  setShowProCategoryLimitModal(true);
                } else {
                  setShowCategoryForm(true);
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Category</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] space-y-3 animate-fade-in">
              <h5 className="text-xs font-extrabold text-[var(--text-primary)]">
                {editingCategory ? `Edit Category (${editingCategory.name})` : `New ${categoryType} Category`}
              </h5>
              <input
                type="text"
                placeholder="Category name"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--text-secondary)] block">Customize Icon:</span>
                <div className="flex gap-1.5 overflow-x-auto py-1">
                  {[
                    '🍔', '⛽', '🛒', '🏠', '🎓', '✈️', '🏋️', '💈', '🐾', '🥬', '📱', '🔑', '💼', '💰', '💻', '📈', '🎁', '📦', '🍕', '☕', '🎟️', '🎬', '💊', '⚡', '🍿', '👕', '🚕', '🚲'
                  ].map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setCatIcon(ic)}
                      className={`p-2 rounded-xl border text-lg shrink-0 transition-all ${
                        catIcon === ic ? 'border-[var(--accent-primary)] bg-[var(--accent-light)] scale-110 shadow-2xs' : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--text-secondary)] block">Color:</span>
                <div className="flex gap-1.5 overflow-x-auto py-1">
                  {['#5A5A40', '#E53935', '#43A047', '#1E88E5', '#8E24AA', '#FB8C00', '#0097A7', '#0288D1', '#D84315', '#F57F17', '#C2185B', '#455A64'].map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setCatColor(clr)}
                      className={`w-7 h-7 rounded-full border border-black/20 shrink-0 ${catColor === clr ? 'ring-2 ring-offset-1 ring-stone-600 scale-105' : ''}`}
                      style={{ backgroundColor: clr }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-bold shadow-sm"
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* BACKUP & RESTORE BOTTOM SHEET */}
      <BottomSheet
        isOpen={activeSheet === 'backup'}
        onClose={() => setActiveSheet(null)}
        title="Backup & Restore"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Export your accounts, categories, budgets, and transactions into a local JSON file or restore from a backup.
          </p>

          <button
            onClick={handleExportJSON}
            className="w-full p-4 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md"
          >
            <Download className="w-5 h-5" />
            <span>Export Backup JSON</span>
          </button>

          <label className="w-full p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors">
            <Upload className="w-5 h-5 text-[var(--accent-primary)]" />
            <span>Import Backup JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </BottomSheet>



      {/* THEME PICKER BOTTOM SHEET */}
      <BottomSheet
        isOpen={activeSheet === 'theme'}
        onClose={() => setActiveSheet(null)}
        title="Select Theme"
      >
        <div className="space-y-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTheme(t.id)}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${settings.theme === t.id
                  ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30 font-bold'
                  : 'border-[var(--border-color)]'
                }`}
              style={{ backgroundColor: t.bg, color: t.text }}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border border-black/20" style={{ backgroundColor: t.bg }} />
                <span className="text-sm font-bold">{t.label}</span>
              </div>
              {settings.theme === t.id && <Check className="w-5 h-5 text-[var(--accent-primary)]" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* FONT PICKER BOTTOM SHEET */}
      <BottomSheet
        isOpen={activeSheet === 'font'}
        onClose={() => setActiveSheet(null)}
        title="Select Font Typography"
      >
        <div className="space-y-3">
          {[
            { id: 'normal', name: 'Normal', sampleText: 'This is the Normal Font Style', fontStyle: "'Inter', sans-serif", cssStyle: { fontStyle: 'normal', fontWeight: 500 } },
            { id: 'italic', name: 'Italic', sampleText: '𝑇ℎ𝑖𝑠 𝑖𝑠 𝑡ℎ𝑒 𝐼𝑡𝑎𝑙𝑖𝑐 𝐹𝑜𝑛𝑡 𝑆𝑡𝑦𝑙𝑒', fontStyle: "'Inter', sans-serif", cssStyle: { fontStyle: 'italic' } },
            { id: 'bold_italic', name: 'Bold Italic', sampleText: '𝑻𝒉𝒊𝒔 𝒊𝒔 𝒕𝒉𝒆 𝑩𝒐𝒍𝒅 𝑰𝒕𝒂𝒍𝒊𝒄 𝑭𝒐𝒏𝒕 𝑺𝒕𝒚𝒍𝒆', fontStyle: "'Inter', sans-serif", cssStyle: { fontStyle: 'italic', fontWeight: 700 } },
            { id: 'monospace', name: 'Monospace', sampleText: '𝚃𝚑𝚒𝚜 𝚒𝚜 𝚝𝚑𝚎 𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎 𝙵𝚘𝚗𝚝 𝚂𝚝𝚢𝚕𝚎', fontStyle: "'JetBrains Mono', monospace", cssStyle: {} },
            { id: 'script', name: 'Script', sampleText: '𝒯𝒽𝒾𝓈 𝒾𝓈 𝓉𝒽𝑒 𝒮𝒸𝓇𝒾𝓅𝓉 𝐹𝑜𝓃𝓉 𝒮𝓉𝓎𝓁𝑒', fontStyle: "'Dancing Script', cursive", cssStyle: { fontSize: '1.15rem' } },
          ].map((f) => {
            const isSelected =
              (settings.font_family || 'normal') === f.id ||
              (f.id === 'normal' && (settings.font_family === 'formal' || settings.font_family === 'inter'));
            return (
              <button
                key={f.id}
                onClick={() => {
                  haptics.light();
                  onUpdateSettings({ ...settings, font_family: f.id as any });
                  document.documentElement.setAttribute('data-font', f.id);
                  setActiveSheet(null);
                }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${isSelected
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-light)] ring-2 ring-[var(--accent-primary)]/30 font-bold'
                    : 'border-[var(--border-color)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-card-hover)]'
                  }`}
              >
                <div>
                  <div className="text-sm font-extrabold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                    <span>{f.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">Font Style</span>
                  </div>
                  <div className="text-sm text-[var(--accent-primary)] leading-relaxed" style={{ fontFamily: f.fontStyle, ...f.cssStyle }}>
                    {f.sampleText}
                  </div>
                </div>
                {isSelected && <Check className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* ACCENT COLOR BOTTOM SHEET */}
      <BottomSheet
        isOpen={activeSheet === 'accent_color'}
        onClose={() => setActiveSheet(null)}
        title="Select Accent Color"
      >
        <div className="space-y-2.5">
          {[
            { id: undefined, name: 'Default Theme Palette', color: 'var(--accent-primary)', hex: 'Theme Default' },
            { id: '#5A5A40', name: 'Olive Classic', color: '#5A5A40', hex: '#5A5A40' },
            { id: '#2563EB', name: 'Royal Sapphire', color: '#2563EB', hex: '#2563EB' },
            { id: '#059669', name: 'Emerald Mint', color: '#059669', hex: '#059669' },
            { id: '#7C3AED', name: 'Deep Amethyst', color: '#7C3AED', hex: '#7C3AED' },
            { id: '#E11D48', name: 'Crimson Coral', color: '#E11D48', hex: '#E11D48' },
          ].map((c) => (
            <button
              key={c.name}
              onClick={() => {
                haptics.light();
                onUpdateSettings({ ...settings, accent_color: c.id });
                setActiveSheet(null);
              }}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${settings.accent_color === c.id
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-light)] ring-2 ring-[var(--accent-primary)]/30 font-bold'
                  : 'border-[var(--border-color)] bg-[var(--bg-canvas)]'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border border-black/20 shadow-xs shrink-0" style={{ backgroundColor: c.color }} />
                <div className="text-left">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{c.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{c.hex}</div>
                </div>
              </div>
              {settings.accent_color === c.id && <Check className="w-5 h-5 text-[var(--accent-primary)]" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* VIEW SUBMITTED FEEDBACKS (ADMIN DASHBOARD BOTTOM SHEET) */}
      <BottomSheet
        isOpen={activeSheet === 'view_feedbacks'}
        onClose={() => setActiveSheet(null)}
        title="User Feedbacks (Admin Dashboard)"
        maxHeight="max-h-[85vh]"
      >
        <div className="space-y-4">
          {(() => {
            const allFeedbacks = feedbacksList;
            const filtered = feedbackFilter === 'all' ? allFeedbacks : allFeedbacks.filter((f) => f.category === feedbackFilter);
            const avgRating = allFeedbacks.length > 0 ? (allFeedbacks.reduce((acc, f) => acc + f.rating, 0) / allFeedbacks.length).toFixed(1) : '5.0';
            return (
              <>
                {/* Metrics Bar */}
                <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-[var(--text-primary)] block">
                      Total Submissions: <span className="text-[var(--accent-primary)] text-sm">{allFeedbacks.length}</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-semibold mt-0.5 block">
                      Average User Rating: ⭐ {avgRating} / 5.0
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      haptics.light();
                      const csvStr = storage.exportFeedbacksCSV();
                      const blob = new Blob([csvStr], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `InAndOut_User_Feedbacks_${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-extrabold text-xs flex items-center gap-1 shadow-xs transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
                  {(['all', 'bug', 'feature', 'other'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFeedbackFilter(cat)}
                      className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${feedbackFilter === cat
                          ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Feedback Cards List */}
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {filtered.length === 0 ? (
                    <div className="p-8 text-center bg-[var(--bg-canvas)] rounded-2xl border border-[var(--border-color)]">
                      <MessageSquare className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold text-[var(--text-secondary)]">No feedback submissions found.</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">Users can submit feedback from More &gt; Submit Feedback.</p>
                    </div>
                  ) : (
                    filtered.map((fb) => (
                      <div key={fb.id} className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${star <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`}
                              />
                            ))}
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-[var(--accent-light)] text-[var(--accent-primary)] text-[10px] font-black uppercase">
                            {fb.category}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed">{fb.message}</p>
                        <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)] font-semibold pt-1 border-t border-[var(--border-color)]/50">
                          <span>👤 {fb.user_name || 'User'} ({fb.user_email || 'No email'})</span>
                          <span>{new Date(fb.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </BottomSheet>

      {/* FEEDBACK BOTTOM SHEET */}
      <BottomSheet
        isOpen={activeSheet === 'feedback'}
        onClose={() => setActiveSheet(null)}
        title="Submit User Feedback"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">How is your experience with In & Out?</p>

          {/* Star Rating */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setFeedbackRating(star)}
                className="p-1 text-amber-400 hover:scale-110 transition-transform"
              >
                <Star className={`w-8 h-8 ${star <= feedbackRating ? 'fill-amber-400' : 'text-stone-300'}`} />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['feature', 'bug', 'other'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFeedbackCategory(cat)}
                className={`py-2 rounded-xl text-xs font-bold capitalize border ${feedbackCategory === cat
                    ? 'bg-[var(--accent-primary)] text-white border-transparent'
                    : 'bg-[var(--bg-canvas)] border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <textarea
            rows={4}
            placeholder="Tell us what you love or how we can improve..."
            value={feedbackMsg}
            onChange={(e) => setFeedbackMsg(e.target.value)}
            className="w-full p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-primary)] focus:outline-none"
          />

          {feedbackSent && <p className="text-xs font-bold text-emerald-600 text-center">✓ Thank you for your feedback!</p>}

          <div className="space-y-2">
            <button
              onClick={handleSendFeedback}
              className="w-full py-4 rounded-2xl bg-[var(--accent-primary)] text-white font-extrabold text-base shadow-md hover:bg-[var(--accent-primary-hover)] transition-all active:scale-[0.99]"
            >
              Submit Feedback
            </button>

            <a
              href={`mailto:developer@innotech.app?subject=InAndOut App Feedback (${feedbackCategory})&body=Rating: ${feedbackRating}/5%0D%0AMessage: ${encodeURIComponent(feedbackMsg)}`}
              className="w-full py-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <Mail className="w-4 h-4 text-amber-600" />
              <span>Send Direct Email Copy</span>
            </a>
          </div>
        </div>
      </BottomSheet>

      {/* FAQ BOTTOM SHEET */}
      <BottomSheet
        isOpen={activeSheet === 'faq'}
        onClose={() => setActiveSheet(null)}
        title="Help & FAQ"
      >
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-sm text-[var(--text-primary)] flex items-center justify-between"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${expandedFaq === idx ? 'rotate-90' : ''}`} />
              </button>
              {expandedFaq === idx && (
                <div className="px-4 pb-4 text-xs font-medium text-[var(--text-secondary)] border-t border-[var(--border-color)] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* ABOUT BOTTOM SHEET */}
      <BottomSheet
        isOpen={activeSheet === 'about'}
        onClose={() => setActiveSheet(null)}
        title="About In & Out"
      >
        <div className="text-center space-y-4 py-2">
          <AppLogo size="lg" className="mx-auto" />
          <div>
            <h3 className="text-xl font-black text-[var(--text-primary)]">In & Out</h3>
            <p className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">Mobile-First Money Manager</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Version v1.1.0 • Developer niceTRY</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] leading-relaxed">
            In & Out is a privacy-focused personal money manager engineered to keep your financial position, income, expenses, cash flow, and budgets instantly understandable with simple mobile interactions.
          </div>
        </div>
      </BottomSheet>

      {/* EDIT PROFILE BOTTOM SHEET */}
      <BottomSheet
        isOpen={activeSheet === 'edit_profile'}
        onClose={() => setActiveSheet(null)}
        title="Edit User Profile"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Full Name</label>
            <input
              type="text"
              value={editNameInput}
              onChange={(e) => setEditNameInput(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-primary)] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Email Address</label>
            <input
              type="email"
              disabled
              value={userProfile?.email || ''}
              className="w-full p-3.5 rounded-2xl bg-[var(--bg-canvas)]/50 border border-[var(--border-color)] text-sm font-bold text-[var(--text-muted)] focus:outline-none cursor-not-allowed"
            />
            <p className="text-[10px] text-[var(--text-muted)]">Email is fixed to your authentication account.</p>
          </div>

          <button
            onClick={() => {
              if (!editNameInput.trim()) return;
              haptics.success();
              onUpdateProfile(editNameInput);
              setActiveSheet(null);
            }}
            className="w-full py-4 rounded-2xl bg-[var(--accent-primary)] text-white font-bold text-sm shadow-md"
          >
            Save Profile
          </button>
        </div>
      </BottomSheet>

      {/* PRO FEATURES BOTTOM SHEET */}
      <BottomSheet
        isOpen={activeSheet === 'pro'}
        onClose={() => setActiveSheet(null)}
        title="Innotech Pro Features (Coming Soon)"
        maxHeight="max-h-[85vh]"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center mx-auto shadow-lg">
            <Crown className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 font-extrabold text-[11px] uppercase tracking-wider">
              🚀 Coming Soon — Innotech Pro
            </span>
            <h3 className="text-xl font-black text-[var(--text-primary)] mt-2">Innotech Pro Features</h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
              Advanced financial intelligence & automated sync capabilities are coming soon!
            </p>
          </div>

          <div className="space-y-2 text-left pt-1">
            <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-black">⚡ Multi-Account Scaling</span>
                <span className="text-[11px] text-[var(--text-secondary)] font-normal">4 Default Accounts + Unlimited Custom Bank, Wallet & Card Accounts</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-black">🏷️ Category Management</span>
                <span className="text-[11px] text-[var(--text-secondary)] font-normal">12 Default Expense Categories (6 Starred ⭐ + Permanent "Other") + Custom Categories</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-black">🌍 Multi-Currency Live Conversion</span>
                <span className="text-[11px] text-[var(--text-secondary)] font-normal">Real-time exchange conversion between INR (₹), USD ($), EUR (€), GBP (£), AED, SAR</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-black">☁️ Encrypted Cloud Sync</span>
                <span className="text-[11px] text-[var(--text-secondary)] font-normal">Seamless end-to-end encrypted backup & multi-device sync</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block font-black">📄 Automated PDF & Excel Statements</span>
                <span className="text-[11px] text-[var(--text-secondary)] font-normal">Export formatted financial audits and tax statements in one tap</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              haptics.light();
              setActiveSheet(null);
              setToastMessage('Coming soon');
              setShowToast(true);
            }}
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Crown className="w-4 h-4" />
            <span>Activate Innotech Pro (Unlock Unlimited)</span>
          </button>
        </div>
      </BottomSheet>

      {/* PRO LIMIT MODAL */}
      <ProLimitModal
        isOpen={showProCategoryLimitModal}
        onClose={() => setShowProCategoryLimitModal(false)}
        type="category"
        onOpenProSheet={() => {
          setShowProCategoryLimitModal(false);
          setActiveSheet('pro');
        }}
        onActivatePro={() => {
          setShowProCategoryLimitModal(false);
          setShowCategoryForm(false);
          setToastMessage('Coming soon');
          setShowToast(true);
        }}
      />

      {/* CONFIRMATION DIALOGS FOR DATA RESET */}
      <ConfirmDialog
        isOpen={confirmResetType !== null}
        onClose={() => setConfirmResetType(null)}
        onConfirm={() => {
          if (confirmResetType) onResetData(confirmResetType);
        }}
        title={
          confirmResetType === 'seed'
            ? 'Reset Demo Data'
            : confirmResetType === 'clean'
            ? 'Reset Clear Empty State'
            : 'Delete All Data'
        }
        message={
          confirmResetType === 'seed'
            ? 'This will reset all data to the default demo dataset.'
            : confirmResetType === 'clean'
            ? 'This will reset accounts to zero balance and clear all transactions.'
            : 'DESTRUCTIVE: This will permanently delete ALL accounts, transactions, and settings.'
        }
        requiredText={
          confirmResetType === 'seed'
            ? 'demo'
            : confirmResetType === 'clean'
            ? 'reset'
            : 'delete'
        }
        confirmText={
          confirmResetType === 'seed'
            ? 'Reset Demo'
            : confirmResetType === 'clean'
            ? 'Reset'
            : 'Delete All'
        }
        isDanger={true}
      />

      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};
