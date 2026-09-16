import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
  KeyRound
} from 'lucide-react';
import { UCULogo } from './UCULogo';
import { apiRequest, setSession, UserSession } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Please provide your university email/ID and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const session = await apiRequest<UserSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: identifier.trim(),
          password,
        }),
      });

      setSession(session);
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (emailVal: string, passVal: string) => {
    setIdentifier(emailVal);
    setPassword(passVal);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#091E3A] selection:bg-[#E6007E] selection:text-white">
      {/* 1. Left Showcase Panel: UCU Institutional Heritage & Mission */}
      <div className="lg:w-5/12 xl:w-1/2 relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 text-white overflow-hidden bg-gradient-to-b from-[#091E3A] via-[#0E2A4F] to-[#091E3A] border-b lg:border-b-0 lg:border-r border-[#1E3A60]/80">
        {/* Subtle decorative crest watermark in background */}
        <div className="absolute -right-24 -bottom-24 w-96 h-96 opacity-5 pointer-events-none">
          <UCULogo size={384} />
        </div>

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0047AB] via-[#E6007E] to-[#FFCC00]" />

        {/* Header Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/5 p-2 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
              <UCULogo size={46} />
            </div>
            <div>
              <span className="font-serif font-black text-2xl tracking-tight text-white block">
                CampusQ
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#FFD700] block">
                Directorate of Financial Services
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-3 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6007E]/20 text-[#FCE7F3] border border-[#E6007E]/40 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#E6007E] animate-pulse" />
              Official Accounts Office Portal • Easter Semester 2025/2026
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white leading-tight">
              Uganda Christian University
            </h1>
            <p className="text-[#FFD700] font-serif italic text-base">
              "A Centre of Excellence in the Heart of Africa"
            </p>
            <p className="text-sm text-slate-300 leading-relaxed pt-1">
              Secure institutional access for students, bursary staff, and financial supervisors to manage tuition verification, automated 45% registration clearances, and virtual queue services.
            </p>
          </div>
        </div>

        {/* Core Pillars Feature Cards */}
        <div className="relative z-10 my-10 space-y-3.5 max-w-lg hidden sm:block">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#00883E]/20 border border-[#00883E]/40 flex items-center justify-center text-[#86EFAC] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide">Automated 45% & 75% Clearance</h2>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                Real-time financial reconciliation checking assessed programme tuition against verified bank deposits for instant exam & registration permits.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#E6007E]/20 border border-[#E6007E]/40 flex items-center justify-center text-[#F472B6] shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide">Intelligent Virtual Counter Queue</h2>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                Join physical Accounts Office queues remotely, monitor live estimated wait times, or resolve inquiries digitally to prevent campus congestion.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Status */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00883E] ring-4 ring-[#00883E]/20" />
            <span className="text-slate-300 font-medium text-xs">Mukono Main Campus Services Online</span>
          </div>
          <span className="font-mono text-[11px] text-[#FFD700]">UGX Currency</span>
        </div>
      </div>

      {/* 2. Right Authentication Form Panel */}
      <div className="lg:w-7/12 xl:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#F8FAFC]">
        <div className="w-full max-w-md space-y-6">
          {/* Card Top Branding */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#091E3A] text-[#FFD700] border border-[#1E3A60]">
                  UCU Single Sign-On
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Role-Aware
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-[#E6007E]" />
                SSL Encrypted
              </div>
            </div>

            <h2 className="text-2xl font-serif font-black text-[#091E3A] tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Enter your institutional credentials. The system automatically identifies your role and permissions upon authentication.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Authentication Failed</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5" htmlFor="login-identifier">
                University Email or Student ID / Reg No.
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. student1@ucu.ac.ug or A92831"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-[#0047AB] transition-all shadow-2xs font-medium"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Students can sign in using their official student email or Registration No. (e.g. A92831).
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#0F172A]" htmlFor="login-password">
                  Password
                </label>
                <a
                  href="#support"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('For password resets, contact the UCU ICT Accounts Helpdesk at accounts-support@ucu.ac.ug or visit Nkoyoyo Hall Helpdesk.');
                  }}
                  className="text-[11px] text-[#0047AB] hover:text-[#091E3A] font-semibold transition-colors"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your university portal password"
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-[#0047AB] transition-all shadow-2xs font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#0047AB] focus:ring-[#0047AB] w-3.5 h-3.5"
                />
                Remember my session on this device
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="btn-login-submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#091E3A] via-[#0047AB] to-[#091E3A] hover:from-[#08172C] hover:to-[#0B2A52] text-white text-xs font-bold transition-all duration-150 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Financial Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant (Without listing all users on screen) */}
          <div className="pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="w-full text-center text-xs text-slate-500 hover:text-[#091E3A] font-semibold flex items-center justify-center gap-1.5 py-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E6007E]" />
              <span>{showDemoCredentials ? 'Hide Evaluation Credentials Guide' : 'Institutional Evaluation Credentials Guide'}</span>
            </button>

            {showDemoCredentials && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs animate-in fade-in">
                <p className="text-[11px] text-slate-600 leading-snug">
                  Click any role profile below to automatically populate the login fields with official UCU demo credentials:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fillQuickCredentials('student1@ucu.ac.ug', 'Password123!')}
                    className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-[#00883E] hover:bg-emerald-50/50 transition-all"
                  >
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      Student
                    </span>
                    <p className="font-semibold text-slate-800 text-[11px] mt-1">Jane Namukasa</p>
                    <p className="text-[10px] text-slate-500 font-mono">student1@ucu.ac.ug</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillQuickCredentials('officer@ucu.ac.ug', 'Password123!')}
                    className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-[#0047AB] hover:bg-blue-50/50 transition-all"
                  >
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                      Accounts Officer
                    </span>
                    <p className="font-semibold text-slate-800 text-[11px] mt-1">Sarah Tumusiime</p>
                    <p className="text-[10px] text-slate-500 font-mono">officer@ucu.ac.ug</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillQuickCredentials('senior@ucu.ac.ug', 'Password123!')}
                    className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-[#E6007E] hover:bg-pink-50/50 transition-all"
                  >
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-pink-100 text-pink-800">
                      Senior Officer
                    </span>
                    <p className="font-semibold text-slate-800 text-[11px] mt-1">Patrick Mukasa</p>
                    <p className="text-[10px] text-slate-500 font-mono">senior@ucu.ac.ug</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillQuickCredentials('supervisor@ucu.ac.ug', 'Password123!')}
                    className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-[#C69214] hover:bg-amber-50/50 transition-all"
                  >
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                      Accounts Supervisor
                    </span>
                    <p className="font-semibold text-slate-800 text-[11px] mt-1">Dr. Florence K.</p>
                    <p className="text-[10px] text-slate-500 font-mono">supervisor@ucu.ac.ug</p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Security Guarantee Notice */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/90 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-slate-700 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-[#00883E]" />
              <span>UCU Directorate of Financial Services Security Gateway</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              Protected by 256-bit encryption. Unauthorized access is subject to university disciplinary and legal proceedings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
