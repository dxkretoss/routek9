import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQS = [
  {
    question: "What's the difference between finding a route and buying one?",
    answer: "Finding a route means applying directly to drive as an independent contractor or 1099 delivery driver for an existing logistics company with zero upfront acquisition cost. Buying a route means purchasing an established contract business — including existing trucks, assigned ZIP code territories, trained drivers, and ongoing weekly revenue flow."
  },
  {
    question: "Can anyone buy a FedEx route?",
    answer: "Yes, provided you meet FedEx Ground corporate approval standards. Buyers must incorporate as a corporation (S-Corp or C-Corp), pass criminal and financial background checks, and demonstrate sufficient liquidity or SBA financing to maintain fleet operations."
  },
  {
    question: "Do I need a CDL to drive or buy a route?",
    answer: "No! Over 85% of courier, medical, and local parcel routes (using Cargo Vans, Sprinter Vans, and non-CDL Box Trucks under 26,000 lbs Gross Vehicle Weight Rating) require only a standard valid driver's license with a clean motor vehicle record."
  },
  {
    question: "How much does a route cost?",
    answer: "Prices vary depending on net profit multiples: single-vehicle courier routes start under $20,000, while multi-truck FedEx Ground or linehaul routes typically range from $150,000 to over $1,200,000 depending on annual cash flow and vehicle equity."
  },
  {
    question: "What about buying an Amazon DSP or USPS route?",
    answer: "USPS Contract Delivery Service (CDS) routes can be bid directly on SAM.gov or purchased from current contractors with Postal approval. Amazon DSP businesses require applying through Amazon's official Delivery Service Partner program or acquiring an existing DSP entity with Amazon's consent."
  }
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);

  const toggleFaq = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq-section" className="py-8 sm:py-16 bg-[#FAF9F6] border-t border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Header matching user screenshot */}
        <div className="space-y-3">

          {/* Badge Line */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              QUESTIONS
            </span>
          </div>

          {/* Headline matching screenshot */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
            Frequently asked
          </h2>

        </div>

        {/* FAQ Card Container matching screenshot */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="transition-colors">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 sm:p-7 text-left flex items-center justify-between gap-4 group cursor-pointer"
                >
                  <span className="text-base sm:text-lg font-bold text-[#0b132b] group-hover:text-rose-600 transition-colors font-serif-heading">
                    {faq.question}
                  </span>

                  <span className="text-rose-600 p-1 rounded-full hover:bg-rose-50 transition-colors shrink-0">
                    {isOpen ? (
                      <Minus className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 sm:px-7 pb-6 pt-1 text-slate-600 text-xs sm:text-sm font-medium leading-relaxed font-sans border-t border-slate-50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
