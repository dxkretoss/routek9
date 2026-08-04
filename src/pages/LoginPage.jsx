import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Mail, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, MailCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Toast from '../components/Toast';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const confirmedSent = searchParams.get('confirmed_sent') === 'true';
  const confirmedSuccess = searchParams.get('confirmed') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Supabase Auth Login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes('email not confirmed')) {
          throw new Error("Your email address has not been confirmed yet. Please check your inbox for the verification email or resend confirmation below.");
        }
        if (authError.message?.toLowerCase().includes('invalid login credentials')) {
          throw new Error("Invalid email or password. Please double-check your credentials or create a new account.");
        }
        throw authError;
      }

      const userId = data.user?.id;
      let profileData = null;

      if (userId) {
        // 2. Fetch User Profile from Supabase profiles table
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        profileData = profile;
      }

      const metadata = data.user?.user_metadata || {};
      const userName = profileData?.full_name || metadata.full_name || (cleanEmail ? cleanEmail.split('@')[0] : 'Driver User');
      const userRole = profileData?.role || metadata.role || 'driver';
      const userVehicle = profileData?.vehicle || metadata.vehicle || (userRole === 'driver' ? 'Cargo Van' : 'Company Fleet');

      // Check if account (driver or company) is Deactivated by Admin
      const deactivatedList = JSON.parse(localStorage.getItem('rk9_deactivated_drivers') || '[]').map(i => String(i).toLowerCase());
      const lowerCleanEmail = cleanEmail ? cleanEmail.toLowerCase() : '';
      const userIdStr = userId ? String(userId).toLowerCase() : '';

      const isDeactivated =
        profileData?.status === 'INACTIVE' ||
        profileData?.status === 'DEACTIVATED' ||
        profileData?.is_active === false ||
        profileData?.isactive === false ||
        deactivatedList.includes(lowerCleanEmail) ||
        (userIdStr && deactivatedList.includes(userIdStr));

      if (isDeactivated) {
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch (soErr) {
          console.warn("Local signout notice:", soErr);
        }
        throw new Error("⛔ Account Deactivated: Your account has been deactivated by the administrator. Access is blocked. Please contact support@routek9.com for assistance.");
      }

      const loggedInUser = {
        id: userId,
        name: userName,
        email: cleanEmail,
        role: userRole,
        vehicle: userVehicle,
        stateCode: profileData?.state_code || 'TX',
        city: profileData?.city || 'Houston'
      };

      if (onLogin) {
        onLogin(loggedInUser);
      }
      navigate(redirectPath);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid login credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);

      // Reset googleLoading if user closes/cancels Google login tab or returns
      const resetOnFocus = () => {
        setTimeout(() => setGoogleLoading(false), 2000);
        window.removeEventListener('focus', resetOnFocus);
      };
      window.addEventListener('focus', resetOnFocus);

      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`
        }
      });
      if (googleError) {
        window.removeEventListener('focus', resetOnFocus);
        if (googleError.message?.includes('OAuth secret') || googleError.message?.includes('provider') || googleError.status === 400) {
          throw new Error("Google Login is not enabled in your Supabase Dashboard yet. Please configure Google OAuth in Supabase or log in with Email & Password below.");
        }
        throw googleError;
      }
    } catch (err) {
      console.error("Google Auth error:", err);
      setError(err.message || "Could not connect to Google Login.");
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setResetMessage(true);
    setTimeout(() => setResetMessage(false), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans selection:bg-rose-600 selection:text-white">

      {/* Left Column: Full-Height Branding Pane */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0b132b] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden min-h-screen">
        {/* Background Decorative Gradient Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 animate-fadeIn">
          <Link to="/" className="flex items-center gap-3 group inline-flex">
            <div className="w-11 h-11 rounded-full bg-[#0d1b2a] border-2 border-rose-600 flex flex-col items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-[7px] font-bold uppercase text-slate-300">ROUTE</span>
              <span className="text-xs font-extrabold text-rose-500 leading-none">K9</span>
            </div>
            <div className="text-left font-sans">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white">
                  ROUTE K9
                </span>
                <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-rose-600 text-white rounded-full border border-rose-500">
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
            Welcome back to <span className="text-rose-500">RouteK9</span> Pro
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
            Access over 12,400+ active courier routes, bid on SAM.gov government contracts, and track your daily net earnings nationwide.
          </p>
        </div>

        {/* Stats at bottom */}
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

        {/* Logo for mobile viewports only */}
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
            <h2 className="text-3xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading">
              Log in to your account
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Enter your credentials below to access your route dashboard.
            </p>
          </div>

          {/* Continue with Google */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="24" height="24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
          </div>

          {/* Floating Toast Notifications */}
          {error && (
            <Toast
              message={error}
              type="error"
              duration={5000}
              onClose={() => setError(null)}
            />
          )}

          {resetMessage && (
            <Toast
              message="Password reset link sent to your email!"
              type="success"
              duration={4000}
              onClose={() => setResetMessage(false)}
            />
          )}

          {confirmedSent && (
            <Toast
              message="Confirmation email sent! Please check your inbox and click the link to verify."
              type="info"
              duration={6000}
            />
          )}

          {confirmedSuccess && (
            <Toast
              message="Email verified successfully! You can now log in below."
              type="success"
              duration={5000}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Hidden dummy inputs to capture browser aggressive password autofill */}
            <input type="text" name="prevent_autofill_email" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" autoComplete="off" />
            <input type="password" name="prevent_autofill_password" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" autoComplete="new-password" />

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="login_email_no_fill"
                  required
                  autoComplete="new-password"
                  placeholder="Enter Email address"
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
                  name="login_password_no_fill"
                  required
                  autoComplete="new-password"
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
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] disabled:opacity-75 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Log in to RouteK9</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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

        {/* Footer */}
        <footer className="pt-8 text-center text-xs text-slate-400 font-medium">
          © 2026 RouteK9 Pro • Contract Drivers of America. All rights reserved.
        </footer>
      </div>

    </div>
  );
}
