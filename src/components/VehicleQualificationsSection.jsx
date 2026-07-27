import React from 'react';

const VEHICLE_QUALIFICATIONS = [
  {
    classTitle: "Car / Sedan",
    description: "Small parcel, auto parts, medical specimens",
    payRate: "$120–180 / day"
  },
  {
    classTitle: "Minivan / SUV",
    description: "Small package routes, on-demand gigs",
    payRate: "$150–250 / day"
  },
  {
    classTitle: "Cargo Van",
    description: "DSP-style routes, e-commerce parcels",
    payRate: "$800–1,300 / week"
  },
  {
    classTitle: "Sprinter / High-Top Van",
    description: "Higher-volume routes, multi-stop contracts",
    payRate: "$900–1,600 / week"
  },
  {
    classTitle: "Box Truck (16–26 ft)",
    description: "Master contractor routes, freight & retail",
    payRate: "$1,200–2,200+ / week"
  }
];

export default function VehicleQualificationsSection() {
  return (
    <section id="vehicle-qualifications-section" className="py-8 sm:py-16 bg-[#FAF9F6] border-t border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Header matching user screenshot */}
        <div className="space-y-3">

          {/* Badge Line */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              PICK YOUR CLASS
            </span>
          </div>

          {/* Headline matching screenshot */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
            What your vehicle qualifies you for
          </h2>

          {/* Subtitle matching screenshot */}
          <p className="text-slate-600 text-sm sm:text-base font-normal leading-relaxed font-sans">
            Typical ranges seen on contract boards — run your own numbers before accepting a rate.
          </p>

        </div>

        {/* Main Card List Container matching screenshot */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {VEHICLE_QUALIFICATIONS.map((item, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
            >
              {/* Left Column: Title & Description */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#0b132b] font-serif-heading">
                  {item.classTitle}
                </h3>
                <p className="text-xs text-slate-500 font-medium font-sans">
                  {item.description}
                </p>
              </div>

              {/* Right Column: Pay Rate Range */}
              <div className="text-base sm:text-lg font-extrabold text-rose-600 font-sans shrink-0">
                {item.payRate}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
