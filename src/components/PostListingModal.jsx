import React, { useState } from 'react';
import { X, PlusCircle, CheckCircle2, Truck, Building2 } from 'lucide-react';
import { US_STATES } from '../data/statesData';
import PhoneInputPkg from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const PhoneInput = PhoneInputPkg?.default || PhoneInputPkg;

export default function PostListingModal({ onClose, onAddRoute }) {
  const [title, setTitle] = useState('');
  const [stateCode, setStateCode] = useState('NV');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('open-routes');
  const [routeType, setRouteType] = useState('Dedicated Linehaul');
  const [pay, setPay] = useState('$350');
  const [vehicleRequired, setVehicleRequired] = useState('Cargo Van');
  const [company, setCompany] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedStateObj = US_STATES[stateCode];

    const newRoute = {
      id: `custom-${Date.now()}`,
      title,
      stateCode,
      stateName: selectedStateObj?.name || 'Nevada',
      city: city || 'Las Vegas',
      category,
      routeType,
      pay,
      payPeriod: category === 'for-sale' ? ' asking price' : '/ day',
      distance: 'Local / Regional Route',
      vehicleRequired,
      schedule: 'Mon - Fri',
      company: company || 'Independent Dispatch Co.',
      verified: true,
      featured: true,
      urgency: 'New Listing',
      description: description || 'New contract route listing posted on RouteK9 marketplace.',
      requirements: ['Clean Driving Record', 'Active Cargo Insurance'],
      contactEmail: 'contact@dispatchnetwork.com',
      contactPhone: contactPhone || '(555) 019-2831'
    };

    onAddRoute(newRoute);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2 text-rose-600 font-extrabold text-xs uppercase tracking-wider mb-1">
            <PlusCircle className="w-4 h-4" />
            Marketplace Publisher
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            Post a Route or Business Listing
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Connect with 15,000+ active independent courier drivers and route buyers.
          </p>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-4">
          {submitted ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Listing Published Live!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your listing <strong>"{title}"</strong> has been successfully added to the RouteK9 directory and updated on the interactive map.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Listing Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Las Vegas to Reno Daily Medical Specimen Linehaul"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Listing Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="open-routes">Open Contract Route</option>
                    <option value="for-sale">Route For Sale</option>
                    <option value="business-hiring">Business Hiring</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    State Location
                  </label>
                  <select
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
                  >
                    {Object.values(US_STATES).map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City / Metro
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Las Vegas"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pay / Asking Price
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. $420/day or $150,000"
                    value={pay}
                    onChange={(e) => setPay(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleRequired}
                    onChange={(e) => setVehicleRequired(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Cargo Van">Cargo Van</option>
                    <option value="Sprinter Van">Sprinter Van</option>
                    <option value="16ft Box Truck">16ft Box Truck</option>
                    <option value="26ft Box Truck">26ft Box Truck</option>
                    <option value="SUV / Sedan">SUV / Sedan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Silver State Freight"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone Number (With Country Code)
                </label>
                <PhoneInput
                  country={'us'}
                  value={contactPhone}
                  onChange={(val) => setContactPhone(val)}
                  inputStyle={{
                    width: '100%',
                    height: '40px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    paddingLeft: '44px',
                    color: '#1e293b'
                  }}
                  buttonStyle={{
                    backgroundColor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    borderTopLeftRadius: '0.75rem',
                    borderBottomLeftRadius: '0.75rem',
                    paddingLeft: '2px'
                  }}
                  dropdownStyle={{
                    borderRadius: '0.75rem',
                    zIndex: 1000
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description & Specs
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe cargo details, route requirements, stops, and schedules..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold text-sm shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Publish Listing to Map & Directory
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
