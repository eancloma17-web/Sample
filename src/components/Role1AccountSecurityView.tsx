import React, { useState } from 'react';
import { UserAccount, SupplierApplication } from '../types';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  LogOut, 
  ShieldAlert,
  Smartphone
} from 'lucide-react';

import { 
  updateAuthenticatedPassword, 
  resendVerificationEmail 
} from '../services/authService';

interface Role1AccountSecurityViewProps {
  currentUser: UserAccount;
  supplier: SupplierApplication;
  onUpdateUser: (updatedUser: UserAccount) => void;
  onSignOut: () => void;
}

export const Role1AccountSecurityView: React.FC<Role1AccountSecurityViewProps> = ({
  currentUser,
  supplier,
  onUpdateUser,
  onSignOut,
}) => {
  const [emailResent, setEmailResent] = useState(false);
  const [emailResendError, setEmailResendError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleResendVerification = async () => {
    setEmailResendError(null);
    setIsResending(true);
    try {
      const res = await resendVerificationEmail(currentUser.email);
      if (res.success) {
        setEmailResent(true);
        setTimeout(() => setEmailResent(false), 5000);
      } else {
        setEmailResendError(res.error || 'Failed to send verification email.');
      }
    } catch (e: any) {
      setEmailResendError(e.message || 'Error sending verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please provide your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await updateAuthenticatedPassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onUpdateUser({
          ...currentUser,
          passwordUpdatedAt: new Date().toISOString()
        });
        setTimeout(() => setPasswordSuccess(false), 4000);
      } else {
        setPasswordError(res.error || 'Failed to update password. Check your current password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
              Supplier • Menu Item 5
            </span>
            <span className="text-xs text-slate-400 font-mono">Supabase Auth Security</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a3560] tracking-tight mt-1">
            Account Security & Authentication
          </h1>
          <p className="text-xs text-slate-500">
            Email verification state, credentials, session management, and role protection
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.emailVerified ? (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Email Verified
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-800 border border-amber-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Verification Pending
            </span>
          )}
        </div>
      </div>

      {/* 1. EMAIL VERIFICATION STATE & FLOW */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#0a4f94]" />
            <span>Email Verification State</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">{currentUser.email}</span>
        </div>

        {currentUser.emailVerified ? (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Email address successfully verified.</span>
              <p className="text-slate-600">
                Verification confirms email control only. As specified in project guidelines, email verification does not constitute supplier approval or automatic master-list qualification.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Email verification required for {currentUser.email}</span>
                <p className="text-slate-700">
                  Please confirm your email address. Verification confirms email control only; it does not mean supplier approval.
                </p>
              </div>
            </div>

            {emailResent ? (
              <div className="p-2.5 bg-white rounded-lg border border-amber-300 text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verification email sent to {currentUser.email}. Please verify by clicking the link in your inbox.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResendVerification}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                >
                  {isResending ? 'Sending...' : 'Send / Resend Verification Email'}
                </button>
                {emailResendError && (
                  <div className="text-xs text-red-600 font-medium">
                    {emailResendError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. PASSWORD RECOVERY & CHANGE */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0a4f94]" />
            <span>Password Change & Recovery</span>
          </h2>
          <p className="text-xs text-slate-500">
            Use supported authentication reset flow without exposing private account existence.
          </p>
        </div>

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Password updated successfully.</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs max-w-md">
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Current Password:</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700">New Password (Min 8 characters):</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Confirm New Password:</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-[#0a4f94] hover:bg-[#083e75] text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
          >
            Update Account Password
          </button>
        </form>
      </div>

      {/* 3. SESSION HANDLING & SECURITY ACTIONS */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#0a4f94]" />
            <span>Active Session Management</span>
          </h2>
          <p className="text-slate-500">
            Handle authenticated routes and sign out securely.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-bold text-slate-900">Current Web Session</div>
            <div className="text-slate-600 text-[11px]">
              Logged in as: <span className="font-mono text-slate-800">{currentUser.email}</span> &nbsp;•&nbsp; Role: <span className="font-semibold text-blue-900">{currentUser.role}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-xs self-start sm:self-center"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>

      {/* 4. ENFORCED ROLE PROTECTION & RLS NOTICE */}
      <div className="bg-slate-100 border border-slate-300 rounded-xl p-5 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldAlert className="w-4 h-4 text-blue-900" />
          <span>Role Protection and Row-Level Security (RLS) Policy</span>
        </div>
        <p className="leading-relaxed">
          <strong>Enforced Authorization:</strong> Under the Role 1 Specification, suppliers cannot assign their own role, self-approve applications, or edit staff-only verification fields. Row-level security blocks suppliers from reading, listing, replacing, or deleting another supplier's files or records.
        </p>
      </div>
    </div>
  );
};
