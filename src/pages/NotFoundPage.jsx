import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Compass, ArrowLeft, Home, BookOpen } from 'lucide-react';
import heroBgPattern from '../assets/hero_bg_pattern.png';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b132b] text-white relative p-6 overflow-hidden select-none">

      {/* Map Pattern Background */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBgPattern})` }}
      />

      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Container */}
      <div className="relative z-10 max-w-lg w-full text-center space-y-8 animate-fadeIn">


        {/* 404 Text & Status Badge */}
        <div className="space-y-3">


          <h1 className="text-8xl font-black text-rose-500 font-serif-heading tracking-tighter drop-shadow-lg">
            404
          </h1>

          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            You've Gone Off Route!
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-sm mx-auto leading-relaxed">
            The destination coordinates you requested don't exist, or the dispatcher redirected this route. Let's recalculate your route.
          </p>
        </div>



        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto pt-2">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-5 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent"
          >
            <Home className="w-4 h-4" />
            <span>Return to Base</span>
          </button>
        </div>



      </div>
    </div>
  );
}
