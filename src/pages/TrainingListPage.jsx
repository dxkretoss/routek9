import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../lib/courses';
import { ArrowRight, GraduationCap, Loader2 } from 'lucide-react';

const COURSE_BG_IMAGES = {
  "master-contractor": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
  "logistics-consultant": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
  "delivery-company": "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80",
  "notary-public": "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
  "field-inspector": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
  "courier-dispatcher": "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80"
};

export default function TrainingListPage({ currentUser, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getCourses();
      setCourses(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>

      {/* Main Body */}
      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header */}
          <div className="space-y-4 max-w-4xl">
            
            {/* Badge Line */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold uppercase tracking-wider text-rose-600 font-sans">
              <GraduationCap className="w-4 h-4 text-rose-600" />
              <span>TRAINING LIBRARY ({courses.length} COURSES)</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
              Courses to Grow Your <span className="text-rose-600 italic">Courier Business</span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg font-normal leading-relaxed font-sans">
              Self-paced training with step-by-step lessons, action guides, and downloadable completion certificates. One-time payment — lifetime access.
            </p>

          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
              <span className="text-sm font-bold">Loading training catalog...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, idx) => {
                const bgImg = course.image || course.image_url || COURSE_BG_IMAGES[course.id] || COURSE_BG_IMAGES["master-contractor"];

                return (
                  <div
                    key={course.id}
                    className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-800/80 group flex flex-col justify-between min-h-[340px] p-7 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]"
                  >
                    {/* Background Image */}
                    <img 
                      src={bgImg} 
                      alt={course.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Dark Gradient Overlay for Maximum Legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/85 to-slate-900/50" />

                    {/* Top Content: Number Badge */}
                    <div className="relative z-10">
                      <div className="w-9 h-9 rounded-xl bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center font-serif-heading shadow-md">
                        0{idx + 1}
                      </div>
                    </div>

                    {/* Bottom Content: Title, Description, Price & Action Button */}
                    <div className="relative z-10 space-y-4 mt-auto pt-6">
                      
                      {/* Course Title & Description */}
                      <div className="space-y-2">
                        <h3 className="text-2xl font-extrabold text-white font-serif-heading leading-tight group-hover:text-rose-300 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-xs font-semibold text-rose-300 leading-relaxed font-sans line-clamp-3">
                          {course.subtitle}
                        </p>
                      </div>

                      {/* Bottom Bar: Price & Action Button */}
                      <div className="pt-4 border-t border-white/15 flex items-center justify-between">
                        <div className="text-2xl font-extrabold text-white font-sans">
                          ${course.price}
                        </div>

                        <Link
                          to={`/training/${course.id}`}
                          className="px-4 py-2 rounded-xl bg-white/15 hover:bg-rose-600 text-white text-xs font-bold transition-all duration-200 flex items-center gap-1.5 backdrop-blur-md cursor-pointer border border-white/20 hover:border-rose-500"
                        >
                          <span>View course</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
