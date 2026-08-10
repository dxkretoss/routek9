import React, { useState, useEffect } from 'react';
import { User, Mail, Truck, ShieldCheck, MapPin, Building2, Save, FileText, Crown, Sparkles, Zap, Phone } from 'lucide-react';
import Toast from '../components/Toast';
import PhoneInputPkg from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { US_STATES_LIST } from '../data/statesData';
import { PRIMARY_VEHICLE_CLASSES } from '../data/vehicleTypes';

const PhoneInput = PhoneInputPkg?.default || PhoneInputPkg;

export default function ProfilePage({ currentUser, onLogout, onUpdateProfile, onOpenPricing }) {
  const [fullName, setFullName] = useState(currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : ''));
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [accountRole, setAccountRole] = useState(currentUser?.role || 'driver');
  const [vehicleClass, setVehicleClass] = useState(currentUser?.vehicle || 'Cargo Van');
  const [stateCode, setStateCode] = useState(currentUser?.stateCode || '');
  const [cityName, setCityName] = useState(currentUser?.city || '');
  const [dotNumber, setDotNumber] = useState(currentUser?.dotNumber || '');
  const [insurancePolicy, setInsurancePolicy] = useState(currentUser?.insurancePolicy || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : ''));
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAccountRole(currentUser.role || 'driver');
      setVehicleClass(currentUser.vehicle || 'Cargo Van');
      setStateCode(currentUser.stateCode || '');
      setCityName(currentUser.city || '');
      setDotNumber(currentUser.dotNumber || '');
      setInsurancePolicy(currentUser.insurancePolicy || '');
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    if (onUpdateProfile) {
      const res = await onUpdateProfile({
        name: fullName,
        email,
        phone,
        role: accountRole,
        vehicle: vehicleClass,
        stateCode,
        city: cityName,
        dotNumber,
        insurancePolicy
      });

      if (res && res.success === false) {
        setError(res.error || "Failed to update profile. Please try again.");
      } else {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } else {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Header */}
      <section className="bg-[#0b132b] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{accountRole === 'company' ? 'Company Member Profile' : 'Driver Member Profile'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-serif-heading">
            Account & Authority Profile
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-2xl">
            Manage your credentials, operating authority details, and classification for contract bidding.
          </p>

        </div>
      </section>

      {/* Main Body */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Subscription Plan Card */}
          <div className="bg-gradient-to-r from-slate-900 to-[#0b132b] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Current Subscription</span>
                  {currentUser?.isPro ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>PRO MEMBER ACTIVE</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-extrabold">
                      FREE STARTER
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold font-serif-heading text-white">
                  {currentUser?.isPro ? 'Route K9 PRO Membership' : 'Free Starter Plan'}
                </h3>
                <p className="text-xs text-slate-300 font-medium max-w-lg">
                  {currentUser?.isPro
                    ? 'You have full unlimited 400-stop route optimization, government procurement contact details, and direct driver recruitment enabled.'
                    : 'Upgrade to PRO to unlock 400-stop optimization, government contracts procurement contacts, and direct driver recruitment.'}
                </p>
              </div>

              <button
                onClick={onOpenPricing}
                className={`px-5 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  currentUser?.isPro
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    : 'bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>{currentUser?.isPro ? 'Manage Membership' : 'Upgrade to PRO ($29/mo)'}</span>
              </button>
            </div>

            {/* Active Subscription Details Metadata Grid */}
            {currentUser?.isPro && (
              <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-0.5">
                  <div className="text-slate-400 font-medium text-[10px] uppercase">Subscription Status</div>
                  <div className="font-extrabold text-emerald-400">Active & Verified</div>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-0.5">
                  <div className="text-slate-400 font-medium text-[10px] uppercase">Subscribed On</div>
                  <div className="font-bold text-white">{currentUser.subscribedAt || 'July 29, 2026'}</div>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-0.5">
                  <div className="text-slate-400 font-medium text-[10px] uppercase">Next Renewal Date</div>
                  <div className="font-bold text-amber-400">{currentUser.nextRenewal || 'August 29, 2026'}</div>
                </div>
              </div>
            )}

          </div>

          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-lg space-y-8">

            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-[#0b132b] font-serif-heading">
                  {accountRole === 'company' ? 'Company Information' : 'Driver Information'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Update your contact info and logistics authority details.
                </p>
              </div>

              {error && (
                <Toast
                  message={error}
                  type="error"
                  duration={5000}
                  onClose={() => setError(null)}
                />
              )}

              {savedSuccess && (
                <Toast
                  message="Profile saved successfully!"
                  type="success"
                  duration={4000}
                  onClose={() => setSavedSuccess(false)}
                />
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Account Member Type Selector */}
              {/* <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Account Member Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountRole('driver')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      accountRole === 'driver'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Driver Member</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountRole('company')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      accountRole === 'company'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Company Member</span>
                  </button>
                </div>
              </div> */}

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {accountRole === 'company' ? 'Company / Business Name' : 'Full Name (Certificate & Contract Bids)'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Phone Number & USDOT / MC Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Phone Number
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
                        zIndex: 1000
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    USDOT / MC Number (Optional)
                  </label>
                  <div className="relative">
                    <Truck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={dotNumber}
                      onChange={(e) => setDotNumber(e.target.value)}
                      placeholder="e.g. 3849120"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Primary Vehicle Class & Home State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Primary Vehicle Class
                  </label>
                  <select
                    value={vehicleClass}
                    onChange={(e) => setVehicleClass(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                  >
                    {PRIMARY_VEHICLE_CLASSES.map((vc) => (
                      <option key={vc} value={vc}>{vc}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Home State
                  </label>
                  <select
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select State</option>
                    {US_STATES_LIST.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.code} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Operating Metro / City
                  </label>
                  <input
                    type="text"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="Houston"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Commercial Insurance Policy */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Insurance & Compliance Status
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={insurancePolicy}
                    onChange={(e) => setInsurancePolicy(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Save Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Information</span>
                </button>
              </div>

            </form>

          </div>

        </div>
      </main>
    </>
  );
}
