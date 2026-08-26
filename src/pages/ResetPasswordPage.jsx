import React, { useState, useEffect } from 'react';
import footerLogo from '../assets/footerlogo.png';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, KeyRound, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Multi-strategy helper to verify Supabase recovery token/code without requiring a local PKCE code verifier
 */
async function establishRecoverySession() {
  try {
    const { data: currentSessionData } = await supabase.auth.getSession();
    if (currentSessionData?.session) {
      return currentSessionData.session;
    }
  } catch (e) {
    console.warn("getSession notice:", e);
  }

  const hash = window.location.hash || '';
  const search = window.location.search || '';

  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(search);

  const code = searchParams.get('code') || hashParams.get('code');
  const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
  const type = searchParams.get('type') || hashParams.get('type') || 'recovery';

  const tokenToVerify = tokenHash || code;

  if (tokenToVerify) {
    // Strategy 1: verifyOtp using token_hash
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenToVerify,
        type: type === 'recovery' ? 'recovery' : type
      });
      if (!error && data?.session) {
        return data.session;
      }
    } catch (err) {
      console.warn("verifyOtp token_hash notice:", err);
    }

    // Strategy 2: verifyOtp using token
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token: tokenToVerify,
        type: type === 'recovery' ? 'recovery' : type
      });
      if (!error && data?.session) {
        return data.session;
      }
    } catch (err) {
      console.warn("verifyOtp token notice:", err);
    }

    // Strategy 3: exchangeCodeForSession
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(tokenToVerify);
      if (!error && data?.session) {
        return data.session;
      }
    } catch (err) {
      console.warn("exchangeCodeForSession notice:", err);
    }
  }

  try {
    const { data: finalSessionData } = await supabase.auth.getSession();
    if (finalSessionData?.session) {
      return finalSessionData.session;
    }
  } catch (e) {
    // ignore
  }

  return null;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [expiredReason, setExpiredReason] = useState('');
  const [checkingLink, setCheckingLink] = useState(true);

  useEffect(() => {
    const verifyResetLink = async () => {
      try {
        setCheckingLink(true);
        const hash = window.location.hash || '';
        const search = window.location.search || '';

        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        const searchParams = new URLSearchParams(search);

        const code = searchParams.get('code') || hashParams.get('code');
        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');

        const errorParam = hashParams.get('error') || searchParams.get('error');
        const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
        const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');

        // 1. Check if Supabase returned error parameters in URL (e.g. otp_expired, access_denied, invalid_token)
        if (errorParam || errorCode || errorDesc) {
          const descLower = (errorDesc || '').toLowerCase();
          if (
            errorCode === 'otp_expired' ||
            errorCode === 'access_denied' ||
            errorParam === 'access_denied' ||
            descLower.includes('expired') ||
            descLower.includes('invalid') ||
            descLower.includes('already used')
          ) {
            setIsExpired(true);
            setExpiredReason("This password reset link has already been used or has expired. For security reasons, authentication links are single-use only.");
            return;
          }
        }

        // 2. Check if link was marked as used in current session
        const wasUsed = sessionStorage.getItem('rk9_reset_link_used') === 'true';
        if (wasUsed) {
          setIsExpired(true);
          setExpiredReason("This password reset link has already been used to update your password. Please log in with your new credentials or request a new link.");
          return;
        }

        // 3. Establish recovery session
        const session = await establishRecoverySession();

        const hasRecoveryToken =
          Boolean(code) ||
          Boolean(tokenHash) ||
          hash.includes('access_token=') ||
          hash.includes('type=recovery');

        if (session || hasRecoveryToken) {
          setIsExpired(false);
        } else {
          setIsExpired(true);
          setExpiredReason("Invalid or expired reset link. Password reset requires a valid, active link from your email.");
        }
      } catch (err) {
        console.warn("Link verification notice:", err);
      } finally {
        setCheckingLink(false);
      }
    };

    verifyResetLink();
  }, []);

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
    if (!cleanConfirm) {
      setError("Please confirm your new password.");
      return;
    }
    if (cleanPw !== cleanConfirm) {
      setError("Passwords do not match. Please verify both passwords are identical before saving.");
      return;
    }

    try {
      setLoading(true);

      const session = await establishRecoverySession();
      if (!session) {
        setIsExpired(true);
        setExpiredReason("This password reset link has expired or has already been used. Please request a new link.");
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: cleanPw
      });

      if (updateErr) {
        if (
          updateErr.message?.toLowerCase().includes('session') ||
          updateErr.message?.toLowerCase().includes('expired') ||
          updateErr.message?.toLowerCase().includes('invalid') ||
          updateErr.message?.toLowerCase().includes('token')
        ) {
          setIsExpired(true);
          setExpiredReason("This password reset link has expired or has already been used. Please request a new link.");
          return;
        }
        throw updateErr;
      }

      // Mark link as consumed in sessionStorage to prevent re-use
      sessionStorage.setItem('rk9_reset_link_used', 'true');

      // Invalidate local recovery session so the link cannot be used a second time
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (soErr) {
        console.warn("Post-reset signout notice:", soErr);
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
            <img src={footerLogo} className="h-11" />

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
            <div className="text-lg lg:text-xl font-extrabold text-white">50+ States</div>
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
            <img src={footerLogo} className="h-11" />

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

          {checkingLink ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Verifying link validity...</p>
            </div>
          ) : isExpired ? (
            <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-4 animate-scaleUp">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto">
                <AlertCircle className="w-7 h-7 text-rose-600" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-extrabold text-slate-900 font-serif-heading">Link Expired or Already Used</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {expiredReason || "This password reset or confirmation link has already been used or has expired. Security links can only be used once."}
                </p>
              </div>
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/login?forgot=true')}
                  className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Request New Password Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </div>
          ) : success ? (
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
                {confirmPassword.length > 0 && (
                  newPassword.trim() === confirmPassword.trim() ? (
                    <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Passwords match</span>
                    </p>
                  ) : (
                    <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Passwords do not match</span>
                    </p>
                  )
                )}
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
