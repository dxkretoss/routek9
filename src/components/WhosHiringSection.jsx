import React, { useState } from 'react';
import { ExternalLink, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const DELIVERY_APPS = [
  {
    name: "Amazon Flex",
    url: "https://flex.amazon.com/",
    domain: "amazon.com",
    iconSlug: "amazon",
    color: "#FF9900"
  },
  {
    name: "DoorDash",
    url: "https://dasher.doordash.com/",
    domain: "doordash.com",
    iconSlug: "doordash",
    color: "#FF3008"
  },
  {
    name: "Uber Eats",
    url: "https://www.uber.com/us/en/deliver/",
    domain: "ubereats.com",
    iconSlug: "ubereats",
    color: "#000000"
  },
  {
    name: "Instacart",
    url: "https://shoppers.instacart.com/",
    domain: "instacart.com",
    iconSlug: "instacart",
    color: "#43B02A"
  },
  {
    name: "Shipt",
    url: "https://www.shipt.com/be-a-shopper/",
    domain: "shipt.com",
    iconSlug: "shipt",
    color: "#00A34E"
  },
  {
    name: "Grubhub",
    url: "https://driver.grubhub.com/",
    domain: "grubhub.com",
    iconSlug: "grubhub",
    color: "#F63440"
  },
  {
    name: "Gopuff",
    url: "https://www.gopuff.com/drive",
    domain: "gopuff.com",
    iconSlug: "gopuff",
    color: "#0000FF"
  },
  {
    name: "Spark Driver",
    url: "https://drive4spark.walmart.com/",
    domain: "walmart.com",
    iconSlug: "walmart",
    color: "#0071DC"
  },
  {
    name: "Roadie",
    url: "https://www.roadie.com/drivers",
    domain: "roadie.com",
    iconSlug: "roadie",
    color: "#00B140"
  },
  {
    name: "Postmates",
    url: "https://postmates.com/driver",
    domain: "postmates.com",
    iconSlug: "postmates",
    color: "#000000"
  },
  {
    name: "Favor",
    url: "https://favordelivery.com/apply",
    domain: "favordelivery.com",
    color: "#00AEEF"
  },
  {
    name: "GoShare",
    url: "https://goshare.co/drivers/",
    domain: "goshare.co",
    color: "#28A745"
  },
  {
    name: "Frayt",
    url: "https://www.frayt.com/drivers/",
    domain: "frayt.com",
    color: "#FF6B00"
  },
  {
    name: "Dispatch",
    url: "https://www.dispatchit.com/drivers",
    domain: "dispatchit.com",
    color: "#1A73E8"
  }
];

const REGIONAL_COURIERS = [
  {
    name: "FedEx Ground",
    url: "https://www.buildagroundroute.com/",
    domain: "fedex.com",
    iconSlug: "fedex",
    color: "#4D148C"
  },
  {
    name: "UPS",
    url: "https://www.ups.com/us/en/about/pva.page",
    domain: "ups.com",
    iconSlug: "ups",
    color: "#351C15"
  },
  {
    name: "USPS",
    url: "https://sam.gov/search/?index=opp&is_active=true&naics=492110",
    domain: "usps.com",
    color: "#333366"
  },
  {
    name: "Dropoff",
    url: "https://www.dropoff.com/careers/become-a-courier/",
    domain: "dropoff.com",
    color: "#1E3A5F"
  },
  {
    name: "TForce",
    url: "https://www.tforcelogistics.com/become-a-driver/",
    domain: "tforcelogistics.com",
    color: "#FFD100"
  },
  {
    name: "Medzoomer",
    url: "https://medzoomer.com/drivers/",
    domain: "medzoomer.com",
    color: "#0066CC"
  },
  {
    name: "Velox Express",
    url: "https://veloxexpress.com/careers/",
    domain: "veloxexpress.com",
    color: "#D32F2F"
  },
  {
    name: "CLDA",
    url: "https://clda.org/",
    domain: "clda.org",
    color: "#003366"
  },
  {
    name: "Excel Courier",
    url: "https://www.excelcourier.com/careers/",
    domain: "excelcourier.com",
    color: "#2E7D32"
  },
  {
    name: "GoUSPack",
    url: "https://gouspack.com/careers/",
    domain: "gouspack.com",
    color: "#1565C0"
  }
];

const WARNINGS_BEFORE_DRIVE = [
  'Upfront fees for "training" or a "starter kit" before you\'ve seen a written contract',
  'Vehicle lease-to-own deals with vague terms or payments that outlast the contract',
  'No written contractor agreement — everything happens over text or a phone call',
  'Per-package pay so low it won\'t cover fuel, insurance, and vehicle wear'
];

const WARNINGS_BEFORE_BUY = [
  'Seller won\'t produce verified settlement statements or tax returns',
  'Heavy pressure to close fast, with no real due-diligence period',
  '"Guaranteed drivers" or revenue claims that can\'t be independently checked',
  'A price far below normal valuation multiples — that gap is usually hiding a problem',
  'No cooperation from FedEx, USPS, or the parent company on approving the transfer'
];

function CompanyLogoCard({ company }) {
  const [imgStage, setImgStage] = useState(0); // 0: Google Favicon 128px, 1: SimpleIcon SVG, 2: Fallback initials

  // Multi-tier logo URLs for maximum reliability across browsers & regions
  const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`;
  const simpleIconUrl = company.iconSlug ? `https://cdn.simpleicons.org/${company.iconSlug}` : null;

  const handleImgError = () => {
    setImgStage(prev => prev + 1);
  };

  const getLogoSrc = () => {
    if (imgStage === 0) return googleFaviconUrl;
    if (imgStage === 1 && simpleIconUrl) return simpleIconUrl;
    return null;
  };

  const currentSrc = getLogoSrc();
  const initials = company.name.split(' ').map(w => w[0]).join('').slice(0, 2);

  return (
    <a
      href={company.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 transition-all flex items-center gap-3.5 group cursor-pointer"
    >
      {currentSrc ? (
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 p-2 shrink-0 flex items-center justify-center overflow-hidden">
          <img 
            src={currentSrc}
            alt={company.name}
            className="w-full h-full object-contain"
            onError={handleImgError}
          />
        </div>
      ) : (
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-2xs"
          style={{ backgroundColor: company.color || '#6366f1' }}
        >
          {initials}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate">
          {company.name}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
          <span>Apply</span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-rose-600 transition-colors" />
        </div>
      </div>
    </a>
  );
}

export default function WhosHiringSection() {
  const [showWarnings, setShowWarnings] = useState(false);

  return (
    <section id="whos-hiring-section" className="py-16 sm:py-24 bg-[#FAF9F6] border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Sub-Section 1: Delivery Apps Logo Grid */}
        <div className="space-y-8">
          
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
              <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
                DELIVERY PLATFORMS
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
              Delivery apps hiring now
            </h2>

            <p className="text-slate-600 text-sm max-w-2xl font-normal leading-relaxed font-sans">
              Sign up directly with these platforms to start delivering.
            </p>
          </div>

          {/* Apps Logo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {DELIVERY_APPS.map((app) => (
              <CompanyLogoCard key={app.name} company={app} />
            ))}
          </div>

        </div>

        {/* Sub-Section 2: Regional & Specialty Courier Companies */}
        <div className="space-y-8 pt-4">
          
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
              Carriers & courier companies
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl font-normal leading-relaxed font-sans">
              Major carriers and regional courier companies hiring independent contractors.
            </p>
          </div>

          {/* Regional Couriers Logo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {REGIONAL_COURIERS.map((courier) => (
              <CompanyLogoCard key={courier.name} company={courier} />
            ))}
          </div>

        </div>

        {/* Sub-Section 3: Collapsible Warnings */}
        <div className="space-y-4">
          <button
            onClick={() => setShowWarnings(!showWarnings)}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 hover:bg-rose-50 transition-all cursor-pointer group"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Red flags to watch for before driving or buying
            </span>
            {showWarnings ? (
              <ChevronUp className="w-5 h-5 text-rose-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-rose-600" />
            )}
          </button>

          {showWarnings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
              
              {/* Warning Box 1 */}
              <div className="p-6 sm:p-8 rounded-3xl border border-rose-200/90 bg-rose-50/20 space-y-4">
                <h3 className="text-base font-bold text-[#0b132b] font-serif-heading">
                  Before you drive, watch for
                </h3>
                <div className="space-y-3">
                  {WARNINGS_BEFORE_DRIVE.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-relaxed">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning Box 2 */}
              <div className="p-6 sm:p-8 rounded-3xl border border-rose-200/90 bg-rose-50/20 space-y-4">
                <h3 className="text-base font-bold text-[#0b132b] font-serif-heading">
                  Before you buy, watch for
                </h3>
                <div className="space-y-3">
                  {WARNINGS_BEFORE_BUY.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-relaxed">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </section>
  );
}
