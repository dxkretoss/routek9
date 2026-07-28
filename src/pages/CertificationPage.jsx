import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  X,
  CreditCard,
  Lock,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Loader2,
  FileText
} from "lucide-react";

const QUESTIONS = [
  {
    topic: "HIPAA",
    q: "As a medical courier, when may you discuss a patient's protected health information (PHI) with someone outside your delivery workflow?",
    options: [
      "Anytime, as long as you don't name the patient",
      "Only when the patient or a permitted party has authorized it, or the law requires it",
      "With any healthcare worker who asks",
      "In casual conversation with coworkers after your shift",
    ],
    answer: 1,
  },
  {
    topic: "HIPAA",
    q: "You accidentally leave a lab specimen manifest containing patient names in a public restroom. What is the correct first step?",
    options: [
      "Throw it away so nobody finds it",
      "Ignore it — no diagnosis was listed",
      "Immediately notify your dispatcher/compliance contact and document the incident",
      "Post about it so patients can be warned",
    ],
    answer: 2,
  },
  {
    topic: "Bloodborne Pathogens",
    q: "Which of the following is considered a bloodborne pathogen under OSHA?",
    options: ["Influenza (seasonal flu)", "Hepatitis B Virus (HBV)", "Common cold rhinovirus", "Athlete's foot fungus"],
    answer: 1,
  },
  {
    topic: "Bloodborne Pathogens",
    q: "A specimen bag in your vehicle is leaking blood. What is the correct response?",
    options: [
      "Wipe it up with your bare hands and keep driving",
      "Open a window and let it dry",
      "Put on gloves, contain the spill using your spill kit, and disinfect the area following universal precautions",
      "Return the bag to the sender without cleaning",
    ],
    answer: 2,
  },
  {
    topic: "Bloodborne Pathogens",
    q: "What does the term 'universal precautions' mean?",
    options: [
      "Only patients who look sick are treated as infectious",
      "All human blood and certain body fluids are treated as if infectious",
      "Precautions only apply inside a hospital",
      "Gloves are optional if the specimen is sealed",
    ],
    answer: 1,
  },
];

const PASSING_SCORE = 4;
const PRICE_CENTS = 2500;

