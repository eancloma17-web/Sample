import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import {
  getPasswordRecoveryUserId,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

type RecoveryStatus = 'loading' | 'ready' | 'expired' | 'success' | 'error';

const expiredLinkMessage =
  'This password reset link is invalid or has expired. Request a new recovery email and use its latest link.';

export const ResetPasswordView: React.FC = () => {
  const [status, setStatus] = useState<RecoveryStatus>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryUserId, setRecoveryUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let activeRecoveryUserId = getPasswordRecoveryUserId();

    const validateRecoverySession = async (expectedUserId: string) => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (userError) {
          setError(userError.message);
          setStatus('error');
        } else if (user?.id === expectedUserId) {
          setRecoveryUserId(expectedUserId);
          setStatus('ready');
        } else {
          setStatus('expired');
        }
      } catch (sessionError) {
        if (!isMounted) return;
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : 'Unable to verify the password reset session.'
        );
        setStatus('error');
      }
    };

    if (!isSupabaseConfigured()) {
      setError('Password recovery is unavailable because Supabase is not configured.');
      setStatus('error');
      return () => {
        isMounted = false;
      };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        if (event === 'PASSWORD_RECOVERY' && session) {
          activeRecoveryUserId = session.user.id;
          window.setTimeout(() => {
            if (isMounted && activeRecoveryUserId) {
              void validateRecoverySession(activeRecoveryUserId);
            }
          }, 0);
        } else if (event === 'INITIAL_SESSION') {
          window.setTimeout(() => {
            if (!isMounted) return;
            activeRecoveryUserId =
              activeRecoveryUserId ?? getPasswordRecoveryUserId();
            if (activeRecoveryUserId) {
              void validateRecoverySession(activeRecoveryUserId);
            } else {
              setStatus('expired');
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setRecoveryUserId(null);
          setStatus((current) => current === 'success' ? current : 'expired');
        }
      }
    );

    if (activeRecoveryUserId) {
      void validateRecoverySession(activeRecoveryUserId);
    }

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (
      status !== 'ready' ||
      !recoveryUserId ||
      recoveryUserId !== getPasswordRecoveryUserId()
    ) {
      setStatus('expired');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
      } else {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          setError(
            `Your password was updated, but sign-out failed: ${signOutError.message}`
          );
          setStatus('error');
        } else {
          setPassword('');
          setConfirmPassword('');
          setStatus('success');
        }
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to update your password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#eef5fb] px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 flex items-center gap-3 text-[#0a4275]">
          <KeyRound className="h-6 w-6" />
          <h1 className="text-xl font-bold">Set a new password</h1>
        </div>

        {status === 'loading' && (
          <p role="status" className="text-sm text-slate-600">Verifying your recovery link...</p>
        )}

        {status === 'expired' && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{expiredLinkMessage}</p>
          </div>
        )}

        {status === 'error' && error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {status === 'success' && (
          <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Password updated successfully. You can now sign in with your new password.</p>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-slate-600">Choose a new password for your account.</p>
            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <label className="block space-y-1 text-sm font-medium text-slate-700">
              <span>New password</span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#0a4f94]"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium text-slate-700">
              <span>Confirm new password</span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#0a4f94]"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#0a4f94] px-4 py-2.5 font-bold text-white transition-colors hover:bg-[#083e75] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        )}

        <a href="/" className="mt-6 inline-block text-sm font-semibold text-[#0a4f94] hover:underline">
          Return to sign in
        </a>
      </section>
    </main>
  );
};
