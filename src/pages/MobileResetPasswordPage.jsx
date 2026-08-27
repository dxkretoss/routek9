import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Multi-strategy helper to verify Supabase recovery token/code across devices and flows
 */
async function establishRecoverySession() {
  try {
    // 1. Check if an active session is already available
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

  // Strategy 1: URL Hash with access_token & refresh_token (Implicit Flow - works across all devices)
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  if (accessToken && refreshToken) {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      if (!error && data?.session) {
        return data.session;
      }
    } catch (e) {
      console.warn("setSession error:", e);
    }
  }

  // Strategy 2: verifyOtp using token_hash (Standard Supabase password recovery OTP)
  const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
  const type = searchParams.get('type') || hashParams.get('type') || 'recovery';

  if (tokenHash) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type === 'recovery' ? 'recovery' : type
      });
      if (!error && data?.session) {
        return data.session;
      }
    } catch (err) {
      console.warn("verifyOtp token_hash notice:", err);
    }
  }

  // Strategy 3: exchangeCodeForSession (PKCE authorization code flow)
  const code = searchParams.get('code') || hashParams.get('code');
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.session) {
        return data.session;
      }
    } catch (err) {
      console.warn("exchangeCodeForSession notice:", err);
    }
  }

  // Strategy 4: Final getSession check
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

export default function MobileResetPasswordPage() {
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

  // Fallback resend reset link state
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState(null);

  const handleResendLink = async (e) => {
    e.preventDefault();
    const cleanEmail = resendEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setResendError("Please enter your email address.");
      return;
    }
    try {
      setResending(true);
      setResendError(null);
      setResendSuccess(false);

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/mobile-reset-password`
      });
      if (error) throw error;
      setResendSuccess(true);
    } catch (err) {
      console.error("Resend reset link error:", err);
      setResendError(err.message || "Failed to send reset link. Please check your email.");
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Listen for Supabase password recovery auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setIsExpired(false);
        setCheckingLink(false);
      }
    });

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

        // Check if URL has explicit error parameters from Supabase
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
            if (isMounted) {
              setIsExpired(true);
              setExpiredReason("This password reset link has already been used or has expired. For your security, reset links are single-use only.");
            }
            return;
          }
        }

        // Check if link was marked as used in current session AFTER a successful submit
        const wasUsed = sessionStorage.getItem('rk9_mobile_reset_link_used') === 'true';
        if (wasUsed) {
          if (isMounted) {
            setIsExpired(true);
            setExpiredReason("This password reset link has already been used to update your password. You can now log into the RouteK9 Mobile App.");
          }
          return;
        }

        // Attempt establishing recovery session across all strategies
        const session = await establishRecoverySession();

        if (session) {
          if (isMounted) {
            setIsExpired(false);
          }
        } else {
          if (isMounted) {
            setIsExpired(true);
            setExpiredReason("This password reset link was requested on your mobile device or has expired. Please enter your email below to receive a fresh reset link on this browser, or open the link on your mobile phone.");
          }
        }
      } catch (err) {
        console.warn("Mobile reset link verification notice:", err);
      } finally {
        if (isMounted) setCheckingLink(false);
      }
    };

    verifyResetLink();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
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
      setError("Passwords do not match. Please verify both passwords are identical.");
      return;
    }

    try {
      setLoading(true);

      // Verify or establish session before calling updateUser
      const session = await establishRecoverySession();

      if (!session) {
        setError("Auth session missing or reset link expired. Please request a fresh password reset link below.");
        setLoading(false);
        return;
      }

      const { data, error: updateErr } = await supabase.auth.updateUser({
        password: cleanPw
      });

      if (updateErr) {
        console.error("Mobile password update error:", updateErr);
        setError(updateErr.message || "Failed to update password. Please check your reset link and try again.");
        setSuccess(false);
        return;
      }

      if (!data || !data.user) {
        console.error("Supabase updateUser returned no user object.");
        setError("Password update failed. No user object returned by authentication server.");
        setSuccess(false);
        return;
      }

      // Mark link as consumed
      sessionStorage.setItem('rk9_mobile_reset_link_used', 'true');

      // Clear local session so security link cannot be reused
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (soErr) {
        console.warn("Signout notice:", soErr);
      }

      setSuccess(true);
    } catch (err) {
      console.error("Mobile password update error:", err);
      setError(err?.message || "Failed to update password. Please try again.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b132b] flex flex-col items-center justify-center p-4 sm:p-6 text-white font-sans selection:bg-rose-500 selection:text-white">
      {/* Background Subtle Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-[#1c2541]/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 animate-fadeIn">

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-0.5 shadow-xl shadow-rose-600/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0b132b] rounded-[14px] flex flex-col items-center justify-center">
              <Smartphone className="w-6 h-6 text-rose-500" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-extrabold uppercase tracking-widest text-rose-400">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Mobile App Password Reset</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-serif-heading">
              RouteK9 Mobile Auth
            </h1>
          </div>
        </div>

        {/* State 1: Checking Link Validity */}
        {checkingLink ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">Verifying secure mobile access token...</p>
          </div>
        ) : isExpired ? (
          /* State 2: Expired or Cross-Device Link */
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 mx-auto border border-rose-500/40">
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-white">Reset Link Expired or Cross-Device</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {expiredReason || "This security link has expired or was initiated on another device. Enter your email below to receive a fresh password reset link."}
              </p>
            </div>

            {/* Inline Resend Reset Email Form */}
            {resendSuccess ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold space-y-1">
                <div className="flex items-center justify-center gap-1.5 font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Fresh Reset Link Sent!</span>
                </div>
                <p className="text-[11px] text-emerald-300">
                  Please check your inbox at <strong className="text-white">{resendEmail}</strong> and click the link.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResendLink} className="space-y-2.5 pt-1 text-left">
                {resendError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-semibold">
                    {resendError}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    Your Registered Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <span>Send Fresh Reset Link</span>
                  )}
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-slate-700/50 space-y-2">
              <a
                href="routek9://login"
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open RouteK9 Mobile App</span>
              </a>
              <Link
                to="/"
                className="block w-full py-2 text-slate-400 hover:text-white text-xs font-medium transition-colors text-center"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        ) : success ? (
          /* State 3: Success Banner specifically for Mobile App */
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-5 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20 relative">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Password Reset Complete!
              </h3>
              <p className="text-xs text-emerald-200 font-medium leading-relaxed max-w-xs mx-auto">
                Your password has been updated successfully. You can now log into your <span className="font-bold text-white">RouteK9 Mobile App</span> with your new credentials.
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <a
                href="routek9://login"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Log In to Mobile App</span>
              </a>
              <Link
                to="/"
                className="block w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-bold transition-all text-center"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          /* State 4: Password Input Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-left space-y-1">
              <h2 className="text-lg font-bold text-white">Set New Password</h2>
              <p className="text-xs text-slate-400 font-medium">
                Enter your new password below to update your mobile app account.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* New Password Field */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showNewPw ? "text" : "password"}
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPw ? "text" : "password"}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                newPassword.trim() === confirmPassword.trim() ? (
                  <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Passwords match</span>
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Passwords do not match</span>
                  </p>
                )
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-75 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving Password...</span>
                </>
              ) : (
                <>
                  <span>Save Password for Mobile App</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="pt-2 text-center text-[11px] text-slate-500 font-medium">
          RouteK9 Mobile Driver Network • Secure 256-bit Encryption
        </div>
      </div>
    </div>
  );
}
