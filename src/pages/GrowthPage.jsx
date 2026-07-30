import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Map, 
  Award, 
  Building, 
  Users, 
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Briefcase
} from 'lucide-react';

const PATHS = [
  {
    title: "Master Contractor",
    slug: "master-contractor",
    tagline: "Win bigger contracts and subcontract reliable drivers under your authority.",
    description:
      "A master contractor holds the relationship with the shipper or broker and delegates stops to a network of drivers. Build recurring revenue, negotiate volume rates, and use Route K9's planner and dispatcher tools to keep every route profitable.",
    earnings: "$80,000 – $250,000+ / year",
    actions: ["Negotiate volume rates", "Hire and subcontract drivers", "Manage multiple routes"],
  },
  {
    title: "Logistics Consultant",
    slug: "logistics-consultant",
    tagline: "Help other couriers and small fleets run leaner, faster operations.",
    description:
      "Turn your route knowledge into a consulting business. Audit dispatch workflows, redesign delivery territories, and recommend the right vehicles, insurance, and technology stack for clients scaling their courier operations.",
    earnings: "$60,000 – $180,000+ / year",
    actions: ["Route optimization audits", "Fleet and territory design", "SOP and compliance coaching"],
  },
  {
    title: "Delivery Company",
    slug: "delivery-company",
    tagline: "Build your own brand with trucks, vans, drivers, and direct contracts.",
    description:
      "Move from gig work to a real asset: a registered delivery company. Secure DOT/MC authority, commercial insurance, and direct contracts with pharmacies, labs, legal firms, and regional distributors.",
    earnings: "$150,000 – $1,000,000+ / year",
    actions: ["Register DOT/MC authority", "Secure direct contracts", "Build a driver bench"],
  },
  {
    title: "Notary Public",
    slug: "notary-public",
    tagline: "Add high-margin mobile notary and loan-signing services to your route.",
    description:
      "Couriers already drive house-to-house. A notary commission lets you monetize the same miles with loan signings, apostilles, and document authentications. Perfect for drivers with flexible daytime availability.",
    earnings: "$30,000 – $100,000+ / year",
    actions: ["Get commissioned in your state", "Offer loan signing services", "Stack appointments with deliveries"],
  },
  {
    title: "Field Inspector",
    slug: "field-inspector",
    tagline: "Inspect properties, vehicles, and documents while you are already on the road.",
    description:
      "Insurance, mortgage, and auto-finance companies need eyes on location. Field inspectors verify occupancy, damage, VINs, and photos. The work fits naturally between courier stops and pays per inspection.",
    earnings: "$40,000 – $90,000+ / year",
    actions: ["Complete inspector certification", "Work with insurance and lenders", "Bundle inspections with routes"],
  },
  {
    title: "Courier Dispatcher",
    slug: "courier-dispatcher",
    tagline: "Coordinate routes, drivers, and customers without driving every mile yourself.",
    description:
      "Dispatchers are the nerve center of a delivery operation. Assign loads, handle exceptions, communicate with customers, and keep drivers moving. Strong dispatchers can charge per load or a weekly retainer.",
    earnings: "$50,000 – $120,000+ / year",
    actions: ["Assign loads and routes", "Handle customer communication", "Track performance and delays"],
  },
];

import heroBgPattern from '../assets/hero_bg_pattern.png';
import heroGrowthImg from '../assets/hero_business_growth.png';

