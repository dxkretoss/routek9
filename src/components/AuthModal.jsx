import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, CheckCircle2, Truck } from 'lucide-react';

export default function AuthModal({ initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('driver'); // 'driver' or 'business'
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/80 text-center">
          <div className="w-12 h-12 rounded-full bg-[#0d1b2a] border-2 border-rose-600 text-white font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-md">
            K9
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-serif-heading">
            {mode === 'login' ? 'Welcome Back to RouteK9' : 'Join RouteK9 Marketplace'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login' 
              ? 'Access 12,400+ verified contract routes & carrier tools.' 
              : 'Create your carrier or driver account to bid on routes.'}
          </p>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-4">
          {submitted ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                {mode === 'login' ? 'Successfully Logged In!' : 'Account Created!'}
              </h4>
              <p className="text-xs text-slate-600">
                Welcome to RouteK9. You now have full access to view contract rates and contact dispatchers directly.
              </p>
              <button
                onClick={onClose}
                className="mt-2 w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Continue to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Account Type Selector for Sign Up */}
              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setRole('driver')}
                    className={`py-2 rounded-lg transition-all ${role === 'driver' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600'}`}
                  >
                    Courier / Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('business')}
                    className={`py-2 rounded-lg transition-all ${role === 'business' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600'}`}
                  >
                    Company / Seller
                  </button>
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="driver@routek9.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{mode === 'login' ? 'Log In to Account' : 'Create Member Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                {mode === 'login' ? (
                  <span>
                    Not a member yet?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Register Now
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Log In
                    </button>
                  </span>
                )}
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
