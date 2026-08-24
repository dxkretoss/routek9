import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle2, 
  Loader2, 
  Calendar, 
  Mail, 
  ExternalLink,
  ChevronRight,
  BookOpen,
  Award,
  Sparkles,
  Database,
  Key,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PrivacyPage({ currentUser, onLogout }) {
  const [dbContent, setDbContent] = useState(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const lastUpdated = dbContent?.updated_at
    ? new Date(dbContent.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : "August 24, 2026";

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const { data, error } = await supabase
          .from('legal_pages')
          .select('title, content_html, updated_at')
          .eq('slug', 'privacy')
          .maybeSingle();

        if (data && data.content_html) {
          setDbContent(data);
        }
      } catch (e) {
        console.warn("Notice fetching legal_pages privacy:", e);
      } finally {
        setLoadingDb(false);
      }
    };
    fetchPage();
  }, []);

  // Helper to format raw content into clean styled HTML with numbered sections if needed
  const formatContentHtml = (rawHtml) => {
    if (!rawHtml) return '';
    let formatted = rawHtml;
    // Format numbered headings e.g. "1. Information We Collect" into styled headings if raw
    formatted = formatted.replace(
      /(?:<p>)?(\d+\.\s+[^:<\n]+)(?::|<\/strong>)?(?:<\/p>)?/gi,
      (match, p1) => `<h3 class="text-base sm:text-lg font-bold text-[#0b132b] font-serif-heading flex items-center gap-2.5 mt-8 mb-3 pb-2 border-b border-slate-100"><span class="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-black flex items-center justify-center shrink-0">${p1.split('.')[0]}</span><span>${p1.substring(p1.indexOf('.') + 1).trim()}</span></h3>`
    );
    return formatted;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between">
      <div>
        {/* Header Hero Section */}
        <div className="bg-gradient-to-b from-[#0b132b] via-[#0d2137] to-[#0b132b] text-white py-14 sm:py-18 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
          {/* Subtle Ambient Background Light */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto space-y-6 relative z-10">
            {/* Top Bar with Home Link & Quick Switch */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 backdrop-blur-xs"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Back to Home</span>
              </Link>

              <div className="flex items-center gap-3 text-xs font-bold">
                <Link to="/terms" className="text-slate-400 hover:text-rose-400 transition-colors">
                  Terms & Conditions
                </Link>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 border-b-2 border-emerald-400 pb-0.5">Privacy Policy</span>
              </div>
            </div>

            {/* Title & Document Badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40 shrink-0">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-black uppercase text-emerald-300 tracking-wider">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Data Protection & Privacy
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">Version 2026.1</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold font-serif-heading tracking-tight text-white">
                    {dbContent?.title || "Privacy Policy"}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
                    How RouteK9 collects, protects, and handles your contractor & logistics data
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md self-start md:self-auto shrink-0 shadow-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">Last Modified</div>
                  <div className="text-xs font-extrabold text-white">{lastUpdated}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Document Body with Sidebar Layout */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Left Main Content (2 Columns on Desktop) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Important Privacy Overview Notice Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 shadow-sm space-y-2">
                <div className="flex items-center gap-2.5 font-extrabold text-sm text-emerald-950">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Our Privacy Commitment</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-emerald-900/90 font-medium">
                  At RouteK9, we value the trust of courier contractors, drivers, and logistics dispatchers. We never sell your personal data, and payment information is securely processed via 256-bit encrypted tokenization.
                </p>
              </div>

              {/* Document White Card Body */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 space-y-8">
                {loadingDb ? (
                  <div className="py-16 text-center space-y-3 flex flex-col items-center justify-center">
                    <Loader2 className="w-9 h-9 animate-spin text-emerald-600" />
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Loading Privacy Policy...</p>
                  </div>
                ) : dbContent?.content_html ? (
                  /* Dynamic Content Fetched from Supabase Database */
                  <div
                    className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-5 text-slate-700 font-normal [&_h1]:text-xl [&_h1]:font-extrabold [&_h1]:text-[#0b132b] [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-[#0b132b] [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-[#0b132b] [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_strong]:text-slate-900 [&_strong]:font-extrabold"
                    dangerouslySetInnerHTML={{ __html: formatContentHtml(dbContent.content_html) }}
                  />
                ) : (
                  /* Fallback Sections Template */
                  <div className="space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <section className="space-y-3">
                      <h3 className="text-lg font-bold text-[#0b132b] font-serif-heading flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-black flex items-center justify-center shrink-0">1</span>
                        <span>Information We Collect</span>
                      </h3>
                      <p>
                        We collect personal and business information necessary to deliver courier matching, directory listings, certification records, and route calculation features.
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-lg font-bold text-[#0b132b] font-serif-heading flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-black flex items-center justify-center shrink-0">2</span>
                        <span>Directory Visibility & Privacy Controls</span>
                      </h3>
                      <p>
                        You maintain full control over your contact visibility and can choose whether your profile is listed publicly in the Driver Directory or set to Hidden at any time.
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-lg font-bold text-[#0b132b] font-serif-heading flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-black flex items-center justify-center shrink-0">3</span>
                        <span>Data Security & Protection</span>
                      </h3>
                      <p>
                        We implement industry-standard SSL encryption and strict access controls to safeguard your account records and sensitive information.
                      </p>
                    </section>
                  </div>
                )}

              </div>
            </div>

            {/* Right Sticky Sidebar */}
            <div className="space-y-6 lg:sticky lg:top-8">

              {/* Document Quick Facts Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-[#0b132b] uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Privacy Summary</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Document Type</span>
                    <span className="font-extrabold text-slate-900">Privacy Policy</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Data Encryption</span>
                    <span className="font-extrabold text-emerald-600">256-bit TLS/SSL</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Third-Party Selling</span>
                    <span className="font-extrabold text-rose-600">Never Sold</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Managed via</span>
                    <span className="font-extrabold text-emerald-600">RouteK9 Admin CMS</span>
                  </div>
                </div>
              </div>

              {/* Related Policies Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
                <h3 className="text-sm font-extrabold text-[#0b132b] uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>Related Policies</span>
                </h3>
                <div className="space-y-2 pt-1">
                  <Link
                    to="/terms"
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-100 transition-all text-xs font-bold text-slate-700 hover:text-rose-800 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-rose-600" />
                      <span>Terms & Conditions</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link
                    to="/"
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-100 transition-all text-xs font-bold text-slate-700 hover:text-emerald-800 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>RouteK9 Platform Home</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
