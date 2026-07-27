import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Mail, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const userName = email ? email.split('@')[0] : 'Jane A. Driver';
    if (onLogin) {
      onLogin({
        name: userName,
        email: email || 'driver@routek9.com',
        vehicle: 'Cargo Van',
        stateCode: 'TX',
        city: 'Houston'
      });
    }
    navigate(redirectPath);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setResetMessage(true);
    setTimeout(() => setResetMessage(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between font-sans selection:bg-rose-600 selection:text-white">
      
      {/* Centered Logo */}
      <div className="p-6 sm:p-8 flex items-center justify-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-full bg-[#0d1b2a] border-2 border-rose-600 flex flex-col items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <span className="text-[7px] font-bold uppercase text-slate-300">ROUTE</span>
            <span className="text-xs font-extrabold text-rose-500 leading-none">K9</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[#0b132b] font-sans">
                ROUTE K9
              </span>
              <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-rose-50 text-rose-600 rounded-full border border-rose-200">
                PRO
              </span>
            </div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              CONTRACT DRIVERS OF AMERICA
            </p>
          </div>
        </Link>
      </div>

      {/* Main 2-Column Split Page Container */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 gap-8 items-center justify-center">
        
        {/* Left Side: Platform Artwork & Showcase Banner */}
        <div className="w-full lg:w-1/2 bg-[#0b132b] text-white p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl flex flex-col justify-between min-h-[520px] relative overflow-hidden">
          
          {/* Background Decorative Gradient Blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-rose-400 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Logistics Drivers Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight font-serif-heading">
              Welcome back to <span className="text-rose-500">RouteK9</span> Pro
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
              Access over 12,400+ active courier routes, bid on SAM.gov government contracts, and track your daily net earnings nationwide.
            </p>

          </div>

          {/* Key Platform Stats Cards */}
          <div className="relative z-10 grid grid-cols-3 gap-3 pt-8 border-t border-slate-800/80 mt-8">
            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="text-xl font-extrabold text-white">50 States</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Full US Coverage</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="text-xl font-extrabold text-rose-500">12,400+</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Active Routes</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="text-xl font-extrabold text-emerald-400">100%</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Verified Carriers</div>
            </div>
          </div>

        </div>

        {/* Right Side: Clean Authentication Box */}
        <div className="w-full lg:w-1/2 max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
          
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading">
              Log in to your account
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Enter your credentials below to access your route dashboard.
            </p>
          </div>

          {/* Reset Password Sent Banner */}
          {resetMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Password reset link sent to your email!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="driver@routek9.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Log in to RouteK9</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Bottom Signup Prompt */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs font-medium text-slate-600">
            Not a member yet?{' '}
            <Link to={`/signup${redirectPath !== '/' ? `?redirect=${redirectPath}` : ''}`} className="font-extrabold text-rose-600 hover:underline">
              Create an account →
            </Link>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-200 text-center text-xs text-slate-400 font-medium">
        © 2026 RouteK9 Pro • Contract Drivers of America. All rights reserved.
      </footer>

    </div>
  );
}
