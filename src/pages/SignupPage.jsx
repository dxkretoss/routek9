import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Truck, ArrowRight, Lock, Mail, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function SignupPage({ onSignup }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [signupRole, setSignupRole] = useState('driver'); // 'driver' or 'company'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleType, setVehicleType] = useState('Cargo Van');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      name: fullName || (signupRole === 'driver' ? 'Jane A. Driver' : 'Acme Logistics'),
      email: email || 'driver@routek9.com',
      vehicle: signupRole === 'driver' ? vehicleType : 'Company Fleet',
      role: signupRole,
      stateCode: 'TX',
      city: 'Houston'
    };

    if (onSignup) {
      onSignup(newUser);
    }
    navigate(redirectPath);
  };

  const handleGoogleSignup = () => {
    const newUser = {
      name: 'Google User',
      email: 'googleuser@gmail.com',
      vehicle: 'Cargo Van',
      role: 'driver',
      stateCode: 'TX',
      city: 'Houston'
    };

    if (onSignup) {
      onSignup(newUser);
    }
    navigate(redirectPath);
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
          <span>Free driver registration</span>
          <span className="text-rose-400 font-bold">No credit card required</span>
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
              className="w-full py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer"
            >
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
            </button>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* SIGNING UP AS TOGGLE */}
            <div className="space-y-2">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-sans">
                I'm signing up as
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSignupRole('driver')}
                  className={`py-3 px-4 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                    signupRole === 'driver'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                      : 'bg-white text-[#0b132b] border-slate-200/90 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  A driver
                </button>
                <button
                  type="button"
                  onClick={() => setSignupRole('company')}
                  className={`py-3 px-4 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                    signupRole === 'company'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                      : 'bg-white text-[#0b132b] border-slate-200/90 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  A company
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
                  required
                  placeholder={signupRole === 'driver' ? 'John Doe' : 'Acme Logistics'}
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
                  required
                  placeholder="driver@routek9.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Primary Vehicle Select (Only visible for driver) */}
            {signupRole === 'driver' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Primary Vehicle Class
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                >
                  <option value="Sedan / Hatchback">Sedan / Hatchback</option>
                  <option value="Minivan / SUV">Minivan / SUV</option>
                  <option value="Cargo Van">Cargo Van</option>
                  <option value="Sprinter / High-Top Van">Sprinter / High-Top Van</option>
                  <option value="16ft Box Truck">16ft Box Truck</option>
                  <option value="26ft Box Truck">26ft Box Truck</option>
                </select>
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
                  required
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
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
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

        {/* Footer */}
        <footer className="pt-8 text-center text-xs text-slate-400 font-medium">
          © 2026 RouteK9 Pro • Contract Drivers of America. All rights reserved.
        </footer>
      </div>

    </div>
  );
}
