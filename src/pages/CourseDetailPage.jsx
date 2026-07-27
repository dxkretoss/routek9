import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { COURSES_DATA } from '../data/coursesData';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const COURSE_BG_IMAGES = {
  "master-contractor": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",
  "logistics-consultant": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80",
  "delivery-company": "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1600&q=80",
  "notary-public": "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1600&q=80",
  "field-inspector": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80",
  "courier-dispatcher": "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=80"
};

export default function CourseDetailPage({ currentUser, onLogout }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const course = COURSES_DATA.find((c) => c.id === courseId) || COURSES_DATA[0];

  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [expandedModules, setExpandedModules] = useState({ 0: true, 1: true });
  const [authError, setAuthError] = useState(null);

  const toggleModule = (index) => {
    setExpandedModules((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handlePurchaseClick = () => {
    setAuthError(null);

    // Validation: Require Login before purchasing course
    if (!currentUser) {
      setAuthError("Login required to purchase course and claim your completion certificate. Redirecting to login...");
      setTimeout(() => {
        navigate(`/login?redirect=/training/${course.id}`);
      }, 1500);
      return;
    }

    // Proceed to Test Mode Payment Gateway
    navigate(`/checkout/${course.id}`, { state: { fullName } });
  };

  const bgImg = COURSE_BG_IMAGES[course.id] || COURSE_BG_IMAGES["master-contractor"];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900 font-sans selection:bg-rose-600 selection:text-white">
      
      {/* Header */}
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      {/* Hero Header with Course Background Image & Gradient Overlay */}
      <section className="relative overflow-hidden bg-slate-950 border-b border-slate-800 py-12 sm:py-16 text-white">
        
        {/* Course Background Image */}
        <img 
          src={bgImg} 
          alt={course.title}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />

        {/* Gradient Overlay for Crisp Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/65" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 relative z-10">
          
          <Link
            to="/training"
            className="text-xs font-bold text-rose-300 hover:text-white inline-flex items-center gap-1.5 transition-colors uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ALL COURSES</span>
          </Link>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-serif-heading leading-tight">
            {course.title}
          </h1>

          <p className="text-rose-400 text-base sm:text-lg font-bold font-sans">
            {course.subtitle}
          </p>

          <p className="text-slate-300 text-sm sm:text-base max-w-3xl font-normal leading-relaxed">
            {course.description}
          </p>

          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <span className="px-4 py-1.5 rounded-full bg-rose-600 text-white font-extrabold text-xs shadow-md">
              {course.projectedPay}
            </span>
            <span className="text-3xl font-extrabold text-white font-sans">
              ${course.price}
            </span>
            <span className="text-xs text-slate-300 font-medium">
              {course.access}
            </span>
          </div>

        </div>
      </section>

      {/* Main Body: 2 Columns Layout */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Outcomes & Expandable Course Outline */}
            <div className="lg:col-span-7 space-y-10">
              
              {/* What you'll be able to do */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">
                  What you'll be able to do
                </h3>
                <div className="space-y-2.5">
                  {course.outcomes.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course outline with expandable modules */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">
                  Course outline
                </h3>

                <div className="space-y-4">
                  {course.outline.map((module, mIdx) => {
                    const isExpanded = !!expandedModules[mIdx];
                    return (
                      <div
                        key={mIdx}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
                      >
                        <button
                          onClick={() => toggleModule(mIdx)}
                          className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <span className="text-base font-bold text-[#0b132b] font-serif-heading">
                            {module.moduleNumber}. {module.moduleTitle}
                          </span>
                          <span className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-1 space-y-2.5 border-t border-slate-100 bg-slate-50/40">
                            {module.lessons.map((lesson, lIdx) => (
                              <div key={lIdx} className="flex items-start gap-3 text-xs text-slate-700 font-medium leading-relaxed">
                                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  {lIdx + 1}
                                </span>
                                <span>{lesson}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>

            {/* Right Column: Enrollment Card */}
            <div className="lg:col-span-5 sticky top-24">
              <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-lg space-y-6">
                
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
                    ENROLL NOW
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#0b132b] font-sans">${course.price}</span>
                    <span className="text-xs text-slate-500 font-medium">one-time</span>
                  </div>
                </div>

                {/* Validation Error Banner */}
                {authError && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Certificate Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
                    FULL NAME (FOR YOUR CERTIFICATE)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jane A. Driver"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-[#0b132b] focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-2xs"
                  />
                </div>

                {/* Purchase Course Button */}
                <button
                  type="button"
                  onClick={handlePurchaseClick}
                  className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Purchase course →</span>
                </button>

                <p className="text-[10px] text-slate-400 font-medium leading-relaxed text-center">
                  Secure checkout. After payment you'll get instant lifetime access and downloadable Route K9 completion certificate.
                </p>

              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
