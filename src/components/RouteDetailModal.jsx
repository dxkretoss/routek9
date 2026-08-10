import React, { useState } from 'react';
import { X, Truck, MapPin, DollarSign, Calendar, ShieldCheck, Phone, Mail, CheckCircle2, FileText, Send, Building2, Loader2 } from 'lucide-react';
import { submitRouteBid } from '../lib/supabase';
import { PRIMARY_VEHICLE_CLASSES } from '../data/vehicleTypes';

export default function RouteDetailModal({ route, onClose }) {
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantVehicle, setApplicantVehicle] = useState('Cargo Van');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!route) return null;

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await submitRouteBid({
      driverId: 'drv_' + Date.now(),
      driverName: applicantName,
      driverEmail: applicantEmail,
      routeId: route.id,
      routeTitle: route.title,
      stateCode: route.stateCode || 'TX',
      bidAmount: parseInt(String(route.pay).replace(/[^0-9]/g, ''), 10) || 250,
      notes: `Vehicle: ${applicantVehicle} | Phone: ${applicantPhone}`
    });

    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 sm:p-8 text-white relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-black uppercase tracking-wider mb-3">
            {route.routeType}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold pr-8 leading-tight">
            {route.title}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300 mt-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              {route.city}, {route.stateName} ({route.stateCode})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {route.company}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Key Specs Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">Rate / Pay</span>
              <span className="text-lg font-black text-slate-900">{route.pay} <span className="text-xs font-semibold text-slate-500">{route.payPeriod}</span></span>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">Vehicle Required</span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <Truck className="w-4 h-4 text-rose-600" />
                {route.vehicleRequired}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">Schedule</span>
              <span className="text-sm font-bold text-slate-900">{route.schedule}</span>
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-rose-600" />
              Route Description & Overview
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {route.description}
            </p>
          </div>

          {/* Requirements Checklist */}
          {route.requirements && route.requirements.length > 0 && (
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Contract Requirements & Certifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {route.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 text-xs font-bold text-slate-700 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply Form */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-base font-extrabold text-slate-900 mb-3">
              Direct Route Inquiry & Application
            </h4>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h5 className="text-lg font-bold text-emerald-900">Application Submitted!</h5>
                <p className="text-xs text-emerald-700">
                  Your inquiry has been dispatched to <strong>{route.company}</strong>. Representative will contact you shortly at {applicantPhone || applicantEmail}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <select
                    value={applicantVehicle}
                    onChange={(e) => setApplicantVehicle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                  >
                    {PRIMARY_VEHICLE_CLASSES.map((vc) => (
                      <option key={vc} value={vc}>{vc}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Submit Route Application
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