export default function GrowthPage({ currentUser, onLogout }) {
  return (
    <>

      {/* Full-Width Background Image Hero Section */}
      <section className="relative bg-slate-950 text-white py-20 sm:py-28 border-b border-slate-800 overflow-hidden">
        {/* Full-Screen Background Image */}
        <img
          src={heroGrowthImg}
          alt="Logistics Business Expansion Background"
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 scale-105"
        />

        {/* Dark Translucent Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/75 to-slate-950/90 backdrop-blur-[2px] pointer-events-none" />

        {/* Platform Route Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBgPattern})` }}
        />

        {/* Ambient Decorative Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Centered Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <TrendingUp className="w-4 h-4 text-rose-400" />
            <span>Business Growth Paths</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-serif-heading leading-tight max-w-3xl mx-auto">
            Scale Your Courier Career <br /><span className="text-rose-500 italic font-serif-heading">Beyond the Driver Seat</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base font-normal max-w-2xl mx-auto leading-relaxed">
            Route K9 is not just a routing tool. It is a launching pad for drivers who want to step up to become fleet owners, operations consultants, dispatchers, or specialized field service providers. Pick the growth path that matches your ambition.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Link
              to="/planner"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-6 py-3.5 text-xs font-bold text-white shadow-lg transition-all"
            >
              <span>Plan Your First Route</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/certification"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-3.5 text-xs font-semibold text-white transition-all"
            >
              <span>Browse Certification Courses</span>
            </Link>
          </div>

          {/* Centered Floating Metric Glass Cards */}
          <div className="pt-4 grid grid-cols-3 gap-3 max-w-2xl mx-auto">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">5</div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">Growth Paths</div>
            </div>

            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">$250K+</div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">Potential Pay</div>
            </div>

            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">100%</div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">Fleet Control</div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid of growth paths */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-12">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-serif-heading">
            Choose Your Specialization
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
            Each track builds directly on the driving and dispatch skills you already have as a contractor. Start with one module, secure client accounts, and build a logistics company that owns the route.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PATHS.map((path, i) => (
            <article
              key={path.title}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Visual indicator (Number) */}
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center font-serif-heading font-extrabold text-rose-600 text-sm shadow-2xs">
                  {String(i + 1).padStart(2, '0')}
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#0b132b] font-serif-heading">{path.title}</h3>
                  <p className="text-xs font-semibold text-rose-600 leading-snug">{path.tagline}</p>
                </div>

                {/* Earnings card */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/50 px-3 py-1 text-xs font-bold text-slate-700">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{path.earnings}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {path.description}
                </p>

                {/* Actions check bullets */}
                <ul className="space-y-2.5 pt-2 border-t border-slate-100/80">
                  {path.actions.map((action) => (
                    <li key={action} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <Link
                  to={`/training/${path.slug}`}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 text-center"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Buy training course · $49</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How Route K9 Helps You Grow */}
      <section className="bg-slate-50/50 border-y border-slate-200/60 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side stats / value items */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-serif-heading">
                  How Route K9 Empowers You
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  We supply the route planning tools, credentialing certifications, and directories to help you scale operations smoothly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  [Map, "Route Planner", "Optimize up to 400 stops and dispatch instantly to driver lines."],
                  [Award, "Certifications", "HIPAA, blood-borne pathogen, and general contractor compliance support."],
                  [Briefcase, "Route Marketplace", "Explore routes for sale and local contractor bidding lists."],
                  [Users, "Contract Network", "Direct connections with courier and medical logistics firms."]
                ].map(([Icon, title, desc]) => (
                  <div key={title} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-xs text-[#0b132b]">{title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side steps card */}
            <div className="lg:col-span-5">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5 max-w-md mx-auto lg:ml-auto">
                <h3 className="text-lg font-bold text-[#0b132b] font-serif-heading">Start Your Growth Plan</h3>
                
                <ol className="space-y-4 pt-1">
                  {[
                    "Pick a growth path matching your target capital and scheduling goals.",
                    "Enroll in the relevant logistics training or obtain state business registration.",
                    "Utilize Route K9 optimization tools to secure contracts and subcontract.",
                    "Reinvest route profit margins to expand fleet authority and hire operators."
                  ].map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600 border border-rose-100">
                        {i + 1}
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>

                <Link
                  to="/signup"
                  className="w-full py-3 mt-2 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  <span>Join Route K9 Free</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Action Teaser Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="rounded-3xl bg-[#0b132b] p-8 sm:p-12 text-white relative overflow-hidden shadow-lg">
          {/* Subtle grid lines mask */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5 pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold font-serif-heading leading-tight">
                Not Sure Which Path is Right?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-xl">
                Most successful logistics businesses start small and stack specializations. A dispatch line leads to prime route contracts. A mobile notary commissions into field inspecting. The best strategy is to begin training today.
              </p>
            </div>
            
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 sm:justify-end lg:justify-start xl:justify-end shrink-0">
              <Link
                to="/"
                className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all text-center"
              >
                Find Routes
              </Link>
              <Link
                to="/companies"
                className="px-6 py-3.5 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold text-xs transition-all text-center bg-transparent"
              >
                Browse Companies
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