export default function CertificationPage({ currentUser, onLogout }) {
  const [stage, setStage] = useState("intro"); // 'intro', 'test', 'results', 'checkout', 'paid'
  const [fullName, setFullName] = useState(currentUser?.name || "");
  const [answers, setAnswers] = useState(() => QUESTIONS.map(() => null));
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFilename, setPdfFilename] = useState("certificate.pdf");
  const [pdfError, setPdfError] = useState(null);
  const [generating, setGenerating] = useState(false);
  
  // Mock Checkout state
  const [cardForm, setCardForm] = useState({
    number: "",
    expiry: "",
    cvc: "",
    zip: ""
  });
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const autoDownloadStarted = useRef(false);

  const isMobile = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /iphone|ipad|ipod|android/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const score = useMemo(
    () => answers.reduce((acc, a, i) => acc + (a === QUESTIONS[i].answer ? 1 : 0), 0),
    [answers]
  );
  const passed = score >= PASSING_SCORE;
  const allAnswered = answers.every((a) => a !== null);

  function resetTest() {
    setAnswers(QUESTIONS.map(() => null));
    setStage("test");
  }

  const buildCertificatePdf = useCallback(() => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Palette
    const navy = [16, 32, 72];
    const navySoft = [70, 90, 140];
    const gold = [176, 141, 62];
    const goldSoft = [212, 180, 108];
    const ink = [45, 52, 72];
    const muted = [110, 118, 138];
    const cream = [252, 249, 241];

    // Cream background
    doc.setFillColor(...cream);
    doc.rect(0, 0, w, h, "F");

    // Outer navy frame
    doc.setDrawColor(...navy);
    doc.setLineWidth(3);
    doc.rect(24, 24, w - 48, h - 48);

    // Inner gold hairline frame
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.75);
    doc.rect(36, 36, w - 72, h - 72);
    doc.setLineWidth(0.4);
    doc.rect(42, 42, w - 84, h - 84);

    // Corner ornaments
    const corner = (cx, cy, sx, sy) => {
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.9);
      doc.line(cx, cy, cx + 40 * sx, cy);
      doc.line(cx, cy, cx, cy + 40 * sy);
      doc.setLineWidth(0.5);
      doc.line(cx + 6 * sx, cy + 6 * sy, cx + 34 * sx, cy + 6 * sy);
      doc.line(cx + 6 * sx, cy + 6 * sy, cx + 6 * sx, cy + 34 * sy);
      doc.setFillColor(...gold);
      doc.circle(cx + 6 * sx, cy + 6 * sy, 1.6, "F");
    };
    corner(52, 52, 1, 1);
    corner(w - 52, 52, -1, 1);
    corner(52, h - 52, 1, -1);
    corner(w - 52, h - 52, -1, -1);

    // Top brand bar
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...gold);
    doc.text("R O U T E   K 9   ·   C O N T R A C T   D R I V E R S   O F   A M E R I C A", w / 2, 82, { align: "center" });
    doc.setDrawColor(...goldSoft);
    doc.setLineWidth(0.4);
    doc.line(w / 2 - 200, 90, w / 2 - 20, 90);
    doc.line(w / 2 + 20, 90, w / 2 + 200, 90);
    
    // small diamond
    doc.setFillColor(...gold);
    doc.triangle(w / 2 - 6, 90, w / 2 + 6, 90, w / 2, 84, "F");
    doc.triangle(w / 2 - 6, 90, w / 2 + 6, 90, w / 2, 96, "F");

    // Title
    doc.setFont("times", "bold");
    doc.setTextColor(...navy);
    doc.setFontSize(42);
    doc.text("Certificate of Completion", w / 2, 138, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...navySoft);
    doc.text("H I P A A   P R I V A C Y   ·   B L O O D B O R N E   P A T H O G E N S", w / 2, 160, { align: "center" });

    // "Presented to"
    doc.setFont("times", "italic");
    doc.setFontSize(13);
    doc.setTextColor(...muted);
    doc.text("This certificate is proudly presented to", w / 2, 200, { align: "center" });

    // Recipient name
    doc.setFont("times", "bolditalic");
    doc.setFontSize(40);
    doc.setTextColor(...navy);
    doc.text(fullName || "Recipient", w / 2, 252, { align: "center" });

    // Elegant underline with center diamond
    const nameWidth = Math.min(w - 240, Math.max(240, doc.getTextWidth(fullName || "Recipient") + 80));
    const nx1 = (w - nameWidth) / 2;
    const nx2 = (w + nameWidth) / 2;
    const ny = 266;
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.7);
    doc.line(nx1, ny, w / 2 - 8, ny);
    doc.line(w / 2 + 8, ny, nx2, ny);
    doc.setFillColor(...gold);
    doc.triangle(w / 2 - 5, ny, w / 2 + 5, ny, w / 2, ny - 4, "F");
    doc.triangle(w / 2 - 5, ny, w / 2 + 5, ny, w / 2, ny + 4, "F");

    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...ink);
    const body =
      "has successfully completed the HIPAA Privacy & Bloodborne Pathogens awareness examination for medical courier and contract drivers, demonstrating knowledge of patient privacy safeguards, universal precautions, and safe handling of biohazardous materials.";
    const wrapped = doc.splitTextToSize(body, w - 240);
    doc.text(wrapped, w / 2, 300, { align: "center", lineHeightFactor: 1.45 });

    // Score pill
    const scoreVal = score > 0 ? score : PASSING_SCORE; // fallback if state cleared
    const scoreText = `Examination Score  ${scoreVal} / ${QUESTIONS.length}`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const pillW = doc.getTextWidth(scoreText) + 40;
    const pillH = 22;
    const pillX = (w - pillW) / 2;
    const pillY = 372;
    doc.setFillColor(...navy);
    doc.roundedRect(pillX, pillY, pillW, pillH, 11, 11, "F");
    doc.setTextColor(...goldSoft);
    doc.text(scoreText, w / 2, pillY + 14.5, { align: "center" });

    // Gold seal (right side)
    const sealCx = w - 130;
    const sealCy = h - 150;
    doc.setFillColor(...gold);
    doc.circle(sealCx, sealCy, 34, "F");
    doc.setFillColor(...goldSoft);
    doc.circle(sealCx, sealCy, 30, "F");
    doc.setDrawColor(...navy);
    doc.setLineWidth(1);
    doc.circle(sealCx, sealCy, 26);
    
    // ribbon tails
    doc.setFillColor(...navy);
    doc.triangle(sealCx - 14, sealCy + 24, sealCx - 2, sealCy + 24, sealCx - 8, sealCy + 46, "F");
    doc.triangle(sealCx + 2, sealCy + 24, sealCx + 14, sealCy + 24, sealCx + 8, sealCy + 46, "F");
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...navy);
    doc.text("RK9", sealCx, sealCy - 2, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("CERTIFIED", sealCx, sealCy + 10, { align: "center" });

    // Footer signatures (left + center)
    const dateStr = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const certId = `RK9-${Date.now().toString(36).toUpperCase()}`;

    const sigY = h - 110;
    doc.setDrawColor(...navySoft);
    doc.setLineWidth(0.6);
    doc.line(90, sigY, 260, sigY);
    doc.line(w / 2 - 85, sigY, w / 2 + 85, sigY);

    doc.setFont("times", "italic");
    doc.setFontSize(14);
    doc.setTextColor(...navy);
    doc.text("Route K9 Compliance", 175, sigY - 4, { align: "center" });
    doc.text(dateStr, w / 2, sigY - 4, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    doc.text("AUTHORIZED SIGNATURE", 175, sigY + 12, { align: "center" });
    doc.text("DATE ISSUED", w / 2, sigY + 12, { align: "center" });

    // Cert ID
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(`Certificate ID  ·  ${certId}`, w / 2, h - 58, { align: "center" });
    doc.setFontSize(7.5);
    doc.text("Verify authenticity at routek9.com/verify", w / 2, h - 48, { align: "center" });

    const safe = (fullName || "certificate").replace(/[^a-z0-9]+/gi, "_");
    const filename = `RouteK9_HIPAA_BBP_${safe}.pdf`;
    const blob = doc.output("blob");
    return { blob, doc, filename };
  }, [fullName, score]);

  const setCertificatePreview = useCallback((blob, filename) => {
    const url = URL.createObjectURL(blob);
    setPdfUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });
    setPdfFilename(filename);
    return url;
  }, []);

  const downloadCertificate = useCallback(() => {
    setPdfError(null);
    setGenerating(true);
    try {
      const { blob, doc, filename } = buildCertificatePdf();
      setCertificatePreview(blob, filename);
      doc.save(filename);
    } catch (err) {
      console.error("PDF download failed", err);
      setPdfError(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setGenerating(false);
    }
  }, [buildCertificatePdf, setCertificatePreview]);

  // Handle mock payment submit
  const handleMockPay = (e) => {
    e.preventDefault();
    setCheckoutBusy(true);
    setTimeout(() => {
      setCheckoutBusy(false);
      setStage("paid");
    }, 1500);
  };

  useEffect(() => {
    if (stage !== "paid" || generating || autoDownloadStarted.current) return;
    autoDownloadStarted.current = true;
    try {
      const { blob, filename } = buildCertificatePdf();
      setCertificatePreview(blob, filename);
    } catch (err) {
      console.error("PDF generation failed", err);
      setPdfError(err instanceof Error ? err.message : "Failed to generate PDF");
    }
  }, [stage, generating, buildCertificatePdf, setCertificatePreview]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900 font-sans selection:bg-rose-600 selection:text-white">
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      {/* Main Certification Header */}
      <main className="flex-1 mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 shadow-2xs">
            <Award className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Driver Credentials</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading">
            HIPAA & Bloodborne Pathogens Certification
          </h1>
          
          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
            Essential compliance credentialing for medical couriers. Answer 5 questions covering patient privacy safeguards and OSHA universal precautions, score at least {PASSING_SCORE}/{QUESTIONS.length}, and instantly unlock your official printable certificate for ${(PRICE_CENTS / 100).toFixed(0)}.
          </p>
        </div>

        {/* STAGE 1: INTRO */}
        {stage === "intro" && (
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="font-bold text-xs text-[#0b132b]">1. HIPAA Compliance</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Covers PHI rules, delivery manifest safeguards, and reporting procedures.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="font-bold text-xs text-[#0b132b]">2. OSHA Pathogens</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Covers safe handling of biohazardous specimens, spill kits, and precautions.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="font-bold text-xs text-[#0b132b]">3. Immediate Certificate</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">Download a high-quality, printable PDF containing your name and certificate ID.</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Full Name (as it should appear on the certificate)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane A. Driver"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                />
              </div>

              <button
                onClick={() => setStage("test")}
                disabled={fullName.trim().length < 2}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-40 cursor-pointer"
              >
                Start the 5-Question Exam &rarr;
              </button>
              
              {fullName.length > 0 && fullName.trim().length < 2 && (
                <p className="text-xs text-rose-600 font-semibold">
                  Please enter your full name (minimum 2 characters).
                </p>
              )}
            </div>
          </section>
        )}

        {/* STAGE 2: TEST */}
        {stage === "test" && (
          <section className="space-y-6">
            {QUESTIONS.map((q, i) => (
              <article key={i} className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                  Question {i + 1} of {QUESTIONS.length} &middot; {q.topic}
                </div>
                <h3 className="text-base font-bold text-[#0b132b] font-serif-heading leading-snug">{q.q}</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {q.options.map((opt, oi) => {
                    const selected = answers[i] === oi;
                    return (
                      <label
                        key={oi}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-xs font-semibold transition ${
                          selected
                            ? "border-rose-600 bg-rose-50/50 text-[#0b132b]"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-rose-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${i}`}
                          checked={selected}
                          onChange={() => {
                            const next = [...answers];
                            next[i] = oi;
                            setAnswers(next);
                          }}
                          className="mt-0.5 h-4 w-4 accent-rose-600"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}

            <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-md backdrop-blur-md">
              <span className="text-xs font-bold text-slate-500">
                {answers.filter((a) => a !== null).length} of {QUESTIONS.length} answered
              </span>
              <button
                onClick={() => setStage("results")}
                disabled={!allAnswered}
                className="px-6 py-2.5 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Submit Exam
              </button>
            </div>
          </section>
        )}

        {/* STAGE 3: RESULTS */}
        {stage === "results" && (
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 text-center space-y-6">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Exam Score</div>
              <div className={`text-6xl font-extrabold tracking-tight ${passed ? "text-emerald-600" : "text-rose-600"}`}>
                {score} / {QUESTIONS.length}
              </div>
            </div>

            {passed ? (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-[#0b132b] font-serif-heading">Congratulations, you passed!</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Complete the secure checkout process to instantly generate, unlock, and download your official HIPAA & Bloodborne Pathogens certificate.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => setStage("checkout")}
                    className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ${(PRICE_CENTS / 100).toFixed(2)} &amp; Unlock Certificate</span>
                  </button>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    One-time payment &middot; Fully secure SSL checkout &middot; Direct PDF download
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-[#0b132b] font-serif-heading">Exam Not Passed</h2>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    A minimum score of {PASSING_SCORE}/{QUESTIONS.length} is required. Review medical courier privacy standards and retry the exam. Retakes are 100% free.
                  </p>
                </div>

                <button
                  onClick={resetTest}
                  className="px-8 py-3 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Retake Exam
                </button>
              </div>
            )}
          </section>
        )}

        {/* STAGE 4: MOCK CHECKOUT */}
        {stage === "checkout" && (
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 max-w-md mx-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-[#0b132b] font-serif-heading">Secure Checkout</h2>
                <div className="text-[11px] text-slate-500 font-semibold">
                  Name: <span className="text-slate-800 font-bold">{fullName}</span>
                </div>
              </div>
              <button
                onClick={() => setStage("results")}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                &larr; Back
              </button>
            </div>

            <form onSubmit={handleMockPay} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Card Number</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    required
                    type="text"
                    pattern="\d*"
                    maxLength={19}
                    placeholder="4111 2222 3333 4444"
                    value={cardForm.number}
                    onChange={(e) => setCardForm({ ...cardForm, number: e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim() })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expiration</label>
                  <input
                    required
                    type="text"
                    maxLength={5}
                    placeholder="MM/YY"
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CVC Code</label>
                  <input
                    required
                    type="text"
                    pattern="\d*"
                    maxLength={4}
                    placeholder="123"
                    value={cardForm.cvc}
                    onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ZIP Code</label>
                <input
                  required
                  type="text"
                  maxLength={5}
                  placeholder="90210"
                  value={cardForm.zip}
                  onChange={(e) => setCardForm({ ...cardForm, zip: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={checkoutBusy}
                className="w-full py-3.5 mt-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
              >
                {checkoutBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Authorize &amp; Pay ${(PRICE_CENTS / 100).toFixed(2)}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Standard Demo Sandboxed Gateway</span>
              </div>
            </form>
          </section>
        )}

        {/* STAGE 5: PAID & DOWNLOAD */}
        {stage === "paid" && (
          <section className="bg-white rounded-3xl border border-emerald-500/30 shadow-sm p-6 sm:p-8 text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-[#0b132b] font-serif-heading">Payment Received!</h2>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Your HIPAA &amp; Bloodborne Pathogens certificate for <strong className="text-slate-800">{fullName}</strong> is ready. Open or download the PDF below to save your credentials.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={downloadCertificate}
                disabled={generating}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{generating ? "Generating..." : "Download Certificate PDF"}</span>
              </button>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>Open in New Tab</span>
                </a>
              )}
            </div>

            {pdfUrl && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  title="Certificate preview"
                  className="h-[60vh] w-full rounded-xl"
                >
                  <div className="p-12 text-xs text-slate-400 font-semibold bg-white rounded-xl">
                    PDF ready! Click "Download Certificate PDF" to save it directly to your device downloads folder.
                  </div>
                </object>
              </div>
            )}
          </section>
        )}

        {/* Lower credential sections info */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Additional Credentials
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0b132b] font-serif-heading">
              TWIC&reg; &mdash; Transportation Worker Identification Credential
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Required for airport airside access, maritime ports, secure chemical/hazmat terminals, and selecting federal courier runs. Route K9 does not issue TWIC credentials; apply directly with the TSA.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-xs text-[#0b132b]">Issued by TSA</h4>
              <p className="text-[10px] text-slate-500 leading-snug font-medium">Requires fingerprinting and threat assessment checks.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-xs text-[#0b132b]">5-Year Validity</h4>
              <p className="text-[10px] text-slate-500 leading-snug font-medium">Federal credentials are valid for five years from issue date.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-xs text-[#0b132b]">Route Standard</h4>
              <p className="text-[10px] text-slate-500 leading-snug font-medium">Required by most logistics carriers serving airports.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="https://www.tsa.gov/for-industry/twic"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              Get TWIC Credentials &rarr;
            </a>
            <a
              href="https://universalenroll.dhs.gov/programs/twic"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all"
            >
              Universal Enroll Link
            </a>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Authority Registration
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0b132b] font-serif-heading">
              MC &amp; DOT Numbers &mdash; Motor Carrier Authority
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Necessary if you transport goods across state lines, operate a vehicle for hire, or manage a fleet carrying loads above 10,000 lbs. Secure active authority directly from the FMCSA.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-xs text-[#0b132b]">USDOT Number</h4>
              <p className="text-[10px] text-slate-500 leading-snug font-medium">Required to identify commercial vehicle transport lines.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-xs text-[#0b132b]">MC Authority</h4>
              <p className="text-[10px] text-slate-500 leading-snug font-medium">Required to haul regulated cargo for hire across state lines.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-xs text-[#0b132b]">Insurance Filing</h4>
              <p className="text-[10px] text-slate-500 leading-snug font-medium">Proof of commercial liability insurance policy (BMC-91) is required.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="https://www.fmcsa.dot.gov/registration"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              Apply for MC &amp; DOT &rarr;
            </a>
            <a
              href="https://www.fmcsa.dot.gov/registration/getting-started-usdot-number"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all"
            >
              FMCSA Getting Started Guide
            </a>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Airport Dispatch
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0b132b] font-serif-heading">
              TSA Air Cargo Certification
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Picking up or dropping off priority freight at cargo warehouses inside commercial airports requires TSA threat clearance. Some local medical carriers or freight forwarders will sponsor your TSA application upon hiring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-xs text-[#0b132b]">Threat Assessment</h4>
              <p className="text-[10px] text-slate-500 leading-snug font-medium">Requires fingerprinting and federal background screenings.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-xs text-[#0b132b]">Known Shipper Training</h4>
              <p className="text-[10px] text-slate-500 leading-snug font-medium">Completed via your sponsoring Indirect Air Carrier (IAC).</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-xs text-[#0b132b]">SIDA Airport Badge</h4>
              <p className="text-[10px] text-slate-500 leading-snug font-medium">Security badge issued by individual local airport authorities.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
