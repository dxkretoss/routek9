import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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

export default function GrowthPage({ currentUser, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900 font-sans selection:bg-rose-600 selection:text-white">
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      {/* Modern Asymmetric Light-Gradient Hero Banner */}
      <section className="bg-gradient-to-br from-slate-50 via-[#faf9f6] to-rose-50/20 py-16 sm:py-24 border-b border-slate-200/60 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 shadow-2xs">
              <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
              <span>Business Growth Paths</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-[1.1]">
              Scale Your Courier Career <br />
              <span className="text-rose-600 italic font-serif-heading">Beyond the Driver Seat</span>
            </h1>

            <p className="text-slate-600 text-xs sm:text-base font-normal leading-relaxed max-w-2xl">
              Route K9 is not just a routing tool. It is a launching pad for drivers who want to step up to become fleet owners, operations consultants, dispatchers, or specialized field service providers. Pick the growth path that matches your ambition.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/planner"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-6 py-3.5 text-xs font-bold text-white shadow-xs transition-all"
              >
                <span>Plan Your First Route</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/certification"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-6 py-3.5 text-xs font-semibold text-slate-800 shadow-2xs transition-all"
              >
                <span>Browse Certification Courses</span>
              </Link>
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

      <Footer />
    </div>
  );
}
