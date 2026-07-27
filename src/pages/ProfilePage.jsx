import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User, Mail, Truck, ShieldCheck, MapPin, Building2, Save, FileText } from 'lucide-react';

export default function ProfilePage({ currentUser, onLogout, onUpdateProfile }) {
  const [fullName, setFullName] = useState(currentUser?.name || 'Jane A. Driver');
  const [email, setEmail] = useState(currentUser?.email || 'driver@routek9.com');
  const [vehicleClass, setVehicleClass] = useState(currentUser?.vehicle || 'Cargo Van');
  const [stateCode, setStateCode] = useState(currentUser?.stateCode || 'TX');
  const [cityName, setCityName] = useState(currentUser?.city || 'Houston');
  const [dotNumber, setDotNumber] = useState('3849120');
  const [insurancePolicy, setInsurancePolicy] = useState('Commercial Auto ($1,000,000 Liability)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile({
      name: fullName,
      email,
      vehicle: vehicleClass,
      stateCode,
      city: cityName
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900 font-sans selection:bg-rose-600 selection:text-white">
      
      {/* Navbar Header */}
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      {/* Header */}
      <section className="bg-[#0b132b] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Driver Member Profile</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-serif-heading">
            Account & Authority Profile
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-2xl">
            Manage your personal credentials, operating authority details, and vehicle classification for contract bidding.
          </p>

        </div>
      </section>

      {/* Main Body */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-lg space-y-8">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-[#0b132b] font-serif-heading">
                  Driver Information
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Update your contact info and logistics authority details.
                </p>
              </div>

              {savedSuccess && (
                <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  ✓ Profile saved successfully!
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Full Name (Certificate & Contract Bids)
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

              {/* Primary Vehicle Class & DOT/MC Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Primary Vehicle Class
                  </label>
                  <select
                    value={vehicleClass}
                    onChange={(e) => setVehicleClass(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Sedan / Hatchback">Sedan / Hatchback</option>
                    <option value="Minivan / SUV">Minivan / SUV</option>
                    <option value="Cargo Van">Cargo Van</option>
                    <option value="Sprinter / High-Top Van">Sprinter / High-Top Van</option>
                    <option value="16ft Box Truck">16ft Box Truck</option>
                    <option value="26ft Box Truck">26ft Box Truck</option>
                  </select>
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

              {/* State & City Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Home State
                  </label>
                  <input
                    type="text"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    placeholder="TX"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
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

      {/* Footer */}
      <Footer />

    </div>
  );
}
