import React, { useState } from 'react';
import type { UserProfile } from '../../types';
import { authService } from '../../services/authService';
import { Shield, Mail, User, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { haptics } from '../../utils/haptics';
import { AppLogo } from '../common/AppLogo';

interface AuthScreenProps {
  onAuthenticated: (profile: UserProfile, isNewUser?: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isCloud = authService.isCloudAuthActive();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      let res;
      if (mode === 'signup') {
        res = await authService.signUp(name, email, password);
      } else {
        res = await authService.signIn(email, password);
      }

      if (res.success && res.profile) {
        haptics.success();
        if (res.message) setSuccessMsg(res.message);
        setTimeout(() => {
          onAuthenticated(res.profile!, mode === 'signup');
        }, 1200);
      } else {
        haptics.error();
        setErrorMsg(res.message || 'Authentication failed.');
      }
    } catch (err: any) {
      haptics.error();
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    haptics.light();

    try {
      const res = await authService.signInWithGoogle();
      if (res.success && res.profile) {
        haptics.success();
        onAuthenticated(res.profile, res.isNewUser);
      } else {
        haptics.error();
        setErrorMsg(res.message || 'Google Sign-In failed.');
      }
    } catch (err: any) {
      haptics.error();
      setErrorMsg(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-canvas)] flex flex-col justify-between p-6 max-w-lg mx-auto overflow-y-auto animate-fade-in">
      {/* App Branding */}
      <div className="pt-6 text-center space-y-2">
        <AppLogo size="lg" className="mx-auto" />
        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">In & Out</h1>
        <p className="text-xs font-semibold text-[var(--text-secondary)]">
          Mobile-First Money Manager
        </p>

        {/* Cloud vs Local Mode Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-light)] text-[var(--accent-primary)] text-[11px] font-bold">
          <span className={`w-2 h-2 rounded-full ${isCloud ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span>{isCloud ? '🔥 Firebase Cloud Auth Active' : '🟡 Local Hybrid Privacy Auth'}</span>
        </div>
      </div>

      {/* Main Form Box */}
      <div className="my-auto py-4 space-y-4">
        {/* Toggle Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => {
              haptics.light();
              setMode('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              mode === 'signup'
                ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.light();
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              mode === 'login'
                ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Log In
          </button>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] text-xs font-extrabold flex items-center justify-center gap-2.5 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="h-px bg-[var(--border-color)] flex-1" />
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">or email</span>
          <div className="h-px bg-[var(--border-color)] flex-1" />
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Username / Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-rose-500 text-center py-2 px-3 bg-rose-500/10 rounded-xl">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Account & Activate' : 'Log In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 100% Financial Privacy Guarantee Box */}
        <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">
            <span className="font-extrabold text-[var(--text-primary)] block">100% Financial Privacy Guarantee:</span>
            Only your identity (Name & Email) is authenticated on Firebase. All financial transactions and accounts remain strictly <strong>stored on your local device</strong>.
          </div>
        </div>
      </div>

      <div className="text-center pb-2 text-[10px] font-semibold text-[var(--text-muted)]">
        In & Out v1.1.0 • Powered by Firebase Auth
      </div>
    </div>
  );
};
