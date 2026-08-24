import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowLeft, Eye, Database, Server, Key, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PrivacyPage() {
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
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-serif-heading tracking-tight text-white">
                  {dbContent?.title || "Privacy Policy"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
                  How RouteK9 collects, protects, and handles your personal & fleet data
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-semibold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Last Modified: {lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Main Document Body */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-10 space-y-10">

            {loadingDb ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Loading Privacy Policy...</p>
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
                {/* Intro Header Box */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm leading-relaxed text-slate-700 space-y-2">
                  <p className="font-extrabold text-slate-900 text-sm">Our Commitment to Your Privacy</p>
                  <p>
                    At RouteK9 ("we", "our", or "us"), we value the trust of independent courier contractors, drivers, and logistics dispatchers. This Privacy Policy explains what information we collect when you use RouteK9, how we safeguard it, and your choices regarding profile visibility in our Driver Directory.
                  </p>
                </div>

                {/* Section 1 */}
                <section className="space-y-3">
                  <h2 className="text-xl font-extrabold text-[#0b132b] flex items-center gap-2 font-serif-heading">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black flex items-center justify-center border border-emerald-200">1</span>
                    Information We Collect
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    We collect personal information necessary to deliver courier matching, directory listings, certification records, and route planning features:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm pt-2">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span>Account Profile Data</span>
                      </div>
                      <p className="text-slate-500 text-xs">Full name, email address, phone number, city, state, vehicle type (Cargo Van, Box Truck, SUV), and DOT license numbers.</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-emerald-600" />
                        <span>Payment & Subscription Tokens</span>
                      </div>
                      <p className="text-slate-500 text-xs">Payment transactions are tokenized via Stripe. RouteK9 does not store raw credit card numbers on our servers.</p>
                    </div>
                  </div>
                </section>

                <hr className="border-slate-100" />

                {/* Section 2 */}
                <section className="space-y-3">
                  <h2 className="text-xl font-extrabold text-[#0b132b] flex items-center gap-2 font-serif-heading">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black flex items-center justify-center border border-emerald-200">2</span>
                    Directory Visibility & Controls
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    You can choose whether your profile is listed publicly in the Driver Directory or set to <strong>Hidden</strong> at any time in your Profile Settings.
                  </p>
                </section>

                <hr className="border-slate-100" />

                {/* Section 3: Contact */}
                <section className="bg-slate-900 text-white rounded-2xl p-6 space-y-3">
                  <h3 className="text-lg font-extrabold font-serif-heading flex items-center gap-2">
                    <Mail className="w-5 h-5 text-emerald-400" />
                    <span>Contact Our Privacy Team</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    If you have questions or concerns regarding our Privacy Policy, please reach out to us:
                  </p>
                  <div className="text-xs font-mono text-emerald-400 font-bold space-y-1">
                    <div>Email: privacy@routek9.com</div>
                    <div>Support: support@routek9.com</div>
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
