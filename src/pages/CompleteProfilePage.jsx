import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInputPkg from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import {
  ShieldCheck,
  Truck,
  Building2,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Mail,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock
} from 'lucide-react';
import { supabase, createNotification } from '../lib/supabase';
import Toast from '../components/Toast';
import { US_STATES_LIST } from '../data/statesData';
import { useVehicleClasses } from '../data/vehicleTypes';

const PhoneInput = PhoneInputPkg?.default || PhoneInputPkg;

export default function CompleteProfilePage({ currentUser, onComplete }) {
  const PRIMARY_VEHICLE_CLASSES = useVehicleClasses();
  const navigate = useNavigate();
  const hasLoadedRef = useRef(false);

  // Role Selection: 'driver', 'company', or '' (unselected until user picks)
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [stateCode, setStateCode] = useState('TX');
  const [city, setCity] = useState('');

  // Driver specific
  const [vehicleClass, setVehicleClass] = useState('Cargo Van');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Strip trailing URL hash (# or #access_token=...)
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(null, '', window.location.origin + window.location.pathname + window.location.search);
    }

    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Populate known metadata from current user or Supabase auth session once on mount
    const loadSessionData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user || currentUser;

        if (user) {
          const userEmail = (user.email || currentUser?.email || '').trim().toLowerCase();
          const isSuperAdmin = user.user_metadata?.role === 'admin' || currentUser?.role === 'admin';
          if (isSuperAdmin) {
            navigate('/admin', { replace: true });
            return;
          }

          const metaName = user.user_metadata?.full_name || user.user_metadata?.name || currentUser?.name || '';

          setEmail(userEmail);
          if (metaName && metaName !== 'User' && metaName !== 'Driver User') {
            setFullName((prev) => prev || metaName);
          }

          // Check if profile already exists in DB
          if (user.id) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

            if (prof) {
              if (prof.onboarding_completed === true) {
                navigate('/dashboard', { replace: true });
                return;
              }
              if (prof.role) {
                setRole(prof.role.toLowerCase() === 'company' ? 'company' : 'driver');
              }
              if (prof.full_name) setFullName(prof.full_name);
              if (prof.phone) setPhone(prof.phone);
              if (prof.state_code) setStateCode(prof.state_code);
              if (prof.city) setCity(prof.city);

              if (prof.vehicle && prof.vehicle !== 'Company Fleet') {
                setVehicleClass(prof.vehicle);
              }
            } else {
              const metaRole = user.user_metadata?.role;
              if (metaRole) {
                setRole(metaRole.toLowerCase() === 'company' ? 'company' : 'driver');
              }
            }
          }
        }
      } catch (err) {
        console.warn("Notice loading session data for onboarding:", err);
      }
    };

    loadSessionData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 0. Validate Role Selection
    if (!role) {
      setError("Please select whether you are signing up as A Driver or A Company.");
      return;
    }

    const cleanName = fullName.trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanCity = city.trim();
    const cleanState = stateCode.trim().toUpperCase();

    // 1. Validate Full Name / Company Name
    if (!cleanName || cleanName.length < 2) {
      setError(role === 'company' ? "Please enter your Company Name (at least 2 characters)." : "Please enter your Full Name (at least 2 characters).");
      return;
    }

    // 2. Validate Email Address
    if (!cleanEmail) {
      setError("Please enter a valid Email Address.");
      return;
    }

    // 3. Validate Vehicle Class (for Drivers)
    if (role === 'driver' && (!vehicleClass || !vehicleClass.trim())) {
      setError("Please select your Primary Vehicle Class.");
      return;
    }

    // 4. Validate Phone Number
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (!cleanPhone || phoneDigits.length < 7) {
      setError("Please enter a valid Phone Number with area code.");
      return;
    }

    // 5. Validate State Code
    if (!cleanState) {
      setError("Please select your State Code.");
      return;
    }

    // 6. Validate Metro / City
    if (!cleanCity || cleanCity.length < 2) {
      setError("Please enter your Metro / City (at least 2 characters).");
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      const userId = user?.id || currentUser?.id;

      if (!userId) {
        throw new Error("User session expired. Please log in again.");
      }

      const cleanEmail = (email || user?.email || currentUser?.email || '').trim().toLowerCase();

      // Upsert profile
      const profilePayload = {
        id: userId,
        email: cleanEmail,
        full_name: cleanName,
        role: role,
        vehicle: role === 'driver' ? vehicleClass : 'Company Fleet',
        city: cleanCity,
        state_code: cleanState,
        phone: cleanPhone,
        ready_to_work: false,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert(profilePayload);

      if (upsertErr) {
        console.warn("Profile upsert notice:", upsertErr);
        // Fallback: If onboarding_completed column is missing in Supabase schema (PGRST204), retry without it
        if (upsertErr.code === 'PGRST204' || upsertErr.message?.includes('onboarding_completed')) {
          delete profilePayload.onboarding_completed;
          const { error: retryErr } = await supabase
            .from('profiles')
            .upsert(profilePayload);
          if (retryErr) {
            throw retryErr;
          }
        } else {
          throw upsertErr;
        }
      }

      // Create Profile Setup Complete Notification
      try {
        await createNotification({
          userId: userId,
          title: `Profile Setup Complete!`,
          message: `Hello ${cleanName}! Your ${role === 'driver' ? 'driver profile' : 'company profile'} setup is complete.`,
          category: 'System',
          important: true,
        });
      } catch (notifErr) {
        console.warn("Could not save profile complete notification:", notifErr);
      }

      const updatedUserData = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: role,
        vehicle: role === 'driver' ? vehicleClass : 'Company Fleet',
        city: cleanCity,
        stateCode: cleanState,
        phone: cleanPhone,
        onboardingCompleted: true
      };

      if (onComplete) {
        onComplete(updatedUserData);
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error("Complete profile error:", err);
      setError(err.message || "Failed to save profile setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Notice signing out from complete profile:", err);
    }
    if (typeof window !== 'undefined') {
      document.cookie = 'routek9_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    navigate('/login', { replace: true });
  };

  const usStates = US_STATES_LIST;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans selection:bg-rose-600 selection:text-white">

      {/* Left Column: Branding Pane */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0b132b] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden min-h-screen">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group inline-flex">
            <div className="w-11 h-11 rounded-full bg-[#0d1b2a] border-2 border-rose-600 flex flex-col items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-[7px] font-bold uppercase text-slate-300">ROUTE</span>
              <span className="text-xs font-extrabold text-rose-500 leading-none">K9</span>
            </div>
            <div className="text-left font-sans">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white">ROUTE K9</span>
                <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-rose-600 text-white rounded-full border border-rose-500">PRO</span>
              </div>
              <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">CONTRACT DRIVERS OF AMERICA</p>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 my-auto max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-rose-400 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Account Onboarding</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight font-serif-heading">
            Just one quick step to <span className="text-rose-500">get started</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
            Select whether you operate as an Independent Contract Driver or a Dispatching Logistics Company to customize your route network dashboard.
          </p>
        </div>

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

      {/* Right Column: Complete Form Pane */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between min-h-screen bg-white p-8 sm:p-12 lg:p-16">
        <div className="my-auto w-full max-w-md mx-auto space-y-7 animate-fadeIn">
          {error && (
            <Toast
              message={error}
              type="error"
              duration={5000}
              onClose={() => setError(null)}
            />
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading">
                Complete Your Profile
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Specify your account role and information to finish setting up your dashboard.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBackToLogin}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs mt-1"
              title="Sign out and return to login screen"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Back to Login</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            {/* ROLE SELECTOR: I'M SIGNING UP AS */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                I'M SIGNING UP AS
              </label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100/80 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${role === 'driver'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>A Driver</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('company')}
                  className={`py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${role === 'company'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>A Company</span>
                </button>
              </div>
            </div>

            {/* FULL NAME / COMPANY NAME */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {role === 'company' ? 'COMPANY NAME' : 'FULL NAME'}
              </label>
              <div className="relative">
                {role === 'company' ? (
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                ) : (
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                )}
                <input
                  type="text"
                  required
                  placeholder={role === 'company' ? 'Enter Company name' : 'Enter Full name'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* EMAIL ADDRESS (Disabled, non-editable from Google / Auth) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  EMAIL ADDRESS
                </label>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Verified</span>
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full pl-10 pr-4 py-3 bg-slate-100/90 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* IF DRIVER: PRIMARY VEHICLE CLASS */}
            {role === 'driver' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  PRIMARY VEHICLE CLASS
                </label>
                <div className="relative">
                  <Truck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <select
                    value={vehicleClass}
                    onChange={(e) => setVehicleClass(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    {PRIMARY_VEHICLE_CLASSES.map((vc) => (
                      <option key={vc} value={vc}>{vc}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* PHONE NUMBER */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                PHONE NUMBER
              </label>
              <div className="relative">
                <PhoneInput
                  country={'us'}
                  value={phone}
                  onChange={(val) => setPhone(val)}
                  inputStyle={{
                    width: '100%',
                    height: '46px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    paddingLeft: '48px',
                    color: '#1e293b'
                  }}
                  buttonStyle={{
                    backgroundColor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    borderTopLeftRadius: '0.75rem',
                    borderBottomLeftRadius: '0.75rem',
                    paddingLeft: '4px'
                  }}
                  dropdownStyle={{
                    borderRadius: '0.75rem',
                    color: '#1e293b',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* STATE & METRO / CITY */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  STATE CODE
                </label>
                <select
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all cursor-pointer"
                >
                  {usStates.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.code} - {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  METRO / CITY
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Houston"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] disabled:opacity-75 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup & Proceed</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-xs text-slate-500 hover:text-rose-600 font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Wrong account? Sign out and return to Login</span>
              </button>
            </div>
          </form>
        </div>

        <footer className="pt-8 text-center text-xs text-slate-400 font-medium">
          © 2026 RouteK9 Pro • Contract Drivers of America. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
