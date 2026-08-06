import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, KeyRound, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanPw = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPw) {
      setError("Please enter a new password.");
      return;
    }
    if (cleanPw.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (cleanPw !== cleanConfirm) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    try {
      setLoading(true);
      const { error: updateErr } = await supabase.auth.updateUser({
        password: cleanPw
      });

      if (updateErr) {
        throw updateErr;
      }

      setSuccess(true);
      setTimeout(() => {
        if (window.location.hash) {
          window.history.replaceState(null, '', '/login');
        }
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      console.error("Password update error:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0b132b] font-sans selection:bg-rose-500 selection:text-white">
      {/* Left Column: Branding & Stats (Matches Login / Signup Split Screen) */}
      <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0b132b] via-[#1c2541] to-[#0b132b]">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo & Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-[#0d1b2a] border-2 border-rose-600 flex flex-col items-center justify-center text-white shadow-md shrink-0">
              <span className="text-[7px] font-bold uppercase text-slate-300">ROUTE</span>
              <span className="text-xs font-extrabold text-rose-500 leading-none">K9</span>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-white font-serif-heading">
                  ROUTE K9
                </span>
                <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                CONTRACT DRIVERS OF AMERICA
              </p>
            </div>
          </Link>
        </div>

        {/* Center Branding Content */}
        <div className="relative z-10 space-y-6 my-auto max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-rose-400 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Logistics Drivers Platform</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight font-serif-heading">
            Reset your <span className="text-rose-500">RouteK9</span> password
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
            Access over 12,400+ active courier routes, bid on SAM.gov government contracts, and track your daily net earnings nationwide.
          </p>
        </div>

        {/* Stats at Bottom */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-8 border-t border-slate-800/80">
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
            <div className="text-lg lg:text-xl font-extrabold text-white">50 States</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Full US Coverage</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
            <div className="text-lg lg:text-xl font-extrabold text-rose-500">12,400+</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Active Routes</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 text-center">
            <div className="text-lg lg:text-xl font-extrabold text-emerald-400">100%</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Verified Carriers</div>
          </div>
        </div>
      </div>

      {/* Right Column: Clean Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between min-h-screen bg-white p-8 sm:p-12 lg:p-16">
        {/* Mobile Logo Header */}
        <div className="flex lg:hidden items-center justify-center mb-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-full bg-[#0d1b2a] border-2 border-rose-600 flex flex-col items-center justify-center text-white shadow-xs shrink-0">
              <span className="text-[7px] font-bold uppercase text-slate-300">ROUTE</span>
              <span className="text-xs font-extrabold text-rose-500 leading-none">K9</span>
            </div>
            <div className="text-left font-sans">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-[#0b132b]">
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

        {/* Centered Form */}
        <div className="my-auto w-full max-w-md mx-auto space-y-8 animate-fadeIn">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold mb-1">
              <KeyRound className="w-4 h-4 text-rose-600" />
              <span>Password Recovery</span>
            </div>
            <h2 className="text-3xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading">
              Set new password
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Enter your new credentials below to update your account password.
            </p>
          </div>

          {success ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-scaleUp">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-emerald-900">Password Reset Complete!</h4>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  Your account password has been updated successfully. Redirecting to login...
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Go to Login →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* New Password Field */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showNewPw ? "text" : "password"}
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] disabled:opacity-75 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password & Save</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom Back to Login Prompt */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs font-medium text-slate-600">
            Remembered your password?{' '}
            <Link to="/login" className="font-extrabold text-rose-600 hover:underline">
              Log in to RouteK9 →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 text-center text-xs text-slate-400 font-medium">
          © 2026 RouteK9 Pro • Contract Drivers of America. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
