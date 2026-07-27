import React, { useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { COURSES_DATA } from '../data/coursesData';
import { 
  ArrowLeft, 
  CreditCard, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function CheckoutPage({ currentUser, onLogout, onCompletePurchase }) {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const course = COURSES_DATA.find((c) => c.id === courseId) || COURSES_DATA[0];
  const certName = location.state?.fullName || currentUser?.name || 'Driver Professional';

  const [currency, setCurrency] = useState('USD');
  const [email, setEmail] = useState(currentUser?.email || 'driver@routek9.com');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expDate, setExpDate] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [cardholderName, setCardholderName] = useState(certName);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handlePay = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      onCompletePurchase(course.id, certName);
      setIsProcessing(false);
      setShowSuccessModal(true);
    }, 1000);
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900 font-sans selection:bg-rose-600 selection:text-white relative">
      
      {/* Navbar Header */}
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      {/* Top Warning Banner matching Screenshot 3 */}
      <div className="bg-amber-500/15 border-b border-amber-300/40 py-2.5 px-4 text-center text-xs font-bold text-amber-900">
        All payments made in the preview are in test mode. Use card <span className="font-mono underline">4242 4242 4242 4242</span>.
      </div>

      {/* Hero Sub-Header matching Screenshot 3 */}
      <div className="bg-rose-50/30 border-b border-slate-200/70 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          
          <Link
            to={`/training/${course.id}`}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 inline-flex items-center gap-1 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to course</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              ALL COURSES
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b132b] font-serif-heading">
            {course.title}
          </h1>

          <p className="text-rose-600 text-xs sm:text-sm font-bold">
            {course.subtitle}
          </p>

          <div className="flex items-center gap-3 pt-1">
            <span className="px-3 py-1 rounded-full bg-rose-100/80 text-rose-700 font-extrabold text-xs">
              {course.projectedPay}
            </span>
            <span className="text-xl font-extrabold text-[#0b132b]">${course.price}</span>
            <span className="text-xs text-slate-500 font-medium">{course.access}</span>
          </div>

        </div>
      </div>

      {/* Main Payment Checkout Box matching Screenshot 3 */}
      <main className="flex-1 py-12">
        <div className="max-w-lg mx-auto px-4 sm:px-6 space-y-6">
          
          {/* TEST MODE Badge Header */}
          <div className="text-center space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold tracking-widest uppercase border border-amber-300">
              TEST MODE
            </span>
            <p className="text-xs text-slate-600 font-medium">
              Learn how to win bigger contracts and subcontract drivers under your own authority.
            </p>
          </div>

          {/* Currency Toggle Buttons matching Screenshot 3 */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Choose a currency:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  currency === 'INR'
                    ? 'border-emerald-600 bg-white text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                🇮🇳 ₹4,891.58
              </button>

              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  currency === 'USD'
                    ? 'border-emerald-600 bg-white text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                🇺🇸 $49.00
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center font-medium">
              1 USD = 99.8282 INR (includes 4% conversion fee)
            </p>
          </div>

          {/* Main Card Payment Container matching Screenshot 3 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
            
            {/* Pay with Link Button */}
            <button
              type="button"
              onClick={handlePay}
              className="w-full py-3.5 rounded-xl bg-[#00D66C] hover:bg-[#00c262] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Pay securely with</span>
              <span className="font-serif italic font-extrabold text-base">link</span>
            </button>

            {/* OR Divider */}
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span className="flex-1 h-px bg-slate-200" />
              <span>OR</span>
              <span className="flex-1 h-px bg-slate-200" />
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              
              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Payment Method Card Form */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700">Payment method</label>
                
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Card</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Card information</label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">MM / YY</label>
                        <input
                          type="text"
                          required
                          value={expDate}
                          onChange={(e) => setExpDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">CVC</label>
                        <input
                          type="text"
                          required
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Cardholder name</label>
                      <input
                        type="text"
                        required
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Submit Pay Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>{isProcessing ? 'Processing Payment...' : `Pay $${course.price}.00 (Test Mode)`}</span>
              </button>

            </form>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>256-Bit SSL Encrypted Test Mode Gateway</span>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modern Payment Success Modal Overlay */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          
          <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-6 text-center relative overflow-hidden animate-scaleUp">
            
            {/* Background Festive Gradient Blobs */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Checkmark Icon Animation Badge */}
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-md">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            {/* Title & Badge */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase border border-emerald-200 tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Test Mode Payment Complete</span>
              </div>

              <h2 className="text-2xl font-extrabold text-[#0b132b] font-serif-heading">
                Payment Successful!
              </h2>

              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                You are now officially enrolled in <span className="font-bold text-slate-800">{course.title}</span>.
              </p>
            </div>

            {/* Summary Details Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Enrolled Course:</span>
                <span className="font-bold text-slate-900">{course.title}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Certificate Registered To:</span>
                <span className="font-bold text-rose-600">{certName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Amount Paid:</span>
                <span className="font-bold text-emerald-600">${course.price}.00 USD</span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-200/70 pt-2">
                <span className="text-slate-500 font-medium">Access Status:</span>
                <span className="font-extrabold text-slate-900 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Lifetime Unlimited Access</span>
                </span>
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              onClick={handleGoToDashboard}
              className="w-full py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>
      )}

    </div>
  );
}
