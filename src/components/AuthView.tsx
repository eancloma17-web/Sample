import butuanBackgroundImg from '../assets/images/butuan-background.png';
import React, { useState } from 'react';
import { ButuanCitySeal, CpmdSeal, ButuanOnBanner } from './Seals';
import { 
  FileCheck2, 
  Lock, 
  BarChart3, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  UserPlus, 
  Headphones, 
  ShieldCheck, 
  Info,
  HelpCircle,
  Landmark,
  Building2,
  Check,
  AlertCircle
} from 'lucide-react';
import { UserAccount, SupplierCategory } from '../types';
import { signIn, signUpSupplier, sendPasswordRecoveryEmail } from '../services/authService';

interface AuthViewProps {
  onLogin: (user: UserAccount) => void;
  onOpenHelp: () => void;
  onSwitchToStaffLogin: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
  onOpenHelp,
  onSwitchToStaffLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);

  // Registration Form State
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regProprietorName, setRegProprietorName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regContactNumber, setRegContactNumber] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCategories, setRegCategories] = useState<SupplierCategory[]>(['GOODS AND SERVICES']);
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setRegistrationNotice(null);
    if (!email || !password) {
      setLoginError('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn(email, password, 'SUPPLIER');
      if (res.success && res.data?.user) {
        onLogin(res.data.user);
      } else {
        setLoginError(res.error || 'Invalid credentials or authentication failure.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regBusinessName.trim() || !regEmail.trim() || !regProprietorName.trim()) {
      setRegError('Please provide business name, proprietor name, and company email.');
      return;
    }
    if (!regPassword || regPassword.length < 8) {
      setRegError('Password must be at least 8 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }
    if (regCategories.length === 0) {
      setRegError('Please select at least one supplier classification.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await signUpSupplier({
        email: regEmail.trim(),
        password: regPassword,
        businessName: regBusinessName.trim().toUpperCase(),
        proprietorName: regProprietorName.trim().toUpperCase(),
        contactNumber: regContactNumber.trim(),
        principalAddress: regAddress.trim(),
        categories: regCategories,
      });

      if (res.success) {
        if (res.requiresEmailConfirmation) {
          setRegistrationNotice(`Registration submitted! A verification link has been sent to ${regEmail}. Please confirm your email before signing in.`);
          setIsRegisterOpen(false);
        } else if (res.data?.user) {
          onLogin(res.data.user);
          setIsRegisterOpen(false);
        } else {
          setRegistrationNotice('Account registered successfully. Please sign in with your email and password.');
          setIsRegisterOpen(false);
        }
      } else {
        setRegError(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setRegError(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail) {
      setForgotError('Please enter your email address.');
      return;
    }

    setIsSendingForgot(true);
    try {
      const res = await sendPasswordRecoveryEmail(forgotEmail);
      if (res.success) {
        setForgotSuccess(true);
      } else {
        setForgotError(res.error || 'Failed to dispatch password recovery email.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Error requesting password reset.');
    } finally {
      setIsSendingForgot(false);
    }
  };

  const toggleCategory = (cat: SupplierCategory) => {
    if (regCategories.includes(cat)) {
      if (regCategories.length > 1) {
        setRegCategories(regCategories.filter(c => c !== cat));
      }
    } else {
      setRegCategories([...regCategories, cat]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#eef5fb] text-slate-900 font-sans">
      {/* 1. TOP HEADER (Exact match to Image 1) */}
      <header className="bg-[#0a4275] text-white px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <ButuanCitySeal size={46} className="w-11 h-11" />
          <div className="border-l border-white/20 pl-3">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight uppercase text-white">
              BUTUAN CITY PROCUREMENT MANAGEMENT DEPARTMENT
            </h1>
            <p className="text-[11px] sm:text-xs font-semibold text-sky-200 tracking-wider uppercase">
              TSAD SUPPLIER INFORMATION SYSTEM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToStaffLogin}
            className="flex items-center gap-1.5 text-xs text-sky-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors border border-sky-300/30 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
            <span>TSAD Staff Portal &rarr;</span>
          </button>
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-sky-200" />
            <span>Need help?</span>
          </button>
        </div>
      </header>

      {/* 2. DEMO SWITCHER BAR */}
      <div className="no-print bg-slate-900 text-slate-300 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Supabase Protected Authentication
          </span>
          <span className="text-slate-400 hidden sm:inline">
            • Direct connection to City of Butuan backend database
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-400">Government Staff Member?</span>
          <button
            type="button"
            onClick={onSwitchToStaffLogin}
            className="text-sky-300 hover:text-white font-bold underline cursor-pointer"
          >
            Switch to Staff Portal &rarr;
          </button>
        </div>
      </div>

      {/* 3. MAIN HERO & LOGIN SECTION (Exact layout from Image 1) */}
      <main className="flex-1 relative flex items-center justify-center p-4 sm:p-6 md:p-10 lg:p-12 overflow-hidden">
        {/* Background Image with subtle architectural depth and soft fade */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url(${butuanBackgroundImg})`,
          }}
        />
        {/* Soft Radial & Linear Vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#eaf2fa]/95 via-[#edf4fb]/90 to-[#e5eef7]/85 pointer-events-none" />

        {/* 2-Column Split Container */}
        <div className="relative z-10 max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: BRANDING & 3 FEATURE BULLETS (Exact copy from Image 1) */}
          <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-6">
            <div className="space-y-4">
              {/* Official Seal Emblem */}
              <div className="inline-block p-1 bg-white/80 rounded-2xl shadow-xs border border-white">
                <ButuanCitySeal size={88} className="w-20 h-20 sm:w-22 sm:h-22" />
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0a3560] tracking-tight leading-tight">
                  Supplier<br />
                  Information System
                </h2>
                <p className="text-base sm:text-lg text-slate-700 font-normal max-w-xl leading-relaxed">
                  A secure digital portal for supplier registration, qualification, and document monitoring.
                </p>
              </div>
            </div>

            {/* The 3 Feature Cards */}
            <div className="space-y-4 pt-2 max-w-lg">
              {/* Feature 1 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#ddecfa] text-[#0a4f94] flex items-center justify-center shrink-0 shadow-xs">
                  <FileCheck2 className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Verified supplier records
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-normal">
                    Accurate and updated supplier information for a reliable procurement process.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#ddecfa] text-[#0a4f94] flex items-center justify-center shrink-0 shadow-xs">
                  <Lock className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Secure document submission
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-normal">
                    Safely upload and manage your requirements.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#ddecfa] text-[#0a4f94] flex items-center justify-center shrink-0 shadow-xs">
                  <BarChart3 className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Transparent review status
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-normal">
                    Track your application and document status in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LOGIN CARD (Exact replica of Image 1) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
              
              {/* Top Shield Icon Badge */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#e8f1fa] text-[#0a4f94] mx-auto">
                  <ShieldCheck className="w-8 h-8 fill-[#0a4f94] text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Sign in to your account
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Access your supplier workspace securely.
                  </p>
                </div>
              </div>

              {/* Login Alerts */}
              {loginError && (
                <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {registrationNotice && (
                <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{registrationNotice}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label 
                    htmlFor="supplier-email" 
                    className="block text-xs font-bold text-slate-700"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="supplier-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0a4f94] focus:border-transparent transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label 
                    htmlFor="supplier-password" 
                    className="block text-xs font-bold text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="supplier-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-10 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0a4f94] focus:border-transparent transition-all placeholder:text-slate-400"
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

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#0a4f94] focus:ring-[#0a4f94] cursor-pointer"
                    />
                    <span>Remember this device</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotSuccess(false);
                      setForgotError(null);
                      setIsForgotPasswordOpen(true);
                    }}
                    className="text-[#0a4f94] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Sign In Button (Deep navy matching Image 1) */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#0a4b8f] hover:bg-[#083e75] disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{isLoading ? 'Authenticating...' : 'Sign in'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative">
                  OR
                </span>
              </div>

              {/* Register as a supplier button */}
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-[#0a4b8f] border border-[#0a4b8f] text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register as a supplier</span>
              </button>

              {/* Contact Support & Staff Portal switch */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={onOpenHelp}
                  className="inline-flex items-center gap-1.5 text-[#0a4b8f] hover:underline font-semibold cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Contact support</span>
                </button>
                <button
                  type="button"
                  onClick={onSwitchToStaffLogin}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:underline font-semibold cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-sky-700" />
                  <span>Staff Portal &rarr;</span>
                </button>
              </div>

              {/* Protected Access Banner (Green rounded pill matching Image 1) */}
              <div className="bg-[#e8f7ee] border border-emerald-200/60 rounded-lg py-2 px-3 flex items-center justify-center gap-1.5 text-xs text-[#15803d] font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Protected access • Supabase Auth</span>
              </div>

              {/* Security Footer Note */}
              <div className="flex items-start gap-1.5 text-[11px] text-slate-500 leading-tight">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>Never share your password. Sign out after using a shared device.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. FOOTER (Exact match to Image 1) */}
      <footer className="bg-[#083863] text-sky-100 text-xs py-3.5 px-4 sm:px-8 border-t border-blue-950 flex flex-col sm:flex-row items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2 text-sky-200">
          <Landmark className="w-4 h-4 text-sky-300" />
          <span>Official government service • Butuan City, Philippines</span>
        </div>
        <div className="flex items-center gap-4 text-sky-200">
          <button 
            onClick={onOpenHelp}
            className="hover:text-white hover:underline transition-colors cursor-pointer"
          >
            Privacy notice
          </button>
          <span className="text-sky-500">|</span>
          <button 
            onClick={onOpenHelp}
            className="hover:text-white hover:underline transition-colors cursor-pointer"
          >
            Terms of use
          </button>
        </div>
      </footer>

      {/* FORGOT PASSWORD MODAL */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
            <div className="bg-[#0a4275] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Reset Supplier Password</h3>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-white/80 hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleForgotPasswordSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Enter your registered supplier email address. We will send a secure password recovery link to your inbox.
              </p>
              {forgotSuccess ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-semibold">
                  A password reset link has been dispatched to {forgotEmail}. Please check your inbox.
                </div>
              ) : (
                <>
                  {forgotError && (
                    <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-200">
                      {forgotError}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">Company Email Address</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="official@company.ph"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingForgot}
                      className="px-4 py-2 bg-[#0a4b8f] text-white font-bold rounded-lg disabled:opacity-50"
                    >
                      {isSendingForgot ? 'Sending...' : 'Send Recovery Link'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#0a4275] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ButuanCitySeal size={36} className="w-9 h-9" />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Supplier Registration Portal
                  </h3>
                  <p className="text-[11px] text-sky-200">
                    Form CPMD.TSAD.F.003 • City Government of Butuan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 text-xs">
              {regError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                  {regError}
                </div>
              )}

              {/* Classification Selector */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">
                  Classification / Category (Check all that apply):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['GOODS AND SERVICES', 'INFRASTRUCTURE PROJECTS', 'CONSULTING SERVICES'] as SupplierCategory[]).map((cat) => (
                    <label 
                      key={cat} 
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        regCategories.includes(cat) 
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={regCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="rounded text-[#0a4f94]"
                      />
                      <span className="text-[11px] uppercase leading-tight">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Business Name */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  Business Name of Supplier / Contractor / Consultant *
                </label>
                <input
                  type="text"
                  required
                  value={regBusinessName}
                  onChange={(e) => setRegBusinessName(e.target.value)}
                  placeholder="e.g., AGUSAN ALLIED COMMERCIAL INC."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
                />
              </div>

              {/* Proprietor / Owner Name */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  Name of Proprietor / Business Owner *
                </label>
                <input
                  type="text"
                  required
                  value={regProprietorName}
                  onChange={(e) => setRegProprietorName(e.target.value)}
                  placeholder="e.g., JUAN D. DELA CRUZ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">
                    Company Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="official@company.ph"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={regContactNumber}
                    onChange={(e) => setRegContactNumber(e.target.value)}
                    placeholder="0917-000-0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Credentials / Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">
                    Account Password (min. 8 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Principal Address */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  Principal Place of Business (Address) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Street / Barangay / Municipality / City"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0a4f94] focus:outline-hidden"
                />
              </div>

              {/* Submission Notice */}
              <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-normal">
                By registering, your account will be securely initialized in the City Government of Butuan Supabase database and assigned Form CPMD.TSAD.F.003. REV00. Public registration grants Supplier role only.
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-5 py-2 bg-[#0a4b8f] hover:bg-[#083e75] disabled:opacity-50 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {isRegistering ? 'Registering Account...' : 'Complete Registration & Open Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
