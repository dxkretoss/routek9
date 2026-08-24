import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, ArrowLeft, AlertCircle, HelpCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function TermsPage() {
  const [dbContent, setDbContent] = useState(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const lastUpdated = dbContent?.updated_at
    ? new Date(dbContent.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : "August 21, 2026";

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const { data, error } = await supabase
          .from('legal_pages')
          .select('title, content_html, updated_at')
          .eq('slug', 'terms')
          .maybeSingle();

        if (data && data.content_html) {
          setDbContent(data);
        }
      } catch (e) {
        console.warn("Notice fetching legal_pages terms:", e);
      } finally {
        setLoadingDb(false);
      }
    };
    fetchPage();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans antialiased text-slate-800 flex flex-col justify-between">
      <div>
        {/* Header Hero Section */}
        <div className="bg-gradient-to-b from-[#0b132b] via-[#1c2541] to-[#0b132b] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
          <div className="max-w-4xl mx-auto space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-serif-heading tracking-tight text-white">
                  {dbContent?.title || "Terms & Conditions"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
                  RouteK9 — Contract Drivers of America Marketplace & Directory Terms of Service
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-semibold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Effective Date: {lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Main Document Body */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-10 space-y-10">

            {loadingDb ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Loading Terms & Conditions...</p>
              </div>
            ) : dbContent?.content_html ? (

              /* Dynamic Content Fetched from Supabase Database */
              <div
                className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-6"
                dangerouslySetInnerHTML={{ __html: dbContent.content_html }}
              />

            ) : (

              /* Default Fallback Content Template */
              <>
                {/* Intro Alert Box */}
                <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs sm:text-sm leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 font-extrabold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Important Notice</span>
                  </div>
                  <p>
                    Please read these Terms & Conditions carefully before accessing or using the RouteK9 platform. By creating an account, browsing contractor directories, or applying for delivery contracts, you agree to be bound by these legal terms.
                  </p>
                </div>

                {/* Section 1 */}
                <section className="space-y-3">
                  <h2 className="text-xl font-extrabold text-[#0b132b] flex items-center gap-2 font-serif-heading">
                    <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 text-xs font-black flex items-center justify-center border border-rose-200">1</span>
                    Acceptance of Terms
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Welcome to RouteK9 ("we", "us", "our", or "RouteK9"). RouteK9 operates an independent directory, route planning software, and marketplace platform connecting independent logistics contractors, medical couriers, box truck owner-operators, and dispatch companies across the United States.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    By accessing our website, mobile interface, or purchasing subscriptions, you acknowledge that you have read, understood, and agreed to comply with all terms herein, as well as our Privacy Policy. If you do not agree, you must immediately discontinue use of the platform.
                  </p>
                </section>

                <hr className="border-slate-100" />

                {/* Section 2 */}
                <section className="space-y-3">
                  <h2 className="text-xl font-extrabold text-[#0b132b] flex items-center gap-2 font-serif-heading">
                    <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 text-xs font-black flex items-center justify-center border border-rose-200">2</span>
                    Independent Contractor Relationship
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    RouteK9 is a technological directory and logistics marketplace. RouteK9 is <strong>not</strong> an employer, freight broker, motor carrier, or direct employer of any drivers listed on the directory.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-600 list-disc pl-5">
                    <li>All drivers using RouteK9 operate strictly as <strong>1099 Independent Contractors</strong> or independent business entities.</li>
                    <li>Hiring companies and couriers negotiate rates, contracts, schedules, and delivery parameters directly with one another.</li>
                    <li>RouteK9 does not withhold taxes, provide worker's compensation, or guarantee minimum contract earnings for any registered contractor.</li>
                  </ul>
                </section>

                <hr className="border-slate-100" />

                {/* Section 3 */}
                <section className="space-y-3">
                  <h2 className="text-xl font-extrabold text-[#0b132b] flex items-center gap-2 font-serif-heading">
                    <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 text-xs font-black flex items-center justify-center border border-rose-200">3</span>
                    User Accounts & Profile Registration
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    To access features such as the Driver Directory, Route Bidding, and Specialized Training Courses, you must register an account with valid credentials.
                  </p>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs sm:text-sm text-slate-700">
                    <p className="font-bold text-slate-900">Account Responsibilities:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Provide accurate DOT & vehicle info</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Maintain confidential passwords</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Promptly update address & contact details</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>One account per driver or company</span>
                      </div>
                    </div>
                  </div>
                </section>

                <hr className="border-slate-100" />

                {/* Section 4 */}
                <section className="space-y-3">
                  <h2 className="text-xl font-extrabold text-[#0b132b] flex items-center gap-2 font-serif-heading">
                    <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 text-xs font-black flex items-center justify-center border border-rose-200">4</span>
                    Subscriptions, Certification & Payment Terms
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Certain premium services, including RouteK9 PRO Memberships, Contractor Certifications, and Featured Directory Badges, require recurring subscriptions or one-time fees processed through Stripe.
                  </p>
                </section>

                <hr className="border-slate-100" />

                {/* Section 5: Contact */}
                <section className="bg-slate-900 text-white rounded-2xl p-6 space-y-3">
                  <h3 className="text-lg font-extrabold font-serif-heading flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-rose-400" />
                    <span>Questions Regarding Terms?</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    If you have questions or require support regarding these Terms & Conditions, please reach out to our legal compliance team:
                  </p>
                  <div className="text-xs font-mono text-rose-400 font-bold">
                    Email: support@routek9.com
                  </div>
                </section>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
