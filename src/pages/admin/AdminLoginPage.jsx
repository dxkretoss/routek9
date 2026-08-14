import React, { useState } from 'react';
import adminLoginLogo from '../../assets/adminloginlogo.png';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminLoginPage({ onAdminLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      // 1. Authenticate via Supabase Auth
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });

      if (supabaseError) {
        setError(supabaseError.message || 'Invalid email or password.');
        return;
      }

      if (data?.session && data?.user) {
        const user = data.user;

        // 2. Fetch user profile from Supabase database to verify role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const userRole = profile?.role || user.user_metadata?.role;

        // 3. Strict check: Must have role === 'admin' in database
        if (userRole === 'admin') {
          onAdminLogin(user);
        } else {
          // Immediately sign out non-admin user and reject access
          await supabase.auth.signOut();
          setError('Access Denied: This account does not have administrator privileges. Please log in with an administrator account.');
        }
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b132b] p-4 font-sans antialiased">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative w-full max-w-md space-y-8 animate-fadeIn">
        {/* Brand Logo */}
        <div className="text-center space-y-4">
          <img src={adminLoginLogo} className='h-20 mx-auto'></img>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-serif-heading">
              Admin Console
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Enter admin email & password to access the dashboard
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">

          {/* Security Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600/10 border border-rose-600/20">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Supabase Role Security</span>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-xs font-bold text-rose-300">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {/* Dummy hidden inputs to block aggressive browser autofill */}
            <input type="text" name="prevent_autofill_admin_email" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" autoComplete="off" />
            <input type="password" name="prevent_autofill_admin_pw" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" autoComplete="new-password" />

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="admin_email_nofill"
                  required
                  autoComplete="off"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:bg-white/10 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPw ? 'text' : 'password'}
                  name="admin_pw_nofill"
                  required
                  autoComplete="new-password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:bg-white/10 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-75 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Admin Panel</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-500 font-medium">
            This area is restricted to users with the 'admin' database role.
          </p>
        </div>
      </div>
    </div>
  );
}
