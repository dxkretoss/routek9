import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Truck, ArrowRight, Lock, Mail, User, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, MailCheck, Info } from 'lucide-react';
import { supabase, createNotification } from '../lib/supabase';
import Toast from '../components/Toast';

export default function SignupPage({ onSignup }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [signupRole, setSignupRole] = useState('driver'); // 'driver' or 'company'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleType, setVehicleType] = useState('Cargo Van');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('TX');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState(null);

  const handleResendEmail = async () => {
    if (!email) return;
    try {
      setResending(true);
      setResendError(null);
      setResendSuccess(false);

      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (resendErr) throw resendErr;
      setResendSuccess(true);
    } catch (err) {
      console.error("Resend confirmation error:", err);
      setResendError(err.message || "Failed to resend confirmation email.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    let nameToSave = fullName.trim();

    // Company Validation
    if (signupRole === 'company') {
      if (!nameToSave || nameToSave.length < 3) {
        setError("Please enter a valid Company Name (at least 3 characters).");
        setLoading(false);
        return;
      }
      if (/^\d+$/.test(nameToSave)) {
        setError("Company Name cannot consist of numbers only.");
        setLoading(false);
        return;
      }
    }

    // Fallback name
    nameToSave = nameToSave || cleanEmail.split('@')[0] || 'User';

    // Password Validation for Non-Technical Users
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      setError("Your password needs at least 1 uppercase letter (A-Z), 1 lowercase letter (a-z), 1 number (0-9), and 1 special symbol (e.g. @, #, $, !).");
      setLoading(false);
      return;
    }

    // Check for common sequence patterns like 'Test@123', 'Password123'
    const commonWords = ['test', 'password', 'admin', 'user', '1234', 'qwerty', 'abc123'];
    const lowerPw = password.toLowerCase();
    if (commonWords.some(word => lowerPw.includes(word))) {
      setError("This password contains a common pattern (like 'Test', 'Password', or '1234') that is easy to guess. Please choose a more unique password.");
      setLoading(false);
      return;
    }

    try {
      const cleanCity = city.trim() || 'Houston';
      const cleanState = stateCode.trim().toUpperCase() || 'TX';

      // 0. Pre-Signup Validation: Ensure email is unique in the database
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .limit(1);

      if (existingProfiles && existingProfiles.length > 0) {
        throw new Error(`An account with email "${cleanEmail}" already exists. Please log in instead.`);
      }

      // 1. Supabase Auth Registration
      const { data, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: nameToSave,
            role: signupRole,
            vehicle: vehicleType,
            city: cleanCity,
            state_code: cleanState
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes('already registered') || authError.message?.toLowerCase().includes('already exists')) {
          throw new Error(`An account with email "${cleanEmail}" already exists. Please log in instead.`);
        }
        throw authError;
      }

      // Supabase returns identities: [] when the user/email ALREADY exists in the database!
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error(`An account with email "${cleanEmail}" already exists. Please log in instead.`);
      }

      const userId = data.user?.id;
      if (userId) {
        // Single source of truth profile record in profiles table
        const { error: upsertErr } = await supabase.from('profiles').upsert({
          id: userId,
          full_name: nameToSave,
          email: cleanEmail,
          role: signupRole,
          vehicle: vehicleType,
          city: cleanCity,
          state_code: cleanState,
          created_at: new Date().toISOString()
        });

        if (upsertErr) {
          if (upsertErr.code === '23503' || upsertErr.message?.includes('foreign key')) {
            throw new Error(`An account with email "${cleanEmail}" already exists. Please log in instead.`);
          }
          throw upsertErr;
        }

        // Create welcome notification
        try {
          await createNotification({
            userId,
            title: `Welcome to Route K9!`,
            message: `Hello ${nameToSave}! Welcome to RouteK9. Your ${signupRole === 'driver' ? 'driver profile' : 'dispatch company account'} has been successfully registered. Complete compliance training to get verified.`,
            category: 'System',
            important: true,
            actionUrl: '/dashboard',
            actionText: 'Get Started'
          });
        } catch (notifErr) {
          console.warn("Could not save welcome notification:", notifErr);
        }
      }

      // Check if Supabase sent email verification or auto-confirmed
      if (data.user && !data.session) {
        setConfirmationSent(true);
        return;
      }

      const newUser = {
        id: userId,
        name: nameToSave,
        email: cleanEmail,
        vehicle: signupRole === 'driver' ? vehicleType : 'Company Fleet',
        role: signupRole,
        stateCode: 'TX',
        city: 'Houston'
      };

      if (onSignup) {
        onSignup(newUser);
      }
      navigate(redirectPath);
    } catch (err) {
      console.error("Signup error:", err);
      if (err.code === 'weak_password' || err.message?.toLowerCase().includes('weak') || err.message?.toLowerCase().includes('pwned') || err.message?.toLowerCase().includes('dictionary')) {
        setError("This password is too easy to guess. Please create a unique password that does not use common words like 'Test' or numbers like '123'.");
      } else {
        setError(err.message || "Failed to create account. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      setError(null);

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
          throw new Error("Google Login is not enabled in your Supabase Dashboard yet. Please configure Google OAuth in Supabase or sign up with Email & Password below.");
        }
        throw googleError;
      }
    } catch (err) {
      console.error("Google Signup error:", err);
      setError(err.message || "Could not connect to Google Login.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans selection:bg-rose-600 selection:text-white">

      {/* Left Column: Full-Height Branding Pane */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0b132b] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden min-h-screen">
        {/* Background Decorative Gradient Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

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
            <Truck className="w-4 h-4 text-rose-400" />
            <span>Join 12,400+ Independent Drivers</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight font-serif-heading">
            Start earning on <span className="text-rose-500">RouteK9</span> Pro today
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
            Create your free account to access daily settlement routes, federal SAM.gov contracts, and local courier directories in all 50 states.
          </p>

          {/* Benefits Checklist */}
          <div className="space-y-3 pt-4 text-xs sm:text-sm font-semibold text-slate-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant access to 12,400+ active contract listings</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Live SAM.gov federal courier contracts directory</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Built-in vehicle net profit & pay-per-mile calculators</span>
            </div>
          </div>
        </div>

        {/* Footer info at bottom */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>© 2026 RouteK9 Pro • Contract Drivers of America. All rights reserved.</span>
          {/* <span className="text-rose-400 font-bold">No credit card required</span> */}
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

        {/* Centered Form / Confirmation Screen */}
        {confirmationSent ? (
          <div className="my-auto w-full max-w-md mx-auto space-y-6 animate-fadeIn text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
              <MailCheck className="w-8 h-8 text-emerald-600 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-[#0b132b] font-serif-heading">
                Check Your Email!
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                We sent a confirmation link to <strong className="text-slate-900 font-bold">{email}</strong>. Please check your inbox and click the link to confirm your account.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 text-left space-y-2.5 shadow-2xs">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Info className="w-4 h-4 text-rose-600" />
                <span>Verification Steps:</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-slate-700 font-medium leading-relaxed">
                <li>Open the email sent from <strong>RouteK9 / Supabase</strong></li>
                <li>Click <strong>Confirm My Account</strong></li>
                <li>After confirming, you will be logged in and redirected straight to your dashboard!</li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resending}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending email...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Resend Confirmation Email</span>
                  </>
                )}
              </button>

              {resendSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 text-center animate-fadeIn">
                  ✓ Fresh confirmation email sent! Please check your inbox (and spam folder).
                </div>
              )}

              {resendError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 text-center animate-fadeIn">
                  {resendError}
                </div>
              )}

              <Link
                to={`/login?confirmed_sent=true&redirect=${redirectPath}`}
                className="w-full py-3 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to Login Page</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setConfirmationSent(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                ← Back to Sign Up form
              </button>
            </div>
          </div>
        ) : (
          <div className="my-auto w-full max-w-md mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading">
                Create your account
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Join RouteK9 Pro to discover contract routes near you.
              </p>
            </div>

            {/* Continue with Google */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignup}
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
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
            </div>

            {error && (
              <Toast
                message={error}
                type="error"
                duration={5000}
                onClose={() => setError(null)}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {/* Dummy hidden inputs to trick browser password managers into autofilling them instead */}
              <input type="text" name="prevent_autofill_email" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" autoComplete="off" />
              <input type="password" name="prevent_autofill_password" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" autoComplete="new-password" />

              {/* SIGNING UP AS TOGGLE */}
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-sans">
                  I'm signing up as
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSignupRole('driver')}
                    className={`py-3 px-4 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${signupRole === 'driver'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                      : 'bg-white text-[#0b132b] border-slate-200/90 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    A Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole('company')}
                    className={`py-3 px-4 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${signupRole === 'company'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                      : 'bg-white text-[#0b132b] border-slate-200/90 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    A Company
                  </button>
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {signupRole === 'driver' ? 'Full Name' : 'Company Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    name="signup_fullname_no_fill"
                    required
                    autoComplete="off"
                    placeholder='Enter Full name'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    name="signup_email_no_fill"
                    required
                    autoComplete="new-password"
                    placeholder='Enter Email address'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Primary Vehicle Select (Visible for driver) */}
              {signupRole === 'driver' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Primary Vehicle Class
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                    >
                      <option value="Cargo Van">Cargo Van</option>
                      <option value="Sedan / Hatchback">Sedan / Hatchback</option>
                      <option value="Minivan / SUV">Minivan / SUV</option>
                      <option value="Sprinter / High-Top Van">Sprinter / High-Top Van</option>
                      <option value="16ft Box Truck">16ft Box Truck</option>
                      <option value="26ft Box Truck">26ft Box Truck</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="signup_password_no_fill"
                    required
                    autoComplete="new-password"
                    placeholder="Create a password"
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
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-75 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            {/* Bottom Login Prompt */}
            <div className="pt-4 border-t border-slate-100 text-center text-xs font-medium text-slate-600">
              Already a member?{' '}
              <Link to={`/login${redirectPath !== '/' ? `?redirect=${redirectPath}` : ''}`} className="font-extrabold text-[#0b132b] hover:underline">
                Log in here →
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        {/* <footer className="pt-8 text-center text-xs text-slate-400 font-medium">
          © 2026 RouteK9 Pro • Contract Drivers of America. All rights reserved.
        </footer> */}
      </div>

    </div>
  );
}
