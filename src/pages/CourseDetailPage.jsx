import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCourses } from '../lib/courses';
// import { COURSES_DATA } from '../data/coursesData';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';

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

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({ 0: true, 1: true });
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    async function load() {
      const allCourses = await getCourses();
      const activeCourses = (allCourses || []).filter(c => c.status !== 'INACTIVE');
      const match = activeCourses.find((c) => c.id === courseId) || activeCourses[0] || null;
      setCourse(match);
      setLoading(false);
    }
    load();
  }, [courseId]);

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
        navigate(`/login?redirect=/training/${course?.id || courseId}`);
      }, 1500);
      return;
    }

    // Proceed to stripe embedded checkout page
    navigate(`/checkout/${course?.id || courseId}`);
  };

  if (loading || !course) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
        <span className="text-sm font-bold">Loading course details...</span>
      </div>
    );
  }

  const bgImg = course.image || course.image_url || COURSE_BG_IMAGES[course.id] || COURSE_BG_IMAGES["master-contractor"];

  return (
    <>

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

          {/* <Link
            to="/training"
            className="text-xs font-bold text-rose-300 hover:text-white inline-flex items-center gap-1.5 transition-colors uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to training library</span>
          </Link> */}

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-rose-600 text-white font-extrabold text-xs font-serif-heading">
              COURSE 0{course.number || 1}
            </span>
            <span className="text-xs font-extrabold text-rose-400 uppercase tracking-widest font-sans">
              {course.access || "One-time • Lifetime access"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-serif-heading">
            {course.title}
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-3xl font-medium leading-relaxed font-sans">
            {course.subtitle || course.description}
          </p>

        </div>
      </section>

      {/* Content Section */}
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
                <ul className="space-y-3">
                  {course.outcomes && course.outcomes.map((outcome, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Course Outline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">
                    Course Outline
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {course.outline ? course.outline.length : 0} Modules
                  </span>
                </div>

                <div className="space-y-3">
                  {course.outline && course.outline.map((mod, idx) => {
                    const isExpanded = expandedModules[idx];
                    const moduleTitle = typeof mod === 'string' ? mod : (mod.moduleTitle || mod.title || `Module ${idx + 1}`);
                    const bodyText = typeof mod === 'object' ? mod.body : null;
                    const lessonsList = typeof mod === 'object'
                      ? (Array.isArray(mod.lessons) ? mod.lessons : (Array.isArray(mod.steps) ? mod.steps : []))
                      : [];

                    return (
                      <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                        <button
                          type="button"
                          onClick={() => toggleModule(idx)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600">
                              Module 0{mod.moduleNumber || idx + 1}
                            </div>
                            <div className="text-sm font-bold text-[#0b132b]">
                              {moduleTitle}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-3">
                            {bodyText && (
                              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                {bodyText}
                              </p>
                            )}

                            {lessonsList.length > 0 && (
                              <div className="space-y-2 pt-1">
                                {lessonsList.map((lesson, lIdx) => (
                                  <div key={lIdx} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium bg-white p-2.5 rounded-xl border border-slate-200/60">
                                    <span className="text-rose-600 font-extrabold shrink-0">•</span>
                                    <span>{typeof lesson === 'string' ? lesson : (lesson.title || lesson.body || JSON.stringify(lesson))}</span>
                                  </div>
                                ))}
                              </div>
                            )}
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
                  <div className="text-4xl font-extrabold text-[#0b132b] font-serif-heading">
                    ${course.price} <span className="text-xs text-slate-500 font-sans font-semibold">USD</span>
                  </div>
                  <div className="text-xs font-semibold text-rose-600">
                    Projected Pay: {course.projectedPay}
                  </div>
                </div>

                {authError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  onClick={handlePurchaseClick}
                  className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Enroll in Course (${course.price})</span>
                </button>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Lifetime Access to all module lessons</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Downloadable Completion Certificate</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Self-Paced Learning</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
