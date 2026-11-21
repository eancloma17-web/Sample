import butuanBackgroundImg from '../assets/images/butuan-background.png';
import React, { useState } from 'react';
import { ButuanCitySeal, CpmdSeal, ButuanOnBanner } from './Seals';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Building2,
  ShieldAlert
} from 'lucide-react';
import { UserAccount } from '../types';
import { signInInternalPersonnel, sendPasswordRecoveryEmail } from '../services/authService';

interface StaffAuthViewProps {
  onStaffLogin: (user: UserAccount) => void;
  onSwitchToSupplierLogin: () => void;
  onOpenHelp: () => void;
}

export const StaffAuthView: React.FC<StaffAuthViewProps> = ({
  onStaffLogin,
  onSwitchToSupplierLogin,
  onOpenHelp,
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setForgotPasswordMsg(false);

    if (!emailOrUsername.trim() || !password || !accessCode.trim()) {
      setErrorMessage('Enter your personnel access code, email, and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInInternalPersonnel(emailOrUsername.trim(), password, accessCode);
      if (res.success && res.data?.user) {
        onStaffLogin(res.data.user);
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify your staff credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#eaf0f7] text-slate-900 font-sans">
      {/* Top Header */}
      <header className="bg-[#072d50] text-white px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <ButuanCitySeal size={44} className="w-10 h-10" />
          <div className="border-l border-white/20 pl-3">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight uppercase text-white">
              CITY GOVERNMENT OF BUTUAN • CPMD
            </h1>
            <p className="text-[11px] sm:text-xs font-semibold text-sky-300 tracking-wider uppercase">
              TECHNICAL SUPPORT AND ACCREDITATION DIVISION (TSAD) • STAFF PORTAL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToSupplierLogin}
            className="flex items-center gap-1.5 text-xs text-sky-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Supplier Portal Login</span>
          </button>
        </div>
      </header>

      {/* Main Staff Login Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-12 relative overflow-hidden">
        {/* Subtle Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
          style={{
            backgroundImage: `url(${butuanBackgroundImg})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#eaf0f7]/95 to-[#dfe9f4]/95 pointer-events-none" />

        <div className="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          {/* Header & Badging */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0a3560] text-white shadow-md mx-auto">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200 font-mono">
                AUTHORIZED INTERNAL PERSONNEL
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1.5">
                Internal Personnel Login
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                TSAD Staff • Department Head • Administrative Staff / MIS Officer
              </p>
            </div>
          </div>

          {/* Strict Scope Alert (from PDF Page 1) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-900" />
              <span>Restricted Internal Personnel Access</span>
            </div>
            <p>
              There is no public personnel registration. Authorized accounts and workspace permissions are assigned through secure administrator provisioning.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Forgot Password Feedback */}
          {forgotPasswordMsg && (
            <div className="p-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-200 text-xs font-semibold">
              If this address has an account, password recovery instructions will be sent. Check your inbox and spam folder.
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="staff-access-code" className="block text-xs font-bold text-slate-700">Internal Personnel Access Code *</label>
              <input id="staff-access-code" type="password" autoComplete="off" required value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)} placeholder="Enter authorized access code"
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#072d50]" />
              <p className="text-[11px] text-slate-500">The code is validated securely by the server; it is not your account password.</p>
            </div>
            <div className="space-y-1.5">
              <label 
                htmlFor="staff-email" 
                className="block text-xs font-bold text-slate-700"
              >
                Staff Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="staff-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="Enter your registered staff email"
                  className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#072d50] focus:border-transparent font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label 
                htmlFor="staff-password" 
                className="block text-xs font-bold text-slate-700"
              >
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="staff-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff password"
                  className="w-full pl-9 pr-10 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#072d50] focus:border-transparent font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-[11px] text-slate-500">
                Staff session security enforced
              </span>
              <button
                type="button"
                onClick={async () => {
                  setErrorMessage(null);
                  setForgotPasswordMsg(false);
                  if (!emailOrUsername.trim() || !emailOrUsername.includes('@')) {
                    setErrorMessage('Enter your registered staff email address before requesting password recovery.');
                    return;
                  }
                  setRecoveryLoading(true);
                  try {
                    const result = await sendPasswordRecoveryEmail(emailOrUsername.trim());
                    if (result.success) setForgotPasswordMsg(true);
                    else setErrorMessage(result.error || 'Unable to request password recovery.');
                  } finally {
                    setRecoveryLoading(false);
                  }
                }}
                className="text-blue-900 hover:underline font-semibold cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#072d50] hover:bg-[#05213b] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>{isLoading ? 'Verifying Staff Credentials...' : 'Authenticate & Open Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Return to Supplier Portal Link */}
          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onSwitchToSupplierLogin}
              className="text-xs text-slate-600 hover:text-slate-900 hover:underline inline-flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Are you a supplier? Return to Supplier Portal Login</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#05213b] text-sky-200 text-xs py-3 px-4 sm:px-8 border-t border-blue-950 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-sky-400" />
          <span>City Government of Butuan • City Procurement Management Department</span>
        </div>
        <div className="text-[11px] text-sky-300">
          Role 2 TSAD Staff Implementation Specification
        </div>
      </footer>
    </div>
  );
};
