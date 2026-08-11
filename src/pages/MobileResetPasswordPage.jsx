import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    let isMounted = true;

    // 1. Listen for Supabase password recovery events (handles async token exchange)
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
        const type = searchParams.get('type') || hashParams.get('type');

        const errorParam = hashParams.get('error') || searchParams.get('error');
        const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
        const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');

        // Check if URL has error parameters from Supabase (e.g. otp_expired, access_denied)
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

        // 2. PKCE Code Exchange: If ?code=... is in URL, exchange code for active session!
        if (code) {
          try {
            const { data: exchangeData, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeErr) {
              console.warn("PKCE exchange error notice:", exchangeErr);
            } else if (exchangeData?.session) {
              if (isMounted) {
                setIsExpired(false);
                setCheckingLink(false);
              }
              return;
            }
          } catch (exErr) {
            console.warn("PKCE exchange exception:", exErr);
          }
        }

        // 3. Verify active session or recovery token state from Supabase Auth
        const { data: { session } } = await supabase.auth.getSession();

        const hasRecoveryToken =
          code ||
          tokenHash ||
          hash.includes('access_token=') ||
          hash.includes('type=recovery') ||
          type === 'recovery';

        if (session || hasRecoveryToken) {
          // Valid recovery session or recovery token detected!
          if (isMounted) {
            setIsExpired(false);
          }
        } else {
          // No session AND no recovery token in URL
          if (isMounted) {
            setIsExpired(true);
            setExpiredReason("Invalid or expired reset link. Please request a new password reset link from your RouteK9 Mobile App.");
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
      let { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Check for ?code= in URL and attempt code exchange
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const code = searchParams.get('code') || hashParams.get('code');

        if (code) {
          try {
            const { data: exData } = await supabase.auth.exchangeCodeForSession(code);
            if (exData?.session) {
              session = exData.session;
            }
          } catch (exErr) {
            console.warn("Submit session exchange exception:", exErr);
          }
        }
      }

      if (!session) {
        setError("Auth session missing or reset link expired. Please request a new password reset link from your mobile app.");
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
          /* State 2: Expired or Already Used Token */
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 mx-auto border border-rose-500/40">
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-white">Reset Link Expired or Invalid</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {expiredReason || "This password reset link has already been used or has expired. Please open the RouteK9 Mobile App to request a new link."}
              </p>
            </div>
            <div className="pt-2 space-y-2">
              <a
                href="routek9://login"
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open RouteK9 Mobile App</span>
              </a>
              <Link
                to="/"
                className="block w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold transition-all text-center"
              >
                Back to Website
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
          RouteK9 Mobile Driver Network • Secure Supabase Auth
        </div>
      </div>
    </div>
  );
}
